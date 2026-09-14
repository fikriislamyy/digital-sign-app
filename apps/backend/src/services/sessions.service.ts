import { SignJWT } from 'jose';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '../db';
import { sessions } from '../models/sessions.model';
import { jwtSecret } from '../utils/jwt.util';

/** How long an access token stays valid. */
export const ACCESS_TOKEN_TTL_MINUTES = 15;

/** How long a refresh token, and therefore the session row, stays valid. */
export const REFRESH_TOKEN_TTL_DAYS = 7;

/**
 * Build an opaque refresh token: 32 random bytes as 64 hex characters.
 * Not a JWT, because refresh tokens must be revocable and revocation
 * means a database lookup regardless.
 */
export function generateRefreshToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Sign a short-lived access token.
 * The payload carries the user id and nothing else, so the finished token
 * stays comfortably inside the VARCHAR(255) column.
 */
export async function signAccessToken(userId: number): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000);

  return await new SignJWT({ type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + ACCESS_TOKEN_TTL_MINUTES * 60)
    .sign(jwtSecret);
}

export interface CreatedSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

/**
 * Issue a fresh pair of tokens and persist the session row.
 * A user may hold several sessions at once, one per device, so this
 * never deletes the user's existing rows.
 */
export async function createSession(userId: number): Promise<CreatedSession> {
  const accessToken = await signAccessToken(userId);
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    userId,
    accessToken,
    refreshToken,
    expiresAt,
  });

  return { accessToken, refreshToken, expiresAt };
}

export async function revokeSession(refreshToken: string): Promise<boolean> {
  const deleted = await db.delete(sessions).where(eq(sessions.refreshToken, refreshToken)).returning({ id: sessions.id });
  return deleted.length > 0;
}

export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.refreshToken, refreshToken), gt(sessions.expiresAt, new Date())))
    .limit(1);
  if (!session) return null;

  const accessToken = await signAccessToken(session.userId);
  await db.update(sessions).set({ accessToken }).where(eq(sessions.id, session.id));
  return accessToken;
}

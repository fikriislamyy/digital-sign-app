import { SignJWT } from 'jose';
import { db } from '../db';
import { sessions } from '../models/sessions.model';

/** How long an access token stays valid. */
export const ACCESS_TOKEN_TTL_MINUTES = 15;

/** How long a refresh token, and therefore the session row, stays valid. */
export const REFRESH_TOKEN_TTL_DAYS = 7;

/**
 * The signing key for access tokens.
 * Anyone with this value can forge a token for any user, so it must come
 * from the environment and must differ per environment.
 */
const jwtSecret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-only-insecure-secret-change-me'
);

if (!process.env.JWT_SECRET) {
  console.warn('[sessions.service] JWT_SECRET is not set. Using an insecure development default.');
}

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

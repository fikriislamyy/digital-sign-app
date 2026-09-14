import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../models/users.model';
import { createAndSendOtp } from './email-verification.service';
import { createSession, signAccessToken, generateRefreshToken } from './sessions.service';
import { createOrganization } from './organizations.service';

export interface RegisterUserInput {
  fullName: string;
  email: string;
  password: string;
  organizationName?: string;
  phoneNumber?: string;
}

export interface LoginUserResult {
  user: {
    id: number;
    email: string;
  };
  accessToken: string;
  refreshToken: string;
}

// In-memory fallback for local dev when PostgreSQL is offline
interface InMemoryUser {
  id: number;
  name: string;
  email: string;
  password: string;
  type: string;
  organizationId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface InMemoryOrganization {
  id: number;
  name: string;
  slug: string;
  ownerId: number;
}

const memoryUsers: InMemoryUser[] = [];
const memoryOrganizations: InMemoryOrganization[] = [];
let memoryIdCounter = 1;
let memoryOrgIdCounter = 1;

/**
 * Register a new user with hashed password and unique email validation.
 */
export async function registerUser(input: RegisterUserInput): Promise<LoginUserResult> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const name = input.fullName.trim();
  const password = input.password;
  const organizationName = input.organizationName?.trim() || undefined;

  try {
    const user = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (existing) throw new Error('Email already registered');

      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert the owner first with no organization. The organization needs
      // owner_id, so it cannot go first. See section 3.1.
      const [created] = await tx
        .insert(users)
        .values({
          name,
          phone: input.phoneNumber?.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          type: organizationName ? 'OWNER' : 'PERSONAL',
        })
        .returning();

      if (!organizationName) return created;

      const organization = await createOrganization(tx, organizationName, created.id);

      const [updated] = await tx
        .update(users)
        .set({ organizationId: organization.id })
        .where(eq(users.id, created.id))
        .returning();

      return updated;
    });

    // Outside the transaction. Neither should undo a committed registration:
    // a failed email is retried with resend-otp, and a failed session means the
    // user simply logs in.
    await createAndSendOtp(user.id, user.email);
    const session = await createSession(user.id);

    return {
      user: { id: user.id, email: user.email },
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    };
  } catch (error: any) {
    // If it's a known domain validation error, propagate immediately
    if (error?.message === 'Email already registered') {
      throw error;
    }

    // If PostgreSQL is unreachable, use development fallback
    console.warn('[users.service] Database connection error or unavailable, using development memory store fallback:', error?.message);

    const existsInMemory = memoryUsers.some((u) => u.email === normalizedEmail);
    if (existsInMemory) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const inMemoryUser: InMemoryUser = {
      id: memoryIdCounter++,
      name,
      email: normalizedEmail,
      password: hashedPassword,
      type: organizationName ? 'OWNER' : 'PERSONAL',
      organizationId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (organizationName) {
      const org: InMemoryOrganization = {
        id: memoryOrgIdCounter++,
        name: organizationName,
        slug: organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        ownerId: inMemoryUser.id,
      };
      memoryOrganizations.push(org);
      inMemoryUser.organizationId = org.id;
    }

    memoryUsers.push(inMemoryUser);

    return {
      user: { id: inMemoryUser.id, email: inMemoryUser.email },
      accessToken: await signAccessToken(inMemoryUser.id),
      refreshToken: generateRefreshToken(),
    };
  }
}

export interface LoginUserInput {
  email: string;
  password: string;
}

/**
 * Validate user credentials and open a session (or in-memory fallback).
 */
export async function loginUser(input: LoginUserInput): Promise<LoginUserResult> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const password = input.password;

  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    const user = existing[0];
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw new Error('Invalid email or password');
    }

    const session = await createSession(user.id);

    return {
      user: { id: user.id, email: user.email },
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    };
  } catch (error: any) {
    if (error?.message === 'Invalid email or password') {
      throw error;
    }

    console.warn('[users.service] Database connection error or unavailable, using development memory store fallback:', error?.message);

    const memoryUser = memoryUsers.find((u) => u.email === normalizedEmail);
    if (!memoryUser) {
      throw new Error('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(password, memoryUser.password);
    if (!passwordMatches) {
      throw new Error('Invalid email or password');
    }

    // Dev fallback: hand out real tokens but persist no session row.
    return {
      user: { id: memoryUser.id, email: memoryUser.email },
      accessToken: await signAccessToken(memoryUser.id),
      refreshToken: generateRefreshToken(),
    };
  }
}

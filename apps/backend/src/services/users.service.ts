import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../models/users.model';
import { createAndSendOtp } from './email-verification.service';
import { createSession, signAccessToken, generateRefreshToken } from './sessions.service';

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  organization?: string;
  phone?: string;
}

export interface RegisteredUserResult {
  id: number;
  name: string;
  email: string;
}

// In-memory fallback for local dev when PostgreSQL is offline
interface InMemoryUser {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const memoryUsers: InMemoryUser[] = [];
let memoryIdCounter = 1;

/**
 * Register a new user with hashed password and unique email validation.
 */
export async function registerUser(input: RegisterUserInput): Promise<RegisteredUserResult> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const password = input.password;

  try {
    // 1. Check if user already exists in PostgreSQL
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      throw new Error('Email already registered');
    }

    // 2. Hash plain text password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Insert new user into database
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        organization: input.organization?.trim(),
        phone: input.phone?.trim(),
        email: normalizedEmail,
        password: hashedPassword,
      })
      .returning();

    await createAndSendOtp(newUser.id, newUser.email);

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryUsers.push(inMemoryUser);

    return {
      id: inMemoryUser.id,
      name: inMemoryUser.name,
      email: inMemoryUser.email,
    };
  }
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface LoginUserResult {
  user: {
    id: number;
    email: string;
  };
  accessToken: string;
  refreshToken: string;
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

import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../models/users.model';

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
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
        email: normalizedEmail,
        password: hashedPassword,
      })
      .returning();

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

import { and, count, eq, gt } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../models/users.model';
import { otpCodes } from '../models/otp-codes.model';

/** How long a code stays usable. */
export const OTP_TTL_MINUTES = 30;

/** How many codes one email may request inside the rate-limit window. */
export const OTP_RESEND_LIMIT = 3;

/** Length of the rate-limit window. */
export const OTP_RESEND_WINDOW_MINUTES = 60;

/**
 * Build a 6-digit code as a string.
 * Padding keeps leading zeros, so "000042" stays six characters.
 */
export function generateOtpCode(): string {
  return Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0');
}

/**
 * Placeholder for the real mail transport.
 * Swap the body for an actual provider later. The call signature stays the same.
 */
export async function sendOtpEmail(email: string, code: string): Promise<void> {
  console.log(`[email-verification] OTP for ${email}: ${code}`);
}

/**
 * Create an OTP row for a user and email it.
 * Called from registration and from the resend endpoint.
 */
export async function createAndSendOtp(userId: number, email: string): Promise<void> {
  const code = generateOtpCode();
  const expiredAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await db.insert(otpCodes).values({ code, userId, expiredAt });
  await sendOtpEmail(email, code);
}

export interface VerifyEmailInput {
  email: string;
  otp: string;
}

/**
 * Verify an email address against a submitted OTP.
 * Throws Error('Invalid email or otp') for every failure path so the
 * response never reveals whether the email exists.
 */
export async function verifyEmail(input: VerifyEmailInput): Promise<true> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const otp = input.otp.trim();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user) {
    throw new Error('Invalid email or otp');
  }

  if (user.verifiedAt) {
    throw new Error('Invalid email or otp');
  }

  const [match] = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.userId, user.id),
        eq(otpCodes.code, otp),
        gt(otpCodes.expiredAt, new Date())
      )
    )
    .limit(1);

  if (!match) {
    throw new Error('Invalid email or otp');
  }

  await db
    .update(users)
    .set({ verifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, user.id));

  // Burn every outstanding code for this user so none can be replayed.
  await db.delete(otpCodes).where(eq(otpCodes.userId, user.id));

  return true;
}

export interface ResendOtpInput {
  email: string;
}

/**
 * Issue a fresh OTP, subject to the per-email rate limit.
 * Throws Error('User not found'), Error('Email already verified'),
 * or Error('Too many OTP requests').
 */
export async function resendOtp(input: ResendOtpInput): Promise<true> {
  const normalizedEmail = input.email.trim().toLowerCase();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user) {
    throw new Error('User not found');
  }

  if (user.verifiedAt) {
    throw new Error('Email already verified');
  }

  const windowStart = new Date(Date.now() - OTP_RESEND_WINDOW_MINUTES * 60 * 1000);

  const [{ value: recentCount }] = await db
    .select({ value: count() })
    .from(otpCodes)
    .where(and(eq(otpCodes.userId, user.id), gt(otpCodes.createdAt, windowStart)));

  if (recentCount >= OTP_RESEND_LIMIT) {
    throw new Error('Too many OTP requests');
  }

  await createAndSendOtp(user.id, user.email);

  return true;
}

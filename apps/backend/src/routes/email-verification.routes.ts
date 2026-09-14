import { Elysia, t } from 'elysia';
import { resendOtp, verifyEmail } from '../services/email-verification.service';

export const emailVerificationRoutes = new Elysia({ prefix: '' })
  .post(
    '/verify-email',
    async ({ body, set }) => {
      try {
        await verifyEmail({ email: body.email, otp: body.otp });

        return {
          success: true,
          message: 'User email verified successfully',
        };
      } catch (error: any) {
        if (error?.message === 'Invalid email or otp') {
          set.status = 400;
          return { error: 'Invalid email or otp' };
        }

        set.status = 500;
        return { error: 'Internal server error' };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: 'email', description: 'Registered email address' }),
        otp: t.String({
          minLength: 6,
          maxLength: 6,
          pattern: '^[0-9]{6}$',
          description: 'Six digit one-time password',
        }),
      }),
      detail: {
        tags: ['Authentication & Users'],
        summary: 'Verify user email with OTP',
        description: 'Validates the submitted OTP and marks the user account as verified',
      },
    }
  )
  .post(
    '/resend-otp',
    async ({ body, set }) => {
      try {
        await resendOtp({ email: body.email });

        return {
          success: true,
          message: 'OTP has been sent to your email',
        };
      } catch (error: any) {
        if (error?.message === 'User not found') {
          set.status = 404;
          return { error: 'User not found' };
        }

        if (error?.message === 'Email already verified') {
          set.status = 400;
          return { error: 'Email already verified' };
        }

        if (error?.message === 'Too many OTP requests') {
          set.status = 429;
          return { error: 'Too many OTP requests. Please try again later.' };
        }

        set.status = 500;
        return { error: 'Internal server error' };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: 'email', description: 'Registered email address' }),
      }),
      detail: {
        tags: ['Authentication & Users'],
        summary: 'Resend verification OTP',
        description: 'Issues a new OTP, limited to 3 requests per hour per email address',
      },
    }
  );

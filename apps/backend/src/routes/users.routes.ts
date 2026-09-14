import { Elysia, t } from 'elysia';
import { loginUser, registerUser } from '../services/users.service';

export const usersRoutes = new Elysia({ prefix: '' })
  .post(
    '/register',
    async ({ body, set }) => {
      try {
        const result = await registerUser({
          fullName: body.full_name,
          email: body.email,
          password: body.password,
          phoneNumber: body.phone_number,
          organizationName: body.organization_name,
        });

        return {
          success: true,
          message: 'User registered successfully',
          data: {
            user: result.user,
            access_token: result.accessToken,
            refresh_token: result.refreshToken,
          },
        };
      } catch (error: any) {
        if (error?.message === 'Email already registered') {
          set.status = 400;
          return { error: 'Email already registered' };
        }
        set.status = 500;
        return { error: 'Internal server error' };
      }
    },
    {
      body: t.Object({
        organization_name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        full_name: t.String({ minLength: 1, maxLength: 255 }),
        phone_number: t.Optional(t.String({ maxLength: 32 })),
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 6 }),
      }),
      detail: {
        tags: ['Authentication & Users'],
        summary: 'Register a new user',
        description: 'Creates a new user record with hashed password and returns session tokens. Registration also signs in the user.',
      },
    }
  )
  .post(
    '/login',
    async ({ body, set }) => {
      try {
        const result = await loginUser({
          email: body.email,
          password: body.password,
        });

        return {
          success: true,
          message: 'User logged in successfully',
          data: {
            user: result.user,
            access_token: result.accessToken,
            refresh_token: result.refreshToken,
          },
        };
      } catch (error: any) {
        if (error?.message === 'Invalid email or password') {
          set.status = 401;
          return {
            error: 'Invalid email or password',
          };
        }

        set.status = 500;
        return {
          error: 'Internal server error',
        };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 1 }),
      }),
      detail: {
        tags: ['Authentication & Users'],
        summary: 'Login user',
        description: 'Validates user credentials and returns an access token and a refresh token',
      },
    }
  );

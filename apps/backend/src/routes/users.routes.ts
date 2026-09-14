import { Elysia, t } from 'elysia';
import { loginUser, registerUser } from '../services/users.service';

export const usersRoutes = new Elysia({ prefix: '' })
  .post(
    '/register',
    async ({ body, set }) => {
      try {
        const user = await registerUser({
          name: body.name,
          email: body.email,
          password: body.password,
        });

        return {
          success: true,
          message: 'User created successfully',
          data: user,
        };
      } catch (error: any) {
        if (error?.message === 'Email already registered') {
          set.status = 400;
          return {
            error: 'Email already registered',
          };
        }

        set.status = 500;
        return {
          error: error?.message || 'Internal server error',
        };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, description: 'User full name' }),
        email: t.String({ format: 'email', description: 'User valid email address' }),
        password: t.String({ minLength: 6, description: 'User account password' }),
      }),
      detail: {
        tags: ['Authentication & Users'],
        summary: 'Register a new user',
        description: 'Creates a new user record with hashed password and returns user profile data',
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

import { Elysia, t } from 'elysia';
import { registerController, loginController, meController } from '../controller/users.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export const usersRoutes = new Elysia({ prefix: '' })
  .post('/register', registerController, {
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
  })
  .post('/login', loginController, {
    body: t.Object({
      email: t.String({ format: 'email' }),
      password: t.String({ minLength: 1 }),
    }),
    detail: {
      tags: ['Authentication & Users'],
      summary: 'Login user',
      description: 'Validates user credentials and returns an access token and a refresh token',
    },
  })
  .use(authMiddleware)
  .get('/me', meController, {
    detail: { tags: ['Authentication & Users'], summary: 'Get current user profile', description: 'Returns the authenticated user profile with wallet information' },
  });

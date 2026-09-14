import { Elysia } from 'elysia';
import { logoutController, refreshController } from '../controller/sessions.controller';
import { logoutBody, refreshBody } from '../validator/sessions.validator';

export const sessionsRoutes = new Elysia({ prefix: '' })
  .post('/logout', logoutController, {
    body: logoutBody,
    detail: { tags: ['Authentication & Users'], summary: 'Logout user', description: 'Revokes the refresh token and logs out the user' },
  })
  .post('/refresh', refreshController, {
    body: refreshBody,
    detail: { tags: ['Authentication & Users'], summary: 'Refresh access token', description: 'Issues a new access token using a valid refresh token' },
  });

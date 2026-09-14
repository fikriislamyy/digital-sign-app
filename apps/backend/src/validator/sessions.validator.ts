import { t } from 'elysia';

export const logoutBody = t.Object({
  refresh_token: t.String({ minLength: 1 }),
});

export const refreshBody = t.Object({
  refresh_token: t.String({ minLength: 1 }),
});

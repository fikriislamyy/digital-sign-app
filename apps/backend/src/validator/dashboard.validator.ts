import { t } from 'elysia';

export const analyticsQuery = t.Object({
  from: t.String({ format: 'date-time' }),
  to: t.String({ format: 'date-time' }),
  tz: t.String({ minLength: 1, maxLength: 64 }),
  granularity: t.Union([t.Literal('hour'), t.Literal('day'), t.Literal('month')]),
});

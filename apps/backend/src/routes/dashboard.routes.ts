import { Elysia } from 'elysia';
import { authMiddleware } from '../middleware/auth.middleware';
import { analyticsController, recentController } from '../controller/dashboard.controller';
import { analyticsQuery } from '../validator/dashboard.validator';

export const dashboardRoutes = new Elysia({ prefix: '/dashboard' })
  .use(authMiddleware)
  .get('/analytics', analyticsController, {
    query: analyticsQuery,
    detail: { tags: ['Dashboard'], summary: 'Analytics data', description: 'Totals and time series for a range' },
  })
  .get('/recent', recentController, {
    detail: { tags: ['Dashboard'], summary: 'Recent documents', description: 'Five most recent documents' },
  });

import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { redis } from './db/redis';
import { usersRoutes } from './routes/users.routes';
import { emailVerificationRoutes } from './routes/email-verification.routes';
import { sessionsRoutes } from './routes/sessions.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { checkMailTransport } from './services/mail.service';

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

export const app = new Elysia()
  .use(cors())
  .use(
    swagger({
      documentation: {
        info: {
          title: 'Digital Sign API',
          version: '1.0.0',
          description: 'High-performance digital signature backend powered by Elysia & Drizzle',
        },
      },
    })
  )
  .get('/', () => ({
    message: 'Welcome to Digital Sign API',
    docs: '/swagger',
    health: '/api/health',
  }))
  .group('/api', (app) =>
    app
      .use(usersRoutes)
      .use(emailVerificationRoutes)
      .use(sessionsRoutes)
      .use(dashboardRoutes)
      .get('/health', async () => {
        const [redisStatus, mailStatus] = await Promise.all([
          redis.ping().then(() => 'ok' as const).catch(() => 'down' as const),
          checkMailTransport().then((ok) => (ok ? 'ok' : 'down')).catch(() => 'down' as const),
        ]);

        return {
          status: 'ok',
          service: 'digital-sign-backend',
          timestamp: new Date().toISOString(),
          redis: redisStatus,
          mail: mailStatus,
        };
      })
  )
  .listen(port);

console.log(`🦊 Elysia backend is running at http://${app.server?.hostname}:${app.server?.port}`);

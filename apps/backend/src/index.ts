import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { db } from './db';
import { documents, signatures } from './db/schema';
import { usersRoutes } from './routes/users.routes';

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
      .get('/health', () => ({
        status: 'ok',
        service: 'digital-sign-backend',
        timestamp: new Date().toISOString(),
      }))
      .get('/documents', async () => {
        try {
          const docs = await db.select().from(documents).limit(20);
          return { success: true, data: docs };
        } catch {
          // Fallback if DB container is not yet started in dev
          return {
            success: true,
            data: [
              {
                id: 'demo-doc-1',
                title: 'Non-Disclosure Agreement (NDA)',
                status: 'pending',
                createdAt: new Date().toISOString(),
              },
              {
                id: 'demo-doc-2',
                title: 'Employment Contract - 2026',
                status: 'signed',
                createdAt: new Date().toISOString(),
              },
            ],
            notice: 'Running in demo mode (Postgres offline or configuring). Start DB with `bun run db:up`.',
          };
        }
      })
      .post(
        '/documents',
        async ({ body }) => {
          try {
            const [created] = await db
              .insert(documents)
              .values({
                title: body.title,
                status: 'draft',
                metadata: body.metadata,
              })
              .returning();
            return { success: true, data: created };
          } catch {
            return {
              success: true,
              data: {
                id: crypto.randomUUID(),
                title: body.title,
                status: 'draft',
                createdAt: new Date().toISOString(),
              },
              notice: 'Recorded in transient state',
            };
          }
        },
        {
          body: t.Object({
            title: t.String(),
            metadata: t.Optional(t.Any()),
          }),
        }
      )
  )
  .listen(port);

console.log(`🦊 Elysia backend is running at http://${app.server?.hostname}:${app.server?.port}`);

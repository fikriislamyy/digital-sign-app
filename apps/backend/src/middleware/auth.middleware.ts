import { Elysia } from 'elysia';
import { jwtVerify } from 'jose';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, type User } from '../models/users.model';
import { jwtSecret } from '../utils/jwt.util';

async function userFromBearer(authorization: string | undefined): Promise<User | null> {
  if (!authorization?.startsWith('Bearer ')) return null;
  try {
    const { payload } = await jwtVerify(authorization.slice(7), jwtSecret);
    const [user] = await db.select().from(users).where(eq(users.id, Number(payload.sub))).limit(1);
    return user ?? null;
  } catch {
    return null;
  }
}

export const authMiddleware = new Elysia({ name: 'auth-middleware' })
  .derive({ as: 'scoped' }, async ({ headers }) => ({
    user: await userFromBearer(headers.authorization),
  }))
  .onBeforeHandle({ as: 'scoped' }, ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }
  });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgrespassword@localhost:5432/digital_sign_db';

// Disable prefetch as it is not supported for Transaction Pooler
export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });

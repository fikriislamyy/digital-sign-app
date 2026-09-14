import { pgTable, serial, varchar, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users.model';

export const sessions = pgTable(
  'sessions',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: varchar('access_token', { length: 255 }).notNull(),
    refreshToken: varchar('refresh_token', { length: 255 }).notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('sessions_user_id_idx').on(table.userId),
  })
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

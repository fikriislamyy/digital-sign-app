import { pgTable, serial, varchar, integer, timestamp, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { users } from './users.model';

export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  // The thunk's return type must be written out. users.model imports this
  // file and this file imports users.model, and without the annotation
  // TypeScript cannot resolve the cycle and reports an implicit `any`.
  ownerId: integer('owner_id').notNull().references((): AnyPgColumn => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

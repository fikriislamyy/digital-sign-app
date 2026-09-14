import { pgTable, serial, varchar, integer, timestamp, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.model';

export const USER_TYPES = ['OWNER', 'PERSONAL', 'MEMBER', 'ADMIN'] as const;
export type UserType = (typeof USER_TYPES)[number];

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 32 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  type: varchar('type', { length: 20, enum: USER_TYPES }).notNull().default('PERSONAL'),
  organizationId: integer('organization_id').references((): AnyPgColumn => organizations.id),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

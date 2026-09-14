import { pgTable, text, timestamp, uuid, jsonb, integer, index } from 'drizzle-orm/pg-core';
import { users } from './users.model';

export const DOCUMENT_STATUSES = ['draft', 'sent', 'completed'] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    fileUrl: text('file_url'),
    status: text('status', { enum: DOCUMENT_STATUSES }).default('draft').notNull(),
    metadata: jsonb('metadata'),
    creatorId: integer('creator_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    creatorIdCreatedAtIdx: index('documents_creator_id_created_at_idx').on(table.creatorId, table.createdAt),
  })
);

export type Document = typeof documents.$inferSelect;

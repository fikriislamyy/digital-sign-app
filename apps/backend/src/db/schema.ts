import { pgTable, text, timestamp, uuid, jsonb, integer } from 'drizzle-orm/pg-core';
import { users } from '../models/users.model';

export * from '../models/users.model';
export * from '../models/otp-codes.model';
export * from '../models/sessions.model';

export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  fileUrl: text('file_url'),
  status: text('status', { enum: ['draft', 'pending', 'signed', 'rejected'] })
    .default('draft')
    .notNull(),
  metadata: jsonb('metadata'),
  creatorId: integer('creator_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const signatures = pgTable('signatures', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id')
    .references(() => documents.id)
    .notNull(),
  signerEmail: text('signer_email').notNull(),
  signatureData: text('signature_data').notNull(), // e.g. base64 image or cryptographic signature
  ipAddress: text('ip_address'),
  auditHash: text('audit_hash'),
  signedAt: timestamp('signed_at').defaultNow().notNull(),
});

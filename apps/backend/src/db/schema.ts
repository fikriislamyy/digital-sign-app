import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';

export * from '../models/users.model';
export * from '../models/organizations.model';
export * from '../models/otp-codes.model';
export * from '../models/sessions.model';
export * from '../models/documents.model';

import { documents } from '../models/documents.model';

export const signatures = pgTable('signatures', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id')
    .references(() => documents.id)
    .notNull(),
  signerEmail: text('signer_email').notNull(),
  signatureData: text('signature_data').notNull(),
  ipAddress: text('ip_address'),
  auditHash: text('audit_hash'),
  signedAt: timestamp('signed_at').defaultNow().notNull(),
});

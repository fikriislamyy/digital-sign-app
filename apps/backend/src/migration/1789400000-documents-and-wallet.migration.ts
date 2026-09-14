import { client } from '../db';

export async function up() {
  console.log('Running migration: 1789400000-documents-and-wallet.migration.ts');

  await client`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS balance NUMERIC(14,2) NOT NULL DEFAULT 0;
  `;

  await client`
    CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      file_url TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'completed')),
      metadata JSONB,
      creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await client`
    CREATE INDEX IF NOT EXISTS documents_creator_id_created_at_idx
    ON documents (creator_id, created_at);
  `;

  await client`DROP TRIGGER IF EXISTS documents_set_updated_at ON documents;`;
  await client`
    CREATE TRIGGER documents_set_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  `;

  console.log('Migration completed: documents table, users.balance.');
}

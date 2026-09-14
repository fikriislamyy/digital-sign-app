import { client } from '../db';

export async function up() {
  console.log('Running migration: 1789368000-email-verification.migration.ts');

  await client`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP NULL;
  `;

  await client`
    CREATE TABLE IF NOT EXISTS otp_codes (
      id SERIAL PRIMARY KEY,
      code VARCHAR(6) NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expired_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `;

  await client`
    CREATE INDEX IF NOT EXISTS otp_codes_user_id_idx
    ON otp_codes (user_id);
  `;

  await client`
    CREATE INDEX IF NOT EXISTS otp_codes_user_id_created_at_idx
    ON otp_codes (user_id, created_at);
  `;

  console.log('Migration completed: users.verified_at added, otp_codes table created.');
}

export async function down() {
  await client`DROP TABLE IF EXISTS otp_codes CASCADE;`;
  await client`ALTER TABLE users DROP COLUMN IF EXISTS verified_at;`;
  console.log('Rollback completed: otp_codes dropped, users.verified_at removed.');
}

if (import.meta.main) {
  try {
    await up();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

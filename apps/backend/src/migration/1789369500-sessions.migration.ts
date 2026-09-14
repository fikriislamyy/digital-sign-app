import { client } from '../db';

export async function up() {
  console.log('Running migration: 1789369500-sessions.migration.ts');

  await client`
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      access_token VARCHAR(255) NOT NULL,
      refresh_token VARCHAR(255) NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `;

  await client`
    CREATE INDEX IF NOT EXISTS sessions_user_id_idx
    ON sessions (user_id);
  `;

  // PostgreSQL has no ON UPDATE CURRENT_TIMESTAMP, so a trigger does that job.
  await client`
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;

  await client`DROP TRIGGER IF EXISTS sessions_set_updated_at ON sessions;`;

  await client`
    CREATE TRIGGER sessions_set_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  `;

  console.log('Migration completed: sessions table created.');
}

export async function down() {
  await client`DROP TRIGGER IF EXISTS sessions_set_updated_at ON sessions;`;
  await client`DROP TABLE IF EXISTS sessions CASCADE;`;
  console.log('Rollback completed: sessions table dropped.');
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

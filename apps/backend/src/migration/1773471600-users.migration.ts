import { client } from '../db';

export async function up() {
  console.log('Running migration: 1773471600-users.migration.ts');
  await client`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `;
  console.log('Migration completed successfully: users table created.');
}

export async function down() {
  await client`
    DROP TABLE IF EXISTS users CASCADE;
  `;
  console.log('Rollback completed: users table dropped.');
}

// Allow direct execution via: bun src/migration/1773471600-users.migration.ts
if (import.meta.main) {
  try {
    await up();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

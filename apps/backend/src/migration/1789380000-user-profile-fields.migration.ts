import { client } from '../db';

export async function up() {
  console.log('Running migration: 1789380000-user-profile-fields.migration.ts');

  // Nullable on purpose: rows already in this table predate both fields.
  await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS organization VARCHAR(255);`;
  await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(32);`;
}

import { client } from '../db';

export async function up() {
  console.log('Running migration: 1789390000-organizations.migration.ts');

  // 1. users.type. DEFAULT is what lets NOT NULL apply to a table with rows.
  await client`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'PERSONAL';
  `;
  await client`
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_type_check;
  `;
  await client`
    ALTER TABLE users
    ADD CONSTRAINT users_type_check
    CHECK (type IN ('OWNER', 'PERSONAL', 'MEMBER', 'ADMIN'));
  `;

  // 2. organizations. Must exist before users can reference it.
  await client`
    CREATE TABLE IF NOT EXISTS organizations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      owner_id INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `;

  // 3. users.organization_id. Nullable; see section 3.1 of the ticket.
  await client`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
  `;

  // 4. The previous ticket's free-text column, now replaced by the table.
  await client`ALTER TABLE users DROP COLUMN IF EXISTS organization;`;

  // 5. updated_at. PostgreSQL has no ON UPDATE; the sessions migration
  //    introduced this trigger function and CREATE OR REPLACE makes it safe
  //    to declare again here.
  await client`
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;
  await client`DROP TRIGGER IF EXISTS organizations_set_updated_at ON organizations;`;
  await client`
    CREATE TRIGGER organizations_set_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  `;

  console.log('Migration completed: organizations table, users.type, users.organization_id.');
}

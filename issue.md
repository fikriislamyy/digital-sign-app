# Feature: Organizations, User Types, and a Two-Tab Signup

**Audience:** junior developer, or a cheaper AI model, working in this repository.
**Estimated effort:** 8-10 hours.
**Prerequisite reading:** `apps/backend/src/services/users.service.ts`, `apps/backend/src/routes/users.routes.ts`, `apps/backend/src/db/schema.ts`, `apps/frontend/src/auth/Signup.svelte`.

---

## 1. What we are building

Registration gains a concept of organizations. A user who signs up with an organization name becomes the `OWNER` of a new organization row. A user who signs up without one is `PERSONAL`. Registration also now returns session tokens, so a new user is signed in immediately.

On the frontend, the signup page gets two tabs, **Personal** and **Organization**. The only difference between them is that the Organization tab shows an organization name field.

Everything touches code that shipped in the previous ticket, so read section 3 before writing anything.

---

## 2. The target contract

### Request

```
POST /api/register
{
  "organization_name": "Acme",          optional
  "full_name": "Jane Doe",
  "phone_number": "+628123456789",
  "email": "jane@acme.com",
  "password": "secret123"
}
```

### Success, 200

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { "id": 1, "email": "jane@acme.com" },
    "access_token": "…",
    "refresh_token": "…"
  }
}
```

### Failure

| Status | Body |
| --- | --- |
| 400 | `{ "error": "Email already registered" }` |
| 500 | `{ "error": "Internal server error" }` |

### Rule

```
if organization_name is present:
    create organization (name, owner_id = user.id)
    user.type = 'OWNER'
    user.organization_id = organization.id
else:
    user.type = 'PERSONAL'
```

---

## 3. Six things in the specification that will not work as written

Each of these is settled below so you do not have to. Where the plan departs from the letter of the specification, it says why.

### 3.1 `users.organization_id NOT NULL` cannot be inserted

The specification asks for two foreign keys pointing at each other: `organizations.owner_id → users.id` and `users.organization_id → organizations.id`, both `NOT NULL`. To create the first owner you need an organization to point at. To create that organization you need an owner to point at. Neither row can go in first.

The specification's own else-branch also creates `PERSONAL` users with no organization at all, and the `users` table already has rows from previous tickets.

**`users.organization_id` is nullable.** The owner is inserted with it null, the organization is inserted pointing at the owner, and the owner is then updated. All three writes sit inside one transaction so nothing is half-done if a step fails. `organizations.owner_id` stays `NOT NULL` as specified, because an organization without an owner makes no sense.

### 3.2 `users.type NOT NULL` needs a default

Adding a `NOT NULL` column to a table that already has rows fails unless you supply a default. **`DEFAULT 'PERSONAL'`.** Everyone who registered before this ticket becomes a personal user, which is true.

### 3.3 The response text is copied from login

The specification's success message is `User logged in successfully` and its error example is `Invalid email or password`. Both are the login endpoint's strings. A register call cannot fail on a wrong password, and calling registration a login will confuse anyone reading logs.

**Use `User registered successfully`, and the real failure `Email already registered`.** The shape of the body is exactly as specified; only these two strings differ. If the reviewer wants the literal text, it is one line in `users.routes.ts`.

### 3.4 `ON UPDATE CURRENT_TIMESTAMP` is MySQL

PostgreSQL has no `ON UPDATE` clause. This repository already solved this for the `sessions` table with a `set_updated_at()` trigger function, created in `1789369500-sessions.migration.ts`. **Reuse that function.** Step 3 attaches a trigger to `organizations` with a `CREATE OR REPLACE` guard so the migration is safe to run whether or not the sessions one ran first.

### 3.5 The field names change under a page that shipped yesterday

The previous ticket taught the register endpoint `name`, `phone` and `organization`. This specification renames them to `full_name`, `phone_number` and `organization_name`. That is a breaking change to the contract, and `Signup.svelte` and `api.ts` send the old names right now.

**Change both sides together in this ticket.** The old names had one caller, it is in this repository, and it is being rewritten anyway. Do not keep both spellings.

### 3.6 `users.organization` is now the wrong shape

The previous ticket added `organization` to `users` as a `VARCHAR(255)`. This ticket makes organizations a table. Keeping the column would leave two places for the same fact to live and drift. **Drop it in the migration.** The column is nullable and days old; nothing else reads it.

---

## 4. Slug

The specification declares `slug VARCHAR(255) NOT NULL` and says nothing about how to make one, or whether two organizations may share one.

**Slugs are unique**, enforced by the database, because a slug that is not unique is not usable as an identifier. Generate it from the name:

```
"Acme, Inc."  →  "acme-inc"
"Café Noir"   →  "cafe-noir"
"   "         →  "org"
```

Lowercase, accents stripped, every run of non-alphanumerics collapsed to one hyphen, hyphens trimmed from the ends. If the result is taken, append `-2`, then `-3`, and so on.

Two people registering `Acme` in the same millisecond could both pass the existence check and one would then fail on the unique index. That is a 500 for one of them, once, and it is acceptable at this stage. The unique index is what keeps the data correct either way.

---

## 5. Files

Every new backend file follows the mandated layout: `routes/`, `services/`, `models/`, `migration/`, with the names below. No new route file is needed because `POST /register` already lives in `users.routes.ts`.

**Create**

| Path | Purpose |
| --- | --- |
| `apps/backend/src/models/organizations.model.ts` | the table |
| `apps/backend/src/services/organizations.service.ts` | slug generation, creating an organization |
| `apps/backend/src/migration/1789390000-organizations.migration.ts` | table, columns, trigger, constraint |

**Change**

| Path | Change |
| --- | --- |
| `apps/backend/src/models/users.model.ts` | add `type` and `organizationId`, drop `organization` |
| `apps/backend/src/db/schema.ts` | export the new model |
| `apps/backend/src/services/users.service.ts` | transaction, organization branch, session |
| `apps/backend/src/routes/users.routes.ts` | new body and response |
| `apps/frontend/src/lib/api.ts` | new field names, new return type |
| `apps/frontend/src/auth/Signup.svelte` | tabs, and save the session |
| `apps/frontend/src/auth/Verify.svelte` | go to the app after verifying, not to login |

---

## 6. Step by step

### Step 1 — The organizations model

Create `models/organizations.model.ts`:

```ts
import { pgTable, serial, varchar, integer, timestamp, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { users } from './users.model';

export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  // The thunk's return type must be written out. users.model imports this
  // file and this file imports users.model, and without the annotation
  // TypeScript cannot resolve the cycle and reports an implicit `any`.
  ownerId: integer('owner_id').notNull().references((): AnyPgColumn => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
```

The `(): AnyPgColumn =>` annotation is not decoration. Two model files that reference each other is the one place Drizzle's type inference gives up, and this is the documented fix. It was checked against the version installed here: both foreign keys register at runtime and `tsc` passes.

Then register the model. In `db/schema.ts`, add one line next to the other exports:

```ts
export * from '../models/organizations.model';
```

### Step 2 — The users model

In `models/users.model.ts`, remove the `organization` line and add `type` and `organizationId`. The file becomes:

```ts
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
  // Nullable: personal users have no organization, and an owner is inserted
  // before their organization exists. See section 3.1.
  organizationId: integer('organization_id').references((): AnyPgColumn => organizations.id),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

`enum: USER_TYPES` on the `varchar` narrows the TypeScript type so that `type: 'ADMN'` is a compile error. It does not add a database constraint; the migration in step 3 does that separately. `db/schema.ts` already uses this pattern on the `documents.status` column.

### Step 3 — The migration

Create `migration/1789390000-organizations.migration.ts`. The timestamp is later than the previous ticket's `1789380000` because this one drops a column that one added.

```ts
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
```

The order matters. `type` first because it touches only `users`. Then `organizations`, because the next statement references it. Then `organization_id`. The `DROP CONSTRAINT IF EXISTS` before `ADD CONSTRAINT` is what makes the whole file safe to run twice.

Migrations in this repository are applied by hand. Nothing imports these files and `db:migrate` runs drizzle-kit against its own folder, not this one. From `apps/backend`:

```bash
bun -e "import('./src/migration/1789390000-organizations.migration.ts').then(m => m.up()).then(() => process.exit(0))"
```

Then confirm:

```bash
docker compose exec postgres psql -U postgres -d digital_sign_db -c '\d users' -c '\d organizations'
```

You should see `type` and `organization_id` on `users`, no `organization`, and a `organizations` table with a unique index on `slug`.

### Step 4 — The organizations service

Create `services/organizations.service.ts`:

```ts
import { eq } from 'drizzle-orm';
import type { db } from '../db';
import { organizations } from '../models/organizations.model';

// The transaction handle the caller is already inside. Passing it in is what
// lets this insert roll back together with the user insert around it.
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')   // combining accents left by NFKD
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
  return slug || 'org';
}

async function uniqueSlug(tx: Tx, base: string): Promise<string> {
  let candidate = base;
  for (let n = 2; ; n++) {
    const [taken] = await tx
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, candidate))
      .limit(1);
    if (!taken) return candidate;
    candidate = `${base}-${n}`;
  }
}

export async function createOrganization(tx: Tx, name: string, ownerId: number) {
  const slug = await uniqueSlug(tx, slugify(name));
  const [organization] = await tx
    .insert(organizations)
    .values({ name: name.trim(), slug, ownerId })
    .returning();
  return organization;
}
```

`createOrganization` takes the transaction rather than using `db` directly. That is the whole point: if anything after it fails, the organization row disappears with the rest.

### Step 5 — Rewrite `registerUser`

This is the largest change. In `services/users.service.ts`:

**The input** gains `organizationName` and loses nothing else. The service keeps camelCase; the route in step 6 translates from the snake_case wire format.

```ts
export interface RegisterUserInput {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  organizationName?: string;
}
```

**The result** now matches `LoginUserResult` exactly, because registration signs the user in. Delete `RegisteredUserResult` and return `LoginUserResult` from both functions.

**The database path** becomes one transaction followed by two side effects. The existing `const name = input.name.trim()` at the top of the function becomes `input.fullName.trim()`.

```ts
const organizationName = input.organizationName?.trim() || undefined;

const user = await db.transaction(async (tx) => {
  const [existing] = await tx
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);
  if (existing) throw new Error('Email already registered');

  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert the owner first with no organization. The organization needs
  // owner_id, so it cannot go first. See section 3.1.
  const [created] = await tx
    .insert(users)
    .values({
      name,
      phone: input.phoneNumber?.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      type: organizationName ? 'OWNER' : 'PERSONAL',
    })
    .returning();

  if (!organizationName) return created;

  const organization = await createOrganization(tx, organizationName, created.id);

  const [updated] = await tx
    .update(users)
    .set({ organizationId: organization.id })
    .where(eq(users.id, created.id))
    .returning();

  return updated;
});

// Outside the transaction. Neither should undo a committed registration:
// a failed email is retried with resend-otp, and a failed session means the
// user simply logs in.
await createAndSendOtp(user.id, user.email);
const session = await createSession(user.id);

return {
  user: { id: user.id, email: user.email },
  accessToken: session.accessToken,
  refreshToken: session.refreshToken,
};
```

Note the `type` is decided on the insert, not on the update. If organization creation throws, the transaction rolls back and there is no `OWNER` row without an organization. The update only fills in `organizationId`.

**The in-memory fallback** must mirror the same rule or local development without PostgreSQL will diverge from production. Add `type` and `organizationId` to `InMemoryUser`, add a `memoryOrganizations` array with the same fields as the table, and follow the same branch: create the user, and if `organizationName` is set, push an organization and set the user's `organizationId`. Return tokens the way `loginUser`'s fallback already does, with `signAccessToken` and `generateRefreshToken`, which are already imported.

### Step 6 — The route

In `routes/users.routes.ts`, the register handler translates the wire format and returns the new shape.

```ts
    async ({ body, set }) => {
      try {
        const result = await registerUser({
          fullName: body.full_name,
          email: body.email,
          password: body.password,
          phoneNumber: body.phone_number,
          organizationName: body.organization_name,
        });

        return {
          success: true,
          message: 'User registered successfully',
          data: {
            user: result.user,
            access_token: result.accessToken,
            refresh_token: result.refreshToken,
          },
        };
      } catch (error: any) {
        if (error?.message === 'Email already registered') {
          set.status = 400;
          return { error: 'Email already registered' };
        }
        set.status = 500;
        return { error: 'Internal server error' };
      }
    },
    {
      body: t.Object({
        organization_name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        full_name: t.String({ minLength: 1, maxLength: 255 }),
        phone_number: t.Optional(t.String({ maxLength: 32 })),
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 6 }),
      }),
```

Two things changed in the error branch on purpose. It no longer echoes `error.message` on a 500, because a raw database error is not something to send to a browser. And the `phone_number` stays optional even though the Signup form always sends it, because the endpoint has other clients and the specification does not mark it required.

Keep the `detail` block; update its `description` to mention that registration now returns tokens.

### Step 7 — The frontend API client

In `lib/api.ts`, `register` sends the new names and gets tokens back. Its return type is the same as `login`'s, so extract it:

```ts
export interface AuthResult {
  user: ApiUser;
  access_token: string;
  refresh_token: string;
}

export const login = (email: string, password: string) =>
  post<AuthResult>('/api/login', { email, password });

export const register = (input: {
  full_name: string;
  email: string;
  password: string;
  phone_number?: string;
  organization_name?: string;
}) => post<AuthResult>('/api/register', input);
```

`ApiUser` currently declares `name`. The register response no longer includes it, and the login response never did. Drop `name` from `ApiUser` so the type tells the truth.

### Step 8 — Tabs on the signup page

In `auth/Signup.svelte`, add one piece of state and a tab strip above the form.

```ts
type Kind = 'personal' | 'organization';
let kind = $state<Kind>('personal');

const tabs: { id: Kind; label: string }[] = [
  { id: 'personal', label: 'Personal' },
  { id: 'organization', label: 'Organization' },
];
```

```svelte
<div role="tablist" aria-label="Account type" class="mb-8 grid grid-cols-2 gap-1 rounded-lg bg-gray-1 p-1 dark:bg-gray-2">
  {#each tabs as tab}
    <button
      type="button"
      role="tab"
      id="tab-{tab.id}"
      aria-selected={kind === tab.id}
      aria-controls="signup-form"
      onclick={() => (kind = tab.id)}
      class="rounded-md px-4 py-2 text-sm font-medium transition-colors duration-300 {kind === tab.id
        ? 'bg-bg-elevated text-fg shadow-card'
        : 'text-fg-muted hover:text-fg'}"
    >
      {tab.label}
    </button>
  {/each}
</div>

<form id="signup-form" role="tabpanel" aria-labelledby="tab-{kind}" onsubmit={onSubmit} class="space-y-5" novalidate>
  {#if kind === 'organization'}
    <Field label="Organization name" bind:value={organization} placeholder="Acme Inc." required />
  {/if}
  <Field label="Full name" bind:value={fullName} placeholder="Jane Doe" required />
  <Field label="Phone number" type="tel" bind:value={phone} placeholder="+628123456789" />
  <Field label="Email" type="email" bind:value={email} placeholder="jane@acme.com" required />
  <PasswordField label="Password" bind:value={password} placeholder="••••••••" />
  <PasswordField label="Confirm password" bind:value={confirmPassword} placeholder="••••••••" />
  …
```

The Personal tab is the default because it is the shorter form and the more common case.

Switching tabs does not clear anything. The state variables for the other five fields live outside the `{#if}`, so a person who types their name and then remembers they need the Organization tab keeps what they typed. Only the organization name is inside the conditional, and it too keeps its value if they switch away and back.

**Validation** gains one rule, first in the list, and only on the Organization tab:

| Check | Message |
| --- | --- |
| Organization tab, and organization name is empty | `Enter your organization name.` |
| Full name is not empty | `Enter your full name.` |
| Email looks valid | `Enter a valid email address.` |
| Password is at least 6 characters | `Password must be at least 6 characters.` |
| Confirm matches | `Passwords do not match.` |

**The request** sends the organization only from the Organization tab. Text typed there and then abandoned by switching to Personal must not be sent:

```ts
const result = await register({
  full_name: fullName.trim(),
  email: email.trim(),
  password,
  phone_number: phone.trim() || undefined,
  organization_name: kind === 'organization' ? organization.trim() : undefined,
});

auth.save(result.user, result.access_token, result.refresh_token);
window.location.hash = `#/verify?email=${encodeURIComponent(email.trim())}`;
```

Import `auth` from `../lib/auth.svelte` for that. The user is now signed in the moment they register, but their email is still unverified and the OTP has still been sent, so the next screen is still verification.

`type="tel"` on the phone field is new. It brings up the phone keypad on mobile and costs nothing.

### Step 9 — Where verification goes afterwards

`auth/Verify.svelte` currently sends a verified user to `#/login`. They already hold a session from step 8, so asking them to log in again is a dead end. Change the success redirect to `#/app`.

That is the only change to this file.

---

## 7. Testing

Start everything with `bun run dev` from the repository root, apply the migration from step 3, and work through the list. Rows 1 through 5 are the API on its own; the rest are the page.

| # | Action | Expected |
| --- | --- | --- |
| 1 | `curl` register with `organization_name` | 200, tokens in `data`, and in psql: a `users` row with `type = 'OWNER'` and `organization_id` set, an `organizations` row with that user as `owner_id` |
| 2 | `curl` register without `organization_name` | 200, `type = 'PERSONAL'`, `organization_id` null, no new organization |
| 3 | Register `Acme, Inc.` then `Acme Inc` | Slugs `acme-inc` and `acme-inc-2` |
| 4 | Register the same email twice | Second is 400 `Email already registered` |
| 5 | Register with the old field name `name` | 422 from Elysia's validator; the old contract is gone |
| 6 | Open `#/signup` | Personal tab selected, five fields, no organization field |
| 7 | Click Organization | Organization name appears at the top; everything typed so far is still there |
| 8 | Submit Organization tab with an empty organization name | `Enter your organization name.` |
| 9 | Type an organization name, switch to Personal, submit | Registers as PERSONAL; the organization name was not sent |
| 10 | Complete an Organization signup | Lands on `#/verify`, and `signcraft-user` is already in local storage |
| 11 | Enter the code from the backend console | Lands on `#/app`, not `#/login` |
| 12 | Tab from the Personal tab | Focus moves to the Organization tab, then into the form |
| 13 | Both tabs, both themes | The selected tab is clearly distinguished in light and dark |
| 14 | Width 375px | Tabs sit side by side; no horizontal scroll |

For row 1:

```bash
curl -s -X POST localhost:3000/api/register -H 'content-type: application/json' \
  -d '{"organization_name":"Acme","full_name":"Jane","phone_number":"+628123456789","email":"jane@acme.com","password":"secret123"}'
```

And after every step:

```bash
cd apps/frontend && bun run check    # must report 0 ERRORS
```

---

## 8. Acceptance checklist

- [ ] `bun run check` reports 0 errors.
- [ ] `organizations.model.ts` exists, uses `(): AnyPgColumn =>`, and is exported from `db/schema.ts`.
- [ ] `users` has `type` with a default and a check constraint, `organization_id` nullable, and no `organization` column.
- [ ] `organizations.slug` has a unique index.
- [ ] `organizations.updated_at` changes on update, via the trigger.
- [ ] User insert, organization insert and user update run in one transaction.
- [ ] An owner is never left without an organization, and a `PERSONAL` user never gets one.
- [ ] `POST /api/register` accepts `full_name`, `phone_number`, `organization_name` and rejects the old names.
- [ ] Registration returns `access_token` and `refresh_token` under `data`.
- [ ] Success message is `User registered successfully`; a duplicate email is 400 `Email already registered`; a 500 never echoes an internal error message.
- [ ] The in-memory fallback applies the same owner/personal rule.
- [ ] Signup has a `role="tablist"` with two `role="tab"` buttons and `aria-selected` on the active one.
- [ ] Only the Organization tab shows and requires the organization name.
- [ ] Switching tabs preserves typed values, and the organization name is sent only from the Organization tab.
- [ ] Signup stores the session before going to `#/verify`.
- [ ] Verification sends the user to `#/app`.
- [ ] `ApiUser` no longer declares a `name` the API does not return.

---

## 9. Mistakes to avoid

**Dropping the `AnyPgColumn` annotation.** Both model files import each other. Without the explicit return type, `tsc` reports an implicit `any` and the error message does not mention either file by name, so it takes a while to trace.

**Making `organization_id` NOT NULL because the specification says so.** Section 3.1. It cannot be inserted, it contradicts the PERSONAL branch, and it fails on existing rows.

**Calling `createOrganization` with `db` instead of `tx`.** It will work in every test you run, and then one day the user update fails and an organization is left with an owner who does not belong to it.

**Deciding `type` in the update instead of the insert.** If organization creation throws, the rollback removes the organization but the insert's `type` value is what would have been committed. Set `OWNER` on the insert so a failed transaction leaves nothing at all.

**Sending the organization name from the Personal tab.** The field is hidden, but the variable still holds whatever was typed. Gate on `kind`, not on whether the string is empty.

**Clearing the form on tab switch.** The tabs differ by one field. Wiping the other five is hostile.

**Keeping the old field names "for compatibility".** The one caller is in this repository and is being changed in the same pull request.

**Echoing `error.message` in the 500 response.** A PostgreSQL error string can include table and column names. The old handler did this; the new one does not.

**Running the migration twice and panicking at the second run.** Every statement is guarded. A second run is a no-op and that is by design.

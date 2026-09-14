# Feature: Logout, Route Guards, App Shell, and Dashboard

**Audience:** junior developer, or a cheaper AI model, working in this repository.
**Estimated effort:** 3–4 days. Ship it as three pull requests, one per phase below. Each phase leaves the app working.
**Prerequisite reading:** `apps/backend/src/routes/users.routes.ts`, `apps/backend/src/services/sessions.service.ts`, `apps/frontend/src/App.svelte`, `apps/frontend/src/lib/auth.svelte.ts`, `apps/frontend/src/lib/api.ts`.

---

## 1. What we are building

**Phase A — backend.** A `POST /api/logout` endpoint, a bearer-token middleware for protected routes, a `GET /api/me` endpoint the app shell needs, a real `documents` table, two dashboard data endpoints, and the folder structure the specification mandates (`controller/`, `middleware/`, `validator/`, `dto/`, `interface/`, `utils/`).

**Phase B — app shell.** Route guards in the frontend router; an authenticated layout with a navbar (user menu with logout, theme toggle, wallet) and a role-aware sidebar; the old `#/app` demo page removed; `/` sending logged-in users to the dashboard and everyone else to the landing page.

**Phase C — dashboard.** Greeting and live clock, a time-range filter, four stat cards, a line chart with peak and average, a status pie, and the five most recent documents.

Everything below has been checked against the installed versions: Elysia 1.4.30, Drizzle 0.38, Svelte 5, Bun 1.4.2, PostgreSQL 16 in Docker. Where a snippet is marked *verified*, it was run.

---

## 2. Contracts

### `POST /api/logout` — public

```
{ "refresh_token": "…" }
```

| Status | Body |
| --- | --- |
| 200 | `{ "success": true, "message": "User logged out successfully" }` |
| 401 | `{ "error": "Invalid token" }` |

Deletes the session row whose `refresh_token` matches. No `Authorization` header is required — see 3.4.

### `POST /api/refresh` — public *(not in the spec; see 3.5)*

```
{ "refresh_token": "…" }
```

| Status | Body |
| --- | --- |
| 200 | `{ "success": true, "data": { "access_token": "…" } }` |
| 401 | `{ "error": "Invalid token" }` |

### `GET /api/me` — protected

```json
{
  "success": true,
  "data": {
    "user": { "id": 6, "name": "John Smith", "email": "john@acme.com", "type": "OWNER",
              "organization": { "id": 1, "name": "Acme Inc", "slug": "acme-inc" } },
    "wallet": { "balance": "0.00", "currency": "USD" }
  }
}
```

`organization` is `null` for `PERSONAL` users. `wallet` is the owner's balance when the user is not `PERSONAL` (see 3.6).

### `GET /api/dashboard/analytics?from=&to=&tz=&granularity=` — protected

`from`/`to` are ISO instants, `tz` is an IANA zone such as `Asia/Jakarta`, `granularity` is `hour` | `day` | `month`.

```json
{
  "success": true,
  "data": {
    "totals": { "uploaded": 12, "draft": 4, "sent": 5, "completed": 3 },
    "series": [ { "bucket": "2026-09-14T06:00:00", "count": 1 }, … ]
  }
}
```

`bucket` is wall-clock time in `tz`, with no offset suffix. Buckets with zero documents are absent; the frontend fills them in.

### `GET /api/dashboard/recent` — protected

```json
{ "success": true, "data": [ { "id": "…", "title": "…", "status": "sent", "createdAt": "2026-09-14T01:15:00.000Z" }, … ] }
```

The five newest documents of the current user, any date.

Every protected endpoint answers `401 { "error": "Unauthorized" }` without a valid `Authorization: Bearer <access_token>` header.

---

## 3. Things in the specification that need settling

### 3.1 The four redirect rules contradict each other

As written:

1. guest on a guest route → landing page
2. auth on an auth route → dashboard
3. guest on an auth route → landing page
4. auth on a guest route → dashboard

Rules 1 and 2 would make the app unusable: a guest could never reach the login page, and a logged-in user could never stay on the dashboard. What the later paragraph actually asks for is `/`: logged-in users go to the dashboard, everyone else sees the landing page. So the rules are:

| Route kind | Examples | Guest | Logged in |
| --- | --- | --- | --- |
| root | `#/`, empty hash, in-page anchors like `#pricing` | landing page | redirect to `#/dashboard` |
| guest | `#/login`, `#/signup` | allowed | redirect to `#/dashboard` |
| open | `#/verify` | allowed | allowed |
| auth | `#/dashboard`, `#/documents`, … everything else under `#/` | redirect to `#/` | allowed |

`#/verify` is **open**, not guest: issue 15 made signup store a session before sending the user to the verify screen, so a freshly signed-up user is logged in *and* needs that page. Classifying it as guest would bounce them to the dashboard before they could enter the code. (Whether unverified users should be kept out of the dashboard is a separate question this ticket does not answer.)

### 3.2 "Middleware" is two different things

Redirects happen in the browser; the backend never redirects an API call. So:

- **Backend middleware** (`middleware/auth.middleware.ts`) reads the bearer token, loads the user, and answers 401 when either is missing. It protects `/me` and the dashboard endpoints.
- **Frontend guard** lives in `App.svelte` and implements the table in 3.1.

Both are built. Neither replaces the other.

### 3.3 The `documents` table does not exist

It is declared in `db/schema.ts` but was never created — `\d documents` in the database returns nothing, and today's `GET /api/documents` silently serves demo data. So this ticket creates it with a migration, which also lets us fix two things while nothing depends on it:

- **Statuses become `draft`, `sent`, `completed`**, the three the dashboard counts. The old `pending`/`signed`/`rejected` set had no consumer.
- **`created_at` is `TIMESTAMPTZ`**, not `TIMESTAMP`. The analytics groups documents by hour and day *in the user's timezone*, and that arithmetic is only unambiguous on a column that stores an instant. Every other table keeps `TIMESTAMP`; only this one does time math.

The two demo endpoints in `index.ts` are deleted along with the demo fallback. The `documents` definition moves from `db/schema.ts` to `models/documents.model.ts`; `signatures` stays where it is and imports it from there.

### 3.4 Logout is keyed on the refresh token alone

The spec's request body has only `refresh_token`. Access tokens expire after 15 minutes; if logout required one, a user with an expired access token could not log out. The refresh token is a 256-bit secret, so it is sufficient on its own. The frontend clears its stored tokens whether or not the call succeeds.

### 3.5 Without a refresh endpoint the app logs everyone out after 15 minutes

Not in the spec, but a consequence of this ticket: the dashboard is the first screen that calls protected endpoints, and access tokens last 15 minutes. With no way to renew one, every user is bounced to the login page a quarter of an hour after signing in. `POST /api/refresh` is small — it lives in the same files as logout — and the frontend's `authFetch` (step B1) retries once through it before giving up. **This is included.** If the reviewer wants it out, delete step A5's refresh handler and the retry in `authFetch`; the rest stands.

### 3.6 There is no wallet anywhere

No balance column exists on any table. The spec's rule — "if user type is not personal, use owner balance" — settles the shape: the balance belongs to a user, and organization members read their owner's. So:

- migration adds `users.balance NUMERIC(14,2) NOT NULL DEFAULT 0`
- `/me` resolves it: `PERSONAL` and `OWNER` return their own row's balance; `MEMBER` and `ADMIN` return the balance of `organizations.owner_id`
- currency is unspecified. `utils/wallet.util.ts` exports `WALLET_CURRENCY = 'USD'`; changing it is one line. The frontend formats with `Intl.NumberFormat`.

Nothing in this ticket changes a balance. "Top up" is a placeholder page.

### 3.7 Thirteen sidebar pages, one of which is specified

Only Dashboard has content. The other twelve (Documents, Templates, Top up, Usage, Plan history, Member list, Invitations, Profile, Security, Notifications, Api keys, Delete account) get one shared `Placeholder.svelte` that shows the page title and "Coming soon". They exist so the sidebar links go somewhere and the role rules in the sidebar can be tested.

### 3.8 Peak and average are underspecified for half the filters

The spec defines peak hour for today/yesterday, peak day for weeks, peak week for months, and nothing for years. The chart is described as "last 7 days" but is also "affected by the filter". This table is the whole definition; the frontend implements it in one file (`dashboard/range.ts`):

| Filter | Range (browser timezone) | Chart buckets | Peak | Average |
| --- | --- | --- | --- | --- |
| today, yesterday | that calendar day | 24 hours | **peak hour** 0–23 | per hour = total ÷ 24 |
| this week, last week | Monday 00:00 → next Monday | 7 days | **peak day** 1–7, Monday = 1 | per day = total ÷ 7 |
| this month, last month | 1st 00:00 → 1st of next month | one per day (28–31) | **peak week** 1–5 | per week = total ÷ (days ÷ 7) |
| this year, last year | Jan 1 → next Jan 1 | 12 months | **peak month** 1–12 | per month = total ÷ 12 |

Three departures from the literal text, each because the literal text cannot be implemented:

- Peak week is 1–5, not 1–4. Week-of-month is `ceil(dayOfMonth ÷ 7)`; days 29–31 fall in week 5.
- Year filters get peak month and average per month, by extension of the same pattern.
- "This week" averages over 7 days even on a Tuesday. Averaging over elapsed days is a different feature; say so in the UI label ("per day") and move on.

When the total is zero, peak shows "—".

The four cards and the pie count documents by **`created_at` within the range**, including the status cards. A "completed this week" that means *completed* this week would need a `completed_at` column that does not exist. Consistency wins.

### 3.9 The browser owns the calendar; the server owns the counting

"Same timezone as the user's browser" means the range boundaries ("start of this week") and the bucket labels ("06:00") must both use the browser's zone. The clean split, and the one the contract in section 2 encodes:

- The **browser** computes `from`/`to` as instants using plain `new Date(y, m, d)` arithmetic, which is local by definition, and sends its zone name from `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- The **server** runs one parameterized query: filter rows by instant, group by `date_trunc(granularity, created_at AT TIME ZONE tz)`.

*Verified:* with rows at 23:30Z and 01:15Z and a Jakarta (UTC+7) "today", the query returns buckets `06:00` and `08:00` and excludes a row at 17:30Z (00:30 the next day in Jakarta).

**One trap, also verified:** the `postgres` client in this repo is configured with `prepare: false`, and in that mode it **refuses `Date` values as query parameters** — it throws `The "string" argument must be of type string`. Always pass `date.toISOString()`. This applies to `db.execute(sql\`…\`)` too.

### 3.10 Folder structure: new code follows it fully; existing routes are moved, not rewritten

The spec mandates `controller/`, `middleware/`, `validator/`, `dto/`, `interface/`, `utils/` alongside the existing `routes/`, `services/`, `models/`, `migration/`. What goes where:

| Folder | Contains | Imports Elysia? |
| --- | --- | --- |
| `routes/` | the `new Elysia().post(path, controller, { body: schema })` wiring, nothing else | yes |
| `controller/` | the handler bodies: call a service, shape the response, set the status | no |
| `validator/` | `t.Object(...)` request schemas | yes (`t` only) |
| `dto/` | request and response body types as TypeScript interfaces | no |
| `interface/` | service input/output types, shared HTTP types | no |
| `middleware/` | Elysia plugins that run before handlers | yes |
| `utils/` | pure functions with no I/O | no |
| `services/`, `models/`, `migration/` | as before | no |

Step A1 moves the existing `users` and `email-verification` handlers into controllers and validators. It is cut-and-paste: the handler function body moves, the schema object moves, behavior does not change. After this ticket, the whole backend has one shape.

### 3.11 The pie chart

Part-to-whole with three close values is a form pie charts handle badly — the eye cannot compare two slices of 32% and 36%. The spec asks for a pie, so it is a pie, but it ships with **percentage labels in a legend beside it**, which is what makes it readable. The three slice colors were run through a colorblind-safety validator against this app's light and dark surfaces and pass; the aqua slice sits below 3:1 contrast on the light surface, which is exactly why the legend labels are mandatory rather than decorative.

---

## 4. Files

### Backend — create

| Path | Purpose |
| --- | --- |
| `interface/http.interface.ts` | `HttpSet`, the one type every controller needs |
| `middleware/auth.middleware.ts` | bearer token → `user` in context, or 401 |
| `dto/users.dto.ts`, `dto/sessions.dto.ts`, `dto/email-verification.dto.ts`, `dto/dashboard.dto.ts` | request/response types |
| `validator/users.validator.ts`, `validator/sessions.validator.ts`, `validator/email-verification.validator.ts`, `validator/dashboard.validator.ts` | `t.Object` schemas |
| `controller/users.controller.ts`, `controller/sessions.controller.ts`, `controller/email-verification.controller.ts`, `controller/dashboard.controller.ts` | handlers |
| `routes/sessions.routes.ts`, `routes/dashboard.routes.ts` | wiring |
| `services/dashboard.service.ts` | the two analytics queries |
| `models/documents.model.ts` | moved out of `db/schema.ts`, new statuses, `timestamptz` |
| `migration/1789400000-documents-and-wallet.migration.ts` | `documents` table, `users.balance` |
| `utils/wallet.util.ts` | `WALLET_CURRENCY` |
| `scripts/seed-documents.ts` (outside `src/`) | dev data for the dashboard |

### Backend — change

| Path | Change |
| --- | --- |
| `routes/users.routes.ts`, `routes/email-verification.routes.ts` | handlers and schemas move out; `/me` added |
| `services/sessions.service.ts` | `revokeSession`, `refreshAccessToken` |
| `services/users.service.ts` | `getProfile` |
| `db/schema.ts` | export documents from its model; delete the inline definition |
| `index.ts` | delete the two demo `/documents` endpoints; mount the new routes |
| `package.json` | `db:seed` script |

### Frontend — create

| Path | Purpose |
| --- | --- |
| `src/app/AppLayout.svelte` | navbar + sidebar + content slot |
| `src/app/Navbar.svelte`, `src/app/UserMenu.svelte`, `src/app/Wallet.svelte`, `src/app/Sidebar.svelte` | the shell |
| `src/app/Placeholder.svelte` | the twelve unspecified pages |
| `src/dashboard/Dashboard.svelte` | the page |
| `src/dashboard/Clock.svelte`, `StatCard.svelte`, `LineChart.svelte`, `PieChart.svelte`, `RecentDocuments.svelte` | its parts |
| `src/dashboard/range.ts` | the table in 3.8 as code |
| `src/lib/routes.ts` | route table and kinds |

### Frontend — change

| Path | Change |
| --- | --- |
| `src/App.svelte` | route guard, layout switch |
| `src/lib/api.ts` | `authFetch`, `logout`, `me`, dashboard calls |
| `src/lib/auth.svelte.ts` | `profile` state, `refreshToken` getter |
| `src/auth/Login.svelte`, `src/auth/Verify.svelte` | redirect to `#/dashboard` |
| `src/landing/Nav.svelte`, `Hero.svelte`, `FinalCta.svelte` | `#/app` links → `#/signup` / `#/login` |
| `src/app.css` | three chart color tokens |
| `src/Dashboard.svelte` | **deleted** (the 769-line demo) |

---

## 5. Phase A — backend

### A1 — Adopt the folder structure (mechanical)

Create `interface/http.interface.ts`:

```ts
export interface HttpSet {
  status?: number | string;
}
```

Then for each existing route file, move the handler bodies and schemas. One full example, `register`; do the same for `login`, `verify-email`, `resend-otp`.

`dto/users.dto.ts`:

```ts
export interface RegisterDto {
  organization_name?: string;
  full_name: string;
  phone_number?: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}
```

`validator/users.validator.ts` — the `t.Object` moves here verbatim:

```ts
import { t } from 'elysia';

export const registerBody = t.Object({
  organization_name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  full_name: t.String({ minLength: 1, maxLength: 255 }),
  phone_number: t.Optional(t.String({ maxLength: 32 })),
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 6 }),
});

export const loginBody = t.Object({
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 1 }),
});
```

`controller/users.controller.ts` — the handler body moves here verbatim. Note there is no Elysia import:

```ts
import type { HttpSet } from '../interface/http.interface';
import type { RegisterDto, LoginDto } from '../dto/users.dto';
import { registerUser, loginUser } from '../services/users.service';

export async function registerController({ body, set }: { body: RegisterDto; set: HttpSet }) {
  try {
    const result = await registerUser({ /* unchanged */ });
    return { /* unchanged */ };
  } catch (error: any) {
    /* unchanged */
  }
}

export async function loginController({ body, set }: { body: LoginDto; set: HttpSet }) {
  /* unchanged */
}
```

`routes/users.routes.ts` shrinks to wiring:

```ts
import { Elysia } from 'elysia';
import { registerController, loginController } from '../controller/users.controller';
import { registerBody, loginBody } from '../validator/users.validator';

export const usersRoutes = new Elysia({ prefix: '' })
  .post('/register', registerController, {
    body: registerBody,
    detail: { tags: ['Authentication & Users'], summary: 'Register a new user', description: '…unchanged…' },
  })
  .post('/login', loginController, {
    body: loginBody,
    detail: { /* unchanged */ },
  });
```

*Verified:* a controller typed `{ body: Dto; set: HttpSet }` type-checks as an Elysia 1.4 handler and runs. The `detail` blocks stay in the route file; they are documentation, not logic.

After moving all four handlers: `bunx tsc --noEmit` silent, and the tests from issues 14 and 16 still pass (register, login, verify, resend). Nothing else may change in this step.

### A2 — Documents model and migration

Create `models/documents.model.ts`:

```ts
import { pgTable, text, timestamp, uuid, jsonb, integer } from 'drizzle-orm/pg-core';
import { users } from './users.model';

export const DOCUMENT_STATUSES = ['draft', 'sent', 'completed'] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  fileUrl: text('file_url'),
  status: text('status', { enum: DOCUMENT_STATUSES }).default('draft').notNull(),
  metadata: jsonb('metadata'),
  creatorId: integer('creator_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
```

In `db/schema.ts`, delete the inline `documents` block, add `export * from '../models/documents.model';`, and change the `signatures` reference to import `documents` from the model. `creatorId` becomes `NOT NULL`: a document without an owner cannot appear on anyone's dashboard.

Add `balance` to `models/users.model.ts`:

```ts
import { numeric } from 'drizzle-orm/pg-core';
// …
balance: numeric('balance', { precision: 14, scale: 2 }).notNull().default('0'),
```

Drizzle returns `numeric` as a **string** (`"0.00"`), not a number. That is correct — floating point must not touch money — and it is why the `/me` contract shows `"balance": "0.00"`.

Create `migration/1789400000-documents-and-wallet.migration.ts`:

```ts
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
```

The trigger function `set_updated_at()` already exists from the sessions migration. The index is on `(creator_id, created_at)` because every dashboard query filters by both.

Run it from `apps/backend`:

```bash
bun --env-file=../../.env -e "import('./src/migration/1789400000-documents-and-wallet.migration.ts').then(m => m.up()).then(() => process.exit(0))"
docker compose exec postgres psql -U postgres -d digital_sign_db -c '\d documents'
```

### A3 — Auth middleware

Create `middleware/auth.middleware.ts`:

```ts
import { Elysia } from 'elysia';
import { jwtVerify } from 'jose';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, type User } from '../models/users.model';

const jwtSecret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-only-insecure-secret-change-me'
);

async function userFromBearer(authorization: string | undefined): Promise<User | null> {
  if (!authorization?.startsWith('Bearer ')) return null;
  try {
    const { payload } = await jwtVerify(authorization.slice(7), jwtSecret);
    const [user] = await db.select().from(users).where(eq(users.id, Number(payload.sub))).limit(1);
    return user ?? null;
  } catch {
    return null;
  }
}

/**
 * Attach as `.use(authMiddleware)` inside a route plugin. Every handler after it
 * receives `user`; requests without a valid token stop here with 401.
 */
export const authMiddleware = new Elysia({ name: 'auth-middleware' })
  .derive({ as: 'scoped' }, async ({ headers }) => ({
    user: await userFromBearer(headers.authorization),
  }))
  .onBeforeHandle({ as: 'scoped' }, ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }
  });
```

*Verified* in this shape: a route plugin that does `.use(authMiddleware)` answers 401 with no token and with a tampered token, 200 with a real one, and a sibling plugin without the middleware stays public. `{ as: 'scoped' }` is what makes the hooks apply to the plugin that `.use`s this one; without it they apply to nothing.

The secret line duplicates `sessions.service.ts`. Move that constant into `utils/jwt.util.ts` and import it from both places, so there is one definition.

Controllers on protected routes receive `user` alongside `body`/`query`/`set`; type it as `{ user: User; … }`. It is never null inside a handler, because the hook already returned.

### A4 — `/me`

`services/users.service.ts`, add:

```ts
import { organizations } from '../models/organizations.model';
import { WALLET_CURRENCY } from '../utils/wallet.util';

export async function getProfile(user: User) {
  const organization = user.organizationId
    ? (await db.select().from(organizations).where(eq(organizations.id, user.organizationId)).limit(1))[0] ?? null
    : null;

  // Members and admins spend from the organization owner's wallet.
  let balance = user.balance;
  if (user.type !== 'PERSONAL' && user.type !== 'OWNER' && organization) {
    const [owner] = await db.select({ balance: users.balance }).from(users).where(eq(users.id, organization.ownerId)).limit(1);
    if (owner) balance = owner.balance;
  }

  return {
    user: {
      id: user.id, name: user.name, email: user.email, type: user.type,
      organization: organization ? { id: organization.id, name: organization.name, slug: organization.slug } : null,
    },
    wallet: { balance, currency: WALLET_CURRENCY },
  };
}
```

`utils/wallet.util.ts` is one line: `export const WALLET_CURRENCY = 'USD';`

Controller `meController({ user })` returns `{ success: true, data: await getProfile(user) }`. Route: a **separate** plugin so the middleware does not leak onto register/login:

```ts
export const meRoutes = new Elysia({ prefix: '' })
  .use(authMiddleware)
  .get('/me', meController, { detail: { tags: ['Authentication & Users'], summary: 'Current user profile and wallet' } });
```

Export it from `users.routes.ts` next to `usersRoutes`, mount both in `index.ts`.

### A5 — Logout and refresh

`services/sessions.service.ts`, add:

```ts
import { and, eq, gt } from 'drizzle-orm';

/** Returns false when no session matched. */
export async function revokeSession(refreshToken: string): Promise<boolean> {
  const deleted = await db.delete(sessions).where(eq(sessions.refreshToken, refreshToken)).returning({ id: sessions.id });
  return deleted.length > 0;
}

/** Returns null when the refresh token is unknown or expired. */
export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.refreshToken, refreshToken), gt(sessions.expiresAt, new Date())))
    .limit(1);
  if (!session) return null;

  const accessToken = await signAccessToken(session.userId);
  await db.update(sessions).set({ accessToken }).where(eq(sessions.id, session.id));
  return accessToken;
}
```

`gt(sessions.expiresAt, new Date())` is fine here — Drizzle's query builder serializes the `Date` itself. The trap in 3.9 is only for raw `sql` templates and `client`.

`controller/sessions.controller.ts`:

```ts
export async function logoutController({ body, set }: { body: LogoutDto; set: HttpSet }) {
  const revoked = await revokeSession(body.refresh_token);
  if (!revoked) {
    set.status = 401;
    return { error: 'Invalid token' };
  }
  return { success: true, message: 'User logged out successfully' };
}

export async function refreshController({ body, set }: { body: RefreshDto; set: HttpSet }) {
  const accessToken = await refreshAccessToken(body.refresh_token);
  if (!accessToken) {
    set.status = 401;
    return { error: 'Invalid token' };
  }
  return { success: true, data: { access_token: accessToken } };
}
```

Both DTOs are `{ refresh_token: string }`; both validators are `t.Object({ refresh_token: t.String({ minLength: 1 }) })`. Wrap each in the same try/catch → 500 pattern the other controllers use. `routes/sessions.routes.ts` wires `/logout` and `/refresh` with no middleware. Mount in `index.ts`.

### A6 — Dashboard service, controller, routes

`services/dashboard.service.ts`:

```ts
import { sql, desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { documents } from '../models/documents.model';

export type Granularity = 'hour' | 'day' | 'month';

export interface AnalyticsInput {
  userId: number;
  from: Date;
  to: Date;
  tz: string;
  granularity: Granularity;
}

export async function getAnalytics(input: AnalyticsInput) {
  // ISO strings, never Date objects: the postgres client rejects Date parameters. See ticket 3.9.
  const from = input.from.toISOString();
  const to = input.to.toISOString();

  const [totals] = await db.execute(sql`
    SELECT count(*)::int AS uploaded,
           count(*) FILTER (WHERE status = 'draft')::int AS draft,
           count(*) FILTER (WHERE status = 'sent')::int AS sent,
           count(*) FILTER (WHERE status = 'completed')::int AS completed
    FROM documents
    WHERE creator_id = ${input.userId} AND created_at >= ${from} AND created_at < ${to}
  `);

  const series = await db.execute(sql`
    SELECT to_char(date_trunc(${input.granularity}, created_at AT TIME ZONE ${input.tz}), 'YYYY-MM-DD"T"HH24:MI:SS') AS bucket,
           count(*)::int AS count
    FROM documents
    WHERE creator_id = ${input.userId} AND created_at >= ${from} AND created_at < ${to}
    GROUP BY 1
    ORDER BY 1
  `);

  return { totals, series };
}

export async function getRecentDocuments(userId: number) {
  return db
    .select({ id: documents.id, title: documents.title, status: documents.status, createdAt: documents.createdAt })
    .from(documents)
    .where(eq(documents.creatorId, userId))
    .orderBy(desc(documents.createdAt))
    .limit(5);
}
```

Both SQL statements are *verified* against a `timestamptz` column with the Jakarta example from 3.9. Everything in `${…}` is a bound parameter — `granularity` and `tz` included — so no user input is spliced into SQL. `date_trunc` accepts its unit as a text parameter.

`validator/dashboard.validator.ts`:

```ts
export const analyticsQuery = t.Object({
  from: t.String({ format: 'date-time' }),
  to: t.String({ format: 'date-time' }),
  tz: t.String({ minLength: 1, maxLength: 64 }),
  granularity: t.Union([t.Literal('hour'), t.Literal('day'), t.Literal('month')]),
});
```

`controller/dashboard.controller.ts`, `analyticsController({ user, query, set })`:

1. `new Intl.DateTimeFormat('en', { timeZone: query.tz })` — throws `RangeError` for an unknown zone. Catch it → `400 { error: 'Invalid timezone' }`. This is what keeps a bad `tz` from becoming a database error.
2. `from = new Date(query.from)`, `to = new Date(query.to)`; if `to <= from` → `400 { error: 'Invalid range' }`.
3. Return `{ success: true, data: await getAnalytics({ userId: user.id, from, to, tz: query.tz, granularity: query.granularity }) }`.

`recentController({ user })` returns `{ success: true, data: await getRecentDocuments(user.id) }`.

`routes/dashboard.routes.ts`:

```ts
export const dashboardRoutes = new Elysia({ prefix: '/dashboard' })
  .use(authMiddleware)
  .get('/analytics', analyticsController, { query: analyticsQuery, detail: { tags: ['Dashboard'], summary: 'Totals and time series for a range' } })
  .get('/recent', recentController, { detail: { tags: ['Dashboard'], summary: 'Five most recent documents' } });
```

In `index.ts`: delete the `/documents` GET and POST handlers and the `documents, signatures` import; mount `meRoutes`, `sessionsRoutes`, `dashboardRoutes` inside the `/api` group.

### A7 — Seed script

The dashboard is empty without documents, and nothing in the app creates them yet. Create `apps/backend/scripts/seed-documents.ts` (outside `src/`, so the `src` naming rules do not apply):

```ts
import { eq } from 'drizzle-orm';
import { db } from '../src/db';
import { users } from '../src/models/users.model';
import { documents, DOCUMENT_STATUSES } from '../src/models/documents.model';

const email = process.argv[2];
if (!email) {
  console.error('Usage: bun run db:seed <email>');
  process.exit(1);
}

const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
if (!user) {
  console.error(`No user with email ${email}`);
  process.exit(1);
}

const rows = [];
const now = Date.now();
for (let i = 0; i < 80; i++) {
  // Spread over the last 400 days, weighted toward recent, at a random hour.
  const daysAgo = Math.floor(Math.pow(Math.random(), 2) * 400);
  const createdAt = new Date(now - daysAgo * 86_400_000 - Math.floor(Math.random() * 86_400_000));
  rows.push({
    title: `Document ${i + 1}`,
    status: DOCUMENT_STATUSES[Math.floor(Math.random() * DOCUMENT_STATUSES.length)],
    creatorId: user.id,
    createdAt,
    updatedAt: createdAt,
  });
}
await db.insert(documents).values(rows);
console.log(`Inserted ${rows.length} documents for ${email}`);
process.exit(0);
```

Add to `apps/backend/package.json`: `"db:seed": "bun --env-file=../../.env scripts/seed-documents.ts"`, and to the root `package.json`: `"db:seed": "bun --filter backend db:seed"`. Run `bun run db:seed you@example.com` after creating your account.

### Phase A check

```bash
cd apps/backend && bunx tsc --noEmit         # silent
```

```bash
# login, keep the tokens
curl -s -X POST localhost:3000/api/login -H 'content-type: application/json' -d '{"email":"…","password":"…"}'
# protected without token -> 401
curl -s localhost:3000/api/me
# with token -> profile + wallet
curl -s localhost:3000/api/me -H "authorization: Bearer $ACCESS"
# analytics for "today" in your zone (adjust the instants)
curl -s "localhost:3000/api/dashboard/analytics?from=2026-09-13T17:00:00.000Z&to=2026-09-14T17:00:00.000Z&tz=Asia/Jakarta&granularity=hour" -H "authorization: Bearer $ACCESS"
# bad tz -> 400
curl -s "localhost:3000/api/dashboard/analytics?from=…&to=…&tz=Mars/Olympus&granularity=hour" -H "authorization: Bearer $ACCESS"
# refresh -> new access token; logout -> 200; logout again -> 401 Invalid token
curl -s -X POST localhost:3000/api/refresh -H 'content-type: application/json' -d "{\"refresh_token\":\"$REFRESH\"}"
curl -s -X POST localhost:3000/api/logout  -H 'content-type: application/json' -d "{\"refresh_token\":\"$REFRESH\"}"
curl -s -X POST localhost:3000/api/logout  -H 'content-type: application/json' -d "{\"refresh_token\":\"$REFRESH\"}"
```

---

## 6. Phase B — app shell

### B1 — API client

In `src/lib/api.ts`:

```ts
export interface Profile {
  user: { id: number; name: string; email: string; type: 'OWNER' | 'PERSONAL' | 'MEMBER' | 'ADMIN';
          organization: { id: number; name: string; slug: string } | null };
  wallet: { balance: string; currency: string };
}

async function refreshAccessToken(): Promise<boolean> {
  const refresh = auth.refreshToken;
  if (!refresh) return false;
  const response = await fetch('/api/refresh', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  if (!response.ok) return false;
  const payload = await response.json();
  auth.setAccessToken(payload.data.access_token);
  return true;
}

/** Fetch with the bearer token; on 401, refresh once and retry; if that fails, sign out. */
export async function authFetch<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${auth.accessToken ?? ''}` },
  });

  if (response.status === 401 && !retried && (await refreshAccessToken())) {
    return authFetch<T>(path, init, true);
  }
  if (response.status === 401) {
    auth.clear();
    window.location.hash = '#/login';
    throw new ApiError('Your session has expired. Please sign in again.');
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(payload?.error ?? 'Something went wrong. Please try again.');
  return payload?.data ?? payload;
}

export const me = () => authFetch<Profile>('/api/me');
export const logout = (refreshToken: string) => post<unknown>('/api/logout', { refresh_token: refreshToken });
```

`auth.svelte.ts` gains `accessToken` / `refreshToken` getters that read localStorage, `setAccessToken(token)`, and a `profile = $state<Profile | null>(null)` that the shell fills from `/me`.

### B2 — Route table and guard

`src/lib/routes.ts`:

```ts
export type RouteKind = 'root' | 'guest' | 'open' | 'auth';

const GUEST = new Set(['#/login', '#/signup']);
const OPEN = new Set(['#/verify']);

export function routeKind(path: string): RouteKind {
  if (path === '' || path === '#' || path === '#/' || !path.startsWith('#/')) return 'root';
  if (GUEST.has(path)) return 'guest';
  if (OPEN.has(path)) return 'open';
  return 'auth';
}
```

In-page anchors (`#features`, `#pricing`) do not start with `#/`, so they are `root` and keep rendering the landing page — the anchors still scroll.

`App.svelte` becomes:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { theme } from './lib/theme.svelte';
  import { auth } from './lib/auth.svelte';
  import { routeKind } from './lib/routes';
  import Landing from './landing/Landing.svelte';
  import Login from './auth/Login.svelte';
  import Signup from './auth/Signup.svelte';
  import Verify from './auth/Verify.svelte';
  import AppLayout from './app/AppLayout.svelte';

  let route = $state(window.location.hash);
  let path = $derived(route.split('?')[0]);
  let kind = $derived(routeKind(path));
  let loggedIn = $derived(auth.user !== null);

  onMount(() => {
    theme.init();
    auth.init();
  });

  // The guard. Runs on every hash change and whenever login state changes.
  $effect(() => {
    if (loggedIn && (kind === 'root' || kind === 'guest')) window.location.hash = '#/dashboard';
    if (!loggedIn && kind === 'auth') window.location.hash = '#/';
  });
</script>

<svelte:window onhashchange={() => (route = window.location.hash)} />

{#if kind === 'auth' && loggedIn}
  <AppLayout {path} />
{:else if path === '#/login'}
  <Login />
{:else if path === '#/signup'}
  <Signup />
{:else if path === '#/verify'}
  <Verify />
{:else}
  <Landing />
{/if}
```

`auth.init()` reads the stored user synchronously, so `loggedIn` is correct on the first render and the guard does not flash the wrong screen. A stale stored user (token long expired) is handled by the shell's `/me` call in B3: `authFetch` clears auth and redirects on a failed refresh.

Redirect targets to update: `Login.svelte` and `Verify.svelte` go to `#/dashboard` instead of `#/app`. In `Hero.svelte` and `FinalCta.svelte`, `#/app` becomes `#/signup`; in `Nav.svelte`'s mobile menu, "Open the app" becomes "Sign in" → `#/login`. Delete `src/Dashboard.svelte`. `grep -rn '#/app' src` must return nothing.

### B3 — Layout

`src/app/AppLayout.svelte` receives `path`, loads the profile once, and picks the page:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '../lib/auth.svelte';
  import { me } from '../lib/api';
  import Navbar from './Navbar.svelte';
  import Sidebar from './Sidebar.svelte';
  import Placeholder from './Placeholder.svelte';
  import Dashboard from '../dashboard/Dashboard.svelte';
  import { PAGES } from './pages';

  let { path }: { path: string } = $props();
  let sidebarOpen = $state(false);

  onMount(async () => {
    try { auth.profile = await me(); } catch { /* authFetch already redirected */ }
  });

  let page = $derived(PAGES.find((p) => path === p.href || path.startsWith(p.href + '/')));
</script>

<div class="min-h-screen bg-bg-base text-fg">
  <Navbar onmenu={() => (sidebarOpen = !sidebarOpen)} />
  <div class="mx-auto flex max-w-7xl">
    <Sidebar open={sidebarOpen} current={path} onnavigate={() => (sidebarOpen = false)} />
    <main class="min-w-0 flex-1 px-4 py-6 sm:px-6">
      {#if path === '#/dashboard'}
        <Dashboard />
      {:else if page}
        <Placeholder title={page.label} />
      {:else}
        <Placeholder title="Not found" />
      {/if}
    </main>
  </div>
</div>
```

`src/app/pages.ts` is the sidebar as data. `roles` is the set of user types that see the section; `undefined` means everyone:

```ts
import type { Profile } from '../lib/api';
type UserType = Profile['user']['type'];

export interface Page { label: string; href: string }
export interface Section { title: string; roles?: UserType[]; pages: Page[] }

export const SECTIONS: Section[] = [
  { title: 'Workspace', pages: [
    { label: 'Dashboard', href: '#/dashboard' },
    { label: 'Documents', href: '#/documents' },
    { label: 'Templates', href: '#/templates' },
  ]},
  { title: 'Billing', roles: ['OWNER', 'PERSONAL'], pages: [
    { label: 'Top up', href: '#/billing/top-up' },
    { label: 'Usage', href: '#/billing/usage' },
    { label: 'Plan history', href: '#/billing/plans' },
  ]},
  { title: 'Member management', roles: ['OWNER', 'ADMIN'], pages: [
    { label: 'Member list', href: '#/members' },
    { label: 'Invitations', href: '#/members/invitations' },
  ]},
  { title: 'Settings', pages: [
    { label: 'Profile', href: '#/settings/profile' },
    { label: 'Security', href: '#/settings/security' },
    { label: 'Notifications', href: '#/settings/notifications' },
    { label: 'Api keys', href: '#/settings/api-keys' },
    { label: 'Delete account', href: '#/settings/delete-account' },
  ]},
];

export const PAGES: Page[] = SECTIONS.flatMap((s) => s.pages);
```

**Sidebar** renders `SECTIONS`, skipping a section when `roles` is set and does not include `auth.profile?.user.type`. Until the profile has loaded, render only sections without `roles`; the billing and member sections appear a moment later rather than flashing for the wrong user. The current page's link gets `aria-current="page"` and the accent text color. On screens under `md`, the sidebar is hidden unless `open`; the navbar's menu button toggles it.

**Navbar**, left to right: brand (links to `#/dashboard`), then on the right: `Wallet`, `ThemeToggle` (reuse `landing/ThemeToggle.svelte` as is), `UserMenu`, and a menu button visible under `md`.

**Wallet** shows `auth.profile.wallet` formatted with `new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(balance))`. `Number()` is acceptable here because it is display only; nothing computes with it. Render nothing until the profile has loaded.

**UserMenu** is a button with the user's name and a chevron. Clicking toggles a dropdown with one item, "Log out". Requirements that are easy to skip:

- the button has `aria-haspopup="menu"` and `aria-expanded`
- the dropdown has `role="menu"`, the item `role="menuitem"`
- Escape closes it; clicking anywhere outside closes it (a `<svelte:window onclick>` that checks `event.target` is outside the menu's element)
- logout: `await logout(auth.refreshToken).catch(() => {})`, then `auth.clear()`, then `window.location.hash = '#/'`. The `catch` is deliberate — if the server says the token is already invalid, the user still wanted out.

**Placeholder** is a heading with the title and one muted line, "Coming soon." Nothing else.

### Phase B check

Sign up as an organization (you are `OWNER`) and as a personal user in two browsers. Walk the table in section 8, rows 1–14.

---

## 7. Phase C — dashboard

### C1 — Range math

`src/dashboard/range.ts` implements the table in 3.8:

```ts
export type Filter = 'today' | 'yesterday' | 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'this-year' | 'last-year';
export type Granularity = 'hour' | 'day' | 'month';

export const FILTERS: { id: Filter; label: string }[] = [
  { id: 'today', label: 'Today' }, { id: 'yesterday', label: 'Yesterday' },
  { id: 'this-week', label: 'This week' }, { id: 'last-week', label: 'Last week' },
  { id: 'this-month', label: 'This month' }, { id: 'last-month', label: 'Last month' },
  { id: 'this-year', label: 'This year' }, { id: 'last-year', label: 'Last year' },
];

export interface Range {
  from: Date;
  to: Date;
  granularity: Granularity;
  peakLabel: 'hour' | 'day' | 'week' | 'month';
  averageLabel: 'hour' | 'day' | 'week' | 'month';
}

function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function startOfWeek(d: Date) { const s = startOfDay(d); s.setDate(s.getDate() - ((s.getDay() + 6) % 7)); return s; } // Monday
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function addMonths(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function addYears(d: Date, n: number) { return new Date(d.getFullYear() + n, 0, 1); }

export function rangeFor(filter: Filter, now = new Date()): Range {
  switch (filter) {
    case 'today':      { const from = startOfDay(now);              return { from, to: addDays(from, 1),   granularity: 'hour',  peakLabel: 'hour',  averageLabel: 'hour' }; }
    case 'yesterday':  { const from = addDays(startOfDay(now), -1); return { from, to: addDays(from, 1),   granularity: 'hour',  peakLabel: 'hour',  averageLabel: 'hour' }; }
    case 'this-week':  { const from = startOfWeek(now);             return { from, to: addDays(from, 7),   granularity: 'day',   peakLabel: 'day',   averageLabel: 'day' }; }
    case 'last-week':  { const from = addDays(startOfWeek(now), -7);return { from, to: addDays(from, 7),   granularity: 'day',   peakLabel: 'day',   averageLabel: 'day' }; }
    case 'this-month': { const from = addMonths(now, 0);            return { from, to: addMonths(from, 1), granularity: 'day',   peakLabel: 'week',  averageLabel: 'week' }; }
    case 'last-month': { const from = addMonths(now, -1);           return { from, to: addMonths(from, 1), granularity: 'day',   peakLabel: 'week',  averageLabel: 'week' }; }
    case 'this-year':  { const from = addYears(now, 0);             return { from, to: addYears(from, 1),  granularity: 'month', peakLabel: 'month', averageLabel: 'month' }; }
    case 'last-year':  { const from = addYears(now, -1);            return { from, to: addYears(from, 1),  granularity: 'month', peakLabel: 'month', averageLabel: 'month' }; }
  }
}

/** Every bucket start in the range, in local time, so the chart shows zeros where the server sent nothing. */
export function bucketsFor(range: Range): Date[] {
  const out: Date[] = [];
  for (let d = new Date(range.from); d < range.to; ) {
    out.push(new Date(d));
    if (range.granularity === 'hour') d.setHours(d.getHours() + 1);
    else if (range.granularity === 'day') d.setDate(d.getDate() + 1);
    else d.setMonth(d.getMonth() + 1);
  }
  return out;
}

/** The server's bucket key for a local Date. Must match to_char in dashboard.service.ts byte for byte. */
export function bucketKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:00:00`;
}
```

`bucketsFor` produces midnight dates for `day` and `month`, so the hour part is `00` there, matching what the server's `date_trunc` emits. If the two formats ever disagree, every bucket silently reads zero — test row 20 catches this.

Peak and average, also in this file:

```ts
export interface Summary { peak: string; average: string }

export function summarize(range: Range, counts: number[], buckets: Date[]): Summary {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return { peak: '—', average: '0' };

  let peak: string;
  if (range.peakLabel === 'week') {
    // Month filter: fold daily counts into weeks of the month, 1..5.
    const weeks = [0, 0, 0, 0, 0];
    buckets.forEach((d, i) => { weeks[Math.ceil(d.getDate() / 7) - 1] += counts[i]; });
    peak = String(weeks.indexOf(Math.max(...weeks)) + 1);
  } else {
    const i = counts.indexOf(Math.max(...counts));
    const d = buckets[i];
    peak = range.peakLabel === 'hour' ? String(d.getHours())
         : range.peakLabel === 'day' ? String(((d.getDay() + 6) % 7) + 1)   // Monday = 1
         : String(d.getMonth() + 1);
  }

  const periods = range.averageLabel === 'hour' ? 24
                : range.averageLabel === 'day' ? 7
                : range.averageLabel === 'week' ? buckets.length / 7
                : 12;
  return { peak, average: (total / periods).toFixed(1) };
}
```

### C2 — Data loading

`api.ts` gains:

```ts
export const analytics = (from: Date, to: Date, granularity: string) =>
  authFetch<{ totals: { uploaded: number; draft: number; sent: number; completed: number }; series: { bucket: string; count: number }[] }>(
    `/api/dashboard/analytics?${new URLSearchParams({
      from: from.toISOString(), to: to.toISOString(), granularity,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })}`
  );
export const recentDocuments = () => authFetch<{ id: string; title: string; status: string; createdAt: string }[]>('/api/dashboard/recent');
```

In `Dashboard.svelte`: `let filter = $state<Filter>('today')`; an `$effect` that reruns whenever `filter` changes: compute `range = rangeFor(filter)`, call `analytics(...)`, then build `counts` by mapping `bucketsFor(range)` through a `Map` of the server's `series` keyed by `bucket`. Show a `busy` state while loading and an inline error on failure. Load `recentDocuments()` once on mount; it does not depend on the filter.

### C3 — Clock and greeting

`Clock.svelte`:

```svelte
<script lang="ts">
  let { name }: { name: string } = $props();
  let now = $state(new Date());

  $effect(() => {
    const id = setInterval(() => (now = new Date()), 1000);
    return () => clearInterval(id);
  });

  let greeting = $derived(now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening');
  let date = $derived(now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  let time = $derived(now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
</script>

<h1 class="text-3xl font-bold">{greeting}, {name}</h1>
<p class="mt-1 text-fg-muted">{date} · <span class="font-mono tabular-nums text-fg">{time}</span></p>
```

The cleanup return in `$effect` is what stops the interval when the user navigates away. `tabular-nums` keeps the digits from shifting width every second. `name` comes from `auth.profile?.user.name ?? 'there'`.

### C4 — Filter and cards

The filter is a row of eight buttons above everything it affects, styled exactly like the signup tabs from issue 15 (`role="tablist"`, `aria-selected`, the pill track). One row, wrapping on narrow screens.

Four `StatCard`s in a `grid gap-4 sm:grid-cols-2 xl:grid-cols-4`: label in muted text, value as a large tabular number. Labels: **Uploaded**, **Draft**, **Sent**, **Completed**. No icons, no deltas, no colors on the numbers — the value is the content.

### C5 — Line chart

First, add three tokens to `app.css`, light in `@theme` and dark in `:root.dark`. They are the validated pair from 3.11:

```css
/* @theme */
--color-chart-1: #2a78d6;   /* draft */
--color-chart-2: #eb6834;   /* sent */
--color-chart-3: #1baf7a;   /* completed */

/* :root.dark */
--color-chart-1: #3987e5;
--color-chart-2: #d95926;
--color-chart-3: #199e70;
```

Tailwind v4 turns these into `stroke-chart-1`, `fill-chart-1`, `bg-chart-1`.

`LineChart.svelte` — one series, so the line uses the app's `accent` and there is no legend; the section title names it:

```svelte
<script lang="ts">
  let { counts, labels }: { counts: number[]; labels: string[] } = $props();

  const W = 640, H = 220;
  const PAD = { top: 16, right: 16, bottom: 28, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  let max = $derived(Math.max(1, ...counts));
  let xs = $derived(counts.map((_, i) => PAD.left + (counts.length === 1 ? innerW / 2 : (i / (counts.length - 1)) * innerW)));
  let ys = $derived(counts.map((v) => PAD.top + innerH - (v / max) * innerH));
  let path = $derived(xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x} ${ys[i]}`).join(' '));
  let ticks = $derived([0, 0.5, 1].map((f) => ({ y: PAD.top + innerH - f * innerH, v: Math.round(f * max) })));
  let labelEvery = $derived(Math.ceil(labels.length / 8));

  let hover = $state<number | null>(null);
  function onMove(event: MouseEvent) {
    const box = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * W;
    let nearest = 0;
    for (let i = 1; i < xs.length; i++) if (Math.abs(xs[i] - x) < Math.abs(xs[nearest] - x)) nearest = i;
    hover = nearest;
  }
</script>

<svg viewBox="0 0 {W} {H}" class="w-full" role="img" aria-label="Uploaded documents over time"
     onmousemove={onMove} onmouseleave={() => (hover = null)}>
  {#each ticks as t}
    <line x1={PAD.left} x2={W - PAD.right} y1={t.y} y2={t.y} class="stroke-gray-1 dark:stroke-gray-2" stroke-width="1" />
    <text x={PAD.left - 8} y={t.y + 4} text-anchor="end" class="fill-fg-muted text-[10px]">{t.v}</text>
  {/each}
  <path d={path} fill="none" class="stroke-accent" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
  {#each xs as x, i}
    {#if i % labelEvery === 0}
      <text {x} y={H - 8} text-anchor="middle" class="fill-fg-muted text-[10px]">{labels[i]}</text>
    {/if}
    {#if hover === i}
      <line x1={x} x2={x} y1={PAD.top} y2={PAD.top + innerH} class="stroke-fg-muted/40" stroke-width="1" />
      <circle cx={x} cy={ys[i]} r="5" class="fill-accent stroke-bg-elevated" stroke-width="2" />
    {/if}
  {/each}
</svg>
<p class="mt-2 h-5 text-sm text-fg-muted" aria-live="polite">
  {#if hover !== null}{labels[hover]}: <span class="font-medium text-fg">{counts[hover]}</span> uploaded{/if}
</p>
```

Under the chart, `Dashboard.svelte` shows the summary line from `summarize()`: **Peak {peakLabel}: 14 · Average per {averageLabel}: 2.3**. Labels for the x axis: hours as `"06"`, days as `"Mon 14"` (weeks) or `"14"` (months), months as `"Sep"` — build them from the same `buckets` array with `toLocaleDateString`/`getHours`.

The hover paragraph has a fixed height so the layout does not jump when it appears. The `2px` line, `r="5"` marker with a surface-colored ring, and hairline solid gridlines are deliberate; do not thicken them.

### C6 — Pie chart

`PieChart.svelte`, a donut with the legend carrying the percentages:

```svelte
<script lang="ts">
  let { draft, sent, completed }: { draft: number; sent: number; completed: number } = $props();

  const R = 40;
  const C = 2 * Math.PI * R;
  const GAP = 2;

  let slices = $derived.by(() => {
    const raw = [
      { label: 'Draft', value: draft, cls: 'stroke-chart-1', swatch: 'bg-chart-1' },
      { label: 'Sent', value: sent, cls: 'stroke-chart-2', swatch: 'bg-chart-2' },
      { label: 'Completed', value: completed, cls: 'stroke-chart-3', swatch: 'bg-chart-3' },
    ];
    const total = raw.reduce((s, x) => s + x.value, 0);
    let offset = 0;
    return raw.map((s) => {
      const frac = total ? s.value / total : 0;
      const slice = { ...s, frac, dash: `${Math.max(0, frac * C - GAP)} ${C}`, offset: -offset * C };
      offset += frac;
      return slice;
    });
  });
  let total = $derived(draft + sent + completed);
</script>

<div class="flex flex-wrap items-center gap-6">
  <svg viewBox="0 0 100 100" class="h-40 w-40 shrink-0" role="img" aria-label="Documents by status">
    <circle cx="50" cy="50" r={R} fill="none" class="stroke-gray-1 dark:stroke-gray-2" stroke-width="14" />
    {#each slices as s}
      {#if s.frac > 0}
        <circle cx="50" cy="50" r={R} fill="none" class={s.cls} stroke-width="14"
                stroke-dasharray={s.dash} stroke-dashoffset={s.offset} transform="rotate(-90 50 50)" />
      {/if}
    {/each}
  </svg>
  <ul class="min-w-40 space-y-2 text-sm">
    {#each slices as s}
      <li class="flex items-center gap-2">
        <span class="h-3 w-3 rounded-sm {s.swatch}"></span>
        <span class="text-fg-muted">{s.label}</span>
        <span class="ml-auto font-medium tabular-nums text-fg">{total ? Math.round(s.frac * 100) : 0}%</span>
      </li>
    {/each}
  </ul>
</div>
```

`GAP` leaves 2px of track between slices, which is how the eye separates them without relying on color. When `total` is 0, the track renders alone and the legend reads 0% — that is the empty state, no extra markup needed.

### C7 — Recent documents

`RecentDocuments.svelte` lists up to five rows: title, a small status label (plain text, muted; no color badges), the date via `toLocaleDateString`, and a "Preview" link to `#/documents/{id}`. The Documents placeholder is where that lands; it shows the id in its subtitle so the link is verifiably wired. Empty state: "No documents yet."

### C8 — Page layout

```
[Clock / greeting]
[filter row]
[card] [card] [card] [card]
[line chart — 2/3 width]   [pie — 1/3 width]
[peak · average line under the chart]
[recent documents]
```

Every block sits in a `.surface` panel. Under `lg` the chart and pie stack. Nothing scrolls horizontally at 375px.

---

## 8. Testing

Seed first: `bun run db:seed you@example.com`. Then in order.

| # | Action | Expected |
| --- | --- | --- |
| 1 | Logged out, open `/` | landing page |
| 2 | Logged out, open `#/dashboard` | redirected to `#/`, landing page |
| 3 | Logged out, open `#/login` | login page |
| 4 | Log in | lands on `#/dashboard` |
| 5 | Logged in, open `/` | redirected to `#/dashboard` |
| 6 | Logged in, open `#/login` | redirected to `#/dashboard` |
| 7 | Sign up a new account (still logged in from the tokens signup stores), open `#/verify?email=…` | verify page renders; not bounced |
| 8 | Navbar shows your name; click it | dropdown opens; Escape closes; click outside closes |
| 9 | Log out | lands on landing page; `signcraft-user` gone from localStorage; second logout call with the same refresh token is 401 |
| 10 | As OWNER | sidebar has Billing and Member management |
| 11 | As PERSONAL | sidebar has Billing, no Member management |
| 12 | Click every sidebar link | each opens its placeholder with the right title; current link is highlighted |
| 13 | Wallet in navbar | `$0.00` (or your currency) |
| 14 | In DevTools, delete `signcraft-access-token`, reload | still logged in — `/me` refreshed the token silently |
| 15 | Also delete `signcraft-refresh-token`, reload | bounced to login |
| 16 | Dashboard greeting | matches the hour; clock ticks every second; date is today |
| 17 | Filter **Today** | 24 x-labels; peak hour is the hour with the most seeded docs (compare `docker compose exec postgres psql … -c "select date_trunc('hour', created_at at time zone 'YOUR/ZONE'), count(*) from documents where creator_id = N and created_at >= … group by 1"`) |
| 18 | Filter **This week** | 7 labels Mon–Sun; peak day 1–7 |
| 19 | Filter **Last month** | one point per day; "Peak week" 1–5; "Average per week" |
| 20 | Any filter: card **Uploaded** | equals the sum of the chart's points (if it does not, `bucketKey` and the server's `to_char` disagree) |
| 21 | Pie percentages | sum to 100 (±1 rounding); draft + sent + completed cards equal Uploaded |
| 22 | Hover the chart | crosshair, marker, and the sentence under the chart follow the cursor |
| 23 | Change OS timezone (or `TZ=America/New_York` when launching the browser) | "Today" boundaries and peak hour shift accordingly |
| 24 | Recent documents | five newest, newest first; Preview goes to `#/documents/<id>` |
| 25 | Wait 16 minutes on the dashboard, change the filter | works — refresh happened; no redirect |
| 26 | Both themes | chart line, slices, gridlines, and text all readable |
| 27 | Width 375px | filter wraps, cards stack, chart and pie stack, no horizontal scroll |
| 28 | `bun run check` (frontend) and `bunx tsc --noEmit` (backend) | 0 errors |

---

## 9. Acceptance checklist

**Phase A**
- [ ] `controller/`, `middleware/`, `validator/`, `dto/`, `interface/`, `utils/` exist with the mandated file names; route files contain only wiring.
- [ ] `documents` table exists with statuses `draft | sent | completed`, `TIMESTAMPTZ` timestamps, `creator_id NOT NULL`.
- [ ] `users.balance` exists; `/me` returns the owner's balance for `MEMBER`/`ADMIN`.
- [ ] `authMiddleware` uses `{ as: 'scoped' }` on both hooks; register and login remain public.
- [ ] `POST /api/logout` returns the exact success body; unknown token → `401 { "error": "Invalid token" }`.
- [ ] `POST /api/refresh` renews an access token; expired or unknown refresh token → 401.
- [ ] Analytics passes `from`/`to` as ISO strings, validates `tz` with `Intl.DateTimeFormat`, and buckets in `tz`.
- [ ] The two demo `/documents` endpoints and their fallback data are gone from `index.ts`.
- [ ] `bun run db:seed <email>` populates the dashboard.

**Phase B**
- [ ] The guard implements the four-row table in 3.1; `#/verify` is open.
- [ ] `#/app` no longer exists anywhere (`grep -rn '#/app' apps/frontend/src` is empty); `src/Dashboard.svelte` is deleted.
- [ ] `authFetch` refreshes once on 401 and signs out on failure.
- [ ] Navbar: user menu with keyboard-closable dropdown and logout; theme toggle; wallet.
- [ ] Sidebar: Billing only for OWNER/PERSONAL; Member management only for OWNER/ADMIN; current page marked.
- [ ] Twelve placeholder pages reachable from the sidebar.

**Phase C**
- [ ] Greeting by hour; clock updates every second and stops when the page unmounts.
- [ ] Eight filters; cards, chart, and pie all react to the filter.
- [ ] Chart buckets, peak, and average follow the table in 3.8; zero-count buckets render as zero, not gaps.
- [ ] Peak uses the browser's timezone.
- [ ] Pie has a legend with percentages and 2px gaps between slices.
- [ ] Recent list shows five, newest first, with a Preview link.
- [ ] Frontend `bun run check` and backend `bunx tsc --noEmit` report 0 errors.

---

## 10. Mistakes to avoid

**Implementing the four redirect rules as written.** Rules 1 and 2 lock everyone out. Use the table in 3.1.

**Classifying `#/verify` as a guest route.** A user who just signed up is logged in and needs it.

**Passing `Date` objects into `sql\`…\`` or `client\`…\``.** The client throws. `.toISOString()` first. Drizzle's query builder (`eq`, `gt`, `.values()`) is fine with `Date`.

**Forgetting `{ as: 'scoped' }` on the middleware hooks.** The middleware then applies to nothing, every "protected" route is public, and no test in section 8 catches it unless you run row 2 of the Phase A curl block.

**Putting `authMiddleware` on the same plugin as register and login.** Nobody can sign up.

**Awaiting logout before clearing local state.** If the server is down, the user is stuck logged in. Clear regardless.

**Computing "start of this week" on the server.** The server does not know the browser's zone at the moment the range is chosen; the browser does. Range in the browser, counting on the server.

**A `bucketKey` that does not match the server's `to_char` format exactly.** Every bucket silently reads zero. Row 20 is the check.

**Rendering role-gated sidebar sections before the profile loads.** They flash for the wrong user. Hide gated sections until `auth.profile` exists.

**Coloring status text or card numbers.** Text wears text colors. The pie's swatches carry the color; the words stay muted.

**A `setInterval` without cleanup.** Navigate away and back a few times and the clock has five intervals running.

**Using `Number(balance)` for anything but display.** It is a string from the database on purpose.

**Keying the middleware's user lookup on anything but `payload.sub`.** That is where `signAccessToken` puts the user id; nothing else is in the token by design.

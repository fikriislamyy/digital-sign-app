# Feature: Login, Signup and Verification Pages

**Audience:** junior frontend developer, or a cheaper AI model, working in this repository.
**Estimated effort:** 12-16 hours.
**Prerequisite reading:** `apps/frontend/src/App.svelte`, `apps/frontend/src/app.css`, `apps/frontend/src/landing/`, and `apps/backend/src/routes/`.

---

## 1. What we are building

Three full-page auth screens in the same deep-black minimal style as the landing page:

| Route | Screen | Fields |
| --- | --- | --- |
| `#/login` | Login | email, password, submit |
| `#/signup` | Signup | organization name, full name, phone number, email, password, confirm password, submit |
| `#/verify` | Verify email | 6-digit code, verify button, resend button |

Every screen uses the same layout: a full-width split, a decorative panel on the left that changes on each page load, and the form on the right. Below 1024px the panel is hidden and the form takes the full width.

**Out of scope.** `src/Dashboard.svelte` is untouched. The landing page keeps its current design except for two nav links added in step 12.

---

## 2. The API you are calling

These four endpoints already exist and work. Do not change their shapes. The frontend dev server proxies `/api` to `http://localhost:3000`, so call them as relative paths.

| Endpoint | Body | Success | Failures |
| --- | --- | --- | --- |
| `POST /api/register` | `name`, `email`, `password` | `{ success, message, data: { id, name, email } }` | 400 `Email already registered` |
| `POST /api/login` | `email`, `password` | `{ success, message, data: { user, access_token, refresh_token } }` | 401 `Invalid email or password` |
| `POST /api/verify-email` | `email`, `otp` | `{ success, message }` | 400 `Invalid email or otp` |
| `POST /api/resend-otp` | `email` | `{ success, message }` | 404 `User not found`, 400 `Email already verified`, 429 `Too many OTP requests. Please try again later.` |

Note the response envelope: success bodies nest the payload under `data`, and failures return a bare `{ error: "..." }` with no `success` key. Your client in step 4 has to handle both.

Registering a user already triggers an OTP email automatically, so signup leads straight to the verify screen. There is no separate "send OTP" call to make.

---

## 3. Three things to clear before writing any page

### 3.1 The signup form asks for two fields the backend cannot store

The form specifies organization name and phone number. The `users` table has only `id`, `name`, `email`, `password`, `verified_at`, `created_at`, `updated_at`, and `POST /api/register` accepts only `name`, `email` and `password`.

Collecting a field and silently dropping it is worse than not asking for it, so step 3 adds both columns properly: a migration, the Drizzle model, the service input, and the route validation.

Both new columns are nullable. Everyone who registered before this change has no organization and no phone, and a `NOT NULL` column would fail to apply against a table that already has rows.

### 3.2 Light mode is broken, and these pages are made of the parts that are broken

The previous ticket added `--color-gray-1` and `--color-gray-2` but gave them dark values in the default block, which is the light-mode block, and dark values again under `.dark`. They never received light-mode values. Measured contrast:

| Where | Colours | Ratio | Needed |
| --- | --- | --- | --- |
| Secondary button label, light mode | `#1a1a1a` on `#333333` | 1.38:1 | 4.5:1 |
| Section divider, light mode | `#333333` on `#fafafa` | 12.1:1 | should be a hairline |

The secondary button is unreadable in light mode. It appears in the hero and the final call to action. The dividers render as near-black rules across every section instead of faint lines.

Separately, `.surface` in `app.css` applies `border` with no colour. Tailwind v4's `border` utility sets width and style only, and the preflight sets `border-color: inherit`, so in light mode every card inherits a border the colour of its own text. In dark mode this is masked because `dark:border-white/[0.05]` supplies a colour.

Auth screens are almost entirely surfaces, inputs, borders and buttons. Building on these tokens means building the bug into three new pages, so step 1 fixes it first.

### 3.3 Two files are now dead

Nothing references `src/landing/TiltCard.svelte` or `src/lib/spotlight.ts`. The tilt and spotlight effects were removed from every component in the previous ticket but the files stayed. Step 2 deletes them.

---

## 4. Design specification

### Layout

```
lg and up                         below lg
┌──────────────┬──────────────┐   ┌──────────────┐
│              │              │   │              │
│   panel      │    form      │   │    form      │
│   (visual)   │  max-w-md    │   │  max-w-md    │
│              │  centred     │   │  centred     │
└──────────────┴──────────────┘   └──────────────┘
   50%              50%              panel hidden
```

Both halves are exactly `min-h-screen`. The page itself never scrolls on a desktop viewport; only the signup form, which is taller, may scroll inside its own column.

### The left panel

The panel shows a different visual on every page load, chosen with `Math.random()` when the component mounts. Not a rotation, not a per-day pick. A fresh random choice each time, as specified.

Ship it as a list of entries in one array so adding or replacing visuals is a one-line change:

```ts
const panels = [
  { image: '/auth/01.jpg', gradient: 'from-indigo-950 via-bg-deep to-black', quote: '...' },
  ...
];
```

Each entry draws in three layers, back to front:

1. **A CSS gradient**, always present. This is what you see if the image is missing, still loading, or fails.
2. **The image**, `object-cover`, at around 40% opacity, with `onerror` hiding it.
3. **A scrim and the text**, a `bg-black/40` wash plus the product name at the top and a short line of copy at the bottom.

Two reasons the gradient sits underneath rather than the image standing alone. The repository has no `public/` directory and no licensed images, so the feature must work before anyone sources any. And the design language here is deep black and minimal, so a full-brightness photograph would fight it. The low opacity over a dark gradient keeps a photo subordinate to the palette.

To add real images later: create `apps/frontend/public/auth/`, drop in files, and point the `image` fields at them. Nothing else changes.

The whole panel is decorative. Give it `aria-hidden="true"` so a screen reader skips straight to the form.

### The form column

- Vertically centred, `max-w-md`, `px-6` at minimum so it never touches the viewport edge.
- Heading at `text-4xl font-bold text-fg`, one muted line under it, then the fields.
- Field spacing `space-y-5`. Generous, in keeping with the landing page.
- Inputs: `bg-bg-elevated`, a hairline border, `rounded-lg`, `px-4 py-3`, `text-fg`, and a muted placeholder.
- Focus: the accent ring already defined globally on `:focus-visible`. Do not invent a second focus style.
- Primary button: full width, `bg-accent`, white text, `rounded-lg`, and hover that changes opacity only. No transform, no scale, no glow. This matches the motion rules from the previous ticket.
- Under the form, one line linking to the other screen: login offers signup, signup offers login.

### Motion

Fade only, matching the landing page. No parallax, no floating, no movement on hover. The panel may cross-fade its layers on mount. Nothing else animates.

---

## 5. Files

**Create**

| Path | Purpose |
| --- | --- |
| `apps/backend/src/migration/1789380000-user-profile-fields.migration.ts` | adds two columns |
| `apps/frontend/src/lib/api.ts` | the four API calls, one place |
| `apps/frontend/src/lib/auth.svelte.ts` | token storage and the signed-in user |
| `apps/frontend/src/lib/hash.ts` | reads a query parameter out of the hash |
| `apps/frontend/src/auth/AuthLayout.svelte` | the split shell |
| `apps/frontend/src/auth/AuthPanel.svelte` | the randomised left panel |
| `apps/frontend/src/auth/Field.svelte` | labelled text input |
| `apps/frontend/src/auth/PasswordField.svelte` | password input with a visibility toggle |
| `apps/frontend/src/auth/Login.svelte` | the login screen |
| `apps/frontend/src/auth/Signup.svelte` | the signup screen |
| `apps/frontend/src/auth/Verify.svelte` | the verification screen |

**Change**

| Path | Change |
| --- | --- |
| `apps/frontend/src/app.css` | light-mode token fix, input styling |
| `apps/backend/src/models/users.model.ts` | two new columns |
| `apps/backend/src/services/users.service.ts` | accept and store them |
| `apps/backend/src/routes/users.routes.ts` | validate them |
| `apps/frontend/src/App.svelte` | route to the three new screens |
| `apps/frontend/src/landing/Nav.svelte` | link to login and signup |

**Delete**

`apps/frontend/src/landing/TiltCard.svelte` and `apps/frontend/src/lib/spotlight.ts`.

---

## 6. Step by step

### Step 1 — Fix the light-mode tokens

In `app.css`, the `@theme` block is the light palette. Give the two gray tokens actual light values:

```css
  --color-gray-1: #e8e8e8;   /* was #333333 */
  --color-gray-2: #d4d4d4;   /* was #4a4a4a */
```

Leave the `.dark` block alone. Its values are already correct.

Then fix the borderless border in `.surface`:

```css
  .surface {
    @apply rounded-xl border border-black/[0.08] bg-black/[0.02];
    @apply dark:border-white/[0.05] dark:bg-white/[0.02];
```

Check the result: `bg-gray-1 text-fg` is now `#1a1a1a` on `#e8e8e8`, about 13:1. The secondary button in the hero and the final call to action become readable, and the section dividers become faint instead of near-black.

While you are in this file, add the shared input style, used by both field components in step 8:

```css
  .input {
    @apply w-full rounded-lg border border-black/[0.08] bg-bg-elevated px-4 py-3;
    @apply text-fg placeholder:text-fg-muted/60;
    @apply dark:border-white/[0.08];
    transition: border-color 300ms var(--ease-out);
  }
  .input:hover { @apply border-black/[0.16] dark:border-white/[0.16]; }
  .input[aria-invalid='true'] { @apply border-red-500/60; }
```

Do not give `.input` its own focus style. The global `:focus-visible` rule already draws the accent ring.

### Step 2 — Delete the dead files

```bash
git rm apps/frontend/src/landing/TiltCard.svelte apps/frontend/src/lib/spotlight.ts
cd apps/frontend && bun run check
```

`check` must still report `0 ERRORS`. If it names a missing import, something still referenced one of them and you should read the error before going further.

### Step 3 — Give the backend somewhere to put organization and phone

**The migration.** Copy the shape of `1789369500-sessions.migration.ts`. Create `apps/backend/src/migration/1789380000-user-profile-fields.migration.ts`:

```ts
import { client } from '../db';

export async function up() {
  console.log('Running migration: 1789380000-user-profile-fields.migration.ts');

  // Nullable on purpose: rows already in this table predate both fields.
  await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS organization VARCHAR(255);`;
  await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(32);`;
}
```

Be aware of how migrations actually run in this repository. These files export an `up()` function that nothing imports and no script calls. The `db:migrate` script runs drizzle-kit, which works from its own generated SQL and ignores this directory entirely. The three existing migrations were applied by hand. Apply yours the same way, from `apps/backend`:

```bash
bun -e "import('./src/migration/1789380000-user-profile-fields.migration.ts').then(m => m.up()).then(() => process.exit(0))"
```

If the database is not running, note it and move on. The register service already falls back to an in-memory store when PostgreSQL is offline, so the frontend work in steps 4 onward is not blocked.

**The model.** In `users.model.ts`, add the two columns next to `name`:

```ts
  organization: varchar('organization', { length: 255 }),
  phone: varchar('phone', { length: 32 }),
```

No `.notNull()`. That is what makes them nullable, matching the migration.

**The service.** In `users.service.ts`, add `organization?: string` and `phone?: string` to `RegisterUserInput`, and pass them through to the `db.insert(users).values({...})` call, trimmed. Also add them to the in-memory fallback object so both paths behave the same.

**The route.** In `users.routes.ts`, extend the register body schema:

```ts
        organization: t.Optional(t.String({ maxLength: 255 })),
        phone: t.Optional(t.String({ maxLength: 32 })),
```

Use `t.Optional`. If you mark them required, every existing client of this endpoint breaks.

### Step 4 — Write the API client

Create `src/lib/api.ts`. One module, four functions, so no component ever writes a `fetch` call.

```ts
export interface ApiUser {
  id: number;
  name: string;
  email: string;
}

class ApiError extends Error {}

/**
 * Success bodies nest their payload under `data`; failures return a bare
 * `{ error }`. This unwraps both into a value or a thrown ApiError whose
 * message is the server's own wording, which is already user-facing.
 */
async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(payload?.error ?? 'Something went wrong. Please try again.');
  }

  return payload?.data ?? payload;
}

export const login = (email: string, password: string) =>
  post<{ user: ApiUser; access_token: string; refresh_token: string }>(
    '/api/login',
    { email, password }
  );

export const register = (input: {
  name: string;
  email: string;
  password: string;
  organization?: string;
  phone?: string;
}) => post<ApiUser>('/api/register', input);

export const verifyEmail = (email: string, otp: string) =>
  post<unknown>('/api/verify-email', { email, otp });

export const resendOtp = (email: string) =>
  post<unknown>('/api/resend-otp', { email });
```

The server's error strings are already written for humans, so show them directly rather than mapping status codes to your own copy. Only the network-failure case needs wording of your own.

### Step 5 — Store the session

Create `src/lib/auth.svelte.ts`. The `.svelte.ts` extension is required for `$state` to work outside a component, the same reason `theme.svelte.ts` has it.

```ts
import type { ApiUser } from './api';

const ACCESS = 'signcraft-access-token';
const REFRESH = 'signcraft-refresh-token';
const USER = 'signcraft-user';

class AuthStore {
  user = $state<ApiUser | null>(null);

  init() {
    try {
      const raw = localStorage.getItem(USER);
      if (raw) this.user = JSON.parse(raw);
    } catch {
      // Private browsing, or a corrupt value. Treat as signed out.
    }
  }

  save(user: ApiUser, accessToken: string, refreshToken: string) {
    this.user = user;
    try {
      localStorage.setItem(ACCESS, accessToken);
      localStorage.setItem(REFRESH, refreshToken);
      localStorage.setItem(USER, JSON.stringify(user));
    } catch {
      // Tokens live in memory for this page view only. Still usable.
    }
  }

  clear() {
    this.user = null;
    try {
      [ACCESS, REFRESH, USER].forEach((k) => localStorage.removeItem(k));
    } catch {}
  }
}

export const auth = new AuthStore();
```

Tokens in `localStorage` are readable by any script that runs on the page, so a cross-site scripting bug becomes a stolen session. The robust alternative is an `HttpOnly` cookie, which the backend does not currently issue. Use `localStorage` for now and leave the comment above in place so the tradeoff is visible to whoever revisits this.

Call `auth.init()` in `App.svelte` next to the existing `theme.init()`.

### Step 6 — Teach the router about the new screens

`App.svelte` currently tests one prefix. Replace that with a small map, because four branches of `if/else` on string prefixes gets hard to read quickly.

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { theme } from './lib/theme.svelte';
  import { auth } from './lib/auth.svelte';
  import Landing from './landing/Landing.svelte';
  import Dashboard from './Dashboard.svelte';
  import Login from './auth/Login.svelte';
  import Signup from './auth/Signup.svelte';
  import Verify from './auth/Verify.svelte';

  let route = $state(window.location.hash);

  onMount(() => {
    theme.init();
    auth.init();
  });

  // The path is everything before a `?`, so `#/verify?email=a@b.c` routes
  // to `#/verify` and the query is still available to the screen itself.
  let path = $derived(route.split('?')[0]);
</script>

<svelte:window onhashchange={() => (route = window.location.hash)} />

{#if path.startsWith('#/app')}
  <Dashboard />
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

Keep `startsWith` for `#/app`, since the dashboard may grow sub-routes. The three auth screens match exactly.

Create `src/lib/hash.ts` for reading the query, used by step 11:

```ts
export function hashParam(name: string): string {
  const query = window.location.hash.split('?')[1] ?? '';
  return new URLSearchParams(query).get(name) ?? '';
}
```

### Step 7 — Build the shell and the panel

`AuthLayout.svelte` is the split. It takes the form as a snippet.

```svelte
<script lang="ts">
  import AuthPanel from './AuthPanel.svelte';
  interface Props { children: import('svelte').Snippet }
  let { children }: Props = $props();
</script>

<div class="flex min-h-screen bg-bg-base">
  <!-- Decorative half. Hidden below lg, and hidden from assistive tech always. -->
  <div class="hidden lg:block lg:w-1/2">
    <AuthPanel />
  </div>

  <div class="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
    <div class="w-full max-w-md">
      {@render children()}
    </div>
  </div>
</div>
```

`AuthPanel.svelte` picks its visual once, on mount.

```svelte
<script lang="ts">
  const panels = [
    { image: '/auth/01.jpg', gradient: 'from-indigo-950 via-bg-deep to-black',
      line: 'Sign documents with cryptographic certainty.' },
    { image: '/auth/02.jpg', gradient: 'from-slate-900 via-bg-deep to-black',
      line: 'Every signature, permanently verifiable.' },
    { image: '/auth/03.jpg', gradient: 'from-zinc-900 via-bg-deep to-black',
      line: 'Built for teams that cannot afford a dispute.' },
  ];

  // A fresh pick per page load, as specified, so this is deliberately not
  // reactive. Only the image-failure flag below needs to be.
  const panel = panels[Math.floor(Math.random() * panels.length)];
  let imageFailed = $state(false);
</script>

<div class="relative h-full overflow-hidden bg-gradient-to-br {panel.gradient}" aria-hidden="true">
  {#if !imageFailed}
    <img
      src={panel.image}
      alt=""
      onerror={() => (imageFailed = true)}
      class="absolute inset-0 h-full w-full object-cover opacity-40"
    />
  {/if}

  <div class="absolute inset-0 bg-black/40"></div>

  <div class="relative flex h-full flex-col justify-between p-12">
    <span class="text-lg font-bold text-white">SignCraft</span>
    <p class="max-w-sm text-2xl font-semibold leading-snug text-white/90">{panel.line}</p>
  </div>
</div>
```

The `onerror` handler is the reason this works with no image files in the repository. Without it a missing file leaves a broken-image icon over the gradient.

### Step 8 — Build the two field components

`Field.svelte`:

```svelte
<script lang="ts">
  interface Props {
    label: string;
    value: string;
    type?: string;
    placeholder?: string;
    error?: string;
    required?: boolean;
  }
  let { label, value = $bindable(), type = 'text', placeholder = '',
        error = '', required = false }: Props = $props();

  const id = `f-${Math.random().toString(36).slice(2, 9)}`;
</script>

<div>
  <label for={id} class="mb-2 block text-sm font-medium text-fg">{label}</label>
  <input
    {id}
    {type}
    {placeholder}
    {required}
    bind:value
    aria-invalid={error ? 'true' : undefined}
    aria-describedby={error ? `${id}-e` : undefined}
    class="input"
  />
  {#if error}<p id="{id}-e" class="mt-2 text-sm text-red-500">{error}</p>{/if}
</div>
```

`$bindable()` is what lets a parent write `bind:value={email}`. The generated `id` ties the label, the input and the error message together, which is what makes the error readable to a screen reader rather than just visible.

`PasswordField.svelte` is the same with a toggle button:

```svelte
<script lang="ts">
  interface Props {
    label: string;
    value: string;
    placeholder?: string;
    error?: string;
  }
  let { label, value = $bindable(), placeholder = '', error = '' }: Props = $props();

  let visible = $state(false);
  const id = `p-${Math.random().toString(36).slice(2, 9)}`;
</script>

<div>
  <label for={id} class="mb-2 block text-sm font-medium text-fg">{label}</label>
  <div class="relative">
    <input
      {id}
      {placeholder}
      type={visible ? 'text' : 'password'}
      bind:value
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={error ? `${id}-e` : undefined}
      class="input pr-12"
    />
    <button
      type="button"
      onclick={() => (visible = !visible)}
      aria-label={visible ? 'Hide password' : 'Show password'}
      class="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted transition-opacity duration-300 hover:opacity-70"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        {#if visible}
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
        {:else}
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" /><circle cx="12" cy="12" r="3" />
        {/if}
      </svg>
    </button>
  </div>
  {#if error}<p id="{id}-e" class="mt-2 text-sm text-red-500">{error}</p>{/if}
</div>
```

`type="button"` matters. A `<button>` inside a `<form>` defaults to `type="submit"`, so without it, revealing the password submits the form.

### Step 9 — The login screen

```svelte
<script lang="ts">
  import AuthLayout from './AuthLayout.svelte';
  import Field from './Field.svelte';
  import PasswordField from './PasswordField.svelte';
  import { login } from '../lib/api';
  import { auth } from '../lib/auth.svelte';

  let email = $state('');
  let password = $state('');
  let formError = $state('');
  let busy = $state(false);

  async function onSubmit(event: SubmitEvent) {
    event.preventDefault();
    formError = '';

    if (!email.trim() || !password) {
      formError = 'Enter your email and password.';
      return;
    }

    busy = true;
    try {
      const result = await login(email.trim(), password);
      auth.save(result.user, result.access_token, result.refresh_token);
      window.location.hash = '#/app';
    } catch (error) {
      formError = error instanceof Error ? error.message : 'Could not sign in.';
    } finally {
      busy = false;
    }
  }
</script>

<AuthLayout>
  <h1 class="mb-2 text-4xl font-bold text-fg">Welcome back</h1>
  <p class="mb-10 text-fg-muted">Sign in to your SignCraft account.</p>

  <form onsubmit={onSubmit} class="space-y-5" novalidate>
    <Field label="Email" type="email" bind:value={email} placeholder="you@company.com" required />
    <PasswordField label="Password" bind:value={password} placeholder="••••••••" />

    {#if formError}
      <p role="alert" class="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
        {formError}
      </p>
    {/if}

    <button
      type="submit"
      disabled={busy}
      class="w-full rounded-lg bg-accent px-6 py-3.5 font-semibold text-white transition-opacity duration-300 hover:opacity-90 disabled:opacity-50"
    >
      {busy ? 'Signing in…' : 'Sign in'}
    </button>
  </form>

  <p class="mt-8 text-center text-sm text-fg-muted">
    No account?
    <a href="#/signup" class="font-medium text-accent transition-opacity duration-300 hover:opacity-80">Create one</a>
  </p>
</AuthLayout>
```

Three details worth keeping when you write the other two screens.

`novalidate` turns off the browser's own bubbles so your messages are the only ones shown. `role="alert"` makes a screen reader announce the failure instead of leaving it silent. And `busy` disables the button so a double click cannot fire two requests.

### Step 10 — The signup screen

Same skeleton as step 9, six fields, and validation before the request.

Field order: organization name, full name, phone number, email, password, confirm password. Organization and phone are optional, so label them `Organization name` and `Phone number` without a required marker, and let the rest be required.

Validate in this order and stop at the first failure:

| Check | Message |
| --- | --- |
| Full name is not empty | `Enter your full name.` |
| Email contains `@` and a dot after it | `Enter a valid email address.` |
| Password is at least 6 characters | `Password must be at least 6 characters.` |
| Confirm matches password | `Passwords do not match.` |

Six characters is not an arbitrary choice. The route schema declares `minLength: 6`, so a shorter password is rejected by the server anyway. Checking it in the browser turns a round trip into an instant message.

On success, send the user to verification with the address in the hash, because the verify endpoint needs an email and the user should not have to type it again:

```ts
await register({
  name: fullName.trim(),
  email: email.trim(),
  password,
  organization: organization.trim() || undefined,
  phone: phone.trim() || undefined,
});
window.location.hash = `#/verify?email=${encodeURIComponent(email.trim())}`;
```

`|| undefined` rather than `|| ''`. An empty string would be stored as an empty organization; `undefined` is dropped from the JSON body and the column stays null.

`encodeURIComponent` is not optional. A `+` in an email address is legal and would otherwise decode as a space on the verify screen.

The form is taller than a laptop viewport. Confirm it scrolls inside its own column and that the panel does not stretch with it.

### Step 11 — The verification screen

Reads the address from the hash, submits a code, and offers a resend.

```svelte
<script lang="ts">
  import AuthLayout from './AuthLayout.svelte';
  import { verifyEmail, resendOtp } from '../lib/api';
  import { hashParam } from '../lib/hash';

  const email = hashParam('email');

  let code = $state('');
  let formError = $state('');
  let notice = $state('');
  let busy = $state(false);
  let resending = $state(false);

  async function onSubmit(event: SubmitEvent) {
    event.preventDefault();
    formError = '';
    notice = '';

    if (code.trim().length !== 6) {
      formError = 'Enter the 6-digit code from your email.';
      return;
    }

    busy = true;
    try {
      await verifyEmail(email, code.trim());
      window.location.hash = '#/login';
    } catch (error) {
      formError = error instanceof Error ? error.message : 'Could not verify that code.';
    } finally {
      busy = false;
    }
  }

  async function onResend() {
    formError = '';
    notice = '';
    resending = true;
    try {
      await resendOtp(email);
      notice = 'A new code is on its way.';
    } catch (error) {
      // Includes the rate limit, which the server words for us.
      formError = error instanceof Error ? error.message : 'Could not resend the code.';
    } finally {
      resending = false;
    }
  }
</script>
```

The input is a single field, styled so the digits read as a code:

```svelte
<input
  bind:value={code}
  inputmode="numeric"
  autocomplete="one-time-code"
  maxlength="6"
  placeholder="000000"
  class="input text-center font-mono text-3xl tracking-[0.5em]"
/>
```

`inputmode="numeric"` brings up the number pad on a phone. `autocomplete="one-time-code"` lets iOS and Android offer the code straight from the SMS or mail notification. Both are one attribute each and save the user real effort.

Two things the screen must handle.

Show the address so the user can tell they typed it correctly: *We sent a code to* followed by the email in `text-fg`. If `email` is empty, because someone opened `#/verify` directly, show a line pointing them at `#/signup` instead of a form that cannot succeed.

The resend button is the one place the 429 appears. `Too many OTP requests. Please try again later.` comes from the server and reads fine as-is. The limit is three per hour, so a user who hits it will see this for a while, which is the intended behaviour, not a bug to work around.

### Step 12 — Link the new screens from the nav

In `Nav.svelte`, the desktop actions are a theme toggle and an `Open the app` button. Make it: a `Sign in` text link, then `Get started` as the accent button pointing at `#/signup`. Keep `Open the app` in the mobile menu.

Use the classes already on those elements. Do not introduce a new button style here.

---

## 7. Testing

```bash
bun run dev              # backend on 3000, frontend on 5173
```

Work through this list in the browser. It is ordered so each step sets up the next.

| # | Action | Expected |
| --- | --- | --- |
| 1 | Open `#/signup`, reload five times | The left panel changes between loads |
| 2 | Submit the empty form | `Enter your full name.`, nothing sent |
| 3 | Enter mismatched passwords | `Passwords do not match.` |
| 4 | Enter a 5-character password | `Password must be at least 6 characters.` |
| 5 | Click the eye icon | The password becomes readable and the form does not submit |
| 6 | Submit a valid form | Lands on `#/verify` with the email in the hash |
| 7 | Check the backend console | A line starting `[email-verification] OTP for` carries the code; sending real mail is still a placeholder |
| 8 | Enter a wrong code | `Invalid email or otp` |
| 9 | Enter the printed code | Lands on `#/login` |
| 10 | Sign in with the wrong password | `Invalid email or password` |
| 11 | Sign in correctly | Lands on `#/app`, and `signcraft-user` is in local storage |
| 12 | Press resend four times | The fourth reports the rate limit |
| 13 | Open `#/verify` with no query | A pointer to signup, not a dead form |
| 14 | Narrow the window below 1024px | The panel disappears, the form fills the width |
| 15 | Narrow to 375px | No horizontal scrollbar on any of the three screens |
| 16 | Toggle to light mode | Every label, button and border is readable |
| 17 | Tab through each form | Every stop shows the accent focus ring |
| 18 | Stop the backend, then submit | A readable message, not a blank screen |

Two of these are about the regression from step 1 rather than the new pages: 16 covers the tokens, and any secondary button on the landing page should now be legible in light mode too.

Also run:

```bash
cd apps/frontend && bun run check   # must report 0 ERRORS
```

---

## 8. Acceptance checklist

- [ ] `bun run check` reports 0 errors.
- [ ] `TiltCard.svelte` and `spotlight.ts` are gone.
- [ ] `--color-gray-1` and `--color-gray-2` have light values, and light-mode secondary buttons are readable.
- [ ] `.surface` declares a border colour in both themes.
- [ ] `users` has nullable `organization` and `phone`, in the migration and the model.
- [ ] `POST /api/register` accepts both as optional and still accepts requests without them.
- [ ] `#/login`, `#/signup` and `#/verify` all render; unknown hashes still fall through to the landing page.
- [ ] The left panel differs across reloads and is hidden below 1024px.
- [ ] The panel renders correctly with no image files present.
- [ ] The panel is `aria-hidden`.
- [ ] Both password fields toggle visibility, and the toggle does not submit the form.
- [ ] Password confirmation is checked in the browser before the request.
- [ ] Server error text is shown to the user rather than replaced.
- [ ] Every error message is in a `role="alert"`.
- [ ] Submit buttons disable while a request is running.
- [ ] The verify screen carries the email through the hash, encoded.
- [ ] A successful login stores the tokens and the user, then goes to `#/app`.
- [ ] Every input has a `<label>` bound by `for` and `id`.
- [ ] No horizontal scroll at 375px on any screen.
- [ ] `Dashboard.svelte` is untouched.

---

## 9. Mistakes to avoid

**Writing `fetch` inside a component.** Four endpoints across three screens becomes twelve places to fix when the envelope changes. `src/lib/api.ts` is the only file that should mention a URL.

**Forgetting `type="button"` on the visibility toggle.** It submits the form. This is the single most common bug in a password field.

**Marking the new backend fields required.** `t.Optional` on both. Required fields break every existing caller of `/api/register`.

**Making the new columns `NOT NULL`.** The table already has rows. The migration will fail.

**Rewriting the server's error messages.** `Invalid email or password` and the rate-limit line are already written for a person. Passing them through is both less code and more accurate than a status-code lookup table.

**Building a 6-box OTP input.** One field with letter-spacing meets the specification. Six boxes means focus management, paste splitting and arrow keys, which is a lot of code for the same result.

**Animating anything.** The landing page removed parallax, floating and hover movement in the previous ticket. Auth screens that bounce would not match. Fade and opacity only.

**Skipping `encodeURIComponent` on the email.** A `+` in the address decodes as a space, and verification then fails with a confusing error.

**Letting the panel scroll with a tall form.** The panel is `min-h-screen` and fixed. Only the form column scrolls.

**Putting the panel text in the accessibility tree.** It is decoration. `aria-hidden="true"` on the wrapper, and `alt=""` on the image.

**Leaving the light-mode token fix for later.** Every input, button and divider on these three screens uses those tokens. Fixing it afterwards means revisiting all three files.

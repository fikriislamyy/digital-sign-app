# Feature: Melt UI components, real URLs, responsive pages

**Audience:** junior developer, or a cheaper AI model, working in this repository.
**Estimated effort:** 2–3 days. Ship it as three pull requests, one per phase below. Each phase leaves the app working.
**Prerequisite reading:** `apps/frontend/src/App.svelte`, `apps/frontend/src/lib/auth.svelte.ts`, `apps/frontend/src/app.css`, `apps/frontend/src/auth/Signup.svelte`, `apps/frontend/src/app/AppLayout.svelte`.

The previous version of this file (the logout / app shell / dashboard plan) is in git history at commit `9b0628d`. That work is done and merged; this file replaces it.

---

## 1. What we are building

**Phase A — real URLs.** Replace hash routing (`/#/app/dashboard`) with History API routing (`/dashboard`). One new file, one deleted file, and every link in the app rewritten. Also fixes a bug where logging in bounces the user straight back to the login page (see 3.4).

**Phase B — Melt UI wrappers + auth pages.** Install `melt`, write six small wrapper components in `src/ui/`, then use them on the login, signup, and verification pages.

**Phase C — landing page and dashboard.** Use the same wrappers on the landing page (mobile menu, theme toggle, testimonial carousel) and in the app shell (mobile sidebar drawer, user menu, theme toggle, time-range filter, chart tooltips). Make the app shell usable on a phone, which it currently is not.

Rules that apply to every phase:

- **No new colors.** Every color comes from the tokens already in `app.css` (`bg-bg-base`, `bg-bg-elevated`, `text-fg`, `text-fg-muted`, `bg-accent`, `border-gray-1`, `dark:border-gray-2`, the `.surface` and `.input` classes). See 3.5 for the one place this changes existing code.
- **Every page must work at 375px wide** (iPhone SE) and at 1440px. Chrome DevTools device toolbar, ⌘⇧M / Ctrl⇧M. Section 7 lists what to check.
- **`bun run check` in `apps/frontend` must report 0 errors** when you are done. Today it reports 2 errors and 16 warnings (see 3.6). Do not add warnings; remove the ones in files you touch.

Everything below was checked against the installed versions: Svelte 5.57.0, Vite 6.4.3, `@sveltejs/vite-plugin-svelte` 4.0.4, Tailwind 4.3.3, Bun 1.4.2, and `melt` 0.44.0. Where a snippet is marked *verified*, it was compiled with `svelte-check` and executed in headless Chromium.

---

## 2. Contracts

### 2.1 URLs after Phase A

| Old | New | Kind (see 3.2) |
| --- | --- | --- |
| `/#/` | `/` | root |
| `/#/login` | `/login` | guest |
| `/#/signup` | `/signup` | guest |
| `/#/verify?email=…` | `/verify?email=…` | open |
| `/#/app`, `/#/app/dashboard` | `/dashboard` | auth |
| `/#/app/documents` | `/documents` | auth |
| `/#/app/templates` | `/templates` | auth |
| `/#/app/signings` | `/signings` | auth |
| `/#/app/analytics` | `/analytics` | auth |
| `/#/app/team` | `/team` | auth |
| `/#/app/settings` | `/settings` | auth |
| `/#/app/billing` | `/billing` | auth |
| `/#/app/audit` | `/audit` | auth |
| `/#/app/integrations` | `/integrations` | auth |
| `/#/app/help` | `/help` | auth |
| `/#/app/profile` | `/profile` | auth |
| anything else | redirect to `/` | — |

In-page anchors on the landing page (`#hero`, `#features`, `#testimonials`, `#pricing`) are **not routes** and do not change. They keep working because the router ignores any `href` that starts with `#`.

### 2.2 The `src/ui/` wrappers (Phase B)

| File | Wraps (Melt builder) | Used by |
| --- | --- | --- |
| `ui/Tabs.svelte` | `Tabs` | Signup account type, Testimonials dots, Dashboard time range |
| `ui/PinField.svelte` | `PinInput` | Verify code |
| `ui/Menu.svelte` | `Popover` | Navbar user menu |
| `ui/Drawer.svelte` | `Dialog` | Landing mobile nav, app shell mobile sidebar |
| `ui/ToggleButton.svelte` | `Toggle` | PasswordField eye button, both ThemeToggles |
| `ui/Tooltip.svelte` | `Tooltip` | Dashboard chart bars |

`auth/Field.svelte` stays as it is. Melt has no text-input builder; a plain `<input class="input">` is already correct.

### 2.3 Backend

Nothing changes in `apps/backend`. Every API call keeps its path and shape.

---

## 3. Things that need settling

### 3.1 Which Melt package

There are two packages with "Melt UI" in the name:

- `@melt-ui/svelte` (0.86) — the original, built on Svelte 4 stores. Works on Svelte 5 but every example uses `$store` syntax that does not mix with runes.
- `melt` (0.44) — the Svelte 5 rewrite. Builders are classes (`new Tabs(...)`) and you spread their getters onto elements (`{...tabs.trigger}`). Peer dependencies: `svelte ^5.30.1` (we have 5.57) and `@floating-ui/dom`.

**Use `melt`.** Install from the frontend folder so the workspace lockfile is updated:

```
cd apps/frontend
bun add melt@0.44.0 @floating-ui/dom
```

Restart the Vite dev server afterwards; Vite pre-bundles dependencies at startup.

If Bun refuses because of the `svelte` peer range, change `"svelte": "^5.2.0"` to `"svelte": "^5.57.0"` in `apps/frontend/package.json` and run `bun install` from the repository root.

Melt's docs are at melt-ui.com, "Next" version. Only the builder form is used here, never the `melt/components` form, so there is one pattern to learn.

### 3.2 Routing library or hand-rolled

The app already has a 40-line hand-rolled hash router in `App.svelte`. Swapping it for a library adds a dependency whose Svelte 5 support would need checking, and the routing needs are tiny (fourteen flat routes, one query parameter). **Keep it hand-rolled**, but move it into `lib/router.svelte.ts` so pages can call `router.navigate()` instead of poking `window.location`. The full file is in 4.1 and was run in a browser.

The route kinds and guard rules do not change from the previous ticket:

| Kind | Guest | Logged in |
| --- | --- | --- |
| root `/` | landing page | replace URL with `/dashboard` |
| guest `/login`, `/signup` | allowed | replace URL with `/dashboard` |
| open `/verify` | allowed | allowed |
| auth (the twelve app pages) | replace URL with `/login` | app shell + page |
| unknown | replace URL with `/` | replace URL with `/` |

"Replace" means `history.replaceState`, so the Back button never lands on a URL that immediately redirects again.

### 3.3 Dropping the `/app` prefix

The user asked for `/dashboard`, not `/app/dashboard`. So the twelve app pages live at the top level. This means `App.svelte` must know the list of auth routes explicitly (a `Set` of twelve strings) rather than matching a prefix. That list already exists as `pageMap` in `App.svelte`; reuse it.

### 3.4 Login currently bounces back to the login page

`auth.save()` in `lib/auth.svelte.ts` sets `profile = null` when it is handed the bare `{ id, email }` object that `/api/login` returns (the profile with the wallet only comes from `/api/me`). `Login.svelte` then navigates to the dashboard, the guard in `App.svelte` sees `auth.profile === null`, and redirects to the login page. The tokens are in `localStorage`, so a page refresh fixes it, which is why it may look like it works.

The fix belongs in Phase A because the guard is being rewritten anyway: add `auth.loadProfile()` (4.2), call it after `auth.save()` in `Login.svelte` and `Verify.svelte`, and only then navigate. `Signup.svelte` does not need it: it goes to `/verify`, which is an open route.

### 3.5 Colors in the app shell

The landing and auth pages use the tokens in `app.css` (`bg-bg-base`, `text-fg`, `bg-accent`, …). The app shell and dashboard built in the previous ticket use raw Tailwind palette classes instead (`bg-slate-50`, `dark:bg-slate-950`, `bg-blue-500`, `text-slate-600`). That is two color systems in one app.

"Keep the color combination as it is" is read as: keep the **design system**, do not invent new colors. So, while touching the app shell in Phase C, replace the slate/blue classes with tokens using this mapping. Do not hunt for these in files you are not already editing.

| Raw class in app shell | Token |
| --- | --- |
| `bg-slate-50 dark:bg-slate-950` (page) | `bg-bg-base` |
| `bg-white dark:bg-slate-900`, `bg-white dark:bg-slate-800` (cards, nav) | `bg-bg-elevated` |
| `border-slate-200 dark:border-slate-800/700` | `border-gray-1 dark:border-gray-2` |
| `text-slate-900 dark:text-white` | `text-fg` |
| `text-slate-600/500 dark:text-slate-400` | `text-fg-muted` |
| `bg-blue-500 text-white` (active filter) | `bg-accent text-white` |
| `bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100` (active sidebar link) | `bg-accent/10 text-accent` |
| `hover:bg-slate-100 dark:hover:bg-slate-800` | `hover:bg-gray-1 dark:hover:bg-gray-2` |
| chart gradient `from-blue-500 to-blue-400` | `bg-accent` |

The pie chart's three status colors (`#fbbf24`, `#3b82f6`, `#10b981`) and the status badge classes in `RecentDocuments.svelte` stay: they encode meaning (draft / sent / completed), not brand.

If the reviewer disagrees with this reading, the mapping is a find-and-replace to revert.

### 3.6 `bun run check` baseline

Running `bun run check` in `apps/frontend` today gives **2 errors, 16 warnings**. The errors are both in `app/dashboard/PieChart.svelte` (`paths` has an implicit `any[]` type: declare it as `const paths: { path: string; color: string }[] = []`). Nine of the warnings are `state_referenced_locally` in `Wallet.svelte`, `StatCard.svelte`, `LineChart.svelte`, and `PieChart.svelte`: those components compute values from props once, at creation, so when the dashboard filter changes and new data arrives, the charts and cards **do not update**. Phase C touches those files; fix them with `$derived` while you are there (6.6 shows how). Two warnings are `<svelte:component>` in `App.svelte`, which Phase A deletes. Two are in `src/Dashboard.svelte`, a leftover demo page nothing imports; Phase A deletes it.

### 3.7 Melt elements use the browser's popover and dialog

Melt's `Popover`, `Tooltip`, and `Dialog` render with the native `popover` attribute and `<dialog>` element. Two consequences:

1. They render in the browser's *top layer*. `z-index` on them does nothing and is not needed; `overflow: hidden` on an ancestor cannot clip them. Good.
2. The browser gives them default styles: a black border, white background, `margin: auto`, centred on screen. Tailwind's preflight does not reset these. Without the CSS in 5.1 the user menu appears as a white box with a black border in the middle of the screen. Add that CSS in Phase B before styling anything else.

### 3.8 Production serving

Vite's dev server and `vite preview` already serve `index.html` for any unknown path (that is what `appType: 'spa'`, the default, means), so `/dashboard` loads in development with no config change. Whatever eventually serves `apps/frontend/dist` in production must do the same (nginx: `try_files $uri /index.html;`). The backend does not serve the frontend today, so there is nothing to change in this ticket; this is a note for whoever sets up deployment.

---

## 4. Phase A — real URLs

### 4.1 `lib/router.svelte.ts` *(verified)*

Create `apps/frontend/src/lib/router.svelte.ts`. The `.svelte.ts` suffix is required because the file uses `$state`.

```ts
/**
 * History-API router. The URL is the only source of truth: `path` and
 * `search` mirror `window.location` and change on navigate() or Back/Forward.
 */
class Router {
  path = $state(window.location.pathname);
  search = $state(window.location.search);

  /** Query string as URLSearchParams. `router.query.get('email')` */
  get query() {
    return new URLSearchParams(this.search);
  }

  /** Go to an app URL such as '/dashboard' or '/verify?email=a%40b.c'. */
  navigate(to: string, { replace = false } = {}) {
    if (to === this.path + this.search) return;
    history[replace ? 'replaceState' : 'pushState'](null, '', to);
    this.sync();
  }

  /** Call once, from App.svelte's onMount. */
  init() {
    window.addEventListener('popstate', () => this.sync());

    document.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element).closest('a');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      if (anchor.origin !== window.location.origin) return;

      // '#features' style links scroll within the page; the browser handles them.
      if (anchor.getAttribute('href')?.startsWith('#')) return;

      event.preventDefault();
      this.navigate(anchor.pathname + anchor.search + anchor.hash);
    });
  }

  private sync() {
    this.path = window.location.pathname;
    this.search = window.location.search;
  }
}

export const router = new Router();
```

What was verified: clicking `<a href="/verify?email=a%40b.c">` updates `router.path` to `/verify` and `router.query.get('email')` returns `a@b.c`; `navigate('/dashboard', { replace: true })` then Back returns to `/`; clicking `<a href="#features">` leaves `router.path` alone and sets `location.hash`.

The click listener means plain `<a href="/login">` works everywhere. Pages only call `router.navigate()` after an async action (login succeeded, code verified).

### 4.2 `auth.loadProfile()` in `lib/auth.svelte.ts`

Add this method to `AuthStore` and import `me` from `./api`:

```ts
  /** Fetch /api/me with the stored access token. Clears auth on 401. */
  async loadProfile(): Promise<boolean> {
    const token = this.accessToken;
    if (!token) return false;
    try {
      const profile = await me(token);
      this.profile = profile;
      try { localStorage.setItem(PROFILE, JSON.stringify(profile)); } catch {}
      return true;
    } catch {
      this.clear();
      return false;
    }
  }
```

Then simplify `save()`: it only stores tokens now, and `profile` is always set by `loadProfile()`.

```ts
  save(accessToken: string, refreshToken: string) {
    try {
      localStorage.setItem(ACCESS, accessToken);
      localStorage.setItem(REFRESH, refreshToken);
    } catch {}
  }
```

Update the three callers (`Login.svelte`, `Signup.svelte`, `Verify.svelte` does not call it) to `auth.save(result.access_token, result.refresh_token)`.

### 4.3 Rewrite `App.svelte`

Replace the whole file. The page imports stay as they are today.

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { theme } from './lib/theme.svelte';
  import { auth } from './lib/auth.svelte';
  import { router } from './lib/router.svelte';
  import Landing from './landing/Landing.svelte';
  import AppLayout from './app/AppLayout.svelte';
  import Login from './auth/Login.svelte';
  import Signup from './auth/Signup.svelte';
  import Verify from './auth/Verify.svelte';
  import Dashboard from './app/pages/Dashboard.svelte';
  import Documents from './app/pages/Documents.svelte';
  import Templates from './app/pages/Templates.svelte';
  import Signings from './app/pages/Signings.svelte';
  import Analytics from './app/pages/Analytics.svelte';
  import Team from './app/pages/Team.svelte';
  import Settings from './app/pages/Settings.svelte';
  import Billing from './app/pages/Billing.svelte';
  import Audit from './app/pages/Audit.svelte';
  import Integrations from './app/pages/Integrations.svelte';
  import Help from './app/pages/Help.svelte';
  import Profile from './app/pages/Profile.svelte';

  const appPages = {
    '/dashboard': Dashboard,
    '/documents': Documents,
    '/templates': Templates,
    '/signings': Signings,
    '/analytics': Analytics,
    '/team': Team,
    '/settings': Settings,
    '/billing': Billing,
    '/audit': Audit,
    '/integrations': Integrations,
    '/help': Help,
    '/profile': Profile,
  } as const;

  const guestPages = { '/login': Login, '/signup': Signup } as const;

  let ready = $state(false);

  onMount(async () => {
    theme.init();
    auth.init();
    router.init();
    await auth.loadProfile();
    ready = true;
  });

  let loggedIn = $derived(auth.profile !== null);
  let kind = $derived.by(() => {
    const p = router.path;
    if (p === '/') return 'root';
    if (p in guestPages) return 'guest';
    if (p === '/verify') return 'open';
    if (p in appPages) return 'auth';
    return 'unknown';
  });

  // The guard. Runs whenever the URL or the login state changes.
  $effect(() => {
    if (!ready) return;
    if (kind === 'unknown') router.navigate('/', { replace: true });
    else if (loggedIn && (kind === 'root' || kind === 'guest')) router.navigate('/dashboard', { replace: true });
    else if (!loggedIn && kind === 'auth') router.navigate('/login', { replace: true });
  });

  let AppPage = $derived(appPages[router.path as keyof typeof appPages]);
  let GuestPage = $derived(guestPages[router.path as keyof typeof guestPages]);
</script>

{#if !ready}
  <div class="grid min-h-screen place-items-center bg-bg-base text-fg-muted">Loading…</div>
{:else if kind === 'auth' && loggedIn && AppPage}
  <AppLayout>
    {#key router.path}
      <AppPage />
    {/key}
  </AppLayout>
{:else if kind === 'guest' && !loggedIn && GuestPage}
  <GuestPage />
{:else if kind === 'open'}
  <Verify />
{:else if kind === 'root' && !loggedIn}
  <Landing />
{/if}
```

Notes for the implementer:

- Svelte 5 components are dynamic by default: `<AppPage />` where `AppPage` is a `$derived` variable renders whichever component it holds. `<svelte:component>` is deprecated; do not use it.
- The `{#if}` chain only renders a page when the guard would not redirect. During the one frame between a URL change and the redirect, nothing flashes.
- `{#key router.path}` remounts the page when the URL changes so `Dashboard.svelte`'s `onMount` fetch runs again when navigating away and back.

### 4.4 Replace every hash reference

This is the complete list. `grep -rn "#/" apps/frontend/src` must print nothing when you are done (in-page anchors like `#features` do not contain `#/`).

| File | Line today | Change |
| --- | --- | --- |
| `landing/Hero.svelte` | `href="#/app"` | `href="/dashboard"` |
| `landing/Nav.svelte` | `href="#/login"`, `href="#/signup"`, `href="#/app"` | `/login`, `/signup`, `/dashboard` |
| `landing/FinalCta.svelte` | `href="#/app"` | `href="/dashboard"` |
| `auth/Login.svelte` | `window.location.hash = '#/app'` | `await auth.loadProfile(); router.navigate('/dashboard');` |
| `auth/Login.svelte` | `href="#/signup"` | `href="/signup"` |
| `auth/Signup.svelte` | ``window.location.hash = `#/verify?email=…` `` | ``router.navigate(`/verify?email=${encodeURIComponent(email.trim())}`)`` |
| `auth/Signup.svelte` | `href="#/login"` | `href="/login"` |
| `auth/Verify.svelte` | `import { hashParam } from '../lib/hash'` + `hashParam('email')` | `import { router } from '../lib/router.svelte'` + `router.query.get('email') ?? ''` |
| `auth/Verify.svelte` | `window.location.hash = '#/app'` | `await auth.loadProfile(); router.navigate('/dashboard');` (import `auth`) |
| `auth/Verify.svelte` | `href="#/signup"` | `href="/signup"` |
| `app/navbar/UserMenu.svelte` | `window.location.hash = '#/'` | `router.navigate('/')` |
| `app/Sidebar.svelte` | twelve `href: '#/app/…'` | `href: '/…'` (drop `#/app`) |
| `app/Sidebar.svelte` | `currentPath` state + `hashchange` listener + `$effect` | delete all of it; `isActive` becomes `router.path === href` |
| `lib/hash.ts` | whole file | delete |
| `src/Dashboard.svelte` | whole file (old demo, unused) | delete |

In `Login.svelte` the `try` block becomes:

```ts
      const result = await login(email.trim(), password);
      auth.save(result.access_token, result.refresh_token);
      await auth.loadProfile();
      router.navigate('/dashboard');
```

### 4.5 Phase A test

Start both servers (`bun run db:up`, then `bun run dev` from the root). Note the port Vite prints; it is 5173 unless something else holds it.

| # | Do | Expect |
| --- | --- | --- |
| A1 | Open `http://localhost:5173/` as a guest | landing page, URL stays `/` |
| A2 | Click "Sign in" in the nav | URL `/login`, no page reload (the Vite console does not print a new request for `index.html`) |
| A3 | Log in | URL `/dashboard`, the dashboard renders with the user's name in the navbar. **Not** the login page again (3.4) |
| A4 | Press Back | URL `/login` → guard sends you to `/dashboard` again; pressing Back once more leaves the site (no loop) |
| A5 | Type `/documents` in the address bar and press Enter | Documents placeholder inside the app shell |
| A6 | Type `/nope` | URL becomes `/dashboard` (logged in) |
| A7 | Log out from the user menu | URL `/`, landing page |
| A8 | Type `/dashboard` as a guest | URL becomes `/login` |
| A9 | On the landing page click "Features" in the nav | page scrolls, URL is `/#features`, no route change |
| A10 | Sign up with a new email | URL `/verify?email=…`, the email shows on the page |
| A11 | Enter the code from Mailpit (`http://localhost:8025`) | URL `/dashboard` |
| A12 | `bun run check` | 0 errors (the two PieChart errors may remain until Phase C; everything else must be clean) |

Commit as `feat: path-based routing (closes #18)`.

---

## 5. Phase B — Melt wrappers and auth pages

### 5.1 Install and reset styles

Install as in 3.1. Then add to `app.css`, after the `@layer base { … }` block:

```css
/* Melt UI renders popovers and dialogs with the browser's own elements,
   which carry default styles Tailwind does not reset. */
@layer components {
  [data-melt-popover-content],
  [data-melt-tooltip-content] {
    margin: 0;
    inset: auto;
    border: 0;
    padding: 0;
    width: auto;
    height: auto;
    overflow: visible;
    background: transparent;
    color: inherit;
  }

  [data-melt-dialog-overlay] {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    border: 0;
    padding: 0;
    background: rgb(0 0 0 / 0.5);
  }

  dialog[data-melt-dialog-content] {
    margin: 0;
    border: 0;
    padding: 0;
    max-width: none;
    max-height: none;
    background: transparent;
    color: inherit;
  }
  dialog[data-melt-dialog-content]::backdrop {
    background: transparent; /* the overlay element does the dimming */
  }

  /* A drawer is a dialog pinned to the left edge. */
  dialog.drawer {
    position: fixed;
    inset: 0 auto 0 0;
    height: 100dvh;
    width: min(18rem, 85vw);
  }
}
```

Melt positions popovers and tooltips with inline `top`/`left` (via floating-ui), which override the `inset: auto` above for those two sides. That is intended.

### 5.2 The one pattern every wrapper uses

```svelte
<script lang="ts">
  import { Tabs as TabsBuilder } from 'melt/builders';
  let { value = $bindable() } = $props();

  const tabs = new TabsBuilder({
    value: () => value,                 // getter: builder follows the prop
    onValueChange: (v) => (value = v),  // builder writes back to the prop
  });
</script>

<button {...tabs.getTrigger('a')}>A</button>
```

Three rules, each learned the hard way:

1. **Pass getters, not values**, for anything that can change: `value: () => value`, `maxLength: () => length`. Passing `value` directly compiles but the builder keeps the initial value forever, and `svelte-check` warns `state_referenced_locally`.
2. **Never put your own `onclick` on an element that receives a Melt spread.** The spread already contains `onclick`; whichever is written last wins and the other is silently dropped. React to changes through the builder's callbacks (`onValueChange`, `onOpenChange`) instead.
3. **Import the builder under an alias** (`Tabs as TabsBuilder`) when the wrapper file has the same name, so the file reads unambiguously.

### 5.3 `ui/Tabs.svelte` *(verified)*

```svelte
<script lang="ts" generics="T extends string">
  import { Tabs as TabsBuilder } from 'melt/builders';
  import type { Snippet } from 'svelte';

  interface Props {
    value: T;
    items: { id: T; label: string }[];
    /** Accessible name for the tab list, e.g. "Account type". */
    label: string;
    /** Extra classes for the list, e.g. "grid-cols-2" or "overflow-x-auto". */
    listClass?: string;
    /** Custom trigger rendering (used for the testimonial dots). */
    trigger?: Snippet<[{ id: T; label: string }, boolean]>;
    /** The panel. Rendered once, for the active tab. */
    children?: Snippet<[T]>;
  }
  let { value = $bindable(), items, label, listClass = '', trigger, children }: Props = $props();

  const tabs = new TabsBuilder<T>({
    value: () => value,
    onValueChange: (v) => (value = v),
  });
</script>

<div {...tabs.triggerList} aria-label={label} class="flex gap-1 rounded-lg bg-gray-1 p-1 dark:bg-gray-2 {listClass}">
  {#each items as item (item.id)}
    <button
      {...tabs.getTrigger(item.id)}
      type="button"
      class="shrink-0 rounded-md px-4 py-2 text-sm font-medium text-fg-muted transition-colors duration-300 hover:text-fg data-active:bg-bg-elevated data-active:text-fg data-active:shadow-card"
    >
      {#if trigger}{@render trigger(item, tabs.value === item.id)}{:else}{item.label}{/if}
    </button>
  {/each}
</div>

{#if children}
  <div {...tabs.getContent(tabs.value)}>
    {@render children(tabs.value)}
  </div>
{/if}
```

`data-active:` is a Tailwind 4 variant matching the `data-active` attribute Melt sets on the selected trigger. No class juggling in JavaScript.

Keyboard: Left/Right arrows move between tabs, Home/End jump. Melt handles it; test it once.

### 5.4 `ui/PinField.svelte` *(verified)*

```svelte
<script lang="ts">
  import { PinInput } from 'melt/builders';

  interface Props {
    value: string;
    length?: number;
    label: string;
    error?: string;
    /** Called with the full code as soon as the last digit is typed or pasted. */
    oncomplete?: (code: string) => void;
  }
  let { value = $bindable(), length = 6, label, error = '', oncomplete }: Props = $props();

  const pin = new PinInput({
    value: () => value,
    onValueChange: (v) => (value = v),
    maxLength: () => length,
    type: 'numeric',
    placeholder: '',
    onComplete: (code) => oncomplete?.(code),
  });
</script>

<div>
  <span id="{pin.root.id}-label" class="mb-2 block text-sm font-medium text-fg">{label}</span>
  <div {...pin.root} role="group" aria-labelledby="{pin.root.id}-label" class="flex justify-between gap-2">
    {#each pin.inputs as input, i (i)}
      <input
        {...input}
        aria-label="Digit {i + 1} of {length}"
        aria-invalid={error ? 'true' : undefined}
        autocomplete={i === 0 ? 'one-time-code' : 'off'}
        class="input h-14 w-full min-w-0 px-0 text-center font-mono text-2xl data-filled:border-accent"
      />
    {/each}
  </div>
  {#if error}<p class="mt-2 text-sm text-red-500">{error}</p>{/if}
</div>
```

Typing fills left to right and moves focus; Backspace moves back; pasting a six-digit code fills every box. At 375px six boxes with `gap-2` fit inside the 448px auth column because `min-w-0` lets them shrink.

### 5.5 `ui/Menu.svelte` *(verified)*

```svelte
<script lang="ts">
  import { Popover } from 'melt/builders';
  import type { Snippet } from 'svelte';

  interface Props {
    /** What the button shows (avatar, name, chevron). */
    trigger: Snippet;
    /** Menu body. Call close() after an item is chosen. */
    children: Snippet<[{ close: () => void }]>;
    align?: 'start' | 'end';
    /** Classes for the trigger button. */
    class?: string;
  }
  let { trigger, children, align = 'end', class: triggerClass = '' }: Props = $props();

  const popover = new Popover({
    floatingConfig: {
      computePosition: { placement: align === 'end' ? 'bottom-end' : 'bottom-start' },
    },
  });
</script>

<button {...popover.trigger} type="button" class={triggerClass}>
  {@render trigger()}
</button>

<div {...popover.content} class="surface mt-2 min-w-48 bg-bg-elevated p-1">
  {@render children({ close: () => (popover.open = false) })}
</div>
```

Escape and clicking outside close it; focus moves into the menu on open and back to the button on close. Verified: after a click on the trigger, the content matches `:popover-open` and has `position: absolute` with a computed `top`.

### 5.6 `ui/Drawer.svelte` *(verified)*

```svelte
<script lang="ts">
  import { Dialog } from 'melt/builders';
  import type { Snippet } from 'svelte';

  interface Props {
    /** Contents of the open button (a hamburger icon). */
    trigger: Snippet;
    /** Drawer body. Call close() after a link is chosen. */
    children: Snippet<[{ close: () => void }]>;
    title: string;
    /** Classes for the trigger button, e.g. "lg:hidden". */
    class?: string;
  }
  let { trigger, children, title, class: triggerClass = '' }: Props = $props();

  // The trigger lives inside this component on purpose; see the trap in 8.2.
  const dialog = new Dialog();
</script>

<button {...dialog.trigger} class={triggerClass} aria-label="Open {title}">
  {@render trigger()}
</button>

<div {...dialog.overlay}></div>

<dialog {...dialog.content} class="drawer border-r border-gray-1 bg-bg-base p-4 text-fg dark:border-gray-2" aria-label={title}>
  {@render children({ close: () => (dialog.open = false) })}
</dialog>
```

Verified: clicking the trigger opens the `<dialog>` modally with the overlay shown; a button inside calling `close()` closes both. Escape and clicking the overlay also close it, and page scroll is locked while open.

### 5.7 `ui/ToggleButton.svelte` *(verified)*

```svelte
<script lang="ts">
  import { Toggle } from 'melt/builders';
  import type { Snippet } from 'svelte';

  interface Props {
    pressed: boolean;
    /** Called on every click with the new state. Use this when the parent owns the state. */
    onchange?: (pressed: boolean) => void;
    label: string;
    class?: string;
    children: Snippet<[boolean]>;
  }
  let { pressed = $bindable(), onchange, label, class: cls = '', children }: Props = $props();

  const toggle = new Toggle({
    value: () => pressed,
    onValueChange: (v) => {
      pressed = v;
      onchange?.(v);
    },
  });
</script>

<button {...toggle.trigger} type="button" aria-label={label} class={cls}>
  {@render children(pressed)}
</button>
```

The builder adds `aria-pressed` and `data-checked`. The children snippet receives the current state so the caller can swap icons. Two ways to use it, both verified:

- **Bound**, when the toggle owns the state: `<ToggleButton bind:pressed={visible} …>` (PasswordField).
- **Controlled**, when a store owns the state: `<ToggleButton pressed={theme.current === 'dark'} onchange={() => theme.toggle()} …>` (ThemeToggle). The button re-renders because the `pressed` expression re-evaluates after the store changes.

### 5.8 `ui/Tooltip.svelte` *(verified)*

```svelte
<script lang="ts">
  import { Tooltip as TooltipBuilder } from 'melt/builders';
  import type { Snippet } from 'svelte';

  interface Props { text: string; class?: string; children: Snippet }
  let { text, class: cls = '', children }: Props = $props();

  const tooltip = new TooltipBuilder({
    openDelay: 200,
    floatingConfig: { computePosition: { placement: 'top' } },
  });
</script>

<!-- tabindex makes the tooltip reachable by keyboard, not only by mouse. -->
<span {...tooltip.trigger} tabindex="0" class={cls}>
  {@render children()}
</span>

<div {...tooltip.content} class="surface bg-bg-elevated px-2.5 py-1.5 text-xs text-fg">
  {text}
</div>
```

Verified via keyboard focus (the hover path uses the same open call).

### 5.9 Apply to the auth pages

**`auth/PasswordField.svelte`.** Replace the eye `<button>` with `ToggleButton`. `visible` becomes the bound `pressed`:

```svelte
<ToggleButton
  bind:pressed={visible}
  label={visible ? 'Hide password' : 'Show password'}
  class="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted transition-opacity duration-300 hover:opacity-70"
>
  {#snippet children(on)}
    <svg …>{#if on}…eye-off path…{:else}…eye path…{/if}</svg>
  {/snippet}
</ToggleButton>
```

That covers **Login** (which has no other interactive control besides plain fields).

**`auth/Signup.svelte`.** Delete the hand-rolled `role="tablist"` block and the `role="tabpanel"` wrapper. Replace with:

```svelte
<Tabs bind:value={kind} label="Account type" listClass="mb-8 grid grid-cols-2" items={accountTypes}>
  {#snippet children(active)}
    <form id="signup-form" onsubmit={onSubmit} class="space-y-5" novalidate>
      {#if active === 'organization'}
        <Field label="Organization name" bind:value={organization} placeholder="Acme Inc." required />
      {/if}
      …the rest of the form unchanged…
    </form>
  {/snippet}
</Tabs>
```

The existing `tabs` array (`{ id: 'personal', label: 'Personal' }, …`) already has the right shape; rename it to `accountTypes` so it is not confused with the component. The `Tabs` wrapper is generic over the id type, so `kind` keeps its `'personal' | 'organization'` type.

**`auth/Verify.svelte`.** Replace the `<label>` + single `<input maxlength="6">` with:

```svelte
<PinField bind:value={code} label="Verification code" error={formError ? ' ' : ''} oncomplete={() => form?.requestSubmit()} />
```

and add `let form = $state<HTMLFormElement>()` plus `bind:this={form}` on the `<form>`. Entering the sixth digit submits automatically; the Verify button stays for people who paste five digits and type one. Keep the existing `formError` `<p role="alert">` below the field (that is why `error` above only passes a space: to turn the boxes red without printing the message twice).

### 5.10 Phase B test

| # | Do | Expect |
| --- | --- | --- |
| B1 | `/signup`, press Tab until the "Personal" tab has focus, press → | "Organization" selected, the organization field appears |
| B2 | Same at 375px wide | both tabs fit on one row, the form has no horizontal scroll |
| B3 | Click the eye on a password field | text shows, button has `aria-pressed="true"` (inspect) |
| B4 | `/verify?email=…`, type six digits | focus moves box to box; after the sixth, the form submits |
| B5 | Paste a six-digit code into the first box | all six fill |
| B6 | Enter a wrong code | boxes get the red border, the alert text shows once |
| B7 | Verify at 375px | six boxes on one row, none clipped |
| B8 | Colors | tabs use `bg-gray-1`/`bg-bg-elevated`, nothing slate or blue |
| B9 | `bun run check` | no new warnings |

Commit as `feat: adopt Melt UI on auth pages`.

---

## 6. Phase C — landing page and app shell

### 6.1 Landing `Nav.svelte`: mobile menu becomes a Drawer

Delete `mobileOpen` and the `{#if mobileOpen}` list. Replace the hamburger `<button>` with:

```svelte
<Drawer title="navigation menu" class="grid h-10 w-10 place-items-center rounded-lg border border-gray-1 dark:border-gray-2 md:hidden">
  {#snippet trigger()}
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  {/snippet}
  {#snippet children({ close })}
    <ul class="space-y-1">
      {#each links as link}
        <li><a href={link.href} onclick={close} class="block rounded-lg px-3 py-2.5 text-sm font-medium text-fg-muted transition-colors duration-300 hover:text-fg">{link.label}</a></li>
      {/each}
      <li><a href="/login" onclick={close} class="block rounded-lg px-3 py-2.5 text-sm font-medium text-fg-muted">Sign in</a></li>
      <li><a href="/dashboard" onclick={close} class="block rounded-lg px-3 py-2.5 text-sm font-semibold text-accent">Open the app</a></li>
    </ul>
  {/snippet}
</Drawer>
```

`onclick={close}` on the links is fine: those `<a>` elements do not receive a Melt spread (rule 2 in 5.2 is about the trigger). The in-page links (`#features`) still scroll after the drawer closes because the router ignores them and the browser handles the hash.

### 6.2 Both `ThemeToggle.svelte` files

There are two (`landing/ThemeToggle.svelte` and `app/navbar/ThemeToggle.svelte`) with near-identical markup. Rewrite the landing one with `ToggleButton` and delete the navbar one; `app/Navbar.svelte` imports the landing one.

```svelte
<script lang="ts">
  import { theme } from '../lib/theme.svelte';
  import ToggleButton from '../ui/ToggleButton.svelte';

  let dark = $derived(theme.current === 'dark');
</script>

<ToggleButton
  pressed={dark}
  onchange={() => theme.toggle()}
  label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
  class="relative grid h-10 w-10 place-items-center rounded-lg transition-opacity duration-300 hover:opacity-70"
>
  {#snippet children(on)}
    …the two SVGs from today's file, using `on` where they used `isDark`…
  {/snippet}
</ToggleButton>
```

This is the *controlled* form from 5.7: the store owns the state, the button only reports clicks. Do **not** `bind:pressed` here and do not copy `theme.current` into a local `$state`: child components mount before `App.svelte` calls `theme.init()`, so a local copy would capture the default and then overwrite the user's saved choice. Verify the `<html>` element gains and loses the `dark` class, and that a reload keeps the choice.

### 6.3 `Testimonials.svelte`: dots become Tabs

The three dots are a hand-rolled tab list. Use the wrapper's `trigger` snippet for the dot rendering:

```svelte
<Tabs
  bind:value={current}
  label="Testimonials"
  listClass="mt-8 justify-center bg-transparent p-0 dark:bg-transparent"
  items={testimonials.map((t, i) => ({ id: String(i), label: `Testimonial ${i + 1} of ${testimonials.length}` }))}
>
  {#snippet trigger(item, active)}
    <span class="sr-only">{item.label}</span>
    <span class="block h-2.5 rounded-full transition-all duration-300 {active ? 'w-8 bg-accent' : 'w-2.5 bg-gray-2 dark:bg-gray-1'}"></span>
  {/snippet}
  {#snippet children(id)}
    <article class="surface p-8 md:p-16">
      …today's article, reading testimonials[Number(id)]…
    </article>
  {/snippet}
</Tabs>
```

`current` becomes a string (`$state('0')`) and the auto-advance interval does `current = String((Number(current) + 1) % testimonials.length)`. Because the wrapper puts the list *above* the panel, and the design has dots *below* the quote, add `flex flex-col-reverse` to the wrapping `div` in the section. Reduce the article padding to `p-8` on mobile (today's `p-12` leaves 40px of text width at 375px).

### 6.4 App shell: responsive sidebar

Today `AppLayout.svelte` renders a fixed 256px `<aside>` next to the content at every width, so on a phone the dashboard gets 119px. Fix:

1. Move the `<nav>` and its `sections` array from `Sidebar.svelte` into a new `app/SidebarNav.svelte` that takes an optional `onnavigate` prop and calls it when a link is clicked (`onclick={onnavigate}` on each `<a>`). Replace the `isActive`/`hashchange` code with `router.path === section.href`.
2. `Sidebar.svelte` becomes `<aside class="hidden w-64 shrink-0 border-r border-gray-1 bg-bg-elevated dark:border-gray-2 lg:block"><SidebarNav /></aside>`.
3. In `Navbar.svelte`, before the brand, add a `Drawer` visible only below `lg`:

```svelte
<Drawer title="sidebar" class="grid h-10 w-10 place-items-center rounded-lg hover:bg-gray-1 dark:hover:bg-gray-2 lg:hidden">
  {#snippet trigger()}…hamburger svg…{/snippet}
  {#snippet children({ close })}<SidebarNav onnavigate={close} />{/snippet}
</Drawer>
```

4. Apply the color mapping from 3.5 to `AppLayout.svelte`, `Navbar.svelte`, `SidebarNav.svelte`, `Wallet.svelte`, `Placeholder.svelte`.
5. Navbar at 375px: brand text `hidden sm:inline`, the wallet shows the amount only (drop the icon below `sm`), user menu shows the avatar only (`hidden sm:inline` on the name). Everything must fit in one row without wrapping.

### 6.5 `UserMenu.svelte`: Menu

Delete `showMenu`. The whole file becomes:

```svelte
<script lang="ts">
  import { auth } from '../../lib/auth.svelte';
  import { router } from '../../lib/router.svelte';
  import { logout } from '../../lib/api';
  import Menu from '../../ui/Menu.svelte';
  import type { UserProfile } from '../../lib/api';

  let { profile }: { profile: UserProfile } = $props();

  async function handleLogout() {
    const token = auth.refreshToken;
    try {
      if (token) await logout(token);
    } finally {
      auth.clear();
      router.navigate('/');
    }
  }
</script>

<Menu class="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-1 dark:hover:bg-gray-2">
  {#snippet trigger()}
    <span class="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-accent to-indigo-500 text-sm font-bold text-white">
      {profile.user.name.charAt(0).toUpperCase()}
    </span>
    <span class="hidden text-sm font-medium text-fg sm:inline">{profile.user.name}</span>
  {/snippet}
  {#snippet children({ close })}
    <div class="border-b border-gray-1 px-3 py-2 dark:border-gray-2">
      <p class="truncate text-sm font-medium text-fg">{profile.user.email}</p>
      <p class="text-xs text-fg-muted">{profile.user.type}</p>
    </div>
    <a href="/profile" onclick={close} class="block rounded-md px-3 py-2 text-sm text-fg hover:bg-gray-1 dark:hover:bg-gray-2">Profile</a>
    <button type="button" onclick={() => { close(); handleLogout(); }} class="block w-full rounded-md px-3 py-2 text-left text-sm text-fg hover:bg-gray-1 dark:hover:bg-gray-2">Logout</button>
  {/snippet}
</Menu>
```

Note the `finally`: today a failed `/api/logout` call leaves the user logged in with a stale session. Clearing locally regardless is the right behaviour; the server session expires in seven days anyway.

### 6.6 Dashboard: Tabs for the range, Tooltip for the bars, reactive charts

**Range filter.** In `app/pages/Dashboard.svelte` replace the six `<button>`s with:

```svelte
<Tabs
  bind:value={range}
  label="Time range"
  listClass="overflow-x-auto"
  items={ranges.map((r) => ({ id: r, label: rangeLabel(r) }))}
/>
```

and replace `handleRangeChange` with `$effect(() => { range; loadData(); })` — reading `range` inside the effect makes it re-run on every change. Delete the `onMount` call to `loadData()`; the effect runs once on mount already. At 375px the six triggers overflow and the list scrolls horizontally (`shrink-0` on the triggers keeps them from squashing). The tab list has no panel here, so `children` is omitted.

**Bar tooltips.** In `LineChart.svelte` wrap each bar:

```svelte
<Tooltip text="{item.count} {item.count === 1 ? 'document' : 'documents'}" class="block w-full">
  <div class="w-full rounded-t bg-accent transition hover:opacity-80" style="height: {getHeight(item.count)}%"></div>
</Tooltip>
```

and delete the `title` attribute. The wrapping `<span>` needs `class="block w-full"` and the bar column needs `h-full` so percentage heights still resolve.

**Reactivity fixes (3.6).** In `LineChart.svelte`, `PieChart.svelte`, `StatCard.svelte`, and `Wallet.svelte`, every `const x = f(prop)` at the top of the script must become `let x = $derived(f(prop))`. For example in `LineChart.svelte`:

```ts
let maxValue = $derived(Math.max(...series.map((s) => s.count), 1));
```

and in `PieChart.svelte` `slices` and `paths` become `$derived`, with `paths` typed as `{ path: string; color: string }[]` (that also fixes the two `svelte-check` errors). Before this fix, switching the range from "This Month" to "Today" re-fetched data but the chart kept the old bars.

**Mobile labels.** With "This Month" the chart has up to 30 buckets; at 375px the date labels overlap. Show a label only when `i % Math.ceil(series.length / 6) === 0`; the tooltip carries the exact value for the rest.

**Colors.** Apply the 3.5 mapping to `Dashboard.svelte`, `StatCard.svelte`, `LineChart.svelte`, `PieChart.svelte`, `RecentDocuments.svelte`, `Clock.svelte`. The status colors listed in 3.5 stay.

### 6.7 Phase C test

| # | Do | Expect |
| --- | --- | --- |
| C1 | Landing at 375px, tap the hamburger | drawer slides in from the left over a dimmed page; page does not scroll behind it |
| C2 | Tap "Features" in the drawer | drawer closes, page scrolls to Features |
| C3 | Press Escape with the drawer open | closes; focus returns to the hamburger |
| C4 | Landing at 1024px | no hamburger; the three links and both buttons are in the header |
| C5 | Theme toggle on landing and in the app | `<html class="dark">` toggles; reload keeps the choice |
| C6 | Testimonials: press Tab to a dot, press → | next quote shows; wait 8 s, it advances by itself |
| C7 | Dashboard at 375px | sidebar hidden, hamburger in the navbar, navbar fits in one row, no horizontal scroll anywhere |
| C8 | Open the sidebar drawer, tap "Documents" | URL `/documents`, drawer closed |
| C9 | Dashboard at 1280px | sidebar always visible, no hamburger |
| C10 | Click the avatar | menu opens below-right of the button, inside the viewport; click elsewhere closes it |
| C11 | Menu → Logout | URL `/`, landing page; `localStorage` has no `signcraft-*` keys |
| C12 | Switch range "This Month" → "Today" | stat cards, bars and pie all change (they did not before 6.6) |
| C13 | Range tabs at 375px | scroll sideways with a finger/trackpad; the active tab is highlighted |
| C14 | Hover a bar, then Tab to a bar | tooltip with "3 documents" appears both ways |
| C15 | `grep -rn "slate-\|blue-500\|blue-100" apps/frontend/src` | only `RecentDocuments.svelte` (status badges) and `PieChart.svelte` (`#3b82f6`) |
| C16 | `bun run check` | 0 errors, 0 warnings in files touched by this ticket |
| C17 | `bun run build` in `apps/frontend` | succeeds |

Commit as `feat: adopt Melt UI on landing and app shell; responsive sidebar`.

---

## 7. Responsive checklist (run on every page, both phases)

At 375px and 1440px:

- No horizontal scrollbar on `<body>`. If there is one, DevTools → Elements → hover elements until the wide one highlights.
- Every tap target at least 40×40px (`h-10 w-10` or padding that adds up).
- Text does not touch the viewport edge: every top-level container has `px-4` or more.
- Nothing is cut off at the bottom behind a fixed header (the landing `<header>` is fixed; sections already pad for it).
- Rotate to landscape on a phone (667×375): the auth pages still show the form without the decorative panel (`lg:` hides it, so this is already true; confirm nothing regressed).

---

## 8. Traps

### 8.1 Getters, not values

`new PinInput({ maxLength: length })` compiles and works until `length` changes; then it does not. Always `() => length`. `svelte-check` prints `state_referenced_locally` when you get this wrong. Treat that warning as an error.

### 8.2 `Dialog` ignores a bound `open` prop *(verified)*

`new Dialog({ open: () => open })` followed by `open = true` in the parent **does not open the dialog**: Melt's `Dialog` calls `showModal()` only inside its own `open` setter, and a getter change bypasses it. Either spread `dialog.trigger` onto a button or assign `dialog.open = true` yourself. This is why `ui/Drawer.svelte` owns its trigger. (`Popover`, `Tabs`, `Toggle`, `PinInput` do follow getters correctly.)

### 8.3 Missing CSS reset

Symptom: the user menu opens as a white box with a black border in the centre of the screen, or the drawer appears as a small centred box. Cause: 5.1 was skipped or added in the wrong layer (it must be in `@layer components` or unlayered; inside `@layer base` Tailwind's own base rules may come later and win for `dialog`).

### 8.4 Two `onclick`s

`<button {...tabs.getTrigger(id)} onclick={…}>` — one of them is dropped. Use `onValueChange` in the builder options.

### 8.5 Vite did not pick up `melt`

`Failed to resolve import "melt/builders"` after installing: restart `bun run dev`. Vite caches its dependency pre-bundle in `apps/frontend/node_modules/.vite`; deleting that folder also works.

### 8.6 `router.navigate` before the profile is loaded

The guard reads `auth.profile`. Navigating to `/dashboard` while it is still `null` redirects to `/login`. `await auth.loadProfile()` first, every time you have just called `auth.save()`.

### 8.7 The `{#key}` block and page state

`{#key router.path}` in `App.svelte` destroys and recreates the page component on every URL change. That is what makes `Dashboard.svelte`'s effect re-fetch when you navigate back to it. If a future page needs to survive navigation, lift its state into a store; do not remove the key.

### 8.8 `href="/dashboard"` on the landing page as a guest

Goes to `/login` (guard). That is by design: guests cannot see the dashboard. Do not add a `#/app`-style bypass.

### 8.9 The Tabs list without a panel

`Dashboard.svelte` uses `Tabs` as a segmented control with no `children`. The triggers then carry `aria-controls` pointing at an id that does not exist. Screen readers tolerate it; axe reports it as a minor issue. Acceptable here; if it bothers a reviewer, wrap the stat cards and charts in the `children` snippet (the same content for every value) and the ids resolve.

---

## 9. Definition of done

- Three PRs merged in order: routing → auth pages → landing and app shell.
- Table 2.1 holds: every URL in the left column no longer exists, every URL in the right column works when typed directly into the address bar.
- Tables 4.5, 5.10, 6.7 pass, plus the section 7 checklist on `/`, `/login`, `/signup`, `/verify`, `/dashboard`.
- `grep -rn "#/" apps/frontend/src` prints nothing. `grep -rn "window.location.hash" apps/frontend/src` prints nothing.
- `bun run check` in `apps/frontend`: 0 errors.
- `bun run build` in `apps/frontend` succeeds.
- No color class outside the `app.css` tokens except the three status colors (3.5).

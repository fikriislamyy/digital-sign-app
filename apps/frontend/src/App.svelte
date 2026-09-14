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

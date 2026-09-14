<script lang="ts">
  import { onMount } from 'svelte';
  import { theme } from './lib/theme.svelte';
  import { auth } from './lib/auth.svelte';
  import { me } from './lib/api';
  import Landing from './landing/Landing.svelte';
  import AppLayout from './app/AppLayout.svelte';
  import Login from './auth/Login.svelte';
  import Signup from './auth/Signup.svelte';
  import Verify from './auth/Verify.svelte';

  // App pages
  import Dashboard from './app/pages/Dashboard.svelte';
  import Documents from './app/pages/Documents.svelte';
  import Templates from './app/pages/Templates.svelte';
  import Signings from './app/pages/Signings.svelte';
  import AppAnalytics from './app/pages/Analytics.svelte';
  import Team from './app/pages/Team.svelte';
  import Settings from './app/pages/Settings.svelte';
  import Billing from './app/pages/Billing.svelte';
  import Audit from './app/pages/Audit.svelte';
  import Integrations from './app/pages/Integrations.svelte';
  import Help from './app/pages/Help.svelte';
  import Profile from './app/pages/Profile.svelte';

  let route = $state(window.location.hash || '#/');
  let isLoading = $state(true);

  onMount(() => {
    theme.init();
    auth.init();
    loadUserProfile();
  });

  async function loadUserProfile() {
    const accessToken = auth.accessToken;
    if (accessToken) {
      try {
        const profile = await me(accessToken);
        auth.profile = profile;
      } catch (error) {
        // Token expired or invalid, clear it
        auth.clear();
      }
    }
    isLoading = false;
  }

  // The path is everything before a `?`, so `#/verify?email=a@b.c` routes
  // to `#/verify` and the query is still available to the screen itself.
  let path = $derived(route.split('?')[0]);
  let isAuthenticated = $derived(!!auth.profile);

  // Route guards and redirects
  $effect(() => {
    if (isLoading) return;

    // If authenticated and at root, redirect to dashboard
    if (isAuthenticated && path === '#/') {
      window.location.hash = '#/app/dashboard';
      return;
    }

    // If authenticated and at login/signup, redirect to dashboard
    if (isAuthenticated && (path === '#/login' || path === '#/signup')) {
      window.location.hash = '#/app/dashboard';
      return;
    }

    // If not authenticated and trying to access /app/*, redirect to login
    if (!isAuthenticated && path.startsWith('#/app')) {
      window.location.hash = '#/login';
      return;
    }
  });

  function getPageComponent() {
    if (isLoading) return null;

    // Auth routes
    if (path === '#/login') return Login;
    if (path === '#/signup') return Signup;
    if (path === '#/verify') return Verify;

    // Landing
    if (!path.startsWith('#/app')) return Landing;

    // App routes - extract the sub-path
    const appPath = path.slice('#/app/'.length) || 'dashboard';
    const pageMap: Record<string, any> = {
      dashboard: Dashboard,
      documents: Documents,
      templates: Templates,
      signings: Signings,
      analytics: AppAnalytics,
      team: Team,
      settings: Settings,
      billing: Billing,
      audit: Audit,
      integrations: Integrations,
      help: Help,
      profile: Profile,
    };

    return pageMap[appPath] || Dashboard;
  }

  let PageComponent = $derived(getPageComponent());
</script>

<svelte:window onhashchange={() => (route = window.location.hash)} />

{#if isLoading}
  <div class="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
    <div class="text-slate-600 dark:text-slate-400">Loading...</div>
  </div>
{:else if path.startsWith('#/app') && isAuthenticated}
  <AppLayout>
    {#key path}
      <svelte:component this={PageComponent} />
    {/key}
  </AppLayout>
{:else if PageComponent}
  <svelte:component this={PageComponent} />
{:else}
  <Landing />
{/if}

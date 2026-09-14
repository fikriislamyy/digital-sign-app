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

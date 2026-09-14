<script lang="ts">
  import { onMount } from 'svelte';
  import { theme } from './lib/theme.svelte';
  import Landing from './landing/Landing.svelte';
  import Dashboard from './Dashboard.svelte';

  let route = $state(window.location.hash);

  onMount(() => {
    theme.init();
  });

  function onHashChange() {
    route = window.location.hash;
  }
</script>

<svelte:window onhashchange={onHashChange} />

{#if route.startsWith('#/app')}
  <Dashboard />
{:else}
  <Landing />
{/if}

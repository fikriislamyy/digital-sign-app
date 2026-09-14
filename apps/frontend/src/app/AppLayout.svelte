<script lang="ts">
  import { auth } from '../lib/auth.svelte';
  import Navbar from './Navbar.svelte';
  import Sidebar from './Sidebar.svelte';

  let { children }: { children: any } = $props();
</script>

<div class="flex h-screen bg-slate-50 dark:bg-slate-950">
  <Sidebar />
  <div class="flex flex-col flex-1">
    <Navbar />
    <main class="flex-1 overflow-auto">
      {@render children()}
    </main>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style>

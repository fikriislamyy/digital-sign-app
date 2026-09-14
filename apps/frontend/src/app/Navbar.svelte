<script lang="ts">
  import { auth } from '../lib/auth.svelte';
  import { theme } from '../lib/theme.svelte';
  import UserMenu from './navbar/UserMenu.svelte';
  import Wallet from './navbar/Wallet.svelte';
  import ThemeToggle from './navbar/ThemeToggle.svelte';
</script>

<nav class="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
  <div class="h-16 px-6 flex items-center justify-between">
    <div class="text-xl font-bold text-slate-900 dark:text-white">SignCraft</div>

    <div class="flex items-center gap-4">
      {#if auth.profile}
        <Wallet balance={auth.profile.wallet.balance} currency={auth.profile.wallet.currency} />
      {/if}
      <ThemeToggle />
      {#if auth.profile}
        <UserMenu profile={auth.profile} />
      {/if}
    </div>
  </div>
</nav>

<style>
  nav {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
</style>

<script lang="ts">
  import { auth } from '../../lib/auth.svelte';
  import { logout, refresh } from '../../lib/api';
  import type { UserProfile } from '../../lib/api';

  let { profile }: { profile: UserProfile } = $props();
  let showMenu = $state(false);

  async function handleLogout() {
    const refreshToken = auth.refreshToken;
    if (!refreshToken) return;

    try {
      await logout(refreshToken);
      auth.clear();
      window.location.hash = '#/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
</script>

<div class="relative">
  <button
    onclick={() => (showMenu = !showMenu)}
    class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
  >
    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
      {profile.user.name.charAt(0).toUpperCase()}
    </div>
    <span class="text-sm font-medium text-slate-900 dark:text-white">{profile.user.name}</span>
  </button>

  {#if showMenu}
    <div class="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-2 z-10">
      <div class="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
        <div class="text-sm font-medium text-slate-900 dark:text-white">{profile.user.email}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400">{profile.user.type}</div>
      </div>

      <button
        onclick={handleLogout}
        class="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
      >
        Logout
      </button>
    </div>
  {/if}
</div>

<style>
  button {
    outline: none;
  }
</style>

<script lang="ts">
  import ThemeToggle from './ThemeToggle.svelte';

  let scrolled = $state(false);
  let mobileOpen = $state(false);

  function onScroll() {
    scrolled = window.scrollY > 24;
  }

  const links = [
    { href: '#features', label: 'Features' },
    { href: '#testimonials', label: 'Testimonials' },
    { href: '#pricing', label: 'Pricing' },
  ];
</script>

<svelte:window onscroll={onScroll} />

<header
  class="fixed inset-x-0 top-0 z-50 transition-all duration-300 {scrolled
    ? 'border-b border-slate-200/60 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70'
    : 'border-b border-transparent'}"
>
  <nav class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6" aria-label="Main">
    <a href="#hero" class="flex items-center gap-2.5 rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:outline-none">
      <span class="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-white shadow-lg shadow-emerald-500/25">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M21.707 2.293a1 1 0 0 0-1.414 0l-1.8 1.8 3.207 3.207 1.8-1.8a1 1 0 0 0 0-1.414l-1.793-1.793ZM17.086 5.5 4.5 18.086V21.5h3.414L20.5 8.914 17.086 5.5ZM3 22h18v2H3v-2Z" />
        </svg>
      </span>
      <span class="text-lg font-bold text-slate-900 dark:text-white">SignCraft</span>
    </a>

    <ul class="hidden items-center gap-8 md:flex">
      {#each links as link}
        <li>
          <a href={link.href} class="text-sm font-medium text-slate-600 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400">
            {link.label}
          </a>
        </li>
      {/each}
    </ul>

    <div class="flex items-center gap-3">
      <ThemeToggle />
      <a
        href="#/app"
        class="hidden rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:scale-105 sm:block dark:bg-white dark:text-slate-900"
      >
        Open the app
      </a>
      <button
        type="button"
        class="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 md:hidden dark:border-white/10"
        aria-label="Toggle navigation menu"
        aria-expanded={mobileOpen}
        onclick={() => (mobileOpen = !mobileOpen)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          {#if mobileOpen}<path d="M18 6 6 18M6 6l12 12" />{:else}<path d="M3 6h18M3 12h18M3 18h18" />{/if}
        </svg>
      </button>
    </div>
  </nav>

  {#if mobileOpen}
    <ul class="space-y-1 border-t border-slate-200/60 bg-white/95 px-4 py-3 backdrop-blur-xl md:hidden dark:border-white/10 dark:bg-slate-950/95">
      {#each links as link}
        <li>
          <a href={link.href} onclick={() => (mobileOpen = false)} class="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5">
            {link.label}
          </a>
        </li>
      {/each}
      <li><a href="#/app" class="block rounded-xl px-3 py-2.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">Open the app</a></li>
    </ul>
  {/if}
</header>

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
    ? 'border-b border-gray-1 dark:border-gray-2 bg-bg-base/80 backdrop-blur-sm'
    : 'border-b border-transparent'}"
>
  <nav class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6" aria-label="Main">
    <a href="#hero" class="flex items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none">
      <span class="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-accent to-indigo-500 text-white">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M21.707 2.293a1 1 0 0 0-1.414 0l-1.8 1.8 3.207 3.207 1.8-1.8a1 1 0 0 0 0-1.414l-1.793-1.793ZM17.086 5.5 4.5 18.086V21.5h3.414L20.5 8.914 17.086 5.5ZM3 22h18v2H3v-2Z" />
        </svg>
      </span>
      <span class="text-lg font-bold text-fg">SignCraft</span>
    </a>

    <ul class="hidden items-center gap-8 md:flex">
      {#each links as link}
        <li>
          <a href={link.href} class="text-sm font-medium text-fg-muted transition-colors duration-300 hover:text-accent">
            {link.label}
          </a>
        </li>
      {/each}
    </ul>

    <div class="flex items-center gap-3">
      <ThemeToggle />
      <a
        href="#/app"
        class="hidden px-5 py-2 text-sm font-semibold bg-accent text-white rounded-lg transition-opacity duration-300 hover:opacity-90 sm:block"
      >
        Open the app
      </a>
      <button
        type="button"
        class="grid h-10 w-10 place-items-center rounded-lg border border-gray-1 dark:border-gray-2 md:hidden"
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
    <ul class="space-y-1 border-t border-gray-1 dark:border-gray-2 bg-bg-base/95 px-4 py-3 backdrop-blur-sm md:hidden">
      {#each links as link}
        <li>
          <a href={link.href} onclick={() => (mobileOpen = false)} class="block rounded-lg px-3 py-2.5 text-sm font-medium text-fg-muted hover:text-fg transition-colors duration-300">
            {link.label}
          </a>
        </li>
      {/each}
      <li><a href="#/app" class="block rounded-lg px-3 py-2.5 text-sm font-semibold text-accent">Open the app</a></li>
    </ul>
  {/if}
</header>

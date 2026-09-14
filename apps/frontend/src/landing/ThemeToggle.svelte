<script lang="ts">
  import { theme } from '../lib/theme.svelte';

  let isDark = $derived(theme.current === 'dark');
</script>

<button
  type="button"
  onclick={() => theme.toggle()}
  aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
  aria-pressed={isDark}
  class="relative grid h-10 w-10 place-items-center rounded-lg border border-black/[0.06] bg-black/[0.02] transition-all duration-200 ease-expo hover:scale-110 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none dark:border-white/[0.06] dark:bg-white/[0.02]"
>
  <!-- Sun and moon are stacked; opacity and rotation cross-fade between them. -->
  <svg
    class="absolute h-5 w-5 text-amber-500 transition-all duration-500 {isDark
      ? 'scale-50 rotate-90 opacity-0'
      : 'scale-100 rotate-0 opacity-100'}"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>

  <svg
    class="absolute h-5 w-5 text-fg transition-all duration-500 {isDark
      ? 'scale-100 rotate-0 opacity-100'
      : 'scale-50 -rotate-90 opacity-0'}"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" aria-hidden="true"
  >
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
</button>

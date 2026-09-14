<script lang="ts">
  import DeviceMockup from './DeviceMockup.svelte';
  import { inview } from '../lib/inview';

  let scrollY = $state(0);
  let reduced = $state(false);

  $effect(() => {
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Fade out over the first half-screen, shrink slightly, drift down.
  // Clamped so the values stay sane past the fold.
  let progress = $derived(reduced ? 0 : Math.min(scrollY / (window.innerHeight * 0.5), 1));
  let heroOpacity = $derived(1 - progress);
  let heroScale = $derived(1 - progress * 0.05);
  let heroShift = $derived(progress * 100);
</script>

<svelte:window bind:scrollY />

<section id="hero" class="relative flex min-h-screen items-center pt-32 pb-20">
  <div
    class="mx-auto w-full max-w-7xl px-4 sm:px-6"
    style="opacity: {heroOpacity}; transform: translateY({heroShift}px) scale({heroScale});"
  >
    <div class="mx-auto max-w-3xl text-center">
      <p class="reveal inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 font-mono text-xs tracking-widest text-accent uppercase" use:inview>
        <span class="h-1.5 w-1.5 rounded-full bg-accent"></span>
        Next-Gen Digital Signatures
      </p>

      <h1 class="reveal text-gradient mt-8 text-4xl leading-[1.05] font-semibold tracking-[-0.03em] sm:text-6xl lg:text-8xl" use:inview={{ delay: 80 }}>
        High-Assurance Digital Signature Platform
      </h1>

      <p class="reveal mx-auto mt-8 max-w-2xl text-base leading-relaxed text-fg-muted sm:text-lg lg:text-xl" use:inview={{ delay: 160 }}>
        Engineered with Bun, ElysiaJS, Svelte 5, and Drizzle ORM + PostgreSQL
        for extreme speed and transactional integrity.
      </p>

      <div class="reveal mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row" use:inview={{ delay: 240 }}>
        <a
          href="#/app"
          class="shadow-accent inline-flex w-full items-center justify-center rounded-lg bg-accent px-7 py-3.5 text-sm font-medium text-white transition-all duration-200 ease-expo hover:bg-accent-bright active:scale-[0.98] sm:w-auto"
        >
          Start signing free
        </a>

        <a
          href="#features"
          class="inline-flex w-full items-center justify-center rounded-lg bg-black/[0.04] px-7 py-3.5 text-sm font-medium text-fg shadow-[inset_0_1px_0_0_rgb(255_255_255/0.1)] transition-all duration-200 ease-expo hover:bg-black/[0.07] active:scale-[0.98] sm:w-auto dark:bg-white/[0.05] dark:hover:bg-white/[0.08]"
        >
          See how it works
        </a>
      </div>
    </div>

    <div class="reveal mt-24" use:inview={{ delay: 320 }}>
      <DeviceMockup />
    </div>
  </div>
</section>

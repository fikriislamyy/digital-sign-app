<script lang="ts">
  import DeviceMockup from './DeviceMockup.svelte';
  import { inview } from '../lib/inview';
</script>

<section id="hero" class="relative flex min-h-screen items-center pt-40 pb-32">
  <div class="mx-auto w-full max-w-7xl px-4 sm:px-6">
    <div class="mx-auto max-w-4xl text-center">
      <p class="reveal font-mono text-xs tracking-widest uppercase text-fg-muted mb-6" use:inview>
        Digital Signature Platform
      </p>

      <h1 class="reveal text-gradient text-7xl md:text-8xl lg:text-9xl font-bold leading-none tracking-tight mb-8" use:inview={{ delay: 100 }}>
        High-Assurance Signatures
      </h1>

      <p class="reveal text-lg md:text-xl text-fg-muted leading-relaxed mb-12 max-w-2xl mx-auto" use:inview={{ delay: 200 }}>
        Built on Bun, ElysiaJS, Svelte 5, and PostgreSQL for extreme speed and cryptographic integrity.
      </p>

      <div class="reveal flex flex-col sm:flex-row gap-4 justify-center mb-24" use:inview={{ delay: 300 }}>
        <a
          href="/dashboard"
          class="inline-flex items-center justify-center px-8 py-4 bg-accent text-white font-semibold rounded-lg transition-opacity duration-300 hover:opacity-90 active:opacity-75"
        >
          Start signing free
        </a>
        <a
          href="#features"
          class="inline-flex items-center justify-center px-8 py-4 bg-gray-1 text-fg font-semibold rounded-lg transition-opacity duration-300 hover:opacity-80 dark:bg-gray-2 dark:text-fg"
        >
          See how it works
        </a>
      </div>

      <div class="reveal" use:inview={{ delay: 400 }}>
        <DeviceMockup />
      </div>
    </div>
  </div>
</section>

<script lang="ts">
  import DeviceMockup from './DeviceMockup.svelte';
  import { inview } from '../lib/inview';
</script>

<section id="hero" class="grain relative flex min-h-screen items-center overflow-hidden pt-24 pb-16">
  <!-- Drifting gradient blobs -->
  <div class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
    <div class="absolute -top-32 -left-24 h-[32rem] w-[32rem] animate-blob rounded-full bg-emerald-400/25 blur-3xl dark:bg-emerald-500/20"></div>
    <div class="absolute top-1/4 -right-24 h-[28rem] w-[28rem] animate-blob rounded-full bg-cyan-400/25 blur-3xl [animation-delay:-6s] dark:bg-cyan-500/20"></div>
    <div class="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] animate-blob rounded-full bg-teal-300/25 blur-3xl [animation-delay:-12s] dark:bg-teal-500/15"></div>
  </div>

  <div class="mx-auto w-full max-w-7xl px-4 sm:px-6">
    <div class="mx-auto max-w-3xl text-center">
      <p class="reveal inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300" use:inview>
        <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        Next-Gen Digital Signatures
      </p>

      <h1 class="reveal mt-6 text-4xl leading-[1.1] font-extrabold sm:text-6xl lg:text-7xl" use:inview={{ delay: 80 }}>
        High-Assurance
        <span class="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
          Digital Signature
        </span>
        Platform
      </h1>

      <p class="reveal mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl dark:text-slate-400" use:inview={{ delay: 160 }}>
        Engineered with Bun, ElysiaJS, Svelte 5, and Drizzle ORM + PostgreSQL
        for extreme speed and transactional integrity.
      </p>

      <div class="reveal mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row" use:inview={{ delay: 240 }}>
        <a
          href="#/app"
          class="group relative inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-emerald-500/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/50 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:outline-none sm:w-auto dark:focus-visible:ring-offset-slate-950"
        >
          <span class="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-0 blur-xl transition group-hover:opacity-70"></span>
          <span class="relative">Start signing free</span>
        </a>

        <a
          href="#features"
          class="inline-flex w-full items-center justify-center rounded-2xl border border-slate-300/70 bg-white/60 px-8 py-4 text-base font-semibold text-slate-800 backdrop-blur-md transition hover:scale-105 hover:border-emerald-400/60 sm:w-auto dark:border-white/10 dark:bg-white/5 dark:text-white"
        >
          See how it works
        </a>
      </div>
    </div>

    <div class="reveal mt-20" use:inview={{ delay: 320 }}>
      <DeviceMockup />
    </div>
  </div>
</section>

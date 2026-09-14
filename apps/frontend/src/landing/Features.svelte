<script lang="ts">
  import { inview } from '../lib/inview';

  const features = [
    {
      number: '01',
      title: 'Bun Runtime',
      text: 'All-in-one JavaScript toolkit serving as fast package manager, test runner, and native execution environment.',
      icon: 'M13 2 3 14h7l-1 8 10-12h-7l1-8Z',
    },
    {
      number: '02',
      title: 'ElysiaJS Backend',
      text: 'Type-safe, hyper-performant web framework running directly on Bun with automatic OpenAPI/Swagger documentation.',
      icon: 'M4 7h16M4 12h16M4 17h10',
    },
    {
      number: '03',
      title: 'Svelte 5 Frontend',
      text: 'Next-gen reactivity powered by Runes, providing seamless DOM updates and lightweight interactive UI.',
      icon: 'M12 3v18M5 10l7-7 7 7',
    },
    {
      number: '04',
      title: 'Drizzle ORM & Postgres',
      text: 'Serverless-ready SQL toolkit with full type-safety, automatic migration generation, and ACID-compliant transaction safety.',
      icon: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Zm0 0v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6',
    },
  ];
</script>

<section id="features" class="relative py-24 sm:py-32">
  <div class="mx-auto max-w-7xl px-4 sm:px-6">
    <div class="mx-auto max-w-2xl text-center">
      <h2 class="reveal text-3xl font-extrabold sm:text-5xl" use:inview>
        Built on a
        <span class="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">modern stack</span>
      </h2>
      <p class="reveal mt-5 text-lg leading-relaxed text-slate-600 dark:text-slate-400" use:inview={{ delay: 80 }}>
        Every layer chosen for speed and transactional integrity.
      </p>
    </div>

    <ul class="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {#each features as feature, i}
        <li class="reveal" use:inview={{ delay: 100 + i * 90 }}>
          <article class="group h-full rounded-2xl border border-slate-200/70 bg-white/60 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-emerald-400/50 hover:shadow-2xl hover:shadow-emerald-500/10 dark:border-white/10 dark:bg-white/5">
            <div class="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 text-emerald-600 transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110 dark:text-emerald-400">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d={feature.icon} />
              </svg>
            </div>
            <span class="text-xs font-semibold tracking-widest text-slate-400">{feature.number}</span>
            <h3 class="mt-1.5 text-lg font-bold">{feature.title}</h3>
            <p class="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{feature.text}</p>
          </article>
        </li>
      {/each}
    </ul>
  </div>
</section>

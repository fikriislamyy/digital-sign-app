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

<section id="features" class="relative border-t border-gray-1 dark:border-gray-2 py-32 md:py-40 lg:py-48">
  <div class="mx-auto max-w-7xl px-4 sm:px-6">
    <div class="mx-auto max-w-2xl text-center mb-20">
      <p class="reveal font-mono text-xs tracking-widest uppercase text-fg-muted mb-4" use:inview>Architecture</p>
      <h2 class="reveal text-5xl md:text-6xl lg:text-7xl font-bold text-fg mb-6" use:inview={{ delay: 100 }}>
        Built on a modern stack
      </h2>
      <p class="reveal text-lg text-fg-muted" use:inview={{ delay: 200 }}>
        Every layer chosen for speed and reliability.
      </p>
    </div>

    <ul class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {#each features as feature, i}
        <li class="reveal" use:inview={{ delay: 300 + i * 100 }}>
          <article class="surface flex flex-col h-full p-8 transition-all duration-300">
            <div class="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d={feature.icon} />
              </svg>
            </div>
            <span class="font-mono text-xs tracking-widest text-fg-muted mb-2">{feature.number}</span>
            <h3 class="text-xl font-semibold text-fg mb-4">{feature.title}</h3>
            <p class="text-sm text-fg-muted leading-relaxed flex-1">{feature.text}</p>
          </article>
        </li>
      {/each}
    </ul>
  </div>
</section>

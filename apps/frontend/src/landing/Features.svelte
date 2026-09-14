<script lang="ts">
  import { inview } from '../lib/inview';
  import { spotlight } from '../lib/spotlight';

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

  // Asymmetric bento. Card 0 is the hero tile, twice as tall and twice as wide.
  // Single column on mobile; the spans only apply from md upward.
  const spans = [
    'md:col-span-4 md:row-span-2',
    'md:col-span-2',
    'md:col-span-2',
    'md:col-span-6',
  ];
</script>

<section id="features" class="relative border-t border-black/[0.06] py-16 dark:border-white/[0.06] md:py-24 lg:py-32">
  <div class="mx-auto max-w-7xl px-4 sm:px-6">
    <div class="mx-auto max-w-2xl text-center">
      <p class="reveal font-mono text-xs tracking-widest uppercase text-fg-muted" use:inview>Architecture</p>
      <h2 class="reveal mt-3 text-3xl font-semibold sm:text-4xl lg:text-5xl text-fg" use:inview>
        Built on a modern stack
      </h2>
      <p class="reveal mt-5 text-base leading-relaxed text-fg-muted sm:text-lg" use:inview={{ delay: 80 }}>
        Every layer chosen for speed and transactional integrity.
      </p>
    </div>

    <ul class="mt-20 grid grid-cols-1 gap-4 md:grid-cols-6 lg:auto-rows-[180px]">
      {#each features as feature, i}
        <li class="reveal {spans[i]}" use:inview={{ delay: i * 80 }}>
          <article class="surface spotlight group flex h-full flex-col p-6 lg:p-8" use:spotlight>
            <div class="mb-5 grid h-11 w-11 place-items-center rounded-xl border border-black/10 bg-black/[0.03] text-accent transition-transform duration-200 ease-expo group-hover:-translate-y-1 dark:border-white/10 dark:bg-white/[0.03]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d={feature.icon} />
              </svg>
            </div>
            <span class="font-mono text-xs tracking-widest text-fg-muted">{feature.number}</span>
            <h3 class="mt-2 text-xl font-semibold text-fg">{feature.title}</h3>
            <p class="mt-3 text-sm leading-relaxed text-fg-muted">{feature.text}</p>
          </article>
        </li>
      {/each}
    </ul>
  </div>
</section>

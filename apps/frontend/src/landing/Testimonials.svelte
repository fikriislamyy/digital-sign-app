<script lang="ts">
  import { inview } from '../lib/inview';

  // ⚠️ PLACEHOLDER COPY — NOT REAL CUSTOMERS.
  // Replace with genuine, written-permission quotes before this page goes live.
  const testimonials = [
    { initials: 'AB', name: 'Sample Customer', role: 'Role, Company', quote: 'Placeholder testimonial copy. Replace before launch.' },
    { initials: 'CD', name: 'Sample Customer', role: 'Role, Company', quote: 'Placeholder testimonial copy. Replace before launch.' },
    { initials: 'EF', name: 'Sample Customer', role: 'Role, Company', quote: 'Placeholder testimonial copy. Replace before launch.' },
  ];

  let current = $state(0);

  $effect(() => {
    const interval = setInterval(() => {
      current = (current + 1) % testimonials.length;
    }, 8000);
    return () => clearInterval(interval);
  });
</script>

<section id="testimonials" class="relative border-t border-gray-1 dark:border-gray-2 py-32 md:py-40 lg:py-48">
  <div class="mx-auto max-w-7xl px-4 sm:px-6">
    <div class="mx-auto max-w-2xl text-center mb-20">
      <p class="reveal font-mono text-xs tracking-widest uppercase text-fg-muted mb-4" use:inview>Testimonials</p>
      <h2 class="reveal text-5xl md:text-6xl lg:text-7xl font-bold text-fg" use:inview={{ delay: 100 }}>
        Trusted by teams everywhere
      </h2>
    </div>

    <div class="reveal mx-auto max-w-3xl" use:inview={{ delay: 200 }}>
      <article class="surface p-12 md:p-16">
        <p class="text-xl md:text-2xl text-fg leading-relaxed mb-8 transition-opacity duration-300">{testimonials[current].quote}</p>
        <div class="flex items-center gap-4">
          <div class="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-indigo-500 text-sm font-bold text-white flex-shrink-0">
            {testimonials[current].initials}
          </div>
          <div>
            <p class="font-semibold text-fg">{testimonials[current].name}</p>
            <p class="text-sm text-fg-muted">{testimonials[current].role}</p>
          </div>
        </div>
      </article>

      <div class="mt-8 flex justify-center gap-2" role="group" aria-roledescription="carousel">
        {#each testimonials as _, i}
          <button
            type="button"
            onclick={() => (current = i)}
            aria-label="Show testimonial {i + 1} of {testimonials.length}"
            class="h-2.5 w-2.5 rounded-full transition-all duration-300 {i === current ? 'bg-accent w-8' : 'bg-gray-2 dark:bg-gray-1'}"
          ></button>
        {/each}
      </div>
    </div>
  </div>
</section>

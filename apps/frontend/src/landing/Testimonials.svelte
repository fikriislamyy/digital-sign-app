<script lang="ts">
  import { inview } from '../lib/inview';
  import { spotlight } from '../lib/spotlight';

  // ⚠️ PLACEHOLDER COPY — NOT REAL CUSTOMERS.
  // Replace with genuine, written-permission quotes before this page goes live.
  // Shipping invented testimonials is deceptive advertising.
  const testimonials = [
    { initials: 'AB', name: 'Sample Customer', role: 'Role, Company', quote: 'Placeholder testimonial copy. Replace before launch.' },
    { initials: 'CD', name: 'Sample Customer', role: 'Role, Company', quote: 'Placeholder testimonial copy. Replace before launch.' },
    { initials: 'EF', name: 'Sample Customer', role: 'Role, Company', quote: 'Placeholder testimonial copy. Replace before launch.' },
  ];

  let current = $state(0);

  $effect(() => {
    const interval = setInterval(() => {
      current = (current + 1) % testimonials.length;
    }, 5000);
    return () => clearInterval(interval);
  });
</script>

<section id="testimonials" class="relative border-t border-black/[0.06] py-16 dark:border-white/[0.06] md:py-24 lg:py-32">
  <div class="mx-auto max-w-7xl px-4 sm:px-6">
    <div class="mx-auto max-w-2xl text-center">
      <p class="reveal font-mono text-xs tracking-widest uppercase text-fg-muted" use:inview>Testimonials</p>
      <h2 class="reveal mt-3 text-3xl font-semibold sm:text-4xl lg:text-5xl text-fg" use:inview>
        Trusted by teams everywhere
      </h2>
    </div>

    <div class="reveal mt-20 mx-auto max-w-2xl" use:inview>
      <article class="surface spotlight group p-8" use:spotlight>
        <p class="text-lg leading-relaxed text-fg">{testimonials[current].quote}</p>
        <div class="mt-6 flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent to-indigo-500 text-sm font-bold text-white">
            {testimonials[current].initials}
          </div>
          <div>
            <p class="font-semibold text-fg">{testimonials[current].name}</p>
            <p class="text-sm text-fg-muted">{testimonials[current].role}</p>
          </div>
        </div>
      </article>

      <div class="mt-6 flex justify-center gap-2" role="group" aria-roledescription="carousel">
        {#each testimonials as _, i}
          <button
            type="button"
            onclick={() => (current = i)}
            aria-label="Show testimonial {i + 1} of {testimonials.length}"
            class="h-2 w-2 rounded-full transition-all duration-200 ease-expo {i === current ? 'bg-accent w-8' : 'bg-black/20 dark:bg-white/20'}"
          ></button>
        {/each}
      </div>
    </div>
  </div>
</section>

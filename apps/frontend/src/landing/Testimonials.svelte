<script lang="ts">
  import { inview } from '../lib/inview';

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

<section id="testimonials" class="relative py-24 sm:py-32">
  <div class="mx-auto max-w-7xl px-4 sm:px-6">
    <div class="mx-auto max-w-2xl text-center">
      <h2 class="reveal text-3xl font-extrabold sm:text-5xl" use:inview>
        Trusted by teams
        <span class="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">everywhere</span>
      </h2>
    </div>

    <div class="reveal mt-12 mx-auto max-w-2xl" use:inview>
      <div class="rounded-2xl border border-slate-200/70 bg-white/60 p-8 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
        <p class="text-lg leading-relaxed text-slate-700 dark:text-slate-300">{testimonials[current].quote}</p>
        <div class="mt-6 flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-sm font-bold text-white">
            {testimonials[current].initials}
          </div>
          <div>
            <p class="font-semibold text-slate-900 dark:text-white">{testimonials[current].name}</p>
            <p class="text-sm text-slate-600 dark:text-slate-400">{testimonials[current].role}</p>
          </div>
        </div>
      </div>

      <div class="mt-6 flex justify-center gap-2" role="group" aria-roledescription="carousel">
        {#each testimonials as _, i}
          <button
            type="button"
            onclick={() => (current = i)}
            aria-label="Show testimonial {i + 1} of {testimonials.length}"
            class="h-2 w-2 rounded-full transition-all {i === current ? 'bg-emerald-500 w-8' : 'bg-slate-300 dark:bg-slate-600'}"
          ></button>
        {/each}
      </div>
    </div>
  </div>
</section>

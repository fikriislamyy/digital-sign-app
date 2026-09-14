<script lang="ts">
  import { inview } from '../lib/inview';

  const plans = [
    { name: 'Starter', price: '29', features: ['Up to 10 documents', 'Email support', 'Basic analytics'] },
    { name: 'Professional', price: '99', features: ['Unlimited documents', 'Priority support', 'Advanced analytics', 'Team collaboration'], popular: true },
    { name: 'Enterprise', price: 'Custom', features: ['Everything in Pro', 'Dedicated support', 'Custom integrations', 'On-premises option'] },
  ];
</script>

<section id="pricing" class="relative border-t border-gray-1 dark:border-gray-2 py-32 md:py-40 lg:py-48">
  <div class="mx-auto max-w-7xl px-4 sm:px-6">
    <div class="mx-auto max-w-2xl text-center mb-20">
      <p class="reveal font-mono text-xs tracking-widest uppercase text-fg-muted mb-4" use:inview>Pricing</p>
      <h2 class="reveal text-5xl md:text-6xl lg:text-7xl font-bold text-fg" use:inview={{ delay: 100 }}>
        Simple, transparent pricing
      </h2>
    </div>

    <ul class="reveal grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto" use:inview={{ delay: 200 }}>
      {#each plans as plan, idx}
        <li>
          <article class="surface flex flex-col h-full p-10 transition-all duration-300 {plan.popular ? 'ring-2 ring-accent bg-accent/5' : ''}">
            {#if plan.popular}
              <span class="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent mb-6 w-fit">
                <span class="h-1.5 w-1.5 rounded-full bg-accent"></span>
                Most Popular
              </span>
            {/if}
            <h3 class="text-2xl font-bold text-fg mb-6">{plan.name}</h3>
            <div class="mb-8">
              <span class="text-5xl font-bold text-fg">${plan.price}</span>
              {#if plan.price !== 'Custom'}
                <span class="text-fg-muted">/month</span>
              {/if}
            </div>
            <ul class="mb-8 space-y-4 flex-1">
              {#each plan.features as feature}
                <li class="flex items-start gap-3">
                  <svg class="h-5 w-5 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-sm text-fg-muted">{feature}</span>
                </li>
              {/each}
            </ul>
            <button class="w-full py-3 px-6 font-semibold rounded-lg transition-opacity duration-300 {plan.popular ? 'bg-accent text-white hover:opacity-90' : 'bg-gray-1 text-fg dark:bg-gray-2 dark:text-fg hover:opacity-80'}">
              Get Started
            </button>
          </article>
        </li>
      {/each}
    </ul>
  </div>
</section>

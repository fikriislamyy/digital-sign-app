<script lang="ts">
  import { inview } from '../lib/inview';
  import TiltCard from './TiltCard.svelte';

  const plans = [
    { name: 'Starter', price: '29', features: ['Up to 10 documents', 'Email support', 'Basic analytics'] },
    { name: 'Professional', price: '99', features: ['Unlimited documents', 'Priority support', 'Advanced analytics', 'Team collaboration'], popular: true },
    { name: 'Enterprise', price: 'Custom', features: ['Everything in Pro', 'Dedicated support', 'Custom integrations', 'On-premises option'] },
  ];
</script>

<section id="pricing" class="relative border-t border-black/[0.06] py-16 dark:border-white/[0.06] md:py-24 lg:py-32">
  <div class="mx-auto max-w-7xl px-4 sm:px-6">
    <div class="mx-auto max-w-2xl text-center">
      <p class="reveal font-mono text-xs tracking-widest uppercase text-fg-muted" use:inview>Pricing</p>
      <h2 class="reveal mt-3 text-3xl font-semibold sm:text-4xl lg:text-5xl text-fg" use:inview>
        Simple, transparent pricing
      </h2>
    </div>

    <ul class="reveal mt-20 grid gap-6 md:grid-cols-3" use:inview={{ delay: 100 }}>
      {#each plans as plan, idx}
        <li>
          <TiltCard popular={plan.popular}>
            {#if plan.popular}
              <span class="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                <span class="h-1.5 w-1.5 rounded-full bg-accent"></span>
                Most Popular
              </span>
            {/if}
            <h3 class="mt-4 text-2xl font-bold text-fg">{plan.name}</h3>
            <div class="mt-6">
              <span class="text-5xl font-bold text-fg">${plan.price}</span>
              {#if plan.price !== 'Custom'}
                <span class="text-fg-muted">/mo</span>
              {/if}
            </div>
            <ul class="mt-8 space-y-3">
              {#each plan.features as feature}
                <li class="flex items-start gap-3">
                  <svg class="mt-1 h-5 w-5 flex-shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-fg-muted">{feature}</span>
                </li>
              {/each}
            </ul>
            <button class="shadow-accent mt-8 w-full rounded-lg bg-accent px-6 py-3 font-semibold text-white transition-all duration-200 ease-expo hover:bg-accent-bright active:scale-[0.98]">
              Get Started
            </button>
          </TiltCard>
        </li>
      {/each}
    </ul>
  </div>
</section>

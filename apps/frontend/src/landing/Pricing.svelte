<script lang="ts">
  import { inview } from '../lib/inview';

  const plans = [
    { name: 'Starter', price: '29', features: ['Up to 10 documents', 'Email support', 'Basic analytics'] },
    { name: 'Professional', price: '99', features: ['Unlimited documents', 'Priority support', 'Advanced analytics', 'Team collaboration'], popular: true },
    { name: 'Enterprise', price: 'Custom', features: ['Everything in Pro', 'Dedicated support', 'Custom integrations', 'On-premises option'] },
  ];

  let tilt = $state({ x: 0, y: 0 });

  function onMove(e: MouseEvent, idx: number) {
    if (idx !== 1) return; // only tilt middle card
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    tilt = {
      x: ((e.clientY - r.top) / r.height - 0.5) * -8,
      y: ((e.clientX - r.left) / r.width - 0.5) * 8,
    };
  }

  function onLeave() {
    tilt = { x: 0, y: 0 };
  }
</script>

<section id="pricing" class="relative py-24 sm:py-32">
  <div class="mx-auto max-w-7xl px-4 sm:px-6">
    <div class="mx-auto max-w-2xl text-center">
      <h2 class="reveal text-3xl font-extrabold sm:text-5xl" use:inview>
        Simple, transparent
        <span class="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">pricing</span>
      </h2>
    </div>

    <ul class="reveal mt-12 grid gap-8 md:grid-cols-3" use:inview={{ delay: 100 }}>
      {#each plans as plan, idx}
        <li>
          <article
            onmousemove={(e) => onMove(e, idx)}
            onmouseleave={onLeave}
            style="transform: perspective(1000px) rotateX({tilt.x}deg) rotateY({tilt.y}deg)"
            class="h-full rounded-2xl border transition-all duration-300 {plan.popular ? 'ring-2 ring-emerald-400 border-emerald-400/50 bg-gradient-to-br from-white to-emerald-50 dark:from-slate-900 dark:to-emerald-950/20' : 'border-slate-200/70 bg-white/60 dark:border-white/10 dark:bg-white/5'} p-8 backdrop-blur-xl transform-gpu"
          >
            {#if plan.popular}
              <span class="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Most Popular
              </span>
            {/if}
            <h3 class="mt-4 text-2xl font-bold">{plan.name}</h3>
            <div class="mt-6">
              <span class="text-5xl font-bold">${plan.price}</span>
              {#if plan.price !== 'Custom'}
                <span class="text-slate-600 dark:text-slate-400">/mo</span>
              {/if}
            </div>
            <ul class="mt-8 space-y-3">
              {#each plan.features as feature}
                <li class="flex items-start gap-3">
                  <svg class="mt-1 h-5 w-5 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-slate-700 dark:text-slate-300">{feature}</span>
                </li>
              {/each}
            </ul>
            <button class="mt-8 w-full rounded-xl {plan.popular ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'border border-slate-300 bg-white text-slate-900 hover:border-emerald-400 dark:border-white/10 dark:bg-white/5 dark:text-white'} px-6 py-3 font-semibold transition">
              Get Started
            </button>
          </article>
        </li>
      {/each}
    </ul>
  </div>
</section>

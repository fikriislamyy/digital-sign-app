<script lang="ts">
  import { inview } from '../lib/inview';
  import { spotlight } from '../lib/spotlight';

  // Set to a real ISO date the team has actually committed to, or leave null.
  // A timer that resets on reload is a dark pattern, not a conversion tactic.
  export const LAUNCH_DEADLINE: string | null = null;

  let timeRemaining = $state({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  let isPast = $state(false);

  $effect(() => {
    if (!LAUNCH_DEADLINE) return;

    function updateTimer() {
      const now = new Date().getTime();
      const deadline = new Date(LAUNCH_DEADLINE!).getTime();
      const diff = deadline - now;

      if (diff < 0) {
        isPast = true;
        return;
      }

      timeRemaining = {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  });
</script>

<section class="relative border-t border-black/[0.06] py-16 dark:border-white/[0.06] md:py-24 lg:py-32">
  <div class="mx-auto max-w-7xl px-4 sm:px-6">
    <div class="reveal surface spotlight group p-12 sm:p-16 text-center" use:inview use:spotlight>
      <h2 class="text-3xl font-semibold sm:text-4xl lg:text-5xl text-fg">
        Ready to sign?
      </h2>
      <p class="mt-4 text-base sm:text-lg text-fg-muted">
        Join teams using SignCraft for secure, fast digital signatures.
      </p>

      {#if LAUNCH_DEADLINE && !isPast}
        <div class="mt-8 flex justify-center gap-4">
          <div class="rounded-xl bg-accent/10 px-4 py-3">
            <div class="text-3xl font-bold text-accent">{timeRemaining.days}</div>
            <div class="text-xs font-semibold text-accent/70">Days</div>
          </div>
          <div class="rounded-xl bg-accent/10 px-4 py-3">
            <div class="text-3xl font-bold text-accent">{String(timeRemaining.hours).padStart(2, '0')}</div>
            <div class="text-xs font-semibold text-accent/70">Hours</div>
          </div>
          <div class="rounded-xl bg-accent/10 px-4 py-3">
            <div class="text-3xl font-bold text-accent">{String(timeRemaining.minutes).padStart(2, '0')}</div>
            <div class="text-xs font-semibold text-accent/70">Minutes</div>
          </div>
          <div class="rounded-xl bg-accent/10 px-4 py-3">
            <div class="text-3xl font-bold text-accent">{String(timeRemaining.seconds).padStart(2, '0')}</div>
            <div class="text-xs font-semibold text-accent/70">Seconds</div>
          </div>
        </div>
      {/if}

      <div class="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
        <a href="#/app" class="shadow-accent rounded-lg bg-accent px-7 py-3.5 text-sm font-medium text-white transition-all duration-200 ease-expo hover:bg-accent-bright active:scale-[0.98]">
          Start for Free
        </a>
        <a href="#features" class="rounded-lg bg-black/[0.04] px-7 py-3.5 text-sm font-medium text-fg shadow-[inset_0_1px_0_0_rgb(255_255_255/0.1)] transition-all duration-200 ease-expo hover:bg-black/[0.07] active:scale-[0.98] dark:bg-white/[0.05] dark:hover:bg-white/[0.08]">
          Learn More
        </a>
      </div>
    </div>
  </div>
</section>

<script lang="ts">
  import { inview } from '../lib/inview';

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

<section class="relative py-24 sm:py-32">
  <div class="mx-auto max-w-7xl px-4 sm:px-6">
    <div class="reveal rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white to-slate-50 p-12 backdrop-blur-xl sm:p-16 text-center dark:border-white/10 dark:from-slate-950 dark:to-slate-900/50" use:inview>
      <h2 class="text-3xl font-extrabold sm:text-5xl">
        Ready to sign?
      </h2>
      <p class="mt-4 text-lg text-slate-600 dark:text-slate-400">
        Join teams using SignCraft for secure, fast digital signatures.
      </p>

      {#if LAUNCH_DEADLINE && !isPast}
        <div class="mt-8 flex justify-center gap-4">
          <div class="rounded-xl bg-emerald-500/10 px-4 py-3">
            <div class="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{timeRemaining.days}</div>
            <div class="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Days</div>
          </div>
          <div class="rounded-xl bg-emerald-500/10 px-4 py-3">
            <div class="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{String(timeRemaining.hours).padStart(2, '0')}</div>
            <div class="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Hours</div>
          </div>
          <div class="rounded-xl bg-emerald-500/10 px-4 py-3">
            <div class="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{String(timeRemaining.minutes).padStart(2, '0')}</div>
            <div class="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Minutes</div>
          </div>
          <div class="rounded-xl bg-emerald-500/10 px-4 py-3">
            <div class="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{String(timeRemaining.seconds).padStart(2, '0')}</div>
            <div class="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Seconds</div>
          </div>
        </div>
      {/if}

      <div class="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
        <a href="#/app" class="rounded-xl bg-emerald-600 px-8 py-4 text-base font-semibold text-white transition hover:scale-105 dark:bg-emerald-500">
          Start for Free
        </a>
        <a href="#features" class="rounded-xl border border-slate-300 bg-white px-8 py-4 text-base font-semibold transition hover:border-emerald-400 dark:border-white/10 dark:bg-white/5">
          Learn More
        </a>
      </div>
    </div>
  </div>
</section>

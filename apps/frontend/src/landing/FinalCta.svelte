<script lang="ts">
  import { inview } from '../lib/inview';

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

<section class="relative border-t border-gray-1 dark:border-gray-2 py-32 md:py-40 lg:py-48">
  <div class="mx-auto max-w-7xl px-4 sm:px-6">
    <div class="reveal mx-auto max-w-2xl text-center" use:inview>
      <h2 class="text-6xl md:text-7xl lg:text-8xl font-bold text-fg mb-6">
        Ready to sign?
      </h2>
      <p class="text-lg md:text-xl text-fg-muted mb-12">
        Join teams using SignCraft for secure, fast digital signatures.
      </p>

      {#if LAUNCH_DEADLINE && !isPast}
        <div class="mb-12 flex justify-center gap-4">
          <div class="rounded-lg bg-gray-1 dark:bg-gray-2 px-6 py-4">
            <div class="text-3xl font-bold text-fg">{timeRemaining.days}</div>
            <div class="text-xs font-semibold text-fg-muted mt-1">Days</div>
          </div>
          <div class="rounded-lg bg-gray-1 dark:bg-gray-2 px-6 py-4">
            <div class="text-3xl font-bold text-fg">{String(timeRemaining.hours).padStart(2, '0')}</div>
            <div class="text-xs font-semibold text-fg-muted mt-1">Hours</div>
          </div>
          <div class="rounded-lg bg-gray-1 dark:bg-gray-2 px-6 py-4">
            <div class="text-3xl font-bold text-fg">{String(timeRemaining.minutes).padStart(2, '0')}</div>
            <div class="text-xs font-semibold text-fg-muted mt-1">Minutes</div>
          </div>
          <div class="rounded-lg bg-gray-1 dark:bg-gray-2 px-6 py-4">
            <div class="text-3xl font-bold text-fg">{String(timeRemaining.seconds).padStart(2, '0')}</div>
            <div class="text-xs font-semibold text-fg-muted mt-1">Seconds</div>
          </div>
        </div>
      {/if}

      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="#/app" class="inline-flex items-center justify-center px-8 py-4 bg-accent text-white font-semibold rounded-lg transition-opacity duration-300 hover:opacity-90 active:opacity-75">
          Start for Free
        </a>
        <a href="#features" class="inline-flex items-center justify-center px-8 py-4 bg-gray-1 text-fg font-semibold rounded-lg transition-opacity duration-300 hover:opacity-80 dark:bg-gray-2 dark:text-fg">
          Learn More
        </a>
      </div>
    </div>
  </div>
</section>

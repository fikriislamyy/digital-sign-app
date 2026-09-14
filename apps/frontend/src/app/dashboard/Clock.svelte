<script lang="ts">
  import { onMount } from 'svelte';

  let time = $state(new Date());
  let greeting = $derived(getGreeting(time));

  onMount(() => {
    const interval = setInterval(() => {
      time = new Date();
    }, 1000);

    return () => clearInterval(interval);
  });

  function getGreeting(date: Date) {
    const hour = date.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  function formatTime(date: Date) {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
</script>

<div class="mb-8">
  <h1 class="text-4xl font-bold text-slate-900 dark:text-white mb-2">{greeting}</h1>
  <div class="text-lg text-slate-600 dark:text-slate-400 font-mono">{formatTime(time)}</div>
</div>

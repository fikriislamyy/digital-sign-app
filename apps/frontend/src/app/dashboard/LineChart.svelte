<script lang="ts">
  let { title, series }: { title: string; series: Array<{ bucket: string; count: number }> } = $props();

  const maxValue = Math.max(...series.map((s) => s.count), 1);
  const gridLines = 4;

  function getYLabel(index: number) {
    return Math.round((maxValue / gridLines) * (gridLines - index));
  }

  function getHeight(count: number) {
    return (count / maxValue) * 100;
  }

  function formatLabel(bucket: string) {
    const date = new Date(bucket);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
</script>

<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
  <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">{title}</h3>

  {#if !series.length}
    <div class="h-48 flex items-center justify-center text-slate-500">No data available</div>
  {:else}
    <div class="h-64 flex flex-col-reverse justify-between mb-4">
      {#each Array.from({ length: gridLines }) as _, i}
        <div class="text-xs text-slate-500 dark:text-slate-400">{getYLabel(i)}</div>
      {/each}
    </div>

    <div class="flex gap-2 items-end justify-between h-48">
      {#each series as item}
        <div class="flex-1 flex flex-col items-center gap-2">
          <div
            class="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t hover:opacity-80 transition"
            style="height: {getHeight(item.count)}%"
            title="{item.count} documents"
          />
          <div class="text-xs text-slate-600 dark:text-slate-400 text-center break-words w-full">
            {formatLabel(item.bucket)}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<script lang="ts">
  let {
    title,
    data,
  }: {
    title: string;
    data: Array<{ label: string; value: number; color: string }>;
  } = $props();

  const total = data.reduce((sum, item) => sum + item.value, 0);

  function getPercentage(value: number) {
    return total === 0 ? 0 : Math.round((value / total) * 100);
  }

  function calculatePath(slices: Array<{ percentage: number; color: string }>) {
    let currentAngle = -Math.PI / 2;
    const radius = 45;
    const paths = [];

    slices.forEach(({ percentage, color }) => {
      const sliceAngle = (percentage / 100) * 2 * Math.PI;
      const startX = 50 + radius * Math.cos(currentAngle);
      const startY = 50 + radius * Math.sin(currentAngle);

      currentAngle += sliceAngle;

      const endX = 50 + radius * Math.cos(currentAngle);
      const endY = 50 + radius * Math.sin(currentAngle);

      const largeArc = percentage > 50 ? 1 : 0;
      const path = `M 50 50 L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;

      paths.push({ path, color });
    });

    return paths;
  }

  const slices = data.map((item) => ({ percentage: getPercentage(item.value), color: item.color }));
  const paths = calculatePath(slices);
</script>

<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
  <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">{title}</h3>

  {#if total === 0}
    <div class="h-48 flex items-center justify-center text-slate-500">No data available</div>
  {:else}
    <div class="flex gap-8">
      <svg viewBox="0 0 100 100" class="w-48 h-48">
        {#each paths as { path, color }}
          <path {path} fill={color} class="hover:opacity-80 transition" />
        {/each}
        <circle cx="50" cy="50" r="20" fill="currentColor" class="fill-white dark:fill-slate-800" />
        <text x="50" y="55" text-anchor="middle" class="text-xs font-bold fill-slate-900 dark:fill-white">
          {total}
        </text>
      </svg>

      <div class="flex flex-col justify-center gap-3">
        {#each data as item}
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full" style="background-color: {item.color}" />
            <div class="text-sm text-slate-700 dark:text-slate-300">
              {item.label}
              <span class="text-slate-600 dark:text-slate-400">({getPercentage(item.value)}%)</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

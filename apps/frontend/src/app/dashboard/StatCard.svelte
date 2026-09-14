<script lang="ts">
  let { title, value, icon, trend }: { title: string; value: number; icon: string; trend?: number } =
    $props();

  const trendColor = trend !== undefined ? (trend > 0 ? 'text-green-600' : 'text-red-600') : '';
  const trendLabel = trend !== undefined ? (trend > 0 ? '+' : '') + trend + '%' : '';
</script>

<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition">
  <div class="flex items-start justify-between">
    <div>
      <p class="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
      <p class="text-3xl font-bold text-slate-900 dark:text-white mt-2">{value.toLocaleString()}</p>
      {#if trend !== undefined}
        <p class="text-sm mt-2 {trendColor}">
          {trendLabel} from last period
        </p>
      {/if}
    </div>
    <div class="text-3xl">{icon}</div>
  </div>
</div>

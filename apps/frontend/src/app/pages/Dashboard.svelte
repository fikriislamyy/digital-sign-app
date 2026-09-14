<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '../../lib/auth.svelte';
  import { getRecentDocuments, getAnalytics } from '../../lib/api';
  import Clock from '../dashboard/Clock.svelte';
  import StatCard from '../dashboard/StatCard.svelte';
  import LineChart from '../dashboard/LineChart.svelte';
  import PieChart from '../dashboard/PieChart.svelte';
  import RecentDocuments from '../dashboard/RecentDocuments.svelte';
  import { getTimeRange, rangeLabel, summarize } from '../dashboard/range';
  import type { Range } from '../dashboard/range';
  import type { Document, AnalyticsData } from '../../lib/api';

  let range = $state<Range>('month');
  let documents = $state<Document[]>([]);
  let analytics = $state<AnalyticsData | null>(null);
  let loading = $state(true);
  let error = $state('');

  const ranges: Range[] = ['today', 'week', 'month', 'quarter', 'year', 'all'];

  onMount(() => {
    loadData();
  });

  async function loadData() {
    if (!auth.accessToken) return;

    loading = true;
    error = '';

    try {
      // Load recent documents
      const recentDocs = await getRecentDocuments(auth.accessToken);
      documents = recentDocs;

      // Load analytics
      const timeRange = getTimeRange(range, Intl.DateTimeFormat().resolvedOptions().timeZone);
      const analyticsData = await getAnalytics(auth.accessToken, {
        from: timeRange.from.toISOString(),
        to: timeRange.to.toISOString(),
        tz: timeRange.tz,
        granularity: timeRange.granularity,
      });
      analytics = analyticsData;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load dashboard data';
    } finally {
      loading = false;
    }
  }

  function handleRangeChange(newRange: Range) {
    range = newRange;
    loadData();
  }

  const summary = $derived(analytics ? summarize(analytics.series) : null);
  const statusData = $derived(
    analytics
      ? [
          { label: 'Draft', value: analytics.totals.draft, color: '#fbbf24' },
          { label: 'Sent', value: analytics.totals.sent, color: '#3b82f6' },
          { label: 'Completed', value: analytics.totals.completed, color: '#10b981' },
        ]
      : []
  );
</script>

<div class="p-8 space-y-8">
  <Clock />

  {#if error}
    <div class="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
      {error}
    </div>
  {/if}

  <!-- Time Range Filter -->
  <div class="flex gap-2 flex-wrap">
    {#each ranges as r}
      <button
        onclick={() => handleRangeChange(r)}
        class="px-4 py-2 rounded-lg text-sm font-medium transition {r === range
          ? 'bg-blue-500 text-white'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'}"
      >
        {rangeLabel(r)}
      </button>
    {/each}
  </div>

  <!-- Stats Cards -->
  {#if analytics}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Total Uploaded" value={analytics.totals.uploaded} icon="📤" />
      <StatCard title="Draft Documents" value={analytics.totals.draft} icon="📝" />
      <StatCard title="Sent for Signing" value={analytics.totals.sent} icon="📬" />
      <StatCard title="Completed" value={analytics.totals.completed} icon="✅" />
    </div>
  {/if}

  <!-- Charts -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2">
      {#if analytics}
        <LineChart title={`Documents by ${range}`} series={analytics.series} />
      {/if}
    </div>
    <div>
      {#if analytics}
        <PieChart title="Status Breakdown" data={statusData} />
      {/if}
    </div>
  </div>

  <!-- Recent Documents -->
  <div>
    <RecentDocuments {documents} />
  </div>
</div>

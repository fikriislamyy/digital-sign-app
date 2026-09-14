<script lang="ts">
  import type { Document } from '../../lib/api';

  let { documents }: { documents: Document[] } = $props();

  const statusColors: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  }
</script>

<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
  <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Documents</h3>

  {#if !documents.length}
    <div class="text-center py-8 text-slate-500">No documents yet</div>
  {:else}
    <div class="space-y-3">
      {#each documents as doc}
        <div class="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition">
          <div class="flex-1">
            <div class="font-medium text-slate-900 dark:text-white">{doc.title}</div>
            <div class="text-sm text-slate-600 dark:text-slate-400">{formatDate(doc.createdAt)}</div>
          </div>
          <div class="ml-4">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-medium {statusColors[doc.status]}">
              {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
            </span>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

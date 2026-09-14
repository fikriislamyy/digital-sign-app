<script lang="ts">
  let { title, description }: { title: string; description: string } = $props();
</script>

<div class="p-8">
  <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
    <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">{title}</h1>
    <p class="text-slate-600 dark:text-slate-400">{description}</p>
  </div>
</div>

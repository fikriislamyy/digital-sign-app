<script lang="ts">
  import AuthPanel from './AuthPanel.svelte';
  interface Props { children: import('svelte').Snippet }
  let { children }: Props = $props();
</script>

<div class="flex min-h-screen bg-bg-base">
  <!-- Decorative half. Hidden below lg, and hidden from assistive tech always. -->
  <div class="hidden lg:block lg:w-1/2">
    <AuthPanel />
  </div>

  <div class="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
    <div class="w-full max-w-md">
      {@render children()}
    </div>
  </div>
</div>

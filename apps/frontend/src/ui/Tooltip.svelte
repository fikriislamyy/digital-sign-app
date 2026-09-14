<script lang="ts">
  import { Tooltip as TooltipBuilder } from 'melt/builders';
  import type { Snippet } from 'svelte';

  interface Props { text: string; class?: string; children: Snippet }
  let { text, class: cls = '', children }: Props = $props();

  const tooltip = new TooltipBuilder({
    openDelay: 200,
    floatingConfig: { computePosition: { placement: 'top' } },
  });
</script>

<!-- tabindex makes the tooltip reachable by keyboard, not only by mouse. -->
<span {...tooltip.trigger} tabindex="0" class={cls}>
  {@render children()}
</span>

<div {...tooltip.content} class="surface bg-bg-elevated px-2.5 py-1.5 text-xs text-fg">
  {text}
</div>

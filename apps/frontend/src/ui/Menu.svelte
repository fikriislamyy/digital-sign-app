<script lang="ts">
  import { Popover } from 'melt/builders';
  import type { Snippet } from 'svelte';

  interface Props {
    /** What the button shows (avatar, name, chevron). */
    trigger: Snippet;
    /** Menu body. Call close() after an item is chosen. */
    children: Snippet<[{ close: () => void }]>;
    align?: 'start' | 'end';
    /** Classes for the trigger button. */
    class?: string;
  }
  let { trigger, children, align = 'end', class: triggerClass = '' }: Props = $props();

  const popover = new Popover({
    floatingConfig: {
      computePosition: { placement: align === 'end' ? 'bottom-end' : 'bottom-start' },
    },
  });
</script>

<button {...popover.trigger} type="button" class={triggerClass}>
  {@render trigger()}
</button>

<div {...popover.content} class="surface mt-2 min-w-48 bg-bg-elevated p-1">
  {@render children({ close: () => (popover.open = false) })}
</div>

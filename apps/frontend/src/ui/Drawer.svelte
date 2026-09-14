<script lang="ts">
  import { Dialog } from 'melt/builders';
  import type { Snippet } from 'svelte';

  interface Props {
    /** Contents of the open button (a hamburger icon). */
    trigger: Snippet;
    /** Drawer body. Call close() after a link is chosen. */
    children: Snippet<[{ close: () => void }]>;
    title: string;
    /** Classes for the trigger button, e.g. "lg:hidden". */
    class?: string;
  }
  let { trigger, children, title, class: triggerClass = '' }: Props = $props();

  // The trigger lives inside this component on purpose; see the trap in 8.2.
  const dialog = new Dialog();
</script>

<button {...dialog.trigger} class={triggerClass} aria-label="Open {title}">
  {@render trigger()}
</button>

<div {...dialog.overlay}></div>

<dialog {...dialog.content} class="drawer border-r border-gray-1 bg-bg-base p-4 text-fg dark:border-gray-2" aria-label={title}>
  {@render children({ close: () => (dialog.open = false) })}
</dialog>

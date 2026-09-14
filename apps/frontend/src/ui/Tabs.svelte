<script lang="ts" generics="T extends string">
  import { Tabs as TabsBuilder } from 'melt/builders';
  import type { Snippet } from 'svelte';

  interface Props {
    value: T;
    items: { id: T; label: string }[];
    /** Accessible name for the tab list, e.g. "Account type". */
    label: string;
    /** Extra classes for the list, e.g. "grid-cols-2" or "overflow-x-auto". */
    listClass?: string;
    /** Custom trigger rendering (used for the testimonial dots). */
    trigger?: Snippet<[{ id: T; label: string }, boolean]>;
    /** The panel. Rendered once, for the active tab. */
    children?: Snippet<[T]>;
  }
  let { value = $bindable(), items, label, listClass = '', trigger, children }: Props = $props();

  const tabs = new TabsBuilder<T>({
    value: () => value,
    onValueChange: (v) => (value = v),
  });
</script>

<div {...tabs.triggerList} aria-label={label} class="flex gap-1 rounded-lg bg-gray-1 p-1 dark:bg-gray-2 {listClass}">
  {#each items as item (item.id)}
    <button
      {...tabs.getTrigger(item.id)}
      type="button"
      class="shrink-0 rounded-md px-4 py-2 text-sm font-medium text-fg-muted transition-colors duration-300 hover:text-fg data-active:bg-bg-elevated data-active:text-fg data-active:shadow-card"
    >
      {#if trigger}{@render trigger(item, tabs.value === item.id)}{:else}{item.label}{/if}
    </button>
  {/each}
</div>

{#if children}
  <div {...tabs.getContent(tabs.value)}>
    {@render children(tabs.value)}
  </div>
{/if}

<script lang="ts">
  import { Toggle } from 'melt/builders';
  import type { Snippet } from 'svelte';

  interface Props {
    pressed: boolean;
    /** Called on every click with the new state. Use this when the parent owns the state. */
    onchange?: (pressed: boolean) => void;
    label: string;
    class?: string;
    children: Snippet<[boolean]>;
  }
  let { pressed = $bindable(), onchange, label, class: cls = '', children }: Props = $props();

  const toggle = new Toggle({
    value: () => pressed,
    onValueChange: (v) => {
      pressed = v;
      onchange?.(v);
    },
  });
</script>

<button {...toggle.trigger} type="button" aria-label={label} class={cls}>
  {@render children(pressed)}
</button>

<script lang="ts">
  interface Props {
    popular?: boolean;
    children: import('svelte').Snippet;
  }

  let { popular = false, children }: Props = $props();

  // Own state per card. This is the fix: the previous version shared one
  // `tilt` across the whole section, so hovering one card tilted all three.
  let tilt = $state({ x: 0, y: 0 });
  let enabled = $state(true);

  $effect(() => {
    enabled = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  function onMove(event: MouseEvent) {
    if (!enabled) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    tilt = {
      x: ((event.clientY - rect.top) / rect.height - 0.5) * -6,
      y: ((event.clientX - rect.left) / rect.width - 0.5) * 6,
    };
  }
</script>

<article
  onmousemove={onMove}
  onmouseleave={() => (tilt = { x: 0, y: 0 })}
  style="transform: perspective(1000px) rotateX({tilt.x}deg) rotateY({tilt.y}deg);"
  class="surface flex h-full flex-col p-8 transition-transform duration-200 ease-expo {popular
    ? 'border-accent/30 dark:border-accent/30'
    : ''}"
>
  {@render children()}
</article>

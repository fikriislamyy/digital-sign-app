/**
 * Svelte action. Writes the cursor position into CSS custom properties so a
 * radial gradient can follow it. Pair with the `.spotlight` class in app.css.
 *
 * Usage:  <article class="surface spotlight" use:spotlight>
 *
 * Position is written on an animation frame rather than on every mousemove
 * event, so a fast cursor cannot outrun the browser's paint budget.
 */
export function spotlight(node: HTMLElement) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  let frame = 0;

  function onMove(event: MouseEvent) {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      const rect = node.getBoundingClientRect();
      node.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      node.style.setProperty('--my', `${event.clientY - rect.top}px`);
      frame = 0;
    });
  }

  node.addEventListener('mousemove', onMove);

  return {
    destroy() {
      node.removeEventListener('mousemove', onMove);
      if (frame) cancelAnimationFrame(frame);
    },
  };
}

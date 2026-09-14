/**
 * Svelte action. Adds `is-visible` to the element the first time it
 * scrolls into view, which triggers the `.reveal` transition in app.css.
 *
 * Usage:  <div class="reveal" use:inview={{ delay: 120 }}>
 *
 * Stagger a list by passing an increasing delay per item.
 */
export function inview(node: HTMLElement, options: { delay?: number } = {}) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Motion-sensitive visitors get the content immediately, never a fade.
  if (prefersReduced) {
    node.classList.add('is-visible');
    return;
  }

  node.style.transitionDelay = `${options.delay ?? 0}ms`;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          node.classList.add('is-visible');
          observer.unobserve(node); // reveal once, never re-hide
        }
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  );

  observer.observe(node);

  return {
    destroy() {
      observer.disconnect();
    },
  };
}

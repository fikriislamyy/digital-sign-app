/**
 * History-API router. The URL is the only source of truth: `path` and
 * `search` mirror `window.location` and change on navigate() or Back/Forward.
 */
class Router {
  path = $state(window.location.pathname);
  search = $state(window.location.search);

  /** Query string as URLSearchParams. `router.query.get('email')` */
  get query() {
    return new URLSearchParams(this.search);
  }

  /** Go to an app URL such as '/dashboard' or '/verify?email=a%40b.c'. */
  navigate(to: string, { replace = false } = {}) {
    if (to === this.path + this.search) return;
    history[replace ? 'replaceState' : 'pushState'](null, '', to);
    this.sync();
  }

  /** Call once, from App.svelte's onMount. */
  init() {
    window.addEventListener('popstate', () => this.sync());

    document.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element).closest('a');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      if (anchor.origin !== window.location.origin) return;

      // '#features' style links scroll within the page; the browser handles them.
      if (anchor.getAttribute('href')?.startsWith('#')) return;

      event.preventDefault();
      this.navigate(anchor.pathname + anchor.search + anchor.hash);
    });
  }

  private sync() {
    this.path = window.location.pathname;
    this.search = window.location.search;
  }
}

export const router = new Router();

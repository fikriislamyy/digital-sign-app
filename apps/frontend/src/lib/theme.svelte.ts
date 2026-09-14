export type Theme = 'light' | 'dark';

class ThemeStore {
  current = $state<Theme>('dark');

  /** Read the saved choice, falling back to the OS preference. */
  init() {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem('signcraft-theme');
    } catch {
      // Private browsing can throw on localStorage access. Not fatal.
    }

    if (saved === 'light' || saved === 'dark') {
      this.apply(saved);
      return;
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.apply(prefersDark ? 'dark' : 'light');
  }

  apply(next: Theme) {
    this.current = next;
    document.documentElement.classList.toggle('dark', next === 'dark');
    try {
      localStorage.setItem('signcraft-theme', next);
    } catch {
      // Ignore. The toggle still works for this page view.
    }
  }

  toggle() {
    this.apply(this.current === 'dark' ? 'light' : 'dark');
  }
}

export const theme = new ThemeStore();

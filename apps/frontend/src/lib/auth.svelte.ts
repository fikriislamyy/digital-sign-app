import type { ApiUser } from './api';

const ACCESS = 'signcraft-access-token';
const REFRESH = 'signcraft-refresh-token';
const USER = 'signcraft-user';

class AuthStore {
  user = $state<ApiUser | null>(null);

  init() {
    try {
      const raw = localStorage.getItem(USER);
      if (raw) this.user = JSON.parse(raw);
    } catch {
      // Private browsing, or a corrupt value. Treat as signed out.
    }
  }

  save(user: ApiUser, accessToken: string, refreshToken: string) {
    this.user = user;
    try {
      localStorage.setItem(ACCESS, accessToken);
      localStorage.setItem(REFRESH, refreshToken);
      localStorage.setItem(USER, JSON.stringify(user));
    } catch {
      // Tokens live in memory for this page view only. Still usable.
    }
  }

  clear() {
    this.user = null;
    try {
      [ACCESS, REFRESH, USER].forEach((k) => localStorage.removeItem(k));
    } catch {}
  }
}

export const auth = new AuthStore();

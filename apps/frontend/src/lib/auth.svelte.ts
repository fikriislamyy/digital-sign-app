import type { UserProfile } from './api';
import { me } from './api';

const ACCESS = 'signcraft-access-token';
const REFRESH = 'signcraft-refresh-token';
const PROFILE = 'signcraft-profile';

class AuthStore {
  profile = $state<UserProfile | null>(null);

  init() {
    try {
      const raw = localStorage.getItem(PROFILE);
      if (raw) this.profile = JSON.parse(raw);
    } catch {
      // Private browsing, or a corrupt value. Treat as signed out.
    }
  }

  get accessToken(): string | null {
    try {
      return localStorage.getItem(ACCESS);
    } catch {
      return null;
    }
  }

  get refreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH);
    } catch {
      return null;
    }
  }

  /** Fetch /api/me with the stored access token. Clears auth on 401. */
  async loadProfile(): Promise<boolean> {
    const token = this.accessToken;
    if (!token) return false;
    try {
      const profile = await me(token);
      this.profile = profile;
      try { localStorage.setItem(PROFILE, JSON.stringify(profile)); } catch {}
      return true;
    } catch {
      this.clear();
      return false;
    }
  }

  save(accessToken: string, refreshToken: string) {
    try {
      localStorage.setItem(ACCESS, accessToken);
      localStorage.setItem(REFRESH, refreshToken);
    } catch {}
  }

  clear() {
    this.profile = null;
    try {
      [ACCESS, REFRESH, PROFILE].forEach((k) => localStorage.removeItem(k));
    } catch {}
  }
}

export const auth = new AuthStore();

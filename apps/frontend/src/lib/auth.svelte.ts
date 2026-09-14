import type { UserProfile } from './api';

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

  save(profile: UserProfile | any, accessToken: string, refreshToken: string) {
    // If it's a full profile with wallet, use it directly
    if (profile.wallet) {
      this.profile = profile;
    } else {
      // If it's just basic user info, store it as a minimal profile
      // Full profile will be loaded via /me endpoint
      this.profile = null;
    }
    try {
      localStorage.setItem(ACCESS, accessToken);
      localStorage.setItem(REFRESH, refreshToken);
      if (this.profile) {
        localStorage.setItem(PROFILE, JSON.stringify(this.profile));
      }
    } catch {
      // Tokens live in memory for this page view only. Still usable.
    }
  }

  clear() {
    this.profile = null;
    try {
      [ACCESS, REFRESH, PROFILE].forEach((k) => localStorage.removeItem(k));
    } catch {}
  }
}

export const auth = new AuthStore();

export interface ApiUser {
  id: number;
  email: string;
}

export interface UserProfile {
  user: {
    id: number;
    name: string;
    email: string;
    type: 'PERSONAL' | 'OWNER' | 'MEMBER' | 'ADMIN';
    organization: {
      id: number;
      name: string;
      slug: string;
    } | null;
  };
  wallet: {
    balance: string;
    currency: string;
  };
}

export interface AuthResult {
  user: ApiUser;
  access_token: string;
  refresh_token: string;
}

export interface Document {
  id: string;
  title: string;
  status: 'draft' | 'sent' | 'completed';
  createdAt: string;
}

export interface AnalyticsData {
  totals: {
    uploaded: number;
    draft: number;
    sent: number;
    completed: number;
  };
  series: Array<{
    bucket: string;
    count: number;
  }>;
}

class ApiError extends Error {}

/**
 * Success bodies nest their payload under `data`; failures return a bare
 * `{ error }`. This unwraps both into a value or a thrown ApiError whose
 * message is the server's own wording, which is already user-facing.
 */
async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(payload?.error ?? 'Something went wrong. Please try again.');
  }

  return payload?.data ?? payload;
}

async function get<T>(path: string, accessToken?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(path, { headers });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(payload?.error ?? 'Something went wrong. Please try again.');
  }

  return payload?.data ?? payload;
}

async function authFetch<T>(path: string, method: 'GET' | 'POST', body?: unknown, accessToken?: string): Promise<T> {
  if (method === 'GET') {
    return get<T>(path, accessToken);
  }
  return post<T>(path, body);
}

export const login = (email: string, password: string) =>
  post<AuthResult>('/api/login', { email, password });

export const register = (input: {
  full_name: string;
  email: string;
  password: string;
  phone_number?: string;
  organization_name?: string;
}) => post<AuthResult>('/api/register', input);

export const verifyEmail = (email: string, otp: string) =>
  post<unknown>('/api/verify-email', { email, otp });

export const resendOtp = (email: string) =>
  post<unknown>('/api/resend-otp', { email });

export const me = (accessToken: string) =>
  get<UserProfile>('/api/me', accessToken);

export const logout = (refreshToken: string) =>
  post<unknown>('/api/logout', { refresh_token: refreshToken });

export const refresh = (refreshToken: string) =>
  post<{ access_token: string }>('/api/refresh', { refresh_token: refreshToken });

export const getRecentDocuments = (accessToken: string) =>
  get<Document[]>('/api/dashboard/recent', accessToken);

export const getAnalytics = (accessToken: string, params: {
  from: string;
  to: string;
  tz: string;
  granularity: 'hour' | 'day' | 'month';
}) => {
  const query = new URLSearchParams(params).toString();
  return get<AnalyticsData>(`/api/dashboard/analytics?${query}`, accessToken);
};

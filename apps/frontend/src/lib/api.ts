export interface ApiUser {
  id: number;
  email: string;
}

export interface AuthResult {
  user: ApiUser;
  access_token: string;
  refresh_token: string;
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

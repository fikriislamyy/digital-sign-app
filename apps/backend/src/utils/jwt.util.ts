export const jwtSecret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-only-insecure-secret-change-me'
);

if (!process.env.JWT_SECRET) {
  console.warn('[jwt.util] JWT_SECRET is not set. Using an insecure development default.');
}

import { RedisClient } from 'bun';

export const redis = new RedisClient(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  connectionTimeout: 2000,
  // Without this, a command issued while Redis is down waits forever and the
  // HTTP request that issued it never responds.
  enableOfflineQueue: false,
});

// Not awaited: connect() never settles while Redis is down, and startup must
// not block on it. Commands reject fast until the client reconnects on its own.
redis.connect().catch((error: Error) => {
  console.warn('[redis] Initial connection failed, will keep retrying:', error.message);
});

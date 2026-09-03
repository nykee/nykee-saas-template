import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, oneTap } from 'better-auth/plugins';
import { tanstackStartCookies } from 'better-auth/tanstack-start';
import { databaseSchema } from '@/db/schema';
import {
  getCoordinator,
  requiredBinding,
  requiredEnv,
  runtimeEnv,
} from './cloudflare';
import { getDatabase } from './db';

/**
 * Build the Better Auth instance for the current Worker invocation.
 *
 * Better Auth is intentionally created per request because Cloudflare
 * bindings are request-scoped. D1 stores the canonical auth records, while
 * KV is used as Better Auth's secondary session storage for fast reads.
 */
export function getAuth() {
  const cache = requiredBinding('CACHE');
  const authUrl = requiredEnv('BETTER_AUTH_URL');
  const googleClientId = requiredEnv('GOOGLE_CLIENT_ID');
  const googleClientSecret = requiredEnv('GOOGLE_CLIENT_SECRET');

  return betterAuth({
    database: drizzleAdapter(getDatabase(), {
      provider: 'sqlite',
      schema: databaseSchema,
      transaction: false,
    }),
    baseURL: authUrl,
    basePath: '/api/auth',
    secret: requiredEnv('BETTER_AUTH_SECRET'),
    trustedOrigins: [authUrl],
    socialProviders: {
      google: {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
      },
    },
    secondaryStorage: {
      /** Read a Better Auth session from the configured KV namespace. */
      get: async (key) => cache.get(key),
      /** Store a session with Better Auth's requested TTL. */
      set: async (key, value, ttl) => {
        await cache.put(key, value, { expirationTtl: ttl });
      },
      /** Remove a revoked or expired session from KV. */
      delete: async (key) => {
        await cache.delete(key);
      },
      /**
       * Consume single-use values through the Durable Object coordinator.
       * Cloudflare KV has no compare-and-delete primitive; routing this
       * operation through one DO instance makes the read/delete pair
       * serialized while leaving ordinary session reads on KV.
       */
      getAndDelete: async (key) => {
        const response = await getCoordinator(
          'better-auth-secondary-storage'
        ).fetch(
          new Request(
            `https://coordinator/cache/consume?key=${encodeURIComponent(key)}`
          )
        );
        if (!response.ok) {
          throw new Error('Better Auth secondary storage consume failed.');
        }
        const result = (await response.json()) as { value: unknown };
        return result.value;
      },
      /**
       * Better Auth uses this atomic counter for distributed rate limits.
       * A Durable Object is required because KV increments are not atomic.
       */
      increment: async (key, ttl) => {
        const response = await getCoordinator('better-auth-rate-limit').fetch(
          new Request(
            `https://coordinator/counter?key=${encodeURIComponent(key)}&ttl=${ttl}`,
            { method: 'POST' }
          )
        );
        if (!response.ok) {
          throw new Error('Better Auth rate-limit counter failed.');
        }
        const result = (await response.json()) as { value: number };
        return result.value;
      },
    },
    plugins: [
      /** Adds role and ban fields plus protected administrative endpoints. */
      admin({ defaultRole: 'user', adminRoles: ['admin'] }),
      /** Verifies Google One Tap ID tokens before issuing a Better Auth session. */
      oneTap({ clientId: googleClientId }),
      /** Must remain the final plugin so TanStack Start receives Set-Cookie. */
      tanstackStartCookies(),
    ],
    advanced: {
      database: {
        generateId: 'uuid',
      },
    },
  });
}

/**
 * Keep a direct export available for server modules that already have a
 * request context. The function above remains the source of truth so tests
 * and future Worker environments can construct auth with their own bindings.
 */
export const authEnvironment = runtimeEnv;

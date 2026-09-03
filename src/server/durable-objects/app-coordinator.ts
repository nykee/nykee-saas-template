import type { AppEnv } from '@/lib/server/cloudflare';

/**
 * A minimal Durable Object for serialized coordination.
 *
 * It deliberately has a narrow HTTP protocol: GET reads a JSON snapshot and
 * PUT replaces it. Product-specific locks or realtime collaboration state can
 * be layered on this stable boundary without coupling pages to DO internals.
 */
export class AppCoordinator {
  private readonly state: DurableObjectState;
  private readonly env: AppEnv;

  constructor(state: DurableObjectState, env: AppEnv) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/counter' && request.method === 'POST') {
      return this.incrementCounter(url.searchParams);
    }

    if (url.pathname === '/cache/consume' && request.method === 'GET') {
      return this.consumeCacheValue(url.searchParams);
    }

    if (url.pathname !== '/state') {
      return new Response('Not found', { status: 404 });
    }

    if (request.method === 'GET') {
      const value = await this.state.storage.get<unknown>('snapshot');
      return Response.json({ value: value ?? null });
    }

    if (request.method === 'PUT') {
      const value: unknown = await request.json();
      await this.state.storage.put('snapshot', value);
      return Response.json({ saved: true });
    }

    return new Response('Method not allowed', {
      status: 405,
      headers: { allow: 'GET, PUT, POST' },
    });
  }

  /**
   * Increment one fixed-window rate-limit counter atomically.
   *
   * `blockConcurrencyWhile` gives every request for this named Durable
   * Object a serialized critical section. The expiry is stored with the
   * value because Durable Object storage does not provide a KV-style TTL.
   */
  private async incrementCounter(searchParams: URLSearchParams) {
    const key = searchParams.get('key');
    const ttl = Number(searchParams.get('ttl'));
    if (!key || !Number.isSafeInteger(ttl) || ttl <= 0) {
      return new Response('Invalid counter parameters', { status: 400 });
    }

    const value = await this.state.blockConcurrencyWhile(async () => {
      const storageKey = `counter:${key}`;
      const now = Date.now();
      const current = await this.state.storage.get<{
        value: number;
        expiresAt: number;
      }>(storageKey);
      const nextValue =
        current && current.expiresAt > now ? current.value + 1 : 1;
      const expiresAt =
        current && current.expiresAt > now
          ? current.expiresAt
          : now + ttl * 1000;
      await this.state.storage.put(storageKey, { value: nextValue, expiresAt });
      return nextValue;
    });

    return Response.json({ value });
  }

  /**
   * Atomically consume one Better Auth secondary-storage value.
   *
   * The value itself remains in KV, while this Durable Object serializes
   * consumers for the single-use read/delete operation required by Better
   * Auth verification flows.
   */
  private async consumeCacheValue(searchParams: URLSearchParams) {
    const key = searchParams.get('key');
    if (!key) {
      return new Response('Missing cache key', { status: 400 });
    }

    const value = await this.state.blockConcurrencyWhile(async () => {
      const cached = await this.env.CACHE.get(key);
      await this.env.CACHE.delete(key);
      return cached;
    });

    return Response.json({ value });
  }
}

import { createServerFn } from '@tanstack/react-start';
import type { CurrentSession } from './session.server';

/**
 * Client-safe reference to the current-session server function.
 *
 * Runtime imports stay inside the handler so the browser receives only the
 * generated RPC reference and never attempts to resolve Cloudflare modules.
 */
export const getCurrentSession = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CurrentSession | null> => {
    const [{ getRequest }, { getAuth }, { normalizeSession }] =
      await Promise.all([
        import('@tanstack/react-start/server'),
        import('./auth.server'),
        import('./session.server'),
      ]);
    const value = await getAuth().api.getSession({
      headers: getRequest().headers,
    });
    return normalizeSession(value);
  }
);

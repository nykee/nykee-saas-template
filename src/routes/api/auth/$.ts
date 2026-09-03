import { createFileRoute } from '@tanstack/react-router';
import { getAuth } from '@/lib/server/auth.server';

/**
 * Better Auth owns the complete `/api/auth/*` protocol, including OAuth
 * callbacks, session reads, sign-out, and the One Tap callback. TanStack
 * Start's splat route forwards every HTTP method without reimplementing any
 * provider-specific request parsing.
 */
export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      ANY: ({ request }) => getAuth().handler(request),
    },
  },
});

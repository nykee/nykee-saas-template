import { createFileRoute } from '@tanstack/react-router';
import { buildLlmsTxt } from '@/lib/seo';

/**
 * Publish a compact, server-rendered site brief for AI search agents. The
 * content is generated from the public SEO registry, so private application
 * routes cannot leak into this machine-readable surface by accident.
 */
export const Route = createFileRoute('/llms.txt')({
  server: {
    handlers: {
      GET: ({ request }) =>
        new Response(buildLlmsTxt(new URL(request.url).origin), {
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        }),
    },
  },
});

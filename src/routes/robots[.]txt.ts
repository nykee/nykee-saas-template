import { createFileRoute } from '@tanstack/react-router';
import { buildRobotsTxt } from '@/lib/seo';

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: ({ request }) =>
        new Response(buildRobotsTxt(new URL(request.url).origin), {
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        }),
    },
  },
});

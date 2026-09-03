import { createFileRoute } from '@tanstack/react-router';
import { buildSitemapXml } from '@/lib/seo';

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: ({ request }) => {
        return new Response(buildSitemapXml(new URL(request.url).origin), {
          headers: { 'content-type': 'application/xml; charset=utf-8' },
        });
      },
    },
  },
});

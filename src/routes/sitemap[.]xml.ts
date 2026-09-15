import { createFileRoute } from '@tanstack/react-router';
import { appLocales } from '@/lib/locale';
import { buildSitemapXml, blogPostSeoPage } from '@/lib/seo';

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { getPublishedBlogPosts } = await import(
          '@/lib/server/blog.server'
        );
        const posts = (
          await Promise.all(
            appLocales.map((locale) => getPublishedBlogPosts(locale))
          )
        ).flat();
        return new Response(
          buildSitemapXml(
            new URL(request.url).origin,
            undefined,
            posts.map(blogPostSeoPage)
          ),
          {
          headers: { 'content-type': 'application/xml; charset=utf-8' },
          }
        );
      },
    },
  },
});

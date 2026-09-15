import { createFileRoute } from '@tanstack/react-router';
import { appLocales } from '@/lib/locale';
import { buildLlmsTxt, blogPostSeoPage } from '@/lib/seo';

/**
 * Publish a compact, server-rendered site brief for AI search agents. The
 * content is generated from the public SEO registry, so private application
 * routes cannot leak into this machine-readable surface by accident.
 */
export const Route = createFileRoute('/llms.txt')({
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
          buildLlmsTxt(
            new URL(request.url).origin,
            undefined,
            posts.map(blogPostSeoPage)
          ),
          {
          headers: { 'content-type': 'text/plain; charset=utf-8' },
          }
        );
      },
    },
  },
});

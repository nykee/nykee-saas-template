import { createFileRoute, notFound } from '@tanstack/react-router';
import { BlogPostPage } from '@/components/blog/blog-post-page';
import { getRequestOrigin } from '@/lib/request-origin';
import { isBlogSlug } from '@/lib/blog';
import {
  getBlogPost,
} from '@/lib/server/app-functions.functions';
import { blogPostHead } from '@/lib/seo';

export const Route = createFileRoute('/es_/blog/$slug')({
  loader: async ({ params }) => {
    if (!isBlogSlug(params.slug)) {
      throw notFound();
    }
    const post = await getBlogPost({
      data: { locale: 'es', slug: params.slug },
    });
    if (!post) {
      throw notFound();
    }
    return post;
  },
  head: ({ loaderData }) =>
    blogPostHead(loaderData, getRequestOrigin()),
  component: SpanishBlogPostRoute,
});

/** Spanish article route with localized content and metadata. */
function SpanishBlogPostRoute() {
  return <BlogPostPage locale="es" post={Route.useLoaderData()} />;
}

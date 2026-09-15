import { createFileRoute, notFound } from '@tanstack/react-router';
import { BlogPostPage } from '@/components/blog/blog-post-page';
import { getRequestOrigin } from '@/lib/request-origin';
import { isBlogSlug } from '@/lib/blog';
import {
  getBlogPost,
} from '@/lib/server/app-functions.functions';
import { blogPostHead } from '@/lib/seo';

export const Route = createFileRoute('/blog/$slug')({
  loader: async ({ params }) => {
    if (!isBlogSlug(params.slug)) {
      throw notFound();
    }
    const post = await getBlogPost({
      data: { locale: 'en', slug: params.slug },
    });
    if (!post) {
      throw notFound();
    }
    return post;
  },
  head: ({ loaderData }) =>
    blogPostHead(loaderData, getRequestOrigin()),
  component: BlogPostRoute,
});

/** English article route with server-derived Article metadata. */
function BlogPostRoute() {
  return <BlogPostPage locale="en" post={Route.useLoaderData()} />;
}

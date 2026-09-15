import { createFileRoute } from '@tanstack/react-router';
import { BlogListPage } from '@/components/blog/blog-list-page';
import { getRequestOrigin } from '@/lib/request-origin';
import {
  getBlogPosts,
} from '@/lib/server/app-functions.functions';
import { blogIndexHead } from '@/lib/seo';

export const Route = createFileRoute('/blog')({
  loader: () => getBlogPosts({ data: { locale: 'en' } }),
  head: () => blogIndexHead('en', getRequestOrigin()),
  component: BlogPage,
});

/** English blog route with all presentation delegated to the shared page. */
function BlogPage() {
  return <BlogListPage locale="en" posts={Route.useLoaderData()} />;
}

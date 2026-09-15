import { createFileRoute } from '@tanstack/react-router';
import { BlogListPage } from '@/components/blog/blog-list-page';
import { getRequestOrigin } from '@/lib/request-origin';
import {
  getBlogPosts,
} from '@/lib/server/app-functions.functions';
import { blogIndexHead } from '@/lib/seo';

export const Route = createFileRoute('/es_/blog')({
  loader: () => getBlogPosts({ data: { locale: 'es' } }),
  head: () => blogIndexHead('es', getRequestOrigin()),
  component: SpanishBlogPage,
});

/** Spanish blog route sharing the same list component as English. */
function SpanishBlogPage() {
  return <BlogListPage locale="es" posts={Route.useLoaderData()} />;
}

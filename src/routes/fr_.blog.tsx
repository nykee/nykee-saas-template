import { createFileRoute } from '@tanstack/react-router';
import { BlogListPage } from '@/components/blog/blog-list-page';
import { getRequestOrigin } from '@/lib/request-origin';
import {
  getBlogPosts,
} from '@/lib/server/app-functions.functions';
import { blogIndexHead } from '@/lib/seo';

export const Route = createFileRoute('/fr_/blog')({
  loader: () => getBlogPosts({ data: { locale: 'fr' } }),
  head: () => blogIndexHead('fr', getRequestOrigin()),
  component: FrenchBlogPage,
});

/** French blog route sharing the same list component as every locale. */
function FrenchBlogPage() {
  return <BlogListPage locale="fr" posts={Route.useLoaderData()} />;
}

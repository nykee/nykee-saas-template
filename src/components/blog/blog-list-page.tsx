import { Container } from '@/components/layout/container';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { Section } from '@/components/ui/section';
import { blogSeoId } from '@/config/blog';
import type { PublicBlogPostSummary } from '@/lib/blog';
import { type AppLocale, message } from '@/lib/locale';
import { BlogCard } from './blog-card';

/** Public blog index shared by English, Spanish, and French routes. */
export function BlogListPage({
  locale,
  posts,
}: {
  readonly locale: AppLocale;
  readonly posts: readonly PublicBlogPostSummary[];
}) {
  return (
    <main id="main-content">
      <section className="bg-background py-16 sm:py-24">
        <Container>
          <Breadcrumbs pageId={blogSeoId(locale)} />
          <p className="mt-8 text-sm font-black uppercase tracking-[0.1em] text-muted-foreground">
            {message('blog_eyebrow', locale)}
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black leading-[0.96] tracking-[-0.06em] text-foreground sm:text-7xl">
            {message('blog_title', locale)}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
            {message('blog_description', locale)}
          </p>
        </Container>
      </section>

      <Section className="bg-surface">
        <Container>
          {posts.length === 0 ? (
            <div className="border-2 border-ink bg-background p-8 shadow-brutal">
              <h2 className="text-2xl font-black">
                {message('blog_empty_title', locale)}
              </h2>
              <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
                {message('blog_empty_description', locale)}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} locale={locale} />
              ))}
            </div>
          )}
        </Container>
      </Section>
    </main>
  );
}

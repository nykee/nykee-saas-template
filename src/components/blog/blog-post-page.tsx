import { IconArrowLeft } from '@tabler/icons-react';
import { Container } from '@/components/layout/container';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { ButtonLink } from '@/components/ui/button-link';
import { blogPath, blogSeoId } from '@/config/blog';
import { formatBlogDate, type PublicBlogPost } from '@/lib/blog';
import { type AppLocale, message } from '@/lib/locale';
import { BlogContent } from './blog-content';

/** Shared article layout for every localized blog detail route. */
export function BlogPostPage({
  locale,
  post,
}: {
  readonly locale: AppLocale;
  readonly post: PublicBlogPost;
}) {
  return (
    <main id="main-content">
      <article>
        <section className="bg-background py-16 sm:py-24">
          <Container className="max-w-5xl">
            <Breadcrumbs
              pageId={blogSeoId(locale)}
              currentLabel={post.title}
            />
            <p className="mt-8 text-sm font-black uppercase tracking-[0.1em] text-muted-foreground">
              {message('blog_article_label', locale)}
            </p>
            <h1 className="mt-4 max-w-4xl text-5xl font-black leading-[0.96] tracking-[-0.06em] text-foreground sm:text-7xl">
              {post.title}
            </h1>
            <p className="mt-6 max-w-3xl text-xl leading-8 text-muted-foreground">
              {post.excerpt}
            </p>
            <time
              dateTime={post.publishedAt}
              className="mt-8 block text-sm font-black uppercase tracking-[0.1em] text-muted-foreground"
            >
              {message('blog_published_label', locale)} ·{' '}
              {formatBlogDate(post.publishedAt, locale)}
            </time>
          </Container>
        </section>

        <section className="border-t border-ink/15 bg-surface py-16 sm:py-24">
          <Container className="max-w-3xl">
            <BlogContent content={post.content} />
            <ButtonLink
              href={blogPath(locale)}
              variant="secondary"
              className="mt-12"
            >
              <IconArrowLeft aria-hidden="true" size={17} />
              {message('blog_back_to_index', locale)}
            </ButtonLink>
          </Container>
        </section>
      </article>
    </main>
  );
}

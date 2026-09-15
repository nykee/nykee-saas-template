import { IconArrowUpRight } from '@tabler/icons-react';
import { blogPostPath } from '@/config/blog';
import {
  formatBlogDate,
  type PublicBlogPostSummary,
} from '@/lib/blog';
import { type AppLocale, message } from '@/lib/locale';

/**
 * Shared article preview used by the index and any future related-content
 * sections. The entire card is one link so keyboard and touch navigation have
 * the same target without nesting interactive elements.
 */
export function BlogCard({
  post,
  locale,
}: {
  readonly post: PublicBlogPostSummary;
  readonly locale: AppLocale;
}) {
  return (
    <article className="group flex h-full flex-col border-2 border-ink bg-surface p-6 shadow-brutal transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5">
      <div className="flex items-center justify-between gap-4 text-xs font-black uppercase tracking-[0.1em] text-muted-foreground">
        <time dateTime={post.publishedAt}>
          {formatBlogDate(post.publishedAt, locale)}
        </time>
        <span aria-hidden="true">01</span>
      </div>
      <h2 className="mt-7 text-2xl font-black leading-tight tracking-[-0.03em]">
        <a
          href={blogPostPath(locale, post.slug)}
          className="no-underline hover:underline hover:underline-offset-4"
        >
          {post.title}
        </a>
      </h2>
      <p className="mt-4 flex-1 text-base leading-7 text-muted-foreground">
        {post.excerpt}
      </p>
      <a
        href={blogPostPath(locale, post.slug)}
        className="mt-7 inline-flex items-center gap-2 self-start font-black text-foreground underline-offset-4 hover:underline"
      >
        {message('blog_read_article', locale)}
        <IconArrowUpRight aria-hidden="true" size={17} />
      </a>
    </article>
  );
}

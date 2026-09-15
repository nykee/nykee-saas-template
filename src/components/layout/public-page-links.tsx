import type { ComponentPropsWithoutRef } from 'react';
import {
  type StaticPageKind,
  staticPageDefinitions,
  staticPageKinds,
  staticPagePath,
} from '@/config/static-pages';
import { blogPath } from '@/config/blog';
import { type AppLocale, message } from '@/lib/locale';
import { cn } from '@/lib/utils';

interface PublicPageLinksProps extends ComponentPropsWithoutRef<'nav'> {
  readonly locale: AppLocale;
  readonly currentPage?: StaticPageKind;
  readonly listClassName?: string;
}

/** Shared public-page navigation used by the footer and static content pages. */
export function PublicPageLinks({
  locale,
  currentPage,
  className,
  listClassName,
  ...props
}: PublicPageLinksProps) {
  return (
    <nav
      aria-label={message('public_pages_nav_label', locale)}
      className={className}
      {...props}
    >
      <ul className={cn('flex flex-wrap gap-x-5 gap-y-2', listClassName)}>
        <li>
          <a
            href={blogPath(locale)}
            className="text-sm font-bold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {message('nav_blog', locale)}
          </a>
        </li>
        {staticPageKinds.map((page) => {
          const current = page === currentPage;
          const definition = staticPageDefinitions[page];

          return (
            <li key={page}>
              <a
                href={staticPagePath(page, locale)}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'text-sm font-bold underline-offset-4 hover:text-foreground hover:underline',
                  current
                    ? 'text-foreground underline'
                    : 'text-muted-foreground'
                )}
              >
                {message(definition.navLabelKey, locale)}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

import { getBreadcrumbsForPage } from '@/lib/seo';

/**
 * Render a semantic breadcrumb trail from the central SEO page registry.
 * Pages only provide their stable registry ID; labels and URLs cannot drift
 * between the visible trail and the BreadcrumbList JSON-LD generated for the
 * same page.
 */
export function Breadcrumbs({
  pageId,
  label = 'Breadcrumb',
  currentLabel,
}: {
  pageId: string;
  label?: string;
  currentLabel?: string;
}) {
  const items = getBreadcrumbsForPage(pageId);
  const trail = currentLabel
    ? [...items, { label: currentLabel, href: '' }]
    : items;
  if (trail.length < 2) {
    return null;
  }

  return (
    <nav aria-label={label} data-seo-breadcrumbs>
      <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {trail.map((item, index) => (
          <li key={item.href} className="flex items-center gap-2">
            {index > 0 ? (
              <span aria-hidden="true" className="text-ink/50">
                /
              </span>
            ) : null}
            {index === trail.length - 1 ? (
              <span aria-current="page" className="font-bold text-foreground">
                {item.label}
              </span>
            ) : (
              <a
                href={item.href}
                className="underline underline-offset-4 hover:text-foreground"
              >
                {item.label}
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

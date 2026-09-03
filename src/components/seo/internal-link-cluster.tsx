import { getInternalLinksForPage } from '@/lib/seo';

/**
 * Render the outgoing part of a configured topic cluster. Pillar↔spoke links
 * are generated automatically, while related and cross-cluster links come
 * only from explicit configuration. An empty result renders nothing, keeping
 * a page clean until its content architecture has real destinations.
 */
export function InternalLinkCluster({
  pageId,
  title = 'Explore this topic',
}: {
  pageId: string;
  title?: string;
}) {
  const links = getInternalLinksForPage(pageId);
  if (links.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby={`${pageId}-internal-links`}
      data-seo-internal-links
      className="mt-12 rounded-[14px] border-2 border-ink bg-surface p-6 shadow-brutal"
    >
      <h2
        id={`${pageId}-internal-links`}
        className="text-2xl font-black tracking-[-0.03em]"
      >
        {title}
      </h2>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {links.map((link) => (
          <li key={`${link.fromId}-${link.toId}`}>
            <a
              href={link.href}
              className="flex items-center justify-between gap-4 rounded-xl border-2 border-ink/20 px-4 py-3 font-bold no-underline hover:border-ink hover:bg-yellow hover:text-ink"
            >
              <span>{link.anchor}</span>
              <span aria-hidden="true">↗</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

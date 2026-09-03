import {
  type SeoInfrastructureConfig,
  type SeoPageDefinition,
  type SeoText,
  seoConfig,
} from '@/config/seo';
import { websiteConfig } from '@/config/website';
import { type AppLocale, localeMeta, message } from '@/lib/locale';

/** The resolved shape used by the reusable internal-link component. */
export interface ResolvedInternalLink {
  readonly fromId: string;
  readonly toId: string;
  readonly href: string;
  readonly anchor: string;
  readonly type: 'pillar' | 'related' | 'cross-cluster';
}

/** A small FAQ input accepted by both visible components and JSON-LD helpers. */
export interface FaqEntry {
  readonly question: string;
  readonly answer: string;
}

function withoutTrailingSlash(value: string) {
  return value.replace(/\/$/, '');
}

/** Resolve either a source message reference or literal localized SEO copy. */
export function resolveSeoText(value: SeoText, locale: AppLocale): string {
  if (typeof value === 'string') {
    return value;
  }
  if ('messageKey' in value) {
    return message(value.messageKey, locale);
  }
  const localizedValue = value[locale];
  if (localizedValue === undefined) {
    throw new Error(`SEO text is missing a "${locale}" translation.`);
  }
  return localizedValue;
}

/** Return the configured canonical origin, falling back to the request origin. */
export function siteOrigin(requestOrigin?: string) {
  return withoutTrailingSlash(
    websiteConfig.url ?? requestOrigin ?? 'http://localhost:3000'
  );
}

/** Convert a site-relative or absolute path into a canonical absolute URL. */
export function absoluteSiteUrl(path: string, requestOrigin?: string) {
  return new URL(path, `${siteOrigin(requestOrigin)}/`).toString();
}

/** Look up one registered page and fail explicitly when a route is unregistered. */
export function getSeoPage(
  pageId: string,
  config: SeoInfrastructureConfig = seoConfig
): SeoPageDefinition {
  const page = config.pages.find((candidate) => candidate.id === pageId);
  if (!page) {
    throw new Error(`SEO page "${pageId}" is not registered.`);
  }
  return page;
}

/**
 * Validate the graph before it is published to search engines or AI crawlers.
 * Invalid references are configuration errors; silently dropping them would
 * create incomplete sitemaps and orphaned content that is hard to diagnose.
 */
export function validateSeoConfig(
  config: SeoInfrastructureConfig = seoConfig
): void {
  const pageIds = new Set<string>();
  const localizedPaths = new Set<string>();
  for (const page of config.pages) {
    if (pageIds.has(page.id)) {
      throw new Error(`SEO page ID "${page.id}" is duplicated.`);
    }
    pageIds.add(page.id);

    if (
      !page.path.startsWith('/') ||
      page.path.includes('?') ||
      page.path.includes('#')
    ) {
      throw new Error(
        `SEO page "${page.id}" must use a site-relative path without a query or hash.`
      );
    }
    const localizedPath = `${page.locale}:${page.path}`;
    if (localizedPaths.has(localizedPath)) {
      throw new Error(
        `SEO path "${page.path}" is duplicated for locale "${page.locale}".`
      );
    }
    localizedPaths.add(localizedPath);

    if (
      page.priority !== undefined &&
      (page.priority < 0 || page.priority > 1)
    ) {
      throw new Error(
        `SEO page "${page.id}" priority must be between 0 and 1.`
      );
    }
    if (
      page.lastModified !== undefined &&
      Number.isNaN(Date.parse(page.lastModified))
    ) {
      throw new Error(
        `SEO page "${page.id}" has an invalid lastModified date.`
      );
    }
    for (const breadcrumbId of page.breadcrumbIds ?? []) {
      const breadcrumb = config.pages.find(
        (candidate) => candidate.id === breadcrumbId
      );
      if (!breadcrumb) {
        throw new Error(
          `SEO page "${page.id}" references missing breadcrumb "${breadcrumbId}".`
        );
      }
      if (breadcrumb.locale !== page.locale) {
        throw new Error(
          `SEO breadcrumb "${breadcrumbId}" must use the same locale as "${page.id}".`
        );
      }
    }
  }

  const alternateLocales = new Map<string, Set<AppLocale>>();
  for (const page of config.pages) {
    if (!page.alternateId) {
      continue;
    }
    const locales =
      alternateLocales.get(page.alternateId) ?? new Set<AppLocale>();
    if (locales.has(page.locale)) {
      throw new Error(
        `SEO alternate group "${page.alternateId}" has more than one "${page.locale}" page.`
      );
    }
    locales.add(page.locale);
    alternateLocales.set(page.alternateId, locales);
  }

  const clusterIds = new Set<string>();
  for (const cluster of config.clusters) {
    if (clusterIds.has(cluster.id)) {
      throw new Error(`SEO cluster ID "${cluster.id}" is duplicated.`);
    }
    clusterIds.add(cluster.id);
    const pillar = getSeoPage(cluster.pillarId, config);
    if (pillar.locale !== cluster.locale || pillar.kind !== 'pillar') {
      throw new Error(
        `SEO cluster "${cluster.id}" must reference a same-locale pillar page.`
      );
    }
    if (!pillar.primaryKeyword) {
      throw new Error(
        `SEO pillar "${pillar.id}" needs a primaryKeyword for its anchors.`
      );
    }
    const spokeIds = new Set<string>();
    for (const spokeId of cluster.spokeIds) {
      if (spokeIds.has(spokeId) || spokeId === cluster.pillarId) {
        throw new Error(
          `SEO cluster "${cluster.id}" contains a duplicate or self-referencing spoke.`
        );
      }
      spokeIds.add(spokeId);
      const spoke = getSeoPage(spokeId, config);
      if (spoke.locale !== cluster.locale || spoke.kind !== 'spoke') {
        throw new Error(
          `SEO cluster "${cluster.id}" must reference same-locale spoke pages.`
        );
      }
      if (!spoke.primaryKeyword) {
        throw new Error(
          `SEO spoke "${spoke.id}" needs a primaryKeyword for its anchors.`
        );
      }
    }
  }

  const explicitLinkKeys = new Set<string>();
  for (const link of config.internalLinks) {
    const from = getSeoPage(link.from, config);
    const to = getSeoPage(link.to, config);
    const key = `${link.from}->${link.to}`;
    if (from.id === to.id || explicitLinkKeys.has(key)) {
      throw new Error(
        `SEO internal link "${key}" is duplicated or self-referencing.`
      );
    }
    if (from.locale !== to.locale) {
      throw new Error(
        `SEO internal link "${key}" must connect pages in the same locale.`
      );
    }
    if (to.indexable === false) {
      throw new Error(
        `SEO internal link "${key}" cannot target a non-indexable page.`
      );
    }
    explicitLinkKeys.add(key);
  }

  const crawlers = new Set(config.geo.searchCrawlers);
  for (const crawler of config.geo.trainingCrawlers) {
    if (crawlers.has(crawler)) {
      throw new Error(
        `GEO crawler "${crawler}" cannot be both allowed and blocked.`
      );
    }
  }
}

/** Resolve the mandatory and explicit outgoing links for every public page. */
export function buildInternalLinkMatrix(
  config: SeoInfrastructureConfig = seoConfig
): readonly ResolvedInternalLink[] {
  validateSeoConfig(config);
  const matrix: ResolvedInternalLink[] = [];
  const linkKeys = new Set<string>();

  const addLink = (
    from: SeoPageDefinition,
    to: SeoPageDefinition,
    anchor: SeoText,
    type: ResolvedInternalLink['type']
  ) => {
    const key = `${from.id}->${to.id}`;
    if (linkKeys.has(key)) {
      throw new Error(`SEO internal link "${key}" is defined more than once.`);
    }
    linkKeys.add(key);
    matrix.push({
      fromId: from.id,
      toId: to.id,
      href: to.path,
      anchor: resolveSeoText(anchor, from.locale),
      type,
    });
  };

  for (const cluster of config.clusters) {
    const pillar = getSeoPage(cluster.pillarId, config);
    for (const spokeId of cluster.spokeIds) {
      const spoke = getSeoPage(spokeId, config);
      addLink(pillar, spoke, spoke.primaryKeyword as SeoText, 'pillar');
      addLink(spoke, pillar, pillar.primaryKeyword as SeoText, 'pillar');
    }
  }

  for (const link of config.internalLinks) {
    addLink(
      getSeoPage(link.from, config),
      getSeoPage(link.to, config),
      link.anchor,
      link.type
    );
  }

  return matrix;
}

/** Return outgoing links for one page, ready for a reusable related-links UI. */
export function getInternalLinksForPage(
  pageId: string,
  config: SeoInfrastructureConfig = seoConfig
): readonly ResolvedInternalLink[] {
  return buildInternalLinkMatrix(config).filter(
    (link) => link.fromId === pageId
  );
}

/** Return breadcrumb items with localized labels and site-relative hrefs. */
export function getBreadcrumbsForPage(
  pageId: string,
  config: SeoInfrastructureConfig = seoConfig
): readonly { label: string; href: string }[] {
  const page = getSeoPage(pageId, config);
  validateSeoConfig(config);
  return [...(page.breadcrumbIds ?? []), page.id].map((id) => {
    const item = getSeoPage(id, config);
    return {
      label: resolveSeoText(item.title, page.locale),
      href: item.path,
    };
  });
}

/** Build the canonical Organization entity used by page JSON-LD and GEO. */
export function buildOrganizationJsonLd(
  origin: string,
  config: SeoInfrastructureConfig = seoConfig
) {
  return {
    '@type': 'Organization',
    '@id': `${origin}/#organization`,
    name: config.organization.name,
    url: origin,
    description: config.organization.description,
    logo: absoluteSiteUrl(config.organization.logoPath, origin),
    ...(config.organization.sameAs.length > 0
      ? { sameAs: [...config.organization.sameAs] }
      : {}),
  };
}

/** Build FAQ JSON-LD for pages that render a matching visible Q&A section. */
export function buildFaqJsonLd(entries: readonly FaqEntry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: entry.answer,
      },
    })),
  };
}

/** Build the common metadata and JSON-LD graph for any registered public page. */
export function pageHead(pageId: string, requestOrigin?: string) {
  const page = getSeoPage(pageId);
  validateSeoConfig();
  const title = resolveSeoText(page.title, page.locale);
  const description = resolveSeoText(page.description, page.locale);
  const imageAlt = resolveSeoText(page.imageAlt ?? page.title, page.locale);
  const pageUrl = absoluteSiteUrl(page.path, requestOrigin);
  const imageUrl = absoluteSiteUrl(page.imagePath ?? '/og.png', requestOrigin);
  const alternates = page.alternateId
    ? seoConfig.pages.filter(
        (candidate) =>
          candidate.alternateId === page.alternateId &&
          candidate.indexable !== false
      )
    : [page];
  const breadcrumbs = getBreadcrumbsForPage(page.id);
  const origin = siteOrigin(requestOrigin);
  const organization = buildOrganizationJsonLd(origin);
  const graph: Record<string, unknown>[] = [
    organization,
    {
      '@type': 'WebSite',
      '@id': `${origin}/#website`,
      name: seoConfig.organization.name,
      url: origin,
      description: seoConfig.organization.description,
      publisher: { '@id': `${origin}/#organization` },
      inLanguage: localeMeta[page.locale].hreflang,
    },
    {
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: title,
      description,
      isPartOf: { '@id': `${origin}/#website` },
      inLanguage: localeMeta[page.locale].hreflang,
      ...(page.primaryKeyword
        ? { about: resolveSeoText(page.primaryKeyword, page.locale) }
        : {}),
    },
  ];

  if (
    page.kind === 'pillar' ||
    page.kind === 'spoke' ||
    page.kind === 'article'
  ) {
    graph.push({
      '@type': 'Article',
      '@id': `${pageUrl}#article`,
      headline: title,
      description,
      mainEntityOfPage: { '@id': `${pageUrl}#webpage` },
      publisher: { '@id': `${origin}/#organization` },
      ...(page.lastModified ? { dateModified: page.lastModified } : {}),
    });
  }

  if (breadcrumbs.length > 1) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.label,
        item: absoluteSiteUrl(item.href, requestOrigin),
      })),
    });
  }

  const meta = [
    { title },
    { name: 'description', content: description },
    {
      property: 'og:type',
      content:
        page.kind === 'pillar' ||
        page.kind === 'spoke' ||
        page.kind === 'article'
          ? 'article'
          : 'website',
    },
    { property: 'og:site_name', content: seoConfig.organization.name },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: pageUrl },
    {
      property: 'og:locale',
      content: localeMeta[page.locale].hreflang.replace('-', '_'),
    },
    { property: 'og:image', content: imageUrl },
    { property: 'og:image:type', content: 'image/png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: imageAlt },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: imageUrl },
    { name: 'twitter:image:alt', content: imageAlt },
    ...(page.secondaryKeywords && page.secondaryKeywords.length > 0
      ? [{ name: 'keywords', content: page.secondaryKeywords.join(', ') }]
      : []),
    ...(page.indexable === false
      ? [{ name: 'robots', content: 'noindex, nofollow' }]
      : []),
  ];

  return {
    meta,
    links: [
      { rel: 'canonical', href: pageUrl },
      ...alternates.map((alternate) => ({
        rel: 'alternate',
        hrefLang: localeMeta[alternate.locale].hreflang,
        href: absoluteSiteUrl(alternate.path, requestOrigin),
      })),
      {
        rel: 'alternate',
        hrefLang: 'x-default',
        href: absoluteSiteUrl(
          alternates.find((candidate) => candidate.locale === 'en')?.path ??
            page.path,
          requestOrigin
        ),
      },
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': graph,
        }),
      },
    ],
  };
}

/** Keep the existing homepage API while routing it through the generic page registry. */
export function homeHead(locale: AppLocale, requestOrigin?: string) {
  const pageId =
    locale === 'zh' ? 'home-zh' : locale === 'es' ? 'home-es' : 'home-en';
  return pageHead(pageId, requestOrigin);
}

function xmlEscape(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

/** Generate a sitemap from the same public page registry used by JSON-LD. */
export function buildSitemapXml(
  requestOrigin?: string,
  config: SeoInfrastructureConfig = seoConfig
) {
  validateSeoConfig(config);
  const origin = siteOrigin(requestOrigin);
  const pages = config.pages.filter((page) => page.indexable !== false);
  const body = pages
    .map((page) => {
      const alternates = page.alternateId
        ? pages.filter(
            (candidate) => candidate.alternateId === page.alternateId
          )
        : [page];
      return [
        '  <url>',
        `    <loc>${xmlEscape(absoluteSiteUrl(page.path, origin))}</loc>`,
        ...(page.lastModified
          ? [`    <lastmod>${xmlEscape(page.lastModified)}</lastmod>`]
          : []),
        ...(page.changeFrequency
          ? [`    <changefreq>${page.changeFrequency}</changefreq>`]
          : []),
        ...(page.priority !== undefined
          ? [`    <priority>${page.priority.toFixed(1)}</priority>`]
          : []),
        ...alternates.map(
          (alternate) =>
            `    <xhtml:link rel="alternate" hreflang="${localeMeta[alternate.locale].hreflang}" href="${xmlEscape(absoluteSiteUrl(alternate.path, origin))}" />`
        ),
        '  </url>',
      ].join('\n');
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>`;
}

/** Generate an explicit robots policy for search AI while controlling training crawlers. */
export function buildRobotsTxt(
  requestOrigin?: string,
  config: SeoInfrastructureConfig = seoConfig
) {
  validateSeoConfig(config);
  const lines = ['User-agent: *', 'Allow: /', ''];
  for (const crawler of config.geo.searchCrawlers) {
    lines.push(`User-agent: ${crawler}`, 'Allow: /', '');
  }
  for (const crawler of config.geo.trainingCrawlers) {
    lines.push(`User-agent: ${crawler}`, 'Disallow: /', '');
  }
  lines.push(`Sitemap: ${absoluteSiteUrl('/sitemap.xml', requestOrigin)}`);
  return `${lines.join('\n')}\n`;
}

function markdownSafe(value: string) {
  return value.replaceAll('[', '\\[').replaceAll(']', '\\]');
}

/** Generate the root llms.txt brief from public pages, clusters, and key facts. */
export function buildLlmsTxt(
  requestOrigin?: string,
  config: SeoInfrastructureConfig = seoConfig
) {
  validateSeoConfig(config);
  const origin = siteOrigin(requestOrigin);
  const pages = config.pages.filter((page) => page.indexable !== false);
  const lines = [
    `# ${config.organization.name}`,
    `> ${config.organization.description}`,
    '',
    '## Public pages',
    ...pages.map(
      (page) =>
        `- [${markdownSafe(resolveSeoText(page.title, page.locale))}](${absoluteSiteUrl(page.path, origin)}): ${resolveSeoText(page.description, page.locale)}`
    ),
  ];

  if (config.clusters.length > 0) {
    lines.push('', '## Topic clusters');
    for (const cluster of config.clusters) {
      lines.push(
        `### ${resolveSeoText(cluster.name, cluster.locale)}`,
        resolveSeoText(cluster.description, cluster.locale)
      );
      const pageIds = [cluster.pillarId, ...cluster.spokeIds];
      for (const pageId of pageIds) {
        const page = getSeoPage(pageId, config);
        lines.push(
          `- [${markdownSafe(resolveSeoText(page.title, page.locale))}](${absoluteSiteUrl(page.path, origin)}): ${resolveSeoText(page.description, page.locale)}`
        );
      }
    }
  }

  lines.push(
    '',
    '## Key facts',
    ...config.geo.keyFacts.map((fact) => `- ${resolveSeoText(fact, 'en')}`),
    '',
    '## Content guidance',
    resolveSeoText(config.geo.contentGuidance, 'en')
  );
  return `${lines.join('\n')}\n`;
}

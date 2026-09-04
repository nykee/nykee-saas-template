import { describe, expect, it } from 'vitest';
import type { SeoInfrastructureConfig } from '@/config/seo';
import {
  buildInternalLinkMatrix,
  buildLlmsTxt,
  buildRobotsTxt,
  buildSitemapXml,
  getInternalLinksForPage,
  resolveSeoText,
  validateSeoConfig,
} from '@/lib/seo';

/** A complete small fixture exercises the same hub-and-spoke API used by sites. */
const fixture: SeoInfrastructureConfig = {
  organization: {
    name: 'Example Product',
    description: 'A product for the fixture site.',
    logoPath: '/logo.svg',
    sameAs: ['https://github.com/example/product'],
  },
  pages: [
    {
      id: 'guide',
      path: '/guides/product',
      locale: 'en',
      title: { en: 'Product guide' },
      description: { en: 'The complete product guide.' },
      kind: 'pillar',
      primaryKeyword: 'product guide',
      indexable: true,
    },
    {
      id: 'setup',
      path: '/guides/product/setup',
      locale: 'en',
      title: { en: 'Product setup' },
      description: { en: 'How to set up the product.' },
      kind: 'spoke',
      primaryKeyword: 'product setup',
      breadcrumbIds: ['guide'],
      indexable: true,
    },
    {
      id: 'pricing',
      path: '/guides/product/pricing',
      locale: 'en',
      title: { en: 'Product pricing' },
      description: { en: 'How product pricing works.' },
      kind: 'spoke',
      primaryKeyword: 'product pricing',
      breadcrumbIds: ['guide'],
      indexable: true,
    },
  ],
  clusters: [
    {
      id: 'product',
      name: { en: 'Product cluster' },
      description: { en: 'The product topic cluster.' },
      locale: 'en',
      pillarId: 'guide',
      spokeIds: ['setup', 'pricing'],
    },
  ],
  internalLinks: [
    {
      from: 'setup',
      to: 'pricing',
      anchor: { en: 'product pricing details' },
      type: 'related',
    },
  ],
  geo: {
    searchCrawlers: ['GPTBot'],
    trainingCrawlers: ['CCBot'],
    keyFacts: [
      { en: 'The product is documented with source-backed guidance.' },
    ],
    contentGuidance: { en: 'Use direct, sourced answers.' },
  },
};

describe('SEO and GEO infrastructure', () => {
  it('keeps the starter registry valid and intentionally cluster-free', () => {
    expect(() => validateSeoConfig()).not.toThrow();
    expect(buildInternalLinkMatrix()).toEqual([]);
  });

  it('generates mandatory pillar links and explicit related links', () => {
    const matrix = buildInternalLinkMatrix(fixture);
    expect(matrix).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromId: 'guide',
          toId: 'setup',
          anchor: 'product setup',
          type: 'pillar',
        }),
        expect.objectContaining({
          fromId: 'setup',
          toId: 'guide',
          anchor: 'product guide',
          type: 'pillar',
        }),
        expect.objectContaining({
          fromId: 'setup',
          toId: 'pricing',
          anchor: 'product pricing details',
          type: 'related',
        }),
      ])
    );
    expect(getInternalLinksForPage('pricing', fixture)).toHaveLength(1);
  });

  it('uses the public page registry for sitemap, robots, and llms.txt', () => {
    const sitemap = buildSitemapXml('https://example.com', fixture);
    expect(sitemap).toContain('https://example.com/guides/product');
    expect(sitemap).toContain('hreflang="en"');

    const robots = buildRobotsTxt('https://example.com', fixture);
    expect(robots).toContain('User-agent: GPTBot');
    expect(robots).toContain('User-agent: CCBot');
    expect(robots).toContain('Disallow: /');

    const llms = buildLlmsTxt('https://example.com', fixture);
    expect(llms).toContain('## Topic clusters');
    expect(llms).toContain(
      '[Product setup](https://example.com/guides/product/setup)'
    );
  });

  it('rejects cross-locale internal links instead of publishing a bad graph', () => {
    const invalid: SeoInfrastructureConfig = {
      ...fixture,
      pages: [
        ...fixture.pages,
        {
          id: 'fr-guide',
          path: '/fr/guides/product',
          locale: 'fr',
          title: { fr: 'Guide produit', en: 'Product guide' },
          description: { fr: 'Guide produit.', en: 'Product guide.' },
          kind: 'article',
        },
      ],
      internalLinks: [
        ...fixture.internalLinks,
        {
          from: 'guide',
          to: 'fr-guide',
          anchor: 'product guide in French',
          type: 'cross-cluster',
        },
      ],
    };
    expect(() => validateSeoConfig(invalid)).toThrow(
      'must connect pages in the same locale'
    );
  });

  it('rejects missing localized SEO copy instead of silently using English', () => {
    expect(() => resolveSeoText({ en: 'English only' }, 'es')).toThrow(
      'SEO text is missing a "es" translation'
    );
  });
});

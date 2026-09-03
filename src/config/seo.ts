import type { AppLocale, MessageKey } from '@/lib/locale';
import { websiteConfig } from './website';

/**
 * A localized SEO value can reuse a source Paraglide message or provide
 * literal copy for a future page that has not been added to the message
 * catalog yet. Message keys keep the existing homepage metadata in sync with
 * the visible page copy; literal values make the infrastructure useful for
 * documentation and content routes as they are added.
 */
export type SeoText =
  | string
  | { readonly messageKey: MessageKey }
  | { readonly en: string; readonly zh?: string; readonly es?: string };

/** The page roles used by the hub-and-spoke content architecture. */
export type SeoPageKind =
  | 'landing'
  | 'pillar'
  | 'spoke'
  | 'article'
  | 'support';

/** Change-frequency hints are optional and never replace real freshness data. */
export type SeoChangeFrequency =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

/** One public, indexable or intentionally non-indexable route in the registry. */
export interface SeoPageDefinition {
  /** Stable identifier used by clusters, breadcrumbs, and internal links. */
  readonly id: string;
  /** Canonical path relative to the current site origin. */
  readonly path: string;
  /** Locale represented by this route. */
  readonly locale: AppLocale;
  readonly title: SeoText;
  readonly description: SeoText;
  readonly kind: SeoPageKind;
  /** Pages with the same value receive reciprocal hreflang links. */
  readonly alternateId?: string;
  /** The primary topic is also used as the default pillar/spoke anchor. */
  readonly primaryKeyword?: SeoText;
  readonly secondaryKeywords?: readonly string[];
  /** Parent page IDs, in breadcrumb order, excluding the current page. */
  readonly breadcrumbIds?: readonly string[];
  readonly indexable?: boolean;
  readonly lastModified?: string;
  readonly changeFrequency?: SeoChangeFrequency;
  readonly priority?: number;
  /** An absolute or site-relative social image override. */
  readonly imagePath?: string;
  /** Accessible alt text for the social image. */
  readonly imageAlt?: SeoText;
}

/** A hub-and-spoke cluster with one pillar and explicitly listed spokes. */
export interface SeoClusterDefinition {
  readonly id: string;
  readonly name: SeoText;
  readonly description: SeoText;
  readonly locale: AppLocale;
  readonly pillarId: string;
  readonly spokeIds: readonly string[];
}

/**
 * Optional supporting links. Mandatory pillar↔spoke links are generated from
 * clusters; spoke↔spoke and cross-cluster links must be deliberate entries so
 * the template never invents topical relationships from string similarity.
 */
export interface SeoInternalLinkDefinition {
  readonly from: string;
  readonly to: string;
  readonly anchor: SeoText;
  readonly type: 'related' | 'cross-cluster';
}

/** Inputs used to render an AI-readable, machine-oriented site brief. */
export interface GeoConfig {
  /** Crawlers explicitly allowed to discover content for AI search surfaces. */
  readonly searchCrawlers: readonly string[];
  /** Training crawlers blocked by the default robots policy. */
  readonly trainingCrawlers: readonly string[];
  readonly keyFacts: readonly SeoText[];
  readonly contentGuidance: SeoText;
}

/** Complete SEO/GEO configuration consumed by routes, helpers, and components. */
export interface SeoInfrastructureConfig {
  readonly organization: {
    readonly name: string;
    readonly description: string;
    readonly logoPath: string;
    readonly sameAs: readonly string[];
  };
  readonly pages: readonly SeoPageDefinition[];
  readonly clusters: readonly SeoClusterDefinition[];
  readonly internalLinks: readonly SeoInternalLinkDefinition[];
  readonly geo: GeoConfig;
}

/**
 * Public SEO registry for the starter itself. Add each future public route
 * here before adding it to a sitemap, llms.txt, or a content cluster. Private
 * application routes are intentionally absent from this registry.
 */
export const seoConfig: SeoInfrastructureConfig = {
  organization: {
    name: websiteConfig.name,
    description: websiteConfig.description,
    logoPath: '/favicon.svg',
    sameAs: [],
  },
  pages: [
    {
      id: 'home-en',
      path: '/',
      locale: 'en',
      title: { messageKey: 'site_title' },
      description: { messageKey: 'site_description' },
      kind: 'landing',
      alternateId: 'home',
      primaryKeyword: 'Cloudflare product starter',
      secondaryKeywords: ['SaaS template', 'AI product starter'],
      imageAlt: { messageKey: 'social_image_alt' },
      indexable: true,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      id: 'home-zh',
      path: '/zh',
      locale: 'zh',
      title: { messageKey: 'site_title' },
      description: { messageKey: 'site_description' },
      kind: 'landing',
      alternateId: 'home',
      primaryKeyword: 'Cloudflare 全栈模板',
      secondaryKeywords: ['SaaS 模板', 'AI 产品模板'],
      imageAlt: { messageKey: 'social_image_alt' },
      indexable: true,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      id: 'home-es',
      path: '/es',
      locale: 'es',
      title: { messageKey: 'site_title' },
      description: { messageKey: 'site_description' },
      kind: 'landing',
      alternateId: 'home',
      primaryKeyword: 'plantilla de producto para Cloudflare',
      secondaryKeywords: ['plantilla SaaS', 'plantilla de producto de IA'],
      imageAlt: { messageKey: 'social_image_alt' },
      indexable: true,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ],
  /**
   * Keep this empty until real pillar and spoke routes exist. The example in
   * README.md shows the smallest valid cluster; placeholder URLs must never be
   * emitted into a production sitemap or internal-link graph.
   */
  clusters: [],
  internalLinks: [],
  geo: {
    searchCrawlers: [
      'GPTBot',
      'OAI-SearchBot',
      'ChatGPT-User',
      'ClaudeBot',
      'PerplexityBot',
    ],
    trainingCrawlers: ['CCBot', 'anthropic-ai', 'Bytespider', 'cohere-ai'],
    keyFacts: [
      { messageKey: 'site_description' },
      'Public content is rendered on the server so search and AI crawlers can read it without client-side JavaScript.',
    ],
    contentGuidance: {
      en: 'Prefer direct definitions, question-based headings, short self-contained answer blocks, explicit sources, and stable canonical URLs.',
      zh: '优先使用直接定义、问题式标题、短小完整的答案段落、明确来源和稳定的规范 URL。',
      es: 'Prioriza definiciones directas, títulos formulados como preguntas, respuestas breves y autónomas, fuentes explícitas y URLs canónicas estables.',
    },
  },
};

import type { AppLocale } from '@/lib/locale';

/**
 * Keep blog URL construction in one place so headers, cards, routes, SEO
 * metadata, and future sitemap integrations cannot disagree about locale
 * prefixes or article paths.
 */
export function blogPath(locale: AppLocale): string {
  return locale === 'en' ? '/blog' : `/${locale}/blog`;
}

export function blogPostPath(locale: AppLocale, slug: string): string {
  return `${blogPath(locale)}/${encodeURIComponent(slug)}`;
}

/**
 * The blog index is a stable SEO hub for each locale. Article pages use a
 * separate dynamic ID derived from their locale and validated slug.
 */
export function blogSeoId(locale: AppLocale): string {
  return `blog-${locale}`;
}

export function blogPostSeoId(locale: AppLocale, slug: string): string {
  return `blog-post-${locale}-${slug}`;
}

import { type AppLocale, appLocales, isAppLocale } from './locale';

export const blogStatuses = ['draft', 'published'] as const;
export type BlogStatus = (typeof blogStatuses)[number];

/** The public list projection returned by the server function. */
export interface PublicBlogPostSummary {
  readonly id: string;
  readonly slug: string;
  readonly locale: AppLocale;
  readonly title: string;
  readonly excerpt: string;
  readonly publishedAt: string;
  readonly updatedAt: string;
}

/** The public article projection includes the safe, text-only body. */
export interface PublicBlogPost extends PublicBlogPostSummary {
  readonly content: string;
}

/** The private projection used by the administrator content table. */
export interface AdminBlogPost {
  readonly id: string;
  readonly slug: string;
  readonly locale: AppLocale;
  readonly title: string;
  readonly excerpt: string;
  readonly status: BlogStatus;
  readonly createdAt: string;
  readonly authorUserId: string | null;
  readonly publishedAt: string | null;
  readonly updatedAt: string;
}

export interface CreateBlogPostInput {
  readonly slug: string;
  readonly locale: AppLocale;
  readonly title: string;
  readonly excerpt: string;
  readonly content: string;
  readonly status: BlogStatus;
}

/**
 * Server-function validators use this parser instead of accepting arbitrary
 * objects. The same exact input contract is shared by every admin client,
 * including future CLI or API clients.
 */
export function validateCreateBlogPostInput(
  value: unknown
): CreateBlogPostInput {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Invalid blog post payload.');
  }

  const input = value as Record<string, unknown>;
  const slug = boundedText(input.slug, 'Slug', 1, 80);
  if (!isBlogSlug(slug)) {
    throw new Error(
      'Slug must use lowercase letters, numbers, and single hyphens.'
    );
  }

  if (!isAppLocale(input.locale)) {
    throw new Error(
      `Locale must be one of: ${appLocales.join(', ')}.`
    );
  }

  if (!isBlogStatus(input.status)) {
    throw new Error('Status must be draft or published.');
  }

  return {
    slug,
    locale: input.locale,
    title: boundedText(input.title, 'Title', 1, 160),
    excerpt: boundedText(input.excerpt, 'Excerpt', 1, 320),
    content: boundedText(input.content, 'Content', 1, 100_000),
    status: input.status,
  };
}

export function isBlogStatus(value: unknown): value is BlogStatus {
  return (
    typeof value === 'string' &&
    (blogStatuses as readonly string[]).includes(value)
  );
}

export function isBlogSlug(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 80 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
  );
}

export function isBlogLocale(value: unknown): value is AppLocale {
  return isAppLocale(value);
}

/** Keep date presentation consistent across cards, articles, and admin rows. */
export function formatBlogDate(value: string, locale: AppLocale): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
    new Date(value)
  );
}

function boundedText(
  value: unknown,
  label: string,
  minimumLength: number,
  maximumLength: number
): string {
  if (typeof value !== 'string') {
    throw new Error(`${label} must be text.`);
  }

  const normalized = value.trim();
  if (normalized.length < minimumLength) {
    throw new Error(`${label} is required.`);
  }
  if (normalized.length > maximumLength) {
    throw new Error(`${label} is too long.`);
  }
  return normalized;
}

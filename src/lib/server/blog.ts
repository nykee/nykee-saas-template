import { and, desc, eq, isNotNull } from 'drizzle-orm';
import { blogPost, user, auditLog } from '@/db/schema';
import {
  type AdminBlogPost,
  type CreateBlogPostInput,
  type PublicBlogPost,
  type PublicBlogPostSummary,
  type BlogStatus,
  isBlogStatus,
} from '@/lib/blog';
import { isAppLocale, type AppLocale } from '@/lib/locale';
import type { AppEnv } from './cloudflare';
import { runtimeEnv } from './cloudflare';
import { getDatabase } from './db';

/**
 * Return only published rows for a locale. The `isNotNull` predicate is
 * intentional: a published article without a publication timestamp is invalid
 * content and must be fixed in D1 instead of receiving an invented date.
 */
export async function getPublishedBlogPosts(
  locale: AppLocale,
  source: AppEnv = runtimeEnv
): Promise<PublicBlogPostSummary[]> {
  const db = getDatabase(source);
  const rows = await db
    .select({
      id: blogPost.id,
      slug: blogPost.slug,
      locale: blogPost.locale,
      title: blogPost.title,
      excerpt: blogPost.excerpt,
      publishedAt: blogPost.publishedAt,
      updatedAt: blogPost.updatedAt,
    })
    .from(blogPost)
    .where(
      and(
        eq(blogPost.locale, locale),
        eq(blogPost.status, 'published'),
        isNotNull(blogPost.publishedAt)
      )
    )
    .orderBy(desc(blogPost.publishedAt), desc(blogPost.createdAt));

  return rows.map(serializePublicSummary);
}

/** Resolve one public article without exposing drafts or private columns. */
export async function getPublishedBlogPost(
  locale: AppLocale,
  slug: string,
  source: AppEnv = runtimeEnv
): Promise<PublicBlogPost | null> {
  const db = getDatabase(source);
  const row = (
    await db
      .select({
        id: blogPost.id,
        slug: blogPost.slug,
        locale: blogPost.locale,
        title: blogPost.title,
        excerpt: blogPost.excerpt,
        content: blogPost.content,
        publishedAt: blogPost.publishedAt,
        updatedAt: blogPost.updatedAt,
      })
      .from(blogPost)
      .where(
        and(
          eq(blogPost.locale, locale),
          eq(blogPost.slug, slug),
          eq(blogPost.status, 'published'),
          isNotNull(blogPost.publishedAt)
        )
      )
      .limit(1)
  )[0];

  return row ? serializePublicPost(row) : null;
}

/**
 * Return a bounded administrative projection. Content bodies are omitted from
 * this list so a larger editorial table remains fast and does not send long
 * drafts to the browser unnecessarily.
 */
export async function getAdminBlogPosts(
  limit = 50,
  source: AppEnv = runtimeEnv
): Promise<AdminBlogPost[]> {
  const db = getDatabase(source);
  const rows = await db
    .select({
      id: blogPost.id,
      slug: blogPost.slug,
      locale: blogPost.locale,
      title: blogPost.title,
      excerpt: blogPost.excerpt,
      status: blogPost.status,
      authorUserId: blogPost.authorUserId,
      publishedAt: blogPost.publishedAt,
      createdAt: blogPost.createdAt,
      updatedAt: blogPost.updatedAt,
    })
    .from(blogPost)
    .orderBy(desc(blogPost.updatedAt), desc(blogPost.createdAt))
    .limit(limit);

  return rows.map((row) => {
    const locale = validLocale(row.locale);
    const status = validStatus(row.status);
    return {
      id: row.id,
      slug: row.slug,
      locale,
      title: row.title,
      excerpt: row.excerpt,
      status,
      authorUserId: row.authorUserId,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  });
}

/**
 * Insert an article and its audit record after the caller has authenticated
 * and validated the request. Publication time is set exactly once when a
 * draft is created as published; drafts intentionally retain a null value.
 */
export async function createStoredBlogPost(
  input: CreateBlogPostInput,
  authorUserId: string,
  source: AppEnv = runtimeEnv
): Promise<{ id: string }> {
  const db = getDatabase(source);
  const now = new Date();
  const id = crypto.randomUUID();
  const publishedAt = input.status === 'published' ? now : null;

  await db.insert(blogPost).values({
    id,
    slug: input.slug,
    locale: input.locale,
    title: input.title,
    excerpt: input.excerpt,
    content: input.content,
    status: input.status,
    authorUserId,
    publishedAt,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(auditLog).values({
    id: crypto.randomUUID(),
    actorUserId: authorUserId,
    action: 'create-blog-post',
    targetType: 'blog_post',
    targetId: id,
    payload: JSON.stringify({
      locale: input.locale,
      slug: input.slug,
      status: input.status,
    }),
    createdAt: now,
  });

  return { id };
}

function serializePublicSummary(row: {
  id: string;
  slug: string;
  locale: string;
  title: string;
  excerpt: string;
  publishedAt: Date | null;
  updatedAt: Date;
}): PublicBlogPostSummary {
  return {
    id: row.id,
    slug: row.slug,
    locale: validLocale(row.locale),
    title: row.title,
    excerpt: row.excerpt,
    publishedAt: requiredDate(row.publishedAt, 'publishedAt').toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function serializePublicPost(row: {
  id: string;
  slug: string;
  locale: string;
  title: string;
  excerpt: string;
  content: string;
  publishedAt: Date | null;
  updatedAt: Date;
}): PublicBlogPost {
  return {
    ...serializePublicSummary(row),
    content: row.content,
  };
}

function validLocale(value: string): AppLocale {
  if (!isAppLocale(value)) {
    throw new Error(`Blog row has unsupported locale "${value}".`);
  }
  return value;
}

function validStatus(value: string): BlogStatus {
  if (!isBlogStatus(value)) {
    throw new Error(`Blog row has unsupported status "${value}".`);
  }
  return value;
}

function requiredDate(value: Date | null, field: string): Date {
  if (!value) {
    throw new Error(`Published blog row is missing "${field}".`);
  }
  return value;
}

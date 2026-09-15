import { createServerFn } from '@tanstack/react-start';
import {
  isAppLocale,
  isBlogSlug,
  validateCreateBlogPostInput,
} from '@/lib/blog';

/**
 * Client-safe Server Function declarations for account and admin pages.
 *
 * Each Worker-only dependency is imported inside its handler. TanStack Start
 * can therefore extract the implementation into the server environment while
 * the client bundle retains a small typed RPC reference.
 */
/** Return the published blog index for one supported locale. */
export const getBlogPosts = createServerFn({ method: 'GET' })
  .validator((data: unknown) => {
    if (typeof data !== 'object' || data === null) {
      throw new Error('A supported blog locale is required.');
    }
    const locale = (data as Record<string, unknown>).locale;
    if (!isAppLocale(locale)) {
      throw new Error('A supported blog locale is required.');
    }
    return { locale };
  })
  .handler(async ({ data }) => {
    const [{ setResponseHeader }, { getPublishedBlogPosts }] =
      await Promise.all([
        import('@tanstack/react-start/server'),
        import('./blog.server'),
      ]);
    setResponseHeader(
      'Cache-Control',
      'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
    );
    return getPublishedBlogPosts(data.locale);
  });

/** Return one published article, keeping all draft rows server-side. */
export const getBlogPost = createServerFn({ method: 'GET' })
  .validator((data: unknown) => {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid blog article lookup.');
    }
    const input = data as Record<string, unknown>;
    const locale = input.locale;
    const slug = input.slug;
    if (!isAppLocale(locale) || !isBlogSlug(slug)) {
      throw new Error('A supported locale and valid blog slug are required.');
    }
    return { locale, slug };
  })
  .handler(async ({ data }) => {
    const [{ setResponseHeader }, { getPublishedBlogPost }] = await Promise.all(
      [
        import('@tanstack/react-start/server'),
        import('./blog.server'),
      ]
    );
    setResponseHeader(
      'Cache-Control',
      'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
    );
    return getPublishedBlogPost(data.locale, data.slug);
  });

export const getDashboardData = createServerFn({ method: 'GET' }).handler(
  async () => {
    const [
      { setResponseHeader },
      { requireCurrentSession },
      { getUserBillingSummary, getUserOrders },
    ] = await Promise.all([
      import('@tanstack/react-start/server'),
      import('./session.server'),
      import('./events.server'),
    ]);
    const session = await requireCurrentSession();
    setResponseHeader('Cache-Control', 'private, no-store');
    setResponseHeader('Vary', 'Cookie');
    const [summary, orders] = await Promise.all([
      getUserBillingSummary(session.user.id),
      getUserOrders(session.user.id),
    ]);
    return { session, summary, orders };
  }
);

/** Create a server-configured, authenticated Pancake checkout session. */
export const createCheckoutSession = createServerFn({ method: 'POST' }).handler(
  async () => {
    const [
      { getRequestUrl },
      { requireCurrentSession },
      { createPancakeCheckout },
    ] = await Promise.all([
      import('@tanstack/react-start/server'),
      import('./session.server'),
      import('./payment.server'),
    ]);
    const session = await requireCurrentSession();
    const url = getRequestUrl();
    return createPancakeCheckout({
      userId: session.user.id,
      email: session.user.email,
      successUrl: new URL('/dashboard?billing=success', url.origin).toString(),
    });
  }
);

/** Create one audited blog article from the administrator workspace. */
export const createBlogPost = createServerFn({ method: 'POST' })
  .validator(validateCreateBlogPostInput)
  .handler(async ({ data }) => {
    const [{ requireAdminSession }, { createStoredBlogPost }] =
      await Promise.all([
        import('./session.server'),
        import('./blog.server'),
      ]);
    const session = await requireAdminSession();
    return createStoredBlogPost(data, session.user.id);
  });

/** Return the private administrator projection used by `/admin`. */
export const getAdminDashboardData = createServerFn({ method: 'GET' }).handler(
  async () => {
    const [
      { setResponseHeader },
      { requireAdminSession },
      { getDatabase },
      { getRecentOrders },
      { getAdminBlogPosts },
      { billingOrder, pancakeWebhookEvent, subscription, user },
    ] = await Promise.all([
      import('@tanstack/react-start/server'),
      import('./session.server'),
      import('./db.server'),
      import('./events.server'),
      import('./blog.server'),
      import('@/db/schema'),
    ]);
    const session = await requireAdminSession();
    setResponseHeader('Cache-Control', 'private, no-store');
    setResponseHeader('Vary', 'Cookie');
    const { and, count, desc, eq } = await import('drizzle-orm');
    const db = getDatabase();
    const [
      users,
      userCount,
      orderCount,
      activeSubscriptionCount,
      pendingWebhookCount,
      recentOrders,
      blogPosts,
    ] = await Promise.all([
      db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          banned: user.banned,
          createdAt: user.createdAt,
        })
        .from(user)
        .orderBy(desc(user.createdAt))
        .limit(50),
      db.select({ value: count() }).from(user),
      db.select({ value: count() }).from(billingOrder),
      db
        .select({ value: count() })
        .from(subscription)
        .where(eq(subscription.status, 'active')),
      db
        .select({ value: count() })
        .from(pancakeWebhookEvent)
        .where(
          and(
            eq(pancakeWebhookEvent.processingStatus, 'received'),
            eq(pancakeWebhookEvent.mode, 'prod')
          )
      ),
      getRecentOrders(10),
      getAdminBlogPosts(50),
    ]);

    return {
      session,
      users: users.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
      metrics: {
        userCount: userCount[0]?.value ?? 0,
        orderCount: orderCount[0]?.value ?? 0,
        activeSubscriptionCount: activeSubscriptionCount[0]?.value ?? 0,
        pendingWebhookCount: pendingWebhookCount[0]?.value ?? 0,
      },
      recentOrders: recentOrders.map((order) => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
      })),
      blogPosts,
    };
  }
);

/** Validate and apply one audited administrator access mutation. */
export const updateUserAccess = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid user access payload.');
    }
    const input = data as Record<string, unknown>;
    if (typeof input.userId !== 'string' || input.userId.trim().length === 0) {
      throw new Error('A target user ID is required.');
    }
    if (input.action !== 'set-role' && input.action !== 'set-banned') {
      throw new Error('Unsupported user access action.');
    }
    if (
      input.action === 'set-role' &&
      input.role !== 'user' &&
      input.role !== 'admin'
    ) {
      throw new Error('Role must be user or admin.');
    }
    if (input.action === 'set-banned' && typeof input.banned !== 'boolean') {
      throw new Error('Banned must be a boolean.');
    }
    return input;
  })
  .handler(async ({ data }) => {
    const [{ requireAdminSession }, { getDatabase }, { auditLog, user }] =
      await Promise.all([
        import('./session.server'),
        import('./db.server'),
        import('@/db/schema'),
      ]);
    const actor = await requireAdminSession();
    const input = data as {
      userId: string;
      action: 'set-role' | 'set-banned';
      role?: 'user' | 'admin';
      banned?: boolean;
    };
    if (actor.user.id === input.userId) {
      throw new Error('An administrator cannot change their own access.');
    }
    const db = getDatabase();
    const current = (
      await db
        .select({ id: user.id, role: user.role, banned: user.banned })
        .from(user)
        .where((await import('drizzle-orm')).eq(user.id, input.userId))
        .limit(1)
    )[0];
    if (!current) {
      throw new Error('Target user was not found.');
    }
    const next =
      input.action === 'set-role'
        ? { role: input.role as 'user' | 'admin', banned: current.banned }
        : { role: current.role, banned: input.banned as boolean };
    if (next.role === current.role && next.banned === current.banned) {
      return { updated: false };
    }
    const now = new Date();
    await db
      .update(user)
      .set({ role: next.role, banned: next.banned, updatedAt: now })
      .where((await import('drizzle-orm')).eq(user.id, input.userId));
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      actorUserId: actor.user.id,
      action: input.action,
      targetType: 'user',
      targetId: input.userId,
      payload: JSON.stringify({
        before: { role: current.role, banned: current.banned },
        after: next,
      }),
      createdAt: now,
    });
    return { updated: true };
  });

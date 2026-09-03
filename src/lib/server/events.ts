import { and, desc, eq } from 'drizzle-orm';
import {
  billingOrder,
  pancakeWebhookEvent,
  subscription,
  user,
} from '@/db/schema';
import type { AppEnv, ApplicationEvent } from './cloudflare';
import { runtimeEnv } from './cloudflare';
import { getDatabase } from './db';

/** Read a string field from a verified Pancake event data object. */
function stringField(
  data: Record<string, unknown>,
  key: string
): string | null {
  const value = data[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/**
 * Consume queued external events and project them into local D1 tables.
 * Throwing after marking an event failed makes Cloudflare retry the Queue
 * message according to the configured consumer policy.
 */
export async function processApplicationQueue(
  batch: MessageBatch<ApplicationEvent>,
  source: AppEnv = runtimeEnv
): Promise<void> {
  for (const message of batch.messages) {
    if (message.body.version !== 1 || message.body.kind !== 'pancake.webhook') {
      throw new Error('Unsupported application event version or kind.');
    }
    await projectPancakeWebhook(message.body, source);
  }
}

/**
 * Apply one verified Pancake event. Each event is idempotent because the
 * webhook ledger uses Pancake's `(eventType, eventId)` pair as a unique key.
 */
async function projectPancakeWebhook(
  queued: ApplicationEvent,
  source: AppEnv
): Promise<void> {
  const db = getDatabase(source);
  const event = queued.event;

  try {
    const data = event.data;
    const email = stringField(data, 'buyerEmail');
    /**
     * Pancake names this webhook field `merchantProvidedBuyerIdentity`.
     * `buyerIdentity` remains a compatibility read for older test payloads,
     * but the provider's documented field is always preferred.
     */
    const buyerIdentity =
      stringField(data, 'merchantProvidedBuyerIdentity') ??
      stringField(data, 'buyerIdentity');
    const orderId = stringField(data, 'orderId');
    const currentUserByIdentity = buyerIdentity
      ? (
          await db
            .select({ id: user.id })
            .from(user)
            .where(eq(user.id, buyerIdentity))
            .limit(1)
        )[0]
      : undefined;
    const currentUser =
      currentUserByIdentity ??
      (email
        ? (
            await db
              .select({ id: user.id })
              .from(user)
              .where(eq(user.email, email.toLowerCase()))
              .limit(1)
          )[0]
        : undefined);

    if (orderId) {
      const now = new Date();
      await db
        .insert(billingOrder)
        .values({
          id: crypto.randomUUID(),
          externalOrderId: orderId,
          externalEventId: event.eventId,
          userId: currentUser?.id ?? null,
          status: stringField(data, 'orderStatus') ?? 'unknown',
          productId: stringField(data, 'productId'),
          productName: stringField(data, 'productName'),
          buyerEmail: email,
          amount: stringField(data, 'total') ?? stringField(data, 'amount'),
          currency: stringField(data, 'currency'),
          mode: event.mode,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: billingOrder.externalOrderId,
          set: {
            externalEventId: event.eventId,
            userId: currentUser?.id ?? null,
            status: stringField(data, 'orderStatus') ?? 'unknown',
            productName: stringField(data, 'productName'),
            buyerEmail: email,
            amount: stringField(data, 'total') ?? stringField(data, 'amount'),
            currency: stringField(data, 'currency'),
            updatedAt: now,
          },
        });
    }

    if (event.eventType.startsWith('subscription.') && orderId) {
      const now = new Date();
      await db
        .insert(subscription)
        .values({
          id: crypto.randomUUID(),
          externalOrderId: orderId,
          userId: currentUser?.id ?? null,
          status: stringField(data, 'orderStatus') ?? 'unknown',
          productName: stringField(data, 'productName'),
          buyerEmail: email,
          billingPeriod: stringField(data, 'billingPeriod'),
          currentPeriodEnd: stringField(data, 'currentPeriodEnd'),
          amount: stringField(data, 'amount'),
          currency: stringField(data, 'currency'),
          mode: event.mode,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: subscription.externalOrderId,
          set: {
            userId: currentUser?.id ?? null,
            status: stringField(data, 'orderStatus') ?? 'unknown',
            productName: stringField(data, 'productName'),
            buyerEmail: email,
            billingPeriod: stringField(data, 'billingPeriod'),
            currentPeriodEnd: stringField(data, 'currentPeriodEnd'),
            amount: stringField(data, 'amount'),
            currency: stringField(data, 'currency'),
            updatedAt: now,
          },
        });
    }

    await db
      .update(pancakeWebhookEvent)
      .set({
        processingStatus: 'processed',
        processedAt: new Date(),
        lastError: null,
      })
      .where(
        and(
          eq(pancakeWebhookEvent.eventType, event.eventType),
          eq(pancakeWebhookEvent.externalEventId, event.eventId)
        )
      );
  } catch (error) {
    await db
      .update(pancakeWebhookEvent)
      .set({
        processingStatus: 'failed',
        lastError: error instanceof Error ? error.message : String(error),
      })
      .where(
        and(
          eq(pancakeWebhookEvent.eventType, event.eventType),
          eq(pancakeWebhookEvent.externalEventId, event.eventId)
        )
      );
    throw error;
  }
}

/**
 * Read compact dashboard aggregates for authenticated users. Keeping this
 * query in the service layer prevents pages from learning the D1 schema.
 */
export async function getUserBillingSummary(
  userId: string,
  source: AppEnv = runtimeEnv
): Promise<{ orderCount: number; activeSubscriptionCount: number }> {
  const db = getDatabase(source);
  const orders = await db
    .select({ id: billingOrder.id })
    .from(billingOrder)
    .where(eq(billingOrder.userId, userId));
  const activeSubscriptions = await db
    .select({ id: subscription.id })
    .from(subscription)
    .where(
      and(eq(subscription.userId, userId), eq(subscription.status, 'active'))
    );
  return {
    orderCount: orders.length,
    activeSubscriptionCount: activeSubscriptions.length,
  };
}

/**
 * Return recent orders for an admin view. The selected columns are explicit so
 * payment payloads, tokens, and raw webhook bodies never reach the browser.
 */
export async function getRecentOrders(limit = 10, source: AppEnv = runtimeEnv) {
  const db = getDatabase(source);
  return db
    .select({
      id: billingOrder.id,
      externalOrderId: billingOrder.externalOrderId,
      status: billingOrder.status,
      productName: billingOrder.productName,
      amount: billingOrder.amount,
      currency: billingOrder.currency,
      buyerEmail: billingOrder.buyerEmail,
      mode: billingOrder.mode,
      createdAt: billingOrder.createdAt,
    })
    .from(billingOrder)
    .orderBy(desc(billingOrder.createdAt))
    .limit(limit);
}

/**
 * Return only the signed-in user's recent orders. Keeping this query next to
 * the administrator projection makes the visibility rule explicit and
 * prevents an application route from accidentally widening the selection.
 */
export async function getUserOrders(
  userId: string,
  limit = 10,
  source: AppEnv = runtimeEnv
) {
  const db = getDatabase(source);
  return db
    .select({
      id: billingOrder.id,
      externalOrderId: billingOrder.externalOrderId,
      status: billingOrder.status,
      productName: billingOrder.productName,
      amount: billingOrder.amount,
      currency: billingOrder.currency,
      mode: billingOrder.mode,
      createdAt: billingOrder.createdAt,
    })
    .from(billingOrder)
    .where(eq(billingOrder.userId, userId))
    .orderBy(desc(billingOrder.createdAt))
    .limit(limit);
}

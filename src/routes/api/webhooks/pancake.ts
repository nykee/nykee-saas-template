import { createFileRoute } from '@tanstack/react-router';
import { and, eq } from 'drizzle-orm';
import { pancakeWebhookEvent } from '@/db/schema';
import { enqueueApplicationEvent } from '@/lib/server/cloudflare.server';
import { getDatabase } from '@/lib/server/db.server';
import { verifyPancakeWebhook } from '@/lib/server/payment.server';

/**
 * Receive and acknowledge Pancake webhooks.
 *
 * Verification happens against the unchanged request body before any JSON
 * parsing is used for business logic. D1 receives an idempotency ledger row,
 * and only then does the handler enqueue the event for asynchronous
 * projection. Provider retries therefore cannot create duplicate orders.
 */
export const Route = createFileRoute('/api/webhooks/pancake')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        let event: ReturnType<typeof verifyPancakeWebhook>;
        try {
          event = verifyPancakeWebhook(
            rawBody,
            request.headers.get('X-Waffo-Signature')
          );
        } catch {
          /** Invalid signatures and malformed payloads are never retried. */
          return Response.json(
            { received: false, error: 'Invalid webhook.' },
            { status: 401 }
          );
        }

        try {
          const db = getDatabase();
          await db
            .insert(pancakeWebhookEvent)
            .values({
              id: crypto.randomUUID(),
              externalEventId: event.eventId,
              eventType: event.eventType,
              mode: event.mode,
              rawPayload: rawBody,
              processingStatus: 'received',
              receivedAt: new Date(),
            })
            .onConflictDoNothing({
              target: [
                pancakeWebhookEvent.eventType,
                pancakeWebhookEvent.externalEventId,
              ],
            });

          const ledgerRow = (
            await db
              .select({
                processingStatus: pancakeWebhookEvent.processingStatus,
              })
              .from(pancakeWebhookEvent)
              .where(
                and(
                  eq(pancakeWebhookEvent.eventType, event.eventType),
                  eq(pancakeWebhookEvent.externalEventId, event.eventId)
                )
              )
              .limit(1)
          )[0];

          /**
           * Requeue every non-processed ledger row. If enqueueing fails after
           * the first insert, the next provider retry can recover the event
           * instead of being hidden by the unique event ID.
           */
          if (ledgerRow?.processingStatus !== 'processed') {
            await enqueueApplicationEvent({
              version: 1,
              kind: 'pancake.webhook',
              webhookEventId: event.eventId,
              event,
            });
          }

          return Response.json({ received: true });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          /** Mark failed delivery so a later provider retry will requeue it. */
          try {
            await getDatabase()
              .update(pancakeWebhookEvent)
              .set({ processingStatus: 'failed', lastError: message })
              .where(
                and(
                  eq(pancakeWebhookEvent.eventType, event.eventType),
                  eq(pancakeWebhookEvent.externalEventId, event.eventId)
                )
              );
          } catch {
            /** Preserve the provider retry response if D1 is unavailable. */
          }
          return Response.json(
            {
              received: false,
              error: 'Webhook processing is temporarily unavailable.',
            },
            { status: 503 }
          );
        }
      },
    },
  },
});

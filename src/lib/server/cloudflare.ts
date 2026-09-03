import { env } from 'cloudflare:workers';

/**
 * Application bindings and secrets used by the full-stack template.
 *
 * Wrangler generates the base `Env` interface. This extension documents the
 * application contract in one place while keeping generated files untouched.
 */
interface AppEnvBindings {
  DB: D1Database;
  CACHE: KVNamespace;
  UPLOADS: R2Bucket;
  APP_EVENTS: Queue<ApplicationEvent>;
  APP_COORDINATOR: DurableObjectNamespace;
  AI: Ai;
  ANALYTICS: AnalyticsEngineDataset;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  PANCAKE_MERCHANT_ID: string;
  PANCAKE_PRIVATE_KEY: string;
  PANCAKE_PRODUCT_ID: string;
  PANCAKE_CURRENCY: string;
  PANCAKE_ENVIRONMENT: 'test' | 'prod';
  PANCAKE_API_BASE_URL?: string;
  PANCAKE_WEBHOOK_PUBLIC_KEY_TEST: string;
  PANCAKE_WEBHOOK_PUBLIC_KEY_PROD: string;
}

/** Remove Wrangler's literal placeholder variable types before extending the
 * application contract with the runtime values used by production secrets. */
export type AppEnv = Omit<Env, keyof AppEnvBindings> & AppEnvBindings;

/**
 * Queue messages are intentionally versioned and JSON-serializable. The
 * version field makes future message migrations explicit instead of relying
 * on a best-effort parser.
 */
export interface ApplicationEvent {
  version: 1;
  kind: 'pancake.webhook';
  webhookEventId: string;
  event: {
    id: string;
    timestamp: string;
    eventType: string;
    eventId: string;
    storeId: string;
    storeName?: string;
    mode: 'test' | 'prod';
    data: Record<string, unknown>;
  };
}

/**
 * The Cloudflare Vite plugin exposes runtime bindings through the Workers
 * module. Casting here is the only boundary between generated bindings and
 * the application's explicit contract; callers still validate required
 * values before using them.
 */
export const runtimeEnv = env as unknown as AppEnv;

/**
 * Read a required secret or variable and fail with an actionable message when
 * deployment configuration is incomplete. Missing credentials must never be
 * replaced with a development value in an authentication or payment flow.
 */
export function requiredEnv(name: keyof AppEnv): string {
  const value = runtimeEnv[name];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(
      `Required Cloudflare variable or secret ${String(name)} is missing.`
    );
  }
  return value;
}

/**
 * Resolve a required service binding with a precise configuration error.
 * Cloudflare binds services lazily, so this check keeps failures at the
 * feature boundary rather than producing an unrelated null dereference.
 */
export function requiredBinding<K extends keyof AppEnv>(
  name: K
): NonNullable<AppEnv[K]> {
  const binding = runtimeEnv[name];
  if (binding === undefined || binding === null) {
    throw new Error(`Required Cloudflare binding ${String(name)} is missing.`);
  }
  return binding as NonNullable<AppEnv[K]>;
}

/**
 * Send a typed event to Queues. Queue delivery is the asynchronous boundary
 * for webhook projection, so the HTTP webhook can acknowledge only after the
 * message has been accepted by Cloudflare.
 */
export async function enqueueApplicationEvent(
  event: ApplicationEvent
): Promise<void> {
  const queue = requiredBinding('APP_EVENTS');
  await queue.send(event, { contentType: 'json' });
}

/**
 * Return the named Durable Object stub used for serialized application state.
 * Durable Object state is not used as a substitute for D1; it is reserved for
 * coordination, locks, and realtime state that must have a single owner.
 */
export function getCoordinator(name: string): DurableObjectStub {
  return requiredBinding('APP_COORDINATOR').getByName(name);
}

/**
 * Record an Analytics Engine data point. The helper keeps metric writes
 * centralized so pages and service modules do not know Cloudflare's payload
 * format.
 */
export function writeAnalyticsPoint(input: {
  event: string;
  userId?: string;
  value?: number;
}): void {
  const analytics = requiredBinding('ANALYTICS');
  analytics.writeDataPoint({
    blobs: [input.event, input.userId ?? 'anonymous'],
    doubles: [input.value ?? 1],
    indexes: [input.event],
  });
}

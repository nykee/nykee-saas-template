import {
  type AuthenticatedCheckoutParams,
  verifyWebhook,
  WaffoPancake,
} from '@waffo/pancake-ts';
import {
  type AppEnv,
  type ApplicationEvent,
  requiredEnv,
  runtimeEnv,
} from './cloudflare';

/**
 * Create the official Pancake SDK client from Worker secrets.
 *
 * The SDK signs server-to-server calls with RSA-SHA256. `privateKey` is never
 * passed to a client component, serialized into a route response, or stored
 * in D1. The optional base URL is useful for an explicitly configured test
 * gateway; otherwise the SDK's documented Pancake API default is used.
 */
export function getPancakeClient(source: AppEnv = runtimeEnv): WaffoPancake {
  const merchantId = requiredEnvFrom(source, 'PANCAKE_MERCHANT_ID');
  const privateKey = requiredEnvFrom(source, 'PANCAKE_PRIVATE_KEY');
  const environment = requiredEnvFrom(source, 'PANCAKE_ENVIRONMENT');
  const baseUrl = source.PANCAKE_API_BASE_URL;

  if (environment !== 'test' && environment !== 'prod') {
    throw new Error('PANCAKE_ENVIRONMENT must be either "test" or "prod".');
  }

  return new WaffoPancake({
    merchantId,
    privateKey,
    environment,
    baseUrl,
    fetch: globalThis.fetch.bind(globalThis),
  });
}

/**
 * Create a customer-bound hosted checkout URL. Product and currency are
 * server configuration, so the browser cannot alter price, product, or
 * merchant identity. Pancake receives the authenticated user's stable ID as
 * `buyerIdentity` and their email only for checkout prefill.
 */
export async function createPancakeCheckout(input: {
  userId: string;
  email: string;
  successUrl: string;
}): Promise<{ checkoutUrl: string; sessionId: string; expiresAt: string }> {
  const params: AuthenticatedCheckoutParams = {
    productId: requiredEnv('PANCAKE_PRODUCT_ID'),
    currency: requiredEnv('PANCAKE_CURRENCY'),
    buyerIdentity: input.userId,
    buyerEmail: input.email,
    successUrl: input.successUrl,
  };
  const result = await getPancakeClient().checkout.authenticated.create(params);
  return {
    checkoutUrl: result.checkoutUrl,
    sessionId: result.sessionId,
    expiresAt: result.expiresAt,
  };
}

/**
 * Verify an incoming Pancake webhook against the public key selected by its
 * declared environment. The raw body must be passed unchanged because the
 * signature input is `${timestamp}.${rawRequestBody}`.
 */
export function verifyPancakeWebhook(
  rawBody: string,
  signature: string | null,
  source: AppEnv = runtimeEnv
): ApplicationEvent['event'] {
  if (!signature) {
    throw new Error('Missing X-Waffo-Signature header.');
  }

  const envelope = JSON.parse(rawBody) as {
    mode?: unknown;
  };
  if (envelope.mode !== 'test' && envelope.mode !== 'prod') {
    throw new Error('Pancake webhook mode must be "test" or "prod".');
  }

  const publicKey =
    envelope.mode === 'prod'
      ? requiredEnvFrom(source, 'PANCAKE_WEBHOOK_PUBLIC_KEY_PROD')
      : requiredEnvFrom(source, 'PANCAKE_WEBHOOK_PUBLIC_KEY_TEST');
  const event = verifyWebhook<Record<string, unknown>>(rawBody, signature, {
    publicKey,
    environment: envelope.mode,
  });

  if (
    typeof event.id !== 'string' ||
    typeof event.timestamp !== 'string' ||
    typeof event.eventType !== 'string' ||
    typeof event.eventId !== 'string' ||
    typeof event.storeId !== 'string' ||
    (event.mode !== 'test' && event.mode !== 'prod') ||
    typeof event.data !== 'object' ||
    event.data === null
  ) {
    throw new Error('Pancake webhook payload does not match its contract.');
  }

  return {
    id: event.id,
    timestamp: event.timestamp,
    eventType: event.eventType,
    eventId: event.eventId,
    storeId: event.storeId,
    ...(typeof event.storeName === 'string'
      ? { storeName: event.storeName }
      : {}),
    mode: event.mode,
    data: event.data as Record<string, unknown>,
  };
}

/**
 * Read a string from an explicitly supplied environment object. This helper
 * is separate from `requiredEnv` so queue tests and Worker handlers can pass
 * their request-scoped env without accidentally reading another invocation.
 */
function requiredEnvFrom(source: AppEnv, name: keyof AppEnv): string {
  const value = source[name];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(
      `Required Cloudflare variable or secret ${String(name)} is missing.`
    );
  }
  return value;
}

import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

/**
 * Better Auth's default SQLite schema.
 *
 * The table and column names intentionally follow Better Auth's generated
 * schema contract. Keeping this contract in one module lets the auth adapter
 * and application queries share the same typed database definition.
 */
export const user = sqliteTable(
  'user',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    emailVerified: integer('email_verified', { mode: 'boolean' }).notNull(),
    image: text('image'),
    role: text('role').notNull().default('user'),
    banned: integer('banned', { mode: 'boolean' }).notNull().default(false),
    banReason: text('ban_reason'),
    banExpires: integer('ban_expires', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [uniqueIndex('user_email_unique').on(table.email)]
);

export const session = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    token: text('token').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    impersonatedBy: text('impersonated_by'),
  },
  (table) => [
    uniqueIndex('session_token_unique').on(table.token),
    index('session_user_id_idx').on(table.userId),
  ]
);

export const account = sqliteTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    scope: text('scope'),
    password: text('password'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('account_user_id_idx').on(table.userId),
    uniqueIndex('account_provider_account_unique').on(
      table.providerId,
      table.accountId
    ),
  ]
);

export const verification = sqliteTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('verification_identifier_idx').on(table.identifier),
    uniqueIndex('verification_value_unique').on(table.value),
  ]
);

/**
 * Local order projection populated by verified Pancake webhook events.
 *
 * The external order ID is the stable business identifier from Pancake. It is
 * deliberately separate from Better Auth IDs so payment reconciliation stays
 * provider-specific and does not leak into the authentication schema.
 */
export const billingOrder = sqliteTable(
  'billing_order',
  {
    id: text('id').primaryKey(),
    externalOrderId: text('external_order_id').notNull(),
    externalEventId: text('external_event_id').notNull(),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    status: text('status').notNull(),
    productId: text('product_id'),
    productName: text('product_name'),
    buyerEmail: text('buyer_email'),
    amount: text('amount'),
    currency: text('currency'),
    mode: text('mode').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('billing_order_external_order_unique').on(
      table.externalOrderId
    ),
    index('billing_order_user_id_idx').on(table.userId),
    index('billing_order_status_idx').on(table.status),
  ]
);

/**
 * Current subscription projection. A subscription can emit many webhook
 * events, so this table is upserted by Pancake's external order ID.
 */
export const subscription = sqliteTable(
  'subscription',
  {
    id: text('id').primaryKey(),
    externalOrderId: text('external_order_id').notNull(),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    status: text('status').notNull(),
    productName: text('product_name'),
    buyerEmail: text('buyer_email'),
    billingPeriod: text('billing_period'),
    currentPeriodEnd: text('current_period_end'),
    amount: text('amount'),
    currency: text('currency'),
    mode: text('mode').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('subscription_external_order_unique').on(table.externalOrderId),
    index('subscription_user_id_idx').on(table.userId),
    index('subscription_status_idx').on(table.status),
  ]
);

/**
 * Idempotency ledger for external webhook delivery.
 *
 * Pancake retries deliveries. Pancake's contract scopes event IDs by event
 * type, so the ledger key is the pair `(event_type, external_event_id)`.
 * Keeping that contract in the schema prevents two different event types that
 * happen to reuse an ID from being collapsed into one delivery. Processing
 * status lets the HTTP handler acknowledge a duplicate safely while the Queue
 * consumer can retry a failed projection without creating duplicate business
 * rows.
 */
export const pancakeWebhookEvent = sqliteTable(
  'pancake_webhook_event',
  {
    id: text('id').primaryKey(),
    externalEventId: text('external_event_id').notNull(),
    eventType: text('event_type').notNull(),
    mode: text('mode').notNull(),
    rawPayload: text('raw_payload').notNull(),
    processingStatus: text('processing_status').notNull().default('received'),
    lastError: text('last_error'),
    receivedAt: integer('received_at', { mode: 'timestamp_ms' }).notNull(),
    processedAt: integer('processed_at', { mode: 'timestamp_ms' }),
  },
  (table) => [
    uniqueIndex('pancake_webhook_event_type_external_id_unique').on(
      table.eventType,
      table.externalEventId
    ),
    index('pancake_webhook_event_status_idx').on(table.processingStatus),
  ]
);

/**
 * Small, provider-neutral audit trail for administrative changes.
 *
 * Payloads are JSON strings because audit records must retain the exact
 * before/after context without forcing a schema migration for every new admin
 * action.
 */
export const auditLog = sqliteTable(
  'audit_log',
  {
    id: text('id').primaryKey(),
    actorUserId: text('actor_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    action: text('action').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    payload: text('payload').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('audit_log_actor_user_id_idx').on(table.actorUserId),
    index('audit_log_created_at_idx').on(table.createdAt),
  ]
);

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  sessions: many(session),
  orders: many(billingOrder),
  subscriptions: many(subscription),
  auditLogs: many(auditLog),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const billingOrderRelations = relations(billingOrder, ({ one }) => ({
  user: one(user, {
    fields: [billingOrder.userId],
    references: [user.id],
  }),
}));

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  user: one(user, {
    fields: [subscription.userId],
    references: [user.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  actor: one(user, {
    fields: [auditLog.actorUserId],
    references: [user.id],
  }),
}));

/**
 * The full schema object is passed to Better Auth's Drizzle adapter. Exporting
 * it explicitly prevents the adapter from silently missing custom table
 * aliases when the auth configuration is changed later.
 */
export const databaseSchema = {
  user,
  session,
  account,
  verification,
  billingOrder,
  subscription,
  pancakeWebhookEvent,
  auditLog,
};

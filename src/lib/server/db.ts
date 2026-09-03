import { type DrizzleD1Database, drizzle } from 'drizzle-orm/d1';
import { databaseSchema } from '@/db/schema';
import { type AppEnv, requiredBinding, runtimeEnv } from './cloudflare';

export type AppDatabase = DrizzleD1Database<typeof databaseSchema>;

/**
 * Create a typed Drizzle D1 client for the current request.
 *
 * D1 clients are lightweight request adapters around the Worker binding. A
 * fresh adapter also avoids sharing request-local state between invocations.
 */
export function getDatabase(source: AppEnv = runtimeEnv): AppDatabase {
  const database = source.DB ?? requiredBinding('DB');
  return drizzle(database, { schema: databaseSchema });
}

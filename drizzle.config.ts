import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle's schema-to-SQL configuration for the Cloudflare D1 database.
 * Wrangler applies the generated SQL in `drizzle/`; this file is only the
 * deterministic source mapping used when schema.ts changes.
 */
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
});

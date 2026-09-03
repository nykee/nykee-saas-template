# TanStarter Cloud

TanStarter Cloud is a reusable TanStack Start product starter for Cloudflare. It keeps the public landing page from the original template and adds the common application surface needed by SaaS and AI products:

- Better Auth with Google OAuth and Google One Tap
- D1-backed users, sessions, billing projections, webhook ledger, and audit log
- Pancake hosted checkout and verified webhook ingestion
- Responsive account dashboard and administrator workspace
- Workers, D1, KV, R2, Queues, Durable Objects, Workers AI, and Analytics Engine bindings
- English and Simplified Chinese public-site copy, SEO endpoints, themes, tests, and one-command deployment

The template intentionally leaves credentials, Cloudflare resource IDs, product IDs, and merchant keys as deployment configuration. It does not commit an account ID, custom domain, or secret.

## Quick start

```bash
pnpm install
cp .env.example .env
cp .dev.vars.example .dev.vars
pnpm dev
```

Set `VITE_GOOGLE_CLIENT_ID` in `.env`. Set the matching server credentials and Pancake values in `.dev.vars`. The local app runs at `http://localhost:3000`.

## Cloudflare resources

`wrangler.jsonc` declares the complete binding surface. Replace the placeholder D1 and KV IDs with the values returned by Wrangler, then create the resources in your Cloudflare account:

```bash
pnpm exec wrangler d1 create tanstarter-cloud-db
pnpm exec wrangler kv namespace create CACHE
pnpm exec wrangler r2 bucket create tanstarter-cloud-uploads
pnpm exec wrangler queues create tanstarter-cloud-events
pnpm exec wrangler queues create tanstarter-cloud-events-dlq
```

Copy the returned D1 `database_id` and KV `id` into `wrangler.jsonc`. Keep `workers_dev: true` as the committed deployment default. Durable Objects, Workers AI, Analytics Engine, and the Queue consumer are declared in the same file and do not require an account ID in the repository.

Apply the Better Auth and application schema before the first authenticated request:

```bash
pnpm db:migrate:local
pnpm db:migrate:remote
```

Use only the command matching the target database. `db:migrate:remote` requires Wrangler authentication and updates the configured remote D1 database.

After signing in once, promote the first administrator directly in D1. This
is intentionally an explicit deployment step so a fresh template cannot
silently grant administrative access to an arbitrary account:

```bash
pnpm exec wrangler d1 execute tanstarter-cloud-db --remote --command "UPDATE user SET role = 'admin', updated_at = unixepoch() * 1000 WHERE email = 'you@example.com';"
```

Replace the email and use `--local` when promoting a local development user.
After that, role changes and bans can be managed from `/admin`.

## Environment and secrets

The browser receives only `VITE_GOOGLE_CLIENT_ID`, which is a public Google OAuth client identifier. The Worker reads these values from Wrangler variables or secrets:

| Variable | Purpose |
| --- | --- |
| `BETTER_AUTH_URL` | Canonical origin used by Better Auth and Google OAuth callbacks |
| `BETTER_AUTH_SECRET` | Better Auth signing/encryption secret |
| `GOOGLE_CLIENT_ID` | Server-side Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Server-side Google OAuth client secret |
| `PANCAKE_MERCHANT_ID` | Pancake merchant identifier |
| `PANCAKE_PRIVATE_KEY` | Pancake RSA private key used by the official SDK |
| `PANCAKE_PRODUCT_ID` | The one server-configured product offered by the starter checkout |
| `PANCAKE_CURRENCY` | Checkout currency, such as `USD` |
| `PANCAKE_ENVIRONMENT` | `test` or `prod` |
| `PANCAKE_WEBHOOK_PUBLIC_KEY_TEST` | Pancake test webhook verification key |
| `PANCAKE_WEBHOOK_PUBLIC_KEY_PROD` | Pancake production webhook verification key |

For local development, `.dev.vars.example` documents the complete shape. For deployment, prefer Wrangler secrets:

```bash
pnpm exec wrangler secret put BETTER_AUTH_SECRET
pnpm exec wrangler secret put GOOGLE_CLIENT_SECRET
pnpm exec wrangler secret put PANCAKE_PRIVATE_KEY
pnpm exec wrangler secret put PANCAKE_WEBHOOK_PUBLIC_KEY_TEST
pnpm exec wrangler secret put PANCAKE_WEBHOOK_PUBLIC_KEY_PROD
```

The public Google client ID must also be available as `VITE_GOOGLE_CLIENT_ID` during the production build. Configure Google OAuth authorized origins and redirect URI as:

```text
https://YOUR_WORKERS_DEV_ORIGIN
https://YOUR_WORKERS_DEV_ORIGIN/api/auth/callback/google
```

## Pancake integration

The default payment provider is [Pancake](https://pancake.waffo.ai/). The server uses the official `@waffo/pancake-ts` SDK against `https://api.waffo.ai`:

- `POST /v1/actions/checkout/create-session` creates the hosted checkout.
- `/api/webhooks/pancake` verifies `X-Waffo-Signature` against the unchanged raw body.
- Verified events are stored in the D1 idempotency ledger and sent to `APP_EVENTS`.
- The Queue consumer projects order and subscription state into D1 with provider event IDs as durable idempotency keys.

The browser cannot submit a product ID, amount, merchant ID, or private key. Update the server variables when each product is deployed. Register `/api/webhooks/pancake` in the Pancake dashboard for both test and production environments as appropriate.

## Routes

- `/` — English public landing page
- `/zh` — Simplified Chinese public landing page
- `/login` — Google OAuth and Google One Tap sign-in
- `/dashboard` — authenticated account and billing dashboard
- `/admin` — administrator metrics and access management
- `/api/auth/*` — Better Auth protocol and OAuth callbacks
- `/api/webhooks/pancake` — verified Pancake webhook endpoint
- `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` — machine-readable public endpoints

The administrator role is `admin`; new users default to `user`. An administrator can change roles or ban users from `/admin`. Every accepted access change is recorded in `audit_log`. The server guards every private loader and mutation independently of client-side route redirects.

## Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the Vite development server |
| `pnpm check` | Run Biome, locale parity, tests, and TypeScript |
| `pnpm build` | Build client/Worker output and type-check |
| `pnpm e2e` | Run Playwright acceptance tests |
| `pnpm locale:compile` | Regenerate Paraglide output after copy changes |
| `pnpm locale:check` | Check English/Chinese message-key parity |
| `pnpm db:generate` | Generate a D1 migration from `src/db/schema.ts` |
| `pnpm db:migrate:local` | Apply migrations to local D1 |
| `pnpm db:migrate:remote` | Apply migrations to remote D1 |
| `pnpm cf-typegen` | Regenerate `worker-configuration.d.ts` |
| `pnpm deploy` | Build and deploy to the committed workers.dev default |

## Customize

1. Update site identity and navigation in `src/config/website.ts`.
2. Update English and Chinese copy in `project.inlang/messages/en.json` and `project.inlang/messages/zh.json`, then run `pnpm locale:compile`.
3. Replace `public/favicon.svg` and `public/og.png` with your brand assets.
4. Set the Pancake product variables for the product this site sells.
5. Add product-specific tables and server functions beside the existing shared data services.
6. Add public or authenticated routes under `src/routes/`; keep private reads and writes inside `createServerFn` handlers.

`src/locale/paraglide/`, `src/routeTree.gen.ts`, and `worker-configuration.d.ts` are generated files. Regenerate them with the project commands; never edit them manually.

## Project structure

- `src/routes/` — public, authenticated, admin, auth, and webhook routes
- `src/components/app/` — shared authenticated shell, metrics, status badges, and empty states
- `src/components/layout/` — public header, footer, language, and theme controls
- `src/lib/client/` — browser-only auth client with One Tap
- `src/lib/server/` — Cloudflare bindings, Better Auth, D1, billing, queue projections, and server functions
- `src/db/schema.ts` — Better Auth and application D1 schema
- `drizzle/` — generated D1 migrations
- `wrangler.jsonc` — Cloudflare resource declarations and workers.dev deployment default
- `project.inlang/messages/` — authoritative localized copy

## License

Licensed under the [MIT License](./LICENSE).

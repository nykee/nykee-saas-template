# nykee-saas-template

nykee-saas-template is a reusable TanStack Start product starter for Cloudflare. It keeps the public landing page from the original template and adds the common application surface needed by SaaS and AI products:

- Better Auth with Google OAuth and Google One Tap
- D1-backed users, sessions, billing projections, webhook ledger, and audit log
- Pancake hosted checkout and verified webhook ingestion
- Responsive account dashboard and administrator workspace
- Workers, D1, KV, R2, Queues, Durable Objects, Workers AI, and Analytics Engine bindings
- English, Spanish, and French public-site copy, SEO endpoints, themes, tests, and one-command deployment

The template intentionally leaves credentials, Cloudflare resource IDs, product IDs, and merchant keys as deployment configuration. It does not commit an account ID, custom domain, or secret.

## Sites built with this template

Site build with this template:

- [kuvmusic.com](https://kuvmusic.com)
- [kuvidea.com](https://kuvidea.com)
- [kuvstudio.com](https://kuvstudio.com)
- [hannahdream.com](https://hannahdream.com)
- [musicpromptpro.com](https://musicpromptpro.com)
- [visualiquid.com](https://visualiquid.com)
- [niubid.lol](https://niubid.lol)

## Quick start

Use Node.js 22.13 or newer and the pnpm version declared in `package.json`.
The database checks use Node's built-in SQLite engine to execute the committed
migrations without contacting Cloudflare.

```bash
pnpm install
cp .env.example .env
cp .dev.vars.example .dev.vars
pnpm dev
```

Set `VITE_GOOGLE_CLIENT_ID` in `.env`. Set the matching server credentials and Pancake values in `.dev.vars`. `pnpm dev` applies pending local D1 migrations before starting Vite. The local app runs at `http://127.0.0.1:3000`.

## Cloudflare resources

`wrangler.jsonc` declares the complete binding surface. Replace the placeholder D1 and KV IDs with the values returned by Wrangler, then create the resources in your Cloudflare account:

```bash
pnpm exec wrangler d1 create nykee-saas-template-db
pnpm exec wrangler kv namespace create CACHE
pnpm exec wrangler r2 bucket create nykee-saas-template-uploads
pnpm exec wrangler queues create nykee-saas-template-events
pnpm exec wrangler queues create nykee-saas-template-events-dlq
```

Copy the returned D1 `database_id` and KV `id` into `wrangler.jsonc`. Set the resource names to match the resources you created, including D1's `database_name`; keep its `binding` as `DB`. Migration commands use this binding so renaming a project does not leave them pointing at the original template database. Keep `workers_dev: true` as the committed deployment default. Durable Objects, Workers AI, Analytics Engine, and the Queue consumer are declared in the same file and do not require an account ID in the repository.

Development and deployment apply the Better Auth and application migrations
automatically. To apply migrations independently, choose the matching target:

```bash
pnpm db:migrate:local
pnpm db:migrate:remote
```

Use only the command matching the target database. `db:migrate:remote` requires Wrangler authentication and updates the configured remote D1 database.

`pnpm deploy` checks the database contract, builds the app, applies pending
remote migrations, and then deploys the Worker. A failed check, build, or
migration stops the command before the new Worker is uploaded. Projects using
Cloudflare's Git integration should set their deploy command to `pnpm deploy`;
calling `wrangler deploy` directly skips these checks and migrations.

### Better Auth schema changes

Keep `src/lib/server/auth-options.ts`, `src/db/schema.ts`, and the SQL migrations
in sync when upgrading Better Auth or adding plugins. Run `pnpm db:generate`
after schema changes and commit both the SQL and Drizzle metadata. Review
generated migrations for populated databases: adding a required column needs
an explicit, correct backfill before its constraint can be enforced.
`pnpm db:check` validates the installed Better Auth core/plugin fields and
identity constraints, then applies every committed migration to SQLite and
compares all application tables and indexes with Drizzle. It runs during both
`pnpm check` and `pnpm build`.

Better Auth 1.7 requires `account.issuer` and a unique index on
`(issuer, account_id)`. Migration `0002_better_auth_account_issuer.sql` preserves
existing Google accounts and credentials, fills their canonical issuer
`https://accounts.google.com`, and creates the previously missing `blog_post`
table. It supports both fresh databases and databases with migrations `0000`
and `0001` already applied. It rejects unknown providers before replacing the
account table; projects that added providers must add their verified issuer
mappings before applying this migration. It does not guess an issuer or set
a default for future accounts.

For an existing project derived from an earlier template, merge the auth
configuration, schema, and command changes. Generate a migration against that
project's own Drizzle history and incorporate the verified issuer backfill;
copying the template's migration journal over a customized project can lose
its migration history. Apply the migration to its configured D1 database
before deploying the updated Worker.

After signing in once, promote the first administrator directly in D1. This
is intentionally an explicit deployment step so a fresh template cannot
silently grant administrative access to an arbitrary account:

```bash
pnpm exec wrangler d1 execute DB --remote --command "UPDATE user SET role = 'admin', updated_at = unixepoch() * 1000 WHERE email = 'you@example.com';"
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

## Live support

The shared document mounts one tawk.to chat widget after React hydration.
Its public embed address is configured in `src/config/website.ts` under
`tawkChat.embedUrl`; no API key or server-side SDK is required. The widget
loads asynchronously and stays mounted during client-side route changes.
The integration does not set a signed-in user's name or email on the widget.

Manage the widget's appearance, language, availability, and support agents in
the tawk.to dashboard.

## Routes

- `/` — English public landing page
- `/es` — Spanish public landing page
- `/fr` — French public landing page
- `/login` — Google OAuth and Google One Tap sign-in
- `/dashboard` — authenticated account and billing dashboard
- `/admin` — administrator metrics and access management
- `/api/auth/*` — Better Auth protocol and OAuth callbacks
- `/api/webhooks/pancake` — verified Pancake webhook endpoint
- `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/manifest.webmanifest` — machine-readable public endpoints

The administrator role is `admin`; new users default to `user`. An administrator can change roles or ban users from `/admin`. Every accepted access change is recorded in `audit_log`. The server guards every private loader and mutation independently of client-side route redirects.

## SEO topic clusters and GEO

SEO and GEO are configuration-driven infrastructure in
`src/config/seo.ts`. Keep every public route in `seoConfig.pages`; private
routes are intentionally excluded. A page can then participate in a
hub-and-spoke cluster without duplicating metadata or link markup:

```ts
{
  id: 'cloudflare-guide',
  path: '/guides/cloudflare',
  locale: 'en',
  title: { en: 'Cloudflare guide' },
  description: { en: 'A practical Cloudflare guide for SaaS builders.' },
  kind: 'pillar',
  primaryKeyword: 'Cloudflare guide',
}
```

Add the page IDs to `seoConfig.clusters` as one `pillarId` and its
`spokeIds`. The infrastructure generates mandatory pillar-to-spoke and
spoke-to-pillar links. Add deliberate spoke-to-spoke or cross-cluster links to
`seoConfig.internalLinks`; it does not infer topical relationships from text.
Use `<Breadcrumbs pageId="..." />` and
`<InternalLinkCluster pageId="..." />` in the corresponding route. Both use
the same registry as the sitemap and JSON-LD, so labels and URLs stay aligned.

The generic `pageHead()` helper emits canonical URLs, hreflang alternates,
Open Graph/Twitter metadata, Organization/WebSite/WebPage JSON-LD, Article
JSON-LD for content pages, and BreadcrumbList JSON-LD. Use `buildFaqJsonLd()`
only when the same questions and answers are visibly rendered on the page.

GEO foundations are enabled by default:

- `/llms.txt` publishes a server-rendered brief from the public page registry,
  topic clusters, key facts, and content guidance.
- `/robots.txt` allows AI search crawlers such as GPTBot, OAI-SearchBot,
  ClaudeBot, and PerplexityBot, while blocking common training crawlers. Edit
  `seoConfig.geo` when your publishing policy changes.
- `GeoAnswerBlock` provides a server-rendered, self-contained answer unit with
  first-party source links. Keep important answers direct, use question-based
  headings, and target roughly 134–167 words when the passage is intended for
  citation.
- `seoConfig.organization.sameAs` is the single place to add official
  LinkedIn, GitHub, YouTube, Wikipedia, or other entity profiles.

The generated sitemap and `llms.txt` include only pages with `indexable !==
false`. This makes adding a public content route a deliberate three-part
change: register its metadata, add its route, then add it to a cluster if it
belongs to one.

## Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Apply local D1 migrations and start the Vite development server |
| `pnpm check` | Run Biome, locale parity, tests, and TypeScript |
| `pnpm build` | Check the database contract, build client/Worker output, and type-check |
| `pnpm e2e` | Run Playwright acceptance tests |
| `pnpm locale:compile` | Regenerate Paraglide output after copy changes |
| `pnpm locale:check` | Check English/Spanish/French message-key parity |
| `pnpm db:generate` | Generate a D1 migration from `src/db/schema.ts` |
| `pnpm db:check` | Validate Better Auth fields, identity constraints, and the full SQL migration chain |
| `pnpm db:migrate:local` | Apply migrations to local D1 |
| `pnpm db:migrate:remote` | Apply migrations to remote D1 |
| `pnpm cf-typegen` | Regenerate `worker-configuration.d.ts` |
| `pnpm deploy` | Check/build, apply remote D1 migrations, and deploy to workers.dev |

## Customize

1. Update site identity and navigation in `src/config/website.ts`.
2. Update English, Spanish, and French copy in `project.inlang/messages/en.json`, `project.inlang/messages/es.json`, and `project.inlang/messages/fr.json`, then run `pnpm locale:compile`.
3. Replace `public/favicon.svg` and `public/og.png` with your brand assets.
4. Set the Pancake product variables for the product this site sells.
5. Add product-specific tables and server functions beside the existing shared data services.
6. Add public or authenticated routes under `src/routes/`; keep private reads and writes inside `createServerFn` handlers.

`src/locale/paraglide/`, `src/routeTree.gen.ts`, and `worker-configuration.d.ts` are generated files. Regenerate them with the project commands; never edit them manually.

## Project structure

- `src/routes/` — public, authenticated, admin, auth, and webhook routes
- `src/components/app/` — shared authenticated shell, metrics, status badges, and empty states
- `src/components/layout/` — public header, footer, language, and theme controls
- `src/components/seo/` — reusable breadcrumbs, internal-link clusters, and GEO answer blocks
- `src/lib/client/` — browser-only auth client with One Tap
- `src/lib/server/` — Cloudflare bindings, Better Auth, D1, billing, queue projections, and server functions
- `src/config/seo.ts` and `src/lib/seo.ts` — public page registry, topic clusters, metadata, sitemap, robots, and GEO generators
- `src/db/schema.ts` — Better Auth and application D1 schema
- `drizzle/` — generated D1 migrations
- `wrangler.jsonc` — Cloudflare resource declarations and workers.dev deployment default
- `project.inlang/messages/` — authoritative localized copy

## License

Licensed under the [MIT License](./LICENSE).

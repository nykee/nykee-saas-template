# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

TypeScript, React 19, TanStack Start and Router, Vite, Tailwind CSS v4,
Paraglide, and Cloudflare Workers.

## Users

Developers, indie hackers, solo founders, and small teams who want a public
site and the repeatable application infrastructure behind a SaaS or AI
product.

## Product Purpose

TanStarter Cloud is a reusable web product starter. It provides a complete
multilingual landing page, responsive navigation, language and theme menus,
light/dark/system themes, SEO fundamentals, tests, Cloudflare full-stack
bindings, Better Auth with Google OAuth and One Tap, Pancake billing, a D1
schema, and account/admin application surfaces.

Success means a developer can create a repository from the template, replace
the central site configuration and locale copy, and deploy a polished site in
one short work session.

## Positioning

TanStarter Cloud keeps the production-quality simple-site foundation of
TanStarter and makes the operational surface explicit: identity, billing,
data, asynchronous events, serialized coordination, storage, AI, analytics,
and administration each have a typed boundary.

## Capabilities and Constraints

- Human-facing routes are `/` in English and `/zh` in Simplified Chinese.
- The site supports light, dark, and system themes.
- The landing page includes navigation, product positioning, capabilities,
  stack, included and excluded scope, a four-step customization workflow, FAQ,
  and CTA.
- SEO includes canonical and alternate locale links, social metadata,
  structured data, sitemap, robots, and a web manifest.
- The default deployment uses the account's `workers.dev` subdomain.
- Cloudflare bindings cover Workers, D1, KV, R2, Queues, Durable Objects,
  Workers AI, and Analytics Engine.
- Better Auth persists users and sessions in D1 and uses KV plus Durable
  Objects for secondary storage semantics and atomic counters.
- Pancake checkout is server-created from configured product data; signed
  webhooks are idempotently projected through a Queue into D1.
- The application surface includes `/login`, `/dashboard`, `/admin`, and the
  auth/webhook API routes.
- Credentials and account-specific resource IDs remain deployment inputs.

## Brand Commitments

- Name: TanStarter Cloud.
- Voice: direct, practical, energetic, and free of inflated claims.
- Visual identity: an original neo-brutalist system with bold typography,
  visible construction, hard borders, offset shadows, and confident color.
- The design must remain equally intentional in light and dark modes.

## Evidence on Hand

There are no customer testimonials, usage statistics, or benchmark claims.
The landing page must demonstrate the template through truthful interface and
architecture details rather than invented social proof.

## Product Principles

1. Keep each Cloudflare service accountable to one clear responsibility.
2. Make the first customization obvious.
3. Keep every shipped dependency accountable to visible behavior.
4. Treat multilingual content, accessibility, SEO, and deployment as core.
5. Prefer shared components, server functions, and typed service modules over
   duplicated page-specific implementations.

## Accessibility & Inclusion

Target WCAG 2.1 AA contrast, semantic landmarks, keyboard-complete controls,
visible focus states, reduced-motion support, and readable layouts from narrow
mobile screens through large desktop displays.

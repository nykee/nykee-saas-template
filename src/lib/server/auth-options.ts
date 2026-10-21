import type { BetterAuthOptions } from 'better-auth';
import { admin, oneTap } from 'better-auth/plugins';
import { tanstackStartCookies } from 'better-auth/tanstack-start';

/** Server credentials are supplied by the caller, never read during import. */
interface AuthConfiguration {
  authUrl: string;
  secret: string;
  googleClientId: string;
  googleClientSecret: string;
}

/**
 * Share the actual Better Auth configuration with database contract checks.
 *
 * Cloudflare bindings stay in getAuth(), so validation can inspect all core
 * and plugin fields without Worker request context or production credentials.
 * Add future model mappings, additional fields, and plugins here so a package
 * upgrade or plugin change is checked against the committed D1 migrations.
 */
export function createAuthOptions(configuration: AuthConfiguration) {
  return {
    baseURL: configuration.authUrl,
    basePath: '/api/auth',
    secret: configuration.secret,
    trustedOrigins: [configuration.authUrl],
    socialProviders: {
      google: {
        clientId: configuration.googleClientId,
        clientSecret: configuration.googleClientSecret,
      },
    },
    plugins: [
      /** Adds role and ban fields plus protected administrative endpoints. */
      admin({ defaultRole: 'user', adminRoles: ['admin'] }),
      /** Verifies Google One Tap ID tokens before issuing a session. */
      oneTap({ clientId: configuration.googleClientId }),
      /** Must remain last so TanStack Start receives Set-Cookie. */
      tanstackStartCookies(),
    ],
    advanced: {
      database: { generateId: 'uuid' },
    },
  } satisfies BetterAuthOptions;
}

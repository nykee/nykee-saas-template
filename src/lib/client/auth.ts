import { oneTapClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

/**
 * Browser-safe Better Auth client factory.
 *
 * Google client IDs are public identifiers, but they still must be supplied
 * explicitly at build time so the One Tap SDK cannot silently target the
 * wrong Google Cloud project. The server-side client secret never enters this
 * module or the browser bundle.
 */
/** Build the typed client only after the public Google ID has been checked. */
function createConfiguredClient(googleClientId: string) {
  return createAuthClient({
    basePath: '/api/auth',
    plugins: [oneTapClient({ clientId: googleClientId })],
  });
}

let client: ReturnType<typeof createConfiguredClient> | undefined;

export function getAuthClient() {
  if (client) {
    return client;
  }

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (
    typeof googleClientId !== 'string' ||
    googleClientId.trim().length === 0
  ) {
    throw new Error(
      'VITE_GOOGLE_CLIENT_ID is required to render the Google sign-in surface.'
    );
  }

  client = createConfiguredClient(googleClientId);
  return client;
}

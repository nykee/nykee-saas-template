import { getRequest } from '@tanstack/react-start/server';
import { getAuth } from './auth.server';

/** Public user shape returned to authenticated application surfaces. */
export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: string;
  banned: boolean;
}

/** Serializable session projection shared by server functions and shells. */
export interface CurrentSession {
  user: CurrentUser;
  expiresAt: string;
}

/**
 * Normalize Better Auth's plugin-extended user object into the small shape
 * that route loaders can safely serialize to the browser.
 */
export function normalizeSession(
  value: Awaited<ReturnType<ReturnType<typeof getAuth>['api']['getSession']>>
): CurrentSession | null {
  if (!value) return null;
  const user = value.user as typeof value.user & {
    role?: string | null;
    banned?: boolean | null;
  };
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image ?? null,
      role: user.role ?? 'user',
      banned: user.banned ?? false,
    },
    expiresAt: value.session.expiresAt.toISOString(),
  };
}

/** Guard private business operations with the current Better Auth session. */
export async function requireCurrentSession(): Promise<CurrentSession> {
  const value = await getAuth().api.getSession({
    headers: getRequest().headers,
  });
  const session = normalizeSession(value);
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  if (session.user.banned) {
    throw new Error('USER_BANNED');
  }
  return session;
}

/** Guard administrative reads and mutations with the shared role contract. */
export async function requireAdminSession(): Promise<CurrentSession> {
  const session = await requireCurrentSession();
  if (session.user.role !== 'admin') {
    throw new Error('FORBIDDEN');
  }
  return session;
}

import { createFileRoute } from '@tanstack/react-router';
import { createIsomorphicFn } from '@tanstack/react-start';
import { getRequestUrl } from '@tanstack/react-start/server';
import { HomePage } from '@/components/home/home-page';
import { homeHead } from '@/lib/seo';

const getRequestOrigin = createIsomorphicFn()
  .server(() => getRequestUrl().origin)
  .client(() => window.location.origin);

/** Spanish public landing page sharing the same reusable homepage sections. */
export const Route = createFileRoute('/es')({
  head: () => homeHead('es', getRequestOrigin()),
  component: () => <HomePage locale="es" />,
});

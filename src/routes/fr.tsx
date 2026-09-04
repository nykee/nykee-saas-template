import { createFileRoute } from '@tanstack/react-router';
import { HomePage } from '@/components/home/home-page';
import { getRequestOrigin } from '@/lib/request-origin';
import { homeHead } from '@/lib/seo';

/** French public landing page sharing the same reusable homepage sections. */
export const Route = createFileRoute('/fr')({
  head: () => homeHead('fr', getRequestOrigin()),
  component: () => <HomePage locale="fr" />,
});

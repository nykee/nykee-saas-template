import { createFileRoute } from '@tanstack/react-router';
import { StaticPage } from '@/components/public/static-page';
import { staticPageSeoId } from '@/config/static-pages';
import { getRequestOrigin } from '@/lib/request-origin';
import { pageHead } from '@/lib/seo';

export const Route = createFileRoute('/fr_/about')({
  head: () => pageHead(staticPageSeoId('about', 'fr'), getRequestOrigin()),
  component: () => <StaticPage page="about" locale="fr" />,
});

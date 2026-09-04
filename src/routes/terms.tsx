import { createFileRoute } from '@tanstack/react-router';
import { StaticPage } from '@/components/public/static-page';
import { staticPageSeoId } from '@/config/static-pages';
import { getRequestOrigin } from '@/lib/request-origin';
import { pageHead } from '@/lib/seo';

export const Route = createFileRoute('/terms')({
  head: () => pageHead(staticPageSeoId('terms', 'en'), getRequestOrigin()),
  component: () => <StaticPage page="terms" locale="en" />,
});

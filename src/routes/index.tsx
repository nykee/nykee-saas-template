import { createFileRoute } from '@tanstack/react-router';
import { HomePage } from '@/components/home/home-page';
import { getRequestOrigin } from '@/lib/request-origin';
import { homeHead } from '@/lib/seo';

export const Route = createFileRoute('/')({
  head: () => homeHead('en', getRequestOrigin()),
  component: () => <HomePage locale="en" />,
});

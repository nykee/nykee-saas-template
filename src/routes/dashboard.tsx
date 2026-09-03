import {
  IconArrowUpRight,
  IconCreditCard,
  IconReceipt,
} from '@tabler/icons-react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { AppShell } from '@/components/app/app-shell';
import { EmptyState } from '@/components/app/empty-state';
import { Metric } from '@/components/app/metric';
import { StatusBadge, statusVariant } from '@/components/app/status-badge';
import { Button } from '@/components/ui/button';
import {
  createCheckoutSession,
  getDashboardData,
} from '@/lib/server/app-functions.functions';
import { getCurrentSession } from '@/lib/server/session.functions';

/** Require an active, non-banned session before rendering private data. */
export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const session = await getCurrentSession();
    if (!session || session.user.banned) {
      throw redirect({ to: '/login' });
    }
  },
  loader: () => getDashboardData(),
  head: () => ({
    meta: [
      { title: 'Dashboard' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: DashboardPage,
});

/** User-facing account and billing dashboard. */
function DashboardPage() {
  const data = Route.useLoaderData();
  const checkout = useServerFn(createCheckoutSession);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <AppShell
      session={data.session}
      activeSection="dashboard"
      eyebrow="Account workspace"
      title={`Welcome back, ${data.session.user.name}`}
    >
      <div className="grid gap-5 md:grid-cols-3">
        <Metric
          label="Orders"
          value={data.summary.orderCount}
          detail="Synced from Pancake webhooks"
          accent="cyan"
        />
        <Metric
          label="Active plans"
          value={data.summary.activeSubscriptionCount}
          detail="Current subscription projection"
          accent="green"
        />
        <section className="rounded-[14px] border-2 border-ink bg-orange p-5 text-ink shadow-brutal">
          <IconCreditCard aria-hidden="true" size={25} />
          <p className="mt-3 text-sm font-black uppercase tracking-[0.08em]">
            Add access
          </p>
          <Button
            variant="plain"
            className="mt-4 !min-h-11 w-full border-ink bg-paper text-ink hover:bg-yellow"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              setError(null);
              try {
                const result = await checkout();
                window.location.assign(result.checkoutUrl);
              } catch (reason: unknown) {
                setPending(false);
                setError(
                  reason instanceof Error
                    ? reason.message
                    : 'Checkout could not be created.'
                );
              }
            }}
          >
            {pending ? 'Opening checkout…' : 'Continue to Pancake'}
            <IconArrowUpRight aria-hidden="true" size={17} />
          </Button>
        </section>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-6 rounded-lg border-2 border-ink bg-orange px-4 py-3 font-bold text-ink"
        >
          {error}
        </p>
      ) : null}

      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.1em] text-muted-foreground">
              Billing history
            </p>
            <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
              Recent orders
            </h2>
          </div>
          <IconReceipt aria-hidden="true" size={28} />
        </div>
        {data.orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="Completed Pancake payments will appear here after webhook delivery."
          />
        ) : (
          <div className="overflow-x-auto rounded-[14px] border-2 border-ink bg-surface shadow-brutal">
            <table className="w-full min-w-[42rem] border-collapse text-left">
              <caption className="sr-only">Recent orders</caption>
              <thead className="border-b-2 border-ink bg-muted text-sm font-black">
                <tr>
                  <th scope="col" className="px-5 py-4">
                    Product
                  </th>
                  <th scope="col" className="px-5 py-4">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-4">
                    Amount
                  </th>
                  <th scope="col" className="px-5 py-4">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-ink/15 last:border-0"
                  >
                    <td className="px-5 py-4 font-bold">
                      {order.productName ?? order.externalOrderId}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge
                        status={order.status}
                        variant={statusVariant(order.status)}
                      />
                    </td>
                    <td className="px-5 py-4">
                      {order.amount ?? '—'} {order.currency ?? ''}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}

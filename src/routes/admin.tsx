import { IconActivity, IconUsers } from '@tabler/icons-react';
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { AppShell } from '@/components/app/app-shell';
import { Metric } from '@/components/app/metric';
import { StatusBadge, statusVariant } from '@/components/app/status-badge';
import { Button } from '@/components/ui/button';
import {
  getAdminDashboardData,
  updateUserAccess,
} from '@/lib/server/app-functions.functions';
import { getCurrentSession } from '@/lib/server/session.functions';

/** Keep the administrator surface server-protected as well as visually gated. */
export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    const session = await getCurrentSession();
    if (!session || session.user.banned) {
      throw redirect({ to: '/login' });
    }
    if (session.user.role !== 'admin') {
      throw redirect({ to: '/dashboard' });
    }
  },
  loader: () => getAdminDashboardData(),
  head: () => ({
    meta: [
      { title: 'Admin' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: AdminPage,
});

/** Administrator metrics and the deliberately narrow access-management UI. */
function AdminPage() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const updateAccess = useServerFn(updateUserAccess);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function changeAccess(
    input:
      | { userId: string; action: 'set-role'; role: 'user' | 'admin' }
      | { userId: string; action: 'set-banned'; banned: boolean }
  ) {
    setPendingUserId(input.userId);
    setError(null);
    try {
      await updateAccess({ data: input });
      await router.invalidate({ sync: true });
    } catch (reason: unknown) {
      setError(
        reason instanceof Error ? reason.message : 'Access update failed.'
      );
    } finally {
      setPendingUserId(null);
    }
  }

  return (
    <AppShell
      session={data.session}
      activeSection="admin"
      eyebrow="Operations"
      title="Control room"
    >
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Users"
          value={data.metrics.userCount}
          detail="Latest 50 shown below"
          accent="cyan"
        />
        <Metric
          label="Orders"
          value={data.metrics.orderCount}
          detail="All Pancake order projections"
          accent="yellow"
        />
        <Metric
          label="Active plans"
          value={data.metrics.activeSubscriptionCount}
          detail="Subscriptions in active state"
          accent="green"
        />
        <Metric
          label="Prod webhook queue"
          value={data.metrics.pendingWebhookCount}
          detail="Received events awaiting projection"
          accent="lavender"
        />
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
              Access management
            </p>
            <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
              Users
            </h2>
          </div>
          <IconUsers aria-hidden="true" size={28} />
        </div>
        <div className="overflow-x-auto rounded-[14px] border-2 border-ink bg-surface shadow-brutal">
          <table className="w-full min-w-[58rem] border-collapse text-left">
            <caption className="sr-only">User access management</caption>
            <thead className="border-b-2 border-ink bg-muted text-sm font-black">
              <tr>
                <th scope="col" className="px-5 py-4">
                  User
                </th>
                <th scope="col" className="px-5 py-4">
                  Role
                </th>
                <th scope="col" className="px-5 py-4">
                  Access
                </th>
                <th scope="col" className="px-5 py-4">
                  Joined
                </th>
                <th scope="col" className="px-5 py-4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((item) => {
                const pending = pendingUserId === item.id;
                return (
                  <tr
                    key={item.id}
                    className="border-b border-ink/15 last:border-0"
                  >
                    <td className="px-5 py-4">
                      <p className="font-bold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.email}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge
                        status={item.role}
                        variant={statusVariant(item.role)}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge
                        status={item.banned ? 'banned' : 'active'}
                        variant={statusVariant(
                          item.banned ? 'banned' : 'active'
                        )}
                      />
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="plain"
                          className="!min-h-10 px-3 text-sm"
                          disabled={pending}
                          onClick={() =>
                            void changeAccess({
                              userId: item.id,
                              action: 'set-role',
                              role: item.role === 'admin' ? 'user' : 'admin',
                            })
                          }
                        >
                          {item.role === 'admin' ? 'Make user' : 'Make admin'}
                        </Button>
                        <Button
                          variant="secondary"
                          className="!min-h-10 px-3 text-sm"
                          disabled={pending}
                          onClick={() =>
                            void changeAccess({
                              userId: item.id,
                              action: 'set-banned',
                              banned: !item.banned,
                            })
                          }
                        >
                          {item.banned ? 'Unban' : 'Ban'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.1em] text-muted-foreground">
              Payment feed
            </p>
            <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
              Recent orders
            </h2>
          </div>
          <IconActivity aria-hidden="true" size={28} />
        </div>
        <div className="grid gap-3">
          {data.recentOrders.map((order) => (
            <div
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border-2 border-ink bg-surface px-5 py-4"
            >
              <div>
                <p className="font-black">
                  {order.productName ?? order.externalOrderId}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.buyerEmail ?? 'No buyer email'} ·{' '}
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge
                  status={order.status}
                  variant={statusVariant(order.status)}
                />
                <span className="font-bold">
                  {order.amount ?? '—'} {order.currency ?? ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

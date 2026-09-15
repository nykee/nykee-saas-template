import { cn } from '@/lib/utils';

/**
 * Shared status presentation for orders, subscriptions, and access flags.
 * The semantic variants keep color choices consistent across every app page.
 */
export function StatusBadge({
  status,
  variant = 'neutral',
}: {
  status: string;
  variant?: 'positive' | 'warning' | 'danger' | 'neutral';
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border-2 border-ink px-3 py-1 text-xs font-black uppercase tracking-[0.06em] text-ink',
        variant === 'positive' && 'bg-green',
        variant === 'warning' && 'bg-yellow',
        variant === 'danger' && 'bg-orange',
        variant === 'neutral' && 'bg-muted'
      )}
    >
      {status}
    </span>
  );
}

/** Map provider/user states to one shared visual language. */
export function statusVariant(
  status: string
): 'positive' | 'warning' | 'danger' | 'neutral' {
  const normalized = status.toLowerCase();
  if (
    ['active', 'completed', 'paid', 'processed', 'published'].includes(
      normalized
    )
  ) {
    return 'positive';
  }
  if (['pending', 'received', 'trialing', 'draft'].includes(normalized)) {
    return 'warning';
  }
  if (
    ['banned', 'failed', 'cancelled', 'refunded', 'expired'].includes(
      normalized
    )
  ) {
    return 'danger';
  }
  return 'neutral';
}

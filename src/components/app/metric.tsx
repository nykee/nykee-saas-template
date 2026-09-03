import { cn } from '@/lib/utils';

/**
 * Reusable dashboard metric tile. `accent` is a named semantic option rather
 * than an arbitrary class so dashboards keep the same visual hierarchy.
 */
export function Metric({
  label,
  value,
  detail,
  accent = 'yellow',
}: {
  label: string;
  value: string | number;
  detail?: string;
  accent?: 'yellow' | 'cyan' | 'green' | 'lavender';
}) {
  return (
    <section className="rounded-[14px] border-2 border-ink bg-surface p-5 shadow-brutal">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-extrabold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </p>
        <span
          aria-hidden="true"
          className={cn(
            'size-4 rounded-full border-2 border-ink',
            accent === 'yellow' && 'bg-yellow',
            accent === 'cyan' && 'bg-cyan',
            accent === 'green' && 'bg-green',
            accent === 'lavender' && 'bg-lavender'
          )}
        />
      </div>
      <p className="mt-4 text-4xl font-black tracking-[-0.04em]">{value}</p>
      {detail ? (
        <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      ) : null}
    </section>
  );
}

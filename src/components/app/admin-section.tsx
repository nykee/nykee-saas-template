import type { ReactNode } from 'react';

/**
 * Shared framing for administrator modules. The admin page can add new
 * operational surfaces without repeating heading hierarchy, spacing, or icon
 * placement rules in every section.
 */
export function AdminSection({
  eyebrow,
  title,
  icon,
  children,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly icon?: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <section className="mt-12">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.1em] text-muted-foreground">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
            {title}
          </h2>
        </div>
        {icon}
      </div>
      {children}
    </section>
  );
}

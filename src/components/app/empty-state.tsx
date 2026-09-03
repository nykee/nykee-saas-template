/**
 * Shared empty state for lists that are valid but currently contain no rows.
 * Keeping this state separate from loading and error states avoids ambiguous
 * dashboards and gives future pages one accessible pattern to reuse.
 */
export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border-2 border-dashed border-ink/40 bg-muted/40 p-8 text-center">
      <p className="font-black">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

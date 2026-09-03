import type { ReactNode } from 'react';
import { useId } from 'react';

/** A primary source link attached to a self-contained answer block. */
export interface GeoCitation {
  readonly label: string;
  readonly href: string;
  readonly publisher?: string;
}

/**
 * Render a server-friendly answer unit designed for passage-level citation.
 * Keep the answer self-contained and attach first-party sources instead of
 * hiding important facts in client-only interactions or decorative copy.
 */
export function GeoAnswerBlock({
  question,
  answer,
  sources = [],
  children,
}: {
  question: string;
  answer: string;
  sources?: readonly GeoCitation[];
  children?: ReactNode;
}) {
  /** React's deterministic ID keeps SSR and hydration aligned for every locale. */
  const headingId = useId().replaceAll(':', '');

  return (
    <section
      aria-labelledby={headingId}
      data-geo-answer
      className="rounded-[14px] border-2 border-ink bg-cyan p-6 text-ink shadow-brutal"
    >
      <h2 id={headingId} className="text-2xl font-black tracking-[-0.03em]">
        {question}
      </h2>
      <p className="mt-4 max-w-3xl text-base leading-7">{answer}</p>
      {children}
      {sources.length > 0 ? (
        <div className="mt-5 border-t-2 border-ink/20 pt-4">
          <p className="text-xs font-black uppercase tracking-[0.1em]">
            Sources
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {sources.map((source) => (
              <li key={source.href}>
                <a
                  href={source.href}
                  target={source.href.startsWith('http') ? '_blank' : undefined}
                  rel={
                    source.href.startsWith('http') ? 'noreferrer' : undefined
                  }
                  className="font-bold underline underline-offset-4"
                >
                  {source.label}
                  {source.publisher ? ` · ${source.publisher}` : ''}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

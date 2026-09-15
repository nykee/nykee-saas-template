import { Fragment } from 'react';

/**
 * Render the deliberately small blog body format without injecting HTML.
 *
 * Supported blocks are plain paragraphs, `##`/`###` headings, and consecutive
 * `- ` lines for lists. Keeping this parser narrow makes admin-authored text
 * safe by construction and leaves a clear migration path if a future product
 * needs a full Markdown pipeline.
 */
export function BlogContent({ content }: { readonly content: string }) {
  const blocks = content.trim().split(/\n\s*\n/);

  return (
    <div className="grid gap-7 text-lg leading-8 text-muted-foreground">
      {blocks.map((block, blockIndex) => {
        const lines = block.split('\n').map((line) => line.trimEnd());
        const firstLine = lines[0] ?? '';

        if (firstLine.startsWith('### ')) {
          return (
            <h3
              key={`${blockIndex}-${firstLine}`}
              className="text-2xl font-black leading-tight text-foreground"
            >
              {firstLine.slice(4)}
            </h3>
          );
        }

        if (firstLine.startsWith('## ')) {
          return (
            <h2
              key={`${blockIndex}-${firstLine}`}
              className="text-3xl font-black leading-tight tracking-[-0.03em] text-foreground"
            >
              {firstLine.slice(3)}
            </h2>
          );
        }

        if (
          lines.length > 0 &&
          lines.every((line) => line.startsWith('- '))
        ) {
          return (
            <ul
              key={`${blockIndex}-${firstLine}`}
              className="grid gap-3 pl-6 text-foreground marker:text-orange"
            >
              {lines.map((line) => (
                <li key={line}>{line.slice(2)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`${blockIndex}-${firstLine}`}>
            {lines.map((line, lineIndex) => (
              <Fragment key={`${blockIndex}-${lineIndex}`}>
                {line}
                {lineIndex < lines.length - 1 ? <br /> : null}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

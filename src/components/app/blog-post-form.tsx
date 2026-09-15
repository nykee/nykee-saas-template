import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  blogStatuses,
  type CreateBlogPostInput,
  validateCreateBlogPostInput,
} from '@/lib/blog';
import { appLocales, localeMeta } from '@/lib/locale';

/**
 * Administrator form for the smallest useful publishing workflow: one locale,
 * one slug, one title, one excerpt, one body, and one status. Validation is
 * shared with the server function so browser checks cannot drift from the
 * authoritative Worker-side contract.
 */
export function BlogPostForm({
  pending,
  onSubmit,
}: {
  readonly pending: boolean;
  readonly onSubmit: (input: CreateBlogPostInput) => Promise<boolean>;
}) {
  const [clientError, setClientError] = useState<string | null>(null);

  async function submitBlogPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClientError(null);

    try {
      const form = event.currentTarget;
      const input = validateCreateBlogPostInput(
        Object.fromEntries(new FormData(form))
      );
      const created = await onSubmit(input);
      if (created) {
        form.reset();
      }
    } catch (reason: unknown) {
      setClientError(
        reason instanceof Error ? reason.message : 'Blog post is invalid.'
      );
    }
  }

  return (
    <form
      onSubmit={(event) => void submitBlogPost(event)}
      className="rounded-[14px] border-2 border-ink bg-surface p-5 shadow-brutal"
    >
      <fieldset disabled={pending} className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-[1fr_10rem_10rem]">
          <label className="grid gap-2">
            <span className="text-sm font-black">Slug</span>
            <input
              name="slug"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              maxLength={80}
              placeholder="reusable-saas-starter"
              className="min-h-12 rounded-lg border-2 border-ink bg-background px-4 font-bold text-foreground outline-none focus:ring-4 focus:ring-focus"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black">Locale</span>
            <select
              name="locale"
              defaultValue="en"
              className="min-h-12 rounded-lg border-2 border-ink bg-background px-4 font-bold text-foreground outline-none focus:ring-4 focus:ring-focus"
            >
              {appLocales.map((locale) => (
                <option key={locale} value={locale}>
                  {localeMeta[locale].label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black">Status</span>
            <select
              name="status"
              defaultValue="published"
              className="min-h-12 rounded-lg border-2 border-ink bg-background px-4 font-bold text-foreground outline-none focus:ring-4 focus:ring-focus"
            >
              {blogStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-black">Title</span>
          <input
            name="title"
            required
            maxLength={160}
            className="min-h-12 rounded-lg border-2 border-ink bg-background px-4 font-bold text-foreground outline-none focus:ring-4 focus:ring-focus"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black">Excerpt</span>
          <textarea
            name="excerpt"
            required
            maxLength={320}
            rows={3}
            className="rounded-lg border-2 border-ink bg-background px-4 py-3 font-bold text-foreground outline-none focus:ring-4 focus:ring-focus"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black">Content</span>
          <textarea
            name="content"
            required
            rows={10}
            className="rounded-lg border-2 border-ink bg-background px-4 py-3 font-bold leading-7 text-foreground outline-none focus:ring-4 focus:ring-focus"
          />
          <span className="text-xs font-bold text-muted-foreground">
            Use blank lines for paragraphs, `##` for headings, and `-` for
            simple lists.
          </span>
        </label>

        {clientError ? (
          <p
            role="alert"
            className="rounded-lg border-2 border-ink bg-orange px-4 py-3 text-sm font-bold text-ink"
          >
            {clientError}
          </p>
        ) : null}

        <Button type="submit" className="justify-self-start">
          {pending ? 'Creating…' : 'Create blog post'}
        </Button>
      </fieldset>
    </form>
  );
}

import { EmptyState } from '@/components/app/empty-state';
import { StatusBadge, statusVariant } from '@/components/app/status-badge';
import { blogPostPath } from '@/config/blog';
import {
  type AdminBlogPost,
  formatBlogDate,
} from '@/lib/blog';

/**
 * Private editorial list for admins. It deliberately shows metadata only;
 * full content remains on the create form and public article route until edit
 * workflows are added with their own validation boundary.
 */
export function BlogPostTable({
  posts,
}: {
  readonly posts: readonly AdminBlogPost[];
}) {
  if (posts.length === 0) {
    return (
      <EmptyState
        title="No blog posts yet"
        description="Create the first article from the form above."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-[14px] border-2 border-ink bg-surface shadow-brutal">
      <table className="w-full min-w-[62rem] border-collapse text-left">
        <caption className="sr-only">Blog post management</caption>
        <thead className="border-b-2 border-ink bg-muted text-sm font-black">
          <tr>
            <th scope="col" className="px-5 py-4">
              Post
            </th>
            <th scope="col" className="px-5 py-4">
              Locale
            </th>
            <th scope="col" className="px-5 py-4">
              Status
            </th>
            <th scope="col" className="px-5 py-4">
              Updated
            </th>
            <th scope="col" className="px-5 py-4">
              Public route
            </th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className="border-b border-ink/15 last:border-0">
              <td className="px-5 py-4">
                <p className="font-bold">{post.title}</p>
                <p className="text-sm text-muted-foreground">/{post.slug}</p>
              </td>
              <td className="px-5 py-4 font-black uppercase">
                {post.locale}
              </td>
              <td className="px-5 py-4">
                <StatusBadge
                  status={post.status}
                  variant={statusVariant(post.status)}
                />
              </td>
              <td className="px-5 py-4 text-sm text-muted-foreground">
                {formatBlogDate(post.updatedAt, post.locale)}
              </td>
              <td className="px-5 py-4">
                {post.status === 'published' ? (
                  <a
                    href={blogPostPath(post.locale, post.slug)}
                    className="font-black underline underline-offset-4 hover:text-foreground"
                  >
                    Open
                  </a>
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">
                    Draft only
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import {
  IconArrowLeft,
  IconLayoutDashboard,
  IconLogout,
  IconShield,
} from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { websiteConfig } from '@/config/website';
import { getAuthClient } from '@/lib/client/auth';
import type { CurrentSession } from '@/lib/server/session.server';
import { cn } from '@/lib/utils';

/** Navigation sections shared by the user and administrator surfaces. */
type AppSection = 'dashboard' | 'admin';

/**
 * Shared authenticated application frame.
 *
 * The frame owns the brand bar, responsive section navigation, sign-out
 * action, and skip target. Pages supply only their title and content so these
 * interaction rules cannot drift between dashboards.
 */
export function AppShell({
  session,
  activeSection,
  eyebrow,
  title,
  children,
}: {
  session: CurrentSession;
  activeSection: AppSection;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  const sections: Array<{
    id: AppSection;
    label: string;
    href: string;
    icon: ReactNode;
  }> = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: <IconLayoutDashboard aria-hidden="true" size={18} />,
    },
    ...(session.user.role === 'admin'
      ? [
          {
            id: 'admin' as const,
            label: 'Admin',
            href: '/admin',
            icon: <IconShield aria-hidden="true" size={18} />,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg border-2 border-ink bg-yellow px-4 py-2 font-black text-ink shadow-brutal focus:translate-y-0"
      >
        Skip to content
      </a>
      <header className="border-b-2 border-ink bg-surface">
        <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-7">
          <a
            href="/"
            className="flex items-center gap-3 no-underline"
            aria-label={websiteConfig.name}
          >
            <Logo />
            <span className="text-xl font-black tracking-[-0.02em]">
              {websiteConfig.name}
            </span>
          </a>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-black">{session.user.name}</p>
              <p className="text-xs text-muted-foreground">
                {session.user.email}
              </p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-8 sm:px-7 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12 lg:py-12">
        <aside>
          <nav
            aria-label="Application navigation"
            className="grid gap-2 sm:flex sm:flex-wrap lg:sticky lg:top-8 lg:grid lg:content-start"
          >
            {sections.map((section) => (
              <a
                key={section.id}
                href={section.href}
                aria-current={activeSection === section.id ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl border-2 px-4 py-3 font-black no-underline transition-colors',
                  activeSection === section.id
                    ? 'border-ink bg-yellow text-ink shadow-brutal-xs'
                    : 'border-transparent hover:border-ink hover:bg-muted'
                )}
              >
                {section.icon}
                {section.label}
              </a>
            ))}
            <a
              href="/"
              className="flex items-center gap-3 rounded-xl border-2 border-transparent px-4 py-3 font-black text-muted-foreground no-underline hover:border-ink hover:bg-muted hover:text-foreground"
            >
              <IconArrowLeft aria-hidden="true" size={18} />
              Public site
            </a>
          </nav>
        </aside>

        <main id="main-content" className="min-w-0">
          <div className="mb-8 border-b-2 border-ink pb-7">
            <p className="text-sm font-black uppercase tracking-[0.12em] text-muted-foreground">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              {title}
            </h1>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

/** Shared sign-out action used by every authenticated shell. */
function SignOutButton() {
  return (
    <Button
      variant="plain"
      className="!min-h-11 px-3 text-sm"
      onClick={async () => {
        await getAuthClient().signOut();
        window.location.assign('/');
      }}
      aria-label="Sign out"
    >
      <IconLogout aria-hidden="true" size={17} />
      <span className="hidden sm:inline">Sign out</span>
    </Button>
  );
}

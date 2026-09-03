import { IconBrandGoogle, IconSparkles } from '@tabler/icons-react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/shared/logo';
import { BrutalCard } from '@/components/ui/brutal-card';
import { Button } from '@/components/ui/button';
import { getAuthClient } from '@/lib/client/auth';
import { message } from '@/lib/locale';
import { getCurrentSession } from '@/lib/server/session.functions';

/** Keep authenticated visitors out of the sign-in page. */
export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const session = await getCurrentSession();
    if (session && !session.user.banned) {
      throw redirect({
        to: session.user.role === 'admin' ? '/admin' : '/dashboard',
      });
    }
  },
  head: () => ({
    meta: [
      { title: message('auth_login_title', 'en') },
      { name: 'description', content: message('auth_login_description', 'en') },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: LoginPage,
});

/**
 * Sign-in surface for both regular Google OAuth and Google One Tap.
 *
 * One Tap is started only in an effect, so the server never evaluates browser
 * globals. The regular button remains an explicit, keyboard-accessible sign-in
 * action for browsers where Google does not show a prompt.
 */
function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const auth = getAuthClient();
    void auth
      .oneTap({
        callbackURL: '/dashboard',
        onPromptNotification: () => {
          if (!cancelled) {
            setError(null);
          }
        },
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(
            reason instanceof Error
              ? reason.message
              : 'Google One Tap could not start.'
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main id="main-content" className="min-h-screen px-5 py-8 sm:px-7 sm:py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        <header className="flex items-center justify-between gap-4">
          <a
            href="/"
            className="flex items-center gap-3 no-underline"
            aria-label="Back to public site"
          >
            <Logo />
            <span className="text-xl font-black">
              {message('auth_brand_label', 'en')}
            </span>
          </a>
          <a
            href="/"
            className="font-black text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            {message('auth_back_home', 'en')}
          </a>
        </header>

        <div className="grid items-center gap-12 lg:grid-cols-[1fr_26rem]">
          <section className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-cyan px-4 py-2 font-black text-ink shadow-brutal-xs">
              <IconSparkles aria-hidden="true" size={17} />
              {message('auth_one_tap_badge', 'en')}
            </span>
            <h1 className="mt-6 text-5xl font-black tracking-[-0.06em] sm:text-7xl">
              {message('auth_login_heading', 'en')}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
              {message('auth_login_description', 'en')}
            </p>
          </section>

          <BrutalCard className="bg-surface p-7 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full border-2 border-ink bg-yellow text-ink">
                <IconBrandGoogle aria-hidden="true" size={21} />
              </span>
              <div>
                <h2 className="font-black">
                  {message('auth_card_title', 'en')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {message('auth_card_description', 'en')}
                </p>
              </div>
            </div>
            <Button
              className="mt-7 w-full"
              disabled={pending}
              onClick={async () => {
                setPending(true);
                setError(null);
                try {
                  await getAuthClient().signIn.social({
                    provider: 'google',
                    callbackURL: '/dashboard',
                  });
                } catch (reason: unknown) {
                  setPending(false);
                  setError(
                    reason instanceof Error
                      ? reason.message
                      : 'Google sign-in failed.'
                  );
                }
              }}
            >
              <IconBrandGoogle aria-hidden="true" size={19} />
              {pending
                ? message('auth_signing_in', 'en')
                : message('auth_google_button', 'en')}
            </Button>
            <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
              {message('auth_privacy_note', 'en')}
            </p>
            {error ? (
              <p
                role="alert"
                className="mt-4 rounded-lg border-2 border-ink bg-orange px-4 py-3 text-sm font-bold text-ink"
              >
                {error}
              </p>
            ) : null}
          </BrutalCard>
        </div>
      </div>
    </main>
  );
}

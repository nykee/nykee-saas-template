import { IconBrandGoogle, IconX } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogTitle,
  DialogViewport,
} from '@/components/ui/dialog';
import { getAuthClient } from '@/lib/client/auth';
import { type AppLocale, message } from '@/lib/locale';

export interface LoginDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  locale?: AppLocale;
}

export function LoginDialog({
  open,
  onOpenChange,
  defaultOpen,
  locale = 'en',
}: LoginDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    try {
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
    } catch (reason: unknown) {
      if (!cancelled) {
        setError(
          reason instanceof Error
            ? reason.message
            : 'Google authentication client not ready.'
        );
      }
    }
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleGoogleSignIn = async () => {
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
        reason instanceof Error ? reason.message : 'Google sign-in failed.'
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} defaultOpen={defaultOpen}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogViewport>
          <DialogPopup>
            <div className="absolute right-4 top-4">
              <DialogClose
                className="flex size-9 items-center justify-center rounded-lg border-2 border-ink bg-surface text-foreground shadow-brutal-xs transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 hover:bg-muted active:translate-y-0"
                aria-label={message('nav_close_menu', locale)}
              >
                <IconX aria-hidden="true" size={18} />
              </DialogClose>
            </div>

            <div className="flex items-center gap-3 pr-10">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-yellow text-ink shadow-brutal-xs">
                <IconBrandGoogle aria-hidden="true" size={21} />
              </span>
              <div>
                <DialogTitle>{message('auth_card_title', locale)}</DialogTitle>
                <DialogDescription className="mt-0.5">
                  {message('auth_card_description', locale)}
                </DialogDescription>
              </div>
            </div>

            <Button
              className="mt-6 w-full"
              disabled={pending}
              onClick={handleGoogleSignIn}
            >
              <IconBrandGoogle aria-hidden="true" size={19} />
              {pending
                ? message('auth_signing_in', locale)
                : message('auth_google_button', locale)}
            </Button>

            <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
              {message('auth_privacy_note', locale)}
            </p>

            {error ? (
              <p
                role="alert"
                className="mt-4 rounded-lg border-2 border-ink bg-orange px-4 py-3 text-sm font-bold text-ink"
              >
                {error}
              </p>
            ) : null}
          </DialogPopup>
        </DialogViewport>
      </DialogPortal>
    </Dialog>
  );
}

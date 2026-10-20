import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

export function Dialog(
  props: ComponentPropsWithoutRef<typeof BaseDialog.Root>
) {
  return <BaseDialog.Root {...props} />;
}

export function DialogTrigger(
  props: ComponentPropsWithoutRef<typeof BaseDialog.Trigger>
) {
  return <BaseDialog.Trigger {...props} />;
}

export function DialogPortal(
  props: ComponentPropsWithoutRef<typeof BaseDialog.Portal>
) {
  return <BaseDialog.Portal {...props} />;
}

export function DialogBackdrop({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof BaseDialog.Backdrop>) {
  return (
    <BaseDialog.Backdrop
      className={cn(
        'fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0',
        className
      )}
      {...props}
    />
  );
}

export function DialogViewport({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof BaseDialog.Viewport>) {
  return (
    <BaseDialog.Viewport
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto outline-none',
        className
      )}
      {...props}
    />
  );
}

export function DialogPopup({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof BaseDialog.Popup>) {
  return (
    <BaseDialog.Popup
      className={cn(
        'relative w-full max-w-md rounded-[14px] border-2 border-ink bg-surface p-7 text-foreground shadow-brutal outline-none transition-[transform,opacity] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 sm:p-8',
        className
      )}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof BaseDialog.Title>) {
  return (
    <BaseDialog.Title
      className={cn('text-xl font-black tracking-[-0.02em]', className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof BaseDialog.Description>) {
  return (
    <BaseDialog.Description
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export function DialogClose({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof BaseDialog.Close>) {
  return <BaseDialog.Close className={className} {...props} />;
}

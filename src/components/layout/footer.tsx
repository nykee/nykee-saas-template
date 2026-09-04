import { Container } from '@/components/layout/container';
import { PublicPageLinks } from '@/components/layout/public-page-links';
import { Logo } from '@/components/shared/logo';
import { websiteConfig } from '@/config/website';
import { type AppLocale, message } from '@/lib/locale';

export function Footer({ locale }: { locale: AppLocale }) {
  return (
    <footer className="border-t border-ink/20 bg-surface py-12 text-foreground">
      <Container className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-lg">
          <div className="mb-4 flex items-center gap-3">
            <Logo />
            <span className="text-xl font-black">{websiteConfig.name}</span>
          </div>
          <p className="text-muted-foreground">
            {message('footer_tagline', locale)}
          </p>
        </div>
        <div className="grid gap-4 border-t-2 border-ink/20 pt-5 sm:border-t-0 sm:pt-0 sm:text-right">
          <PublicPageLinks locale={locale} listClassName="sm:justify-end" />
          <a
            href={`mailto:${websiteConfig.supportEmail}`}
            className="text-sm font-bold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            aria-label={`${message('footer_support_email_label', locale)}: ${websiteConfig.supportEmail}`}
          >
            {websiteConfig.supportEmail}
          </a>
          <p className="text-sm text-muted-foreground">
            © {websiteConfig.name} {new Date().getFullYear()}
            {'. '}
            {message('footer_rights', locale)}
          </p>
        </div>
      </Container>
    </footer>
  );
}

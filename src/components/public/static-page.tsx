import { Container } from '@/components/layout/container';
import { PublicPageLinks } from '@/components/layout/public-page-links';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { Section } from '@/components/ui/section';
import {
  type StaticPageKind,
  staticPageDefinitions,
  staticPageSeoId,
} from '@/config/static-pages';
import { type AppLocale, message } from '@/lib/locale';

export function StaticPage({
  page,
  locale,
}: {
  readonly page: StaticPageKind;
  readonly locale: AppLocale;
}) {
  const definition = staticPageDefinitions[page];

  return (
    <main id="main-content">
      <section className="bg-background py-16 sm:py-24">
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="max-w-3xl">
            <Breadcrumbs pageId={staticPageSeoId(page, locale)} />
            <p className="mt-8 text-sm font-black uppercase text-muted-foreground">
              {message(definition.eyebrowKey, locale)}
            </p>
            <h1 className="mt-4 text-4xl font-black leading-[0.98] text-foreground sm:text-6xl">
              {message(definition.titleKey, locale)}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              {message(definition.descriptionKey, locale)}
            </p>
          </div>

          <aside className="border-t border-ink/20 pt-6 lg:border-l lg:border-t-0 lg:pl-8">
            <p className="text-sm font-black uppercase text-muted-foreground">
              {message('public_page_updated_label', locale)}
            </p>
            <p className="mt-2 text-base font-black text-foreground">
              {message(definition.updatedKey, locale)}
            </p>
            <p className="mt-8 text-sm font-black uppercase text-muted-foreground">
              {message('public_page_related_label', locale)}
            </p>
            <PublicPageLinks
              locale={locale}
              currentPage={page}
              className="mt-3"
              listClassName="grid gap-3"
            />
          </aside>
        </Container>
      </section>

      <Section className="bg-surface">
        <Container className="grid gap-10">
          {definition.sections.map((section) => (
            <article
              key={section.headingKey}
              className="grid gap-4 border-t border-ink/15 pt-8 first:border-t-0 first:pt-0 md:grid-cols-[16rem_minmax(0,1fr)]"
            >
              <h2 className="text-2xl font-black leading-tight text-foreground">
                {message(section.headingKey, locale)}
              </h2>
              <div className="grid gap-4 text-base leading-8 text-muted-foreground sm:text-lg">
                {section.bodyKeys.map((bodyKey) => (
                  <p key={bodyKey}>{message(bodyKey, locale)}</p>
                ))}
              </div>
            </article>
          ))}
        </Container>
      </Section>
    </main>
  );
}

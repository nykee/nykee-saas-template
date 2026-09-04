import type { AppLocale, MessageKey } from '@/lib/locale';

export const staticPageKinds = ['about', 'privacy', 'terms'] as const;

export type StaticPageKind = (typeof staticPageKinds)[number];

interface StaticPageSectionDefinition {
  readonly headingKey: MessageKey;
  readonly bodyKeys: readonly MessageKey[];
}

interface StaticPageDefinition {
  readonly navLabelKey: MessageKey;
  readonly metaTitleKey: MessageKey;
  readonly metaDescriptionKey: MessageKey;
  readonly eyebrowKey: MessageKey;
  readonly titleKey: MessageKey;
  readonly descriptionKey: MessageKey;
  readonly updatedKey: MessageKey;
  readonly sections: readonly StaticPageSectionDefinition[];
  readonly priority: number;
}

/**
 * Generic static-page structure for the starter. The copy is intentionally
 * broad so downstream projects can replace the messages without touching
 * routing, SEO metadata, language switching, or footer navigation.
 */
export const staticPageDefinitions: Record<
  StaticPageKind,
  StaticPageDefinition
> = {
  about: {
    navLabelKey: 'page_about_nav',
    metaTitleKey: 'page_about_meta_title',
    metaDescriptionKey: 'page_about_meta_description',
    eyebrowKey: 'page_about_eyebrow',
    titleKey: 'page_about_title',
    descriptionKey: 'page_about_description',
    updatedKey: 'page_about_updated',
    sections: [
      {
        headingKey: 'page_about_section_scope_heading',
        bodyKeys: ['page_about_section_scope_body'],
      },
      {
        headingKey: 'page_about_section_customize_heading',
        bodyKeys: ['page_about_section_customize_body'],
      },
    ],
    priority: 0.7,
  },
  privacy: {
    navLabelKey: 'page_privacy_nav',
    metaTitleKey: 'page_privacy_meta_title',
    metaDescriptionKey: 'page_privacy_meta_description',
    eyebrowKey: 'page_privacy_eyebrow',
    titleKey: 'page_privacy_title',
    descriptionKey: 'page_privacy_description',
    updatedKey: 'page_privacy_updated',
    sections: [
      {
        headingKey: 'page_privacy_section_overview_heading',
        bodyKeys: ['page_privacy_section_overview_body'],
      },
      {
        headingKey: 'page_privacy_section_services_heading',
        bodyKeys: ['page_privacy_section_services_body'],
      },
      {
        headingKey: 'page_privacy_section_update_heading',
        bodyKeys: ['page_privacy_section_update_body'],
      },
    ],
    priority: 0.4,
  },
  terms: {
    navLabelKey: 'page_terms_nav',
    metaTitleKey: 'page_terms_meta_title',
    metaDescriptionKey: 'page_terms_meta_description',
    eyebrowKey: 'page_terms_eyebrow',
    titleKey: 'page_terms_title',
    descriptionKey: 'page_terms_description',
    updatedKey: 'page_terms_updated',
    sections: [
      {
        headingKey: 'page_terms_section_template_heading',
        bodyKeys: ['page_terms_section_template_body'],
      },
      {
        headingKey: 'page_terms_section_owner_heading',
        bodyKeys: ['page_terms_section_owner_body'],
      },
      {
        headingKey: 'page_terms_section_update_heading',
        bodyKeys: ['page_terms_section_update_body'],
      },
    ],
    priority: 0.4,
  },
};

export const staticPagePaths: Record<
  StaticPageKind,
  Record<AppLocale, string>
> = {
  about: {
    en: '/about',
    es: '/es/about',
    fr: '/fr/about',
  },
  privacy: {
    en: '/privacy',
    es: '/es/privacy',
    fr: '/fr/privacy',
  },
  terms: {
    en: '/terms',
    es: '/es/terms',
    fr: '/fr/terms',
  },
};

export function staticPagePath(page: StaticPageKind, locale: AppLocale) {
  return staticPagePaths[page][locale];
}

export function staticPageSeoId(page: StaticPageKind, locale: AppLocale) {
  return `${page}-${locale}`;
}

export function getStaticPageKindByPath(pathname: string) {
  const normalizedPathname =
    pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;

  for (const page of staticPageKinds) {
    for (const path of Object.values(staticPagePaths[page])) {
      if (path === normalizedPathname) {
        return page;
      }
    }
  }

  return undefined;
}

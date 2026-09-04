import * as m from '@/locale/paraglide/messages';

export const appLocales = ['en', 'es', 'fr'] as const;

export type AppLocale = (typeof appLocales)[number];
export type MessageKey = keyof typeof m;

export function message(key: MessageKey, locale: AppLocale): string {
  const value = m[key];
  if (typeof value !== 'function') {
    return key;
  }
  return value({}, { locale });
}

export function localizedPath(locale: AppLocale, hash = '') {
  const prefix = locale === 'es' ? '/es' : locale === 'fr' ? '/fr' : '/';
  return `${prefix}${hash}`;
}

export const localeMeta = {
  en: { hreflang: 'en', label: 'EN', messageKey: 'language_english' },
  es: { hreflang: 'es', label: 'ES', messageKey: 'language_spanish' },
  fr: { hreflang: 'fr', label: 'FR', messageKey: 'language_french' },
} as const;

import * as m from '@/locale/paraglide/messages';

export type AppLocale = 'en' | 'zh' | 'es';
export type MessageKey = keyof typeof m;

export function message(key: MessageKey, locale: AppLocale): string {
  const value = m[key];
  if (typeof value !== 'function') {
    return key;
  }
  return value({}, { locale });
}

export function localizedPath(locale: AppLocale, hash = '') {
  const prefix = locale === 'zh' ? '/zh' : locale === 'es' ? '/es' : '/';
  return `${prefix}${hash}`;
}

export const localeMeta = {
  en: { hreflang: 'en', label: 'EN', messageKey: 'language_english' },
  zh: { hreflang: 'zh-CN', label: '中', messageKey: 'language_chinese' },
  es: { hreflang: 'es', label: 'ES', messageKey: 'language_spanish' },
} as const;

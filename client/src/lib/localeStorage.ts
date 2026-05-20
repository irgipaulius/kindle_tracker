export type AppLocale = 'en' | 'fr';

const STORAGE_KEY = 'hyperreader.locale';

export function readLocalePreference(): AppLocale {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem(STORAGE_KEY) === 'fr' ? 'fr' : 'en';
}

export function writeLocalePreference(locale: AppLocale) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, locale);
  }
}

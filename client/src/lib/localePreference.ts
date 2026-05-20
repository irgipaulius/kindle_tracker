import i18n from '../i18n';

import { writeLocalePreference, type AppLocale } from './localeStorage';

export type { AppLocale } from './localeStorage';
export { readLocalePreference } from './localeStorage';

export function applyLocalePreference(locale: AppLocale) {
  writeLocalePreference(locale);
  void i18n.changeLanguage(locale);
}

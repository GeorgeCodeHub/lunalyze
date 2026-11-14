import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import common from './locales/en/common.json';
import sites from './locales/en/sites.json';

export const defaultNS = 'common';

// English only. All user-facing copy lives in src/locales/en/, one file per domain.
export const resources = { en: { common, sites } } as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  defaultNS,
  interpolation: { escapeValue: false }, // React escapes already
});

export default i18n;

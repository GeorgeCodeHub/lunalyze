import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import common from './locales/en/common.json';
import compare from './locales/en/compare.json';
import sites from './locales/en/sites.json';

export const defaultNS = 'common';

// English only. All user-facing copy lives in frontend/locales/en/, one file per domain.
export const resources = { en: { common, sites, compare } } as const;

/** A site id with a name and blurb in sites.json (locales.test.ts checks every site has them). */
export type SiteId = Exclude<keyof (typeof resources)['en']['sites'], 'groups'>;

void i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  defaultNS,
  interpolation: { escapeValue: false }, // React escapes already
});

export default i18n;

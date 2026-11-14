import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import elCommon from './locales/el/common.json';
import elSites from './locales/el/sites.json';
import enCommon from './locales/en/common.json';
import enSites from './locales/en/sites.json';

export const defaultNS = 'common';

export const resources = {
  en: { common: enCommon, sites: enSites },
  el: { common: elCommon, sites: elSites },
} as const;

// ?lang=el in the URL switches to Greek; English otherwise.
const lang = new URLSearchParams(globalThis.location?.search).get('lang') === 'el' ? 'el' : 'en';

void i18n.use(initReactI18next).init({
  resources,
  lng: lang,
  fallbackLng: 'en',
  defaultNS,
  interpolation: { escapeValue: false }, // React escapes already
});

export default i18n;

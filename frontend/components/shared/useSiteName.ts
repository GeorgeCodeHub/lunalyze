import { useTranslation } from 'react-i18next';
import type { Site } from '../../../backend/lib/types';
import { siteNameKey } from '../site-picker/siteIds';

/** Returns a function that names a place: its name from the sites list, or "Your coordinates" for typed coordinates. */
export const useSiteName = () => {
  const { t } = useTranslation('compare');

  return (site: Site): string => (site.kind === 'typed' ? t('site.typedTitle') : t(siteNameKey(site.id), { ns: 'sites' }));
};

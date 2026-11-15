import { useTranslation } from 'react-i18next';
import { formatNumber } from './formatTime';

/** Returns a function that writes a place on the Moon in words: (-86.04, 2.7) → "86.04° south, 2.70° east". */
export const usePosition = () => {
  const { t } = useTranslation('compare');

  return (lat: number, lon: number): string =>
    t('site.position', {
      lat: t(lat < 0 ? 'site.latSouth' : 'site.latNorth', { value: formatNumber(Math.abs(lat), 2) }),
      lon: t(lon < 0 ? 'site.lonWest' : 'site.lonEast', { value: formatNumber(Math.abs(lon), 2) }),
    });
};

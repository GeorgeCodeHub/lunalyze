import { useTranslation } from 'react-i18next';
import { durationParts } from './durationParts';

/** Returns a function that writes a length of time in words: 37.12 → "1 day 13 hours". */
export const useDuration = () => {
  const { t } = useTranslation('compare');

  return (lengthH: number): string => {
    const { days, hours, minutes } = durationParts(lengthH);
    const onlyMinutes = days === 0 && hours === 0;
    return [
      days > 0 ? t('duration.days', { count: days }) : '',
      hours > 0 ? t('duration.hours', { count: hours }) : '',
      minutes > 0 || onlyMinutes ? t('duration.minutes', { count: minutes }) : '',
    ]
      .filter(Boolean)
      .join(' ');
  };
};

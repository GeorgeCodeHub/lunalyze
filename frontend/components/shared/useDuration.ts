import { useTranslation } from 'react-i18next';
import { durationParts } from './durationParts';

/**
 * Returns a function that writes a length of time: 37.12 → "1 day 13 hours", or with 'short'
 * "1d 13h" for the places where the number is read at a glance.
 */
export const useDuration = () => {
  const { t } = useTranslation('compare');

  return (lengthH: number, form: 'long' | 'short' = 'long'): string => {
    const { days, hours, minutes } = durationParts(lengthH);
    const onlyMinutes = days === 0 && hours === 0;
    const keys = form === 'short' ? (['durationShort.days', 'durationShort.hours', 'durationShort.minutes'] as const) : (['duration.days', 'duration.hours', 'duration.minutes'] as const);
    return [
      days > 0 ? t(keys[0], { count: days }) : '',
      hours > 0 ? t(keys[1], { count: hours }) : '',
      minutes > 0 || onlyMinutes ? t(keys[2], { count: minutes }) : '',
    ]
      .filter(Boolean)
      .join(' ');
  };
};

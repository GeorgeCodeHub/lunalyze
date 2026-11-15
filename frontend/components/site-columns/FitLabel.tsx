import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { testIds } from '../../test-ids';
import { formatDay } from '../shared/formatTime';
import IconCheck from '../shared/IconCheck';
import type { StayFit } from './stayFit';
import styles from './FitLabel.module.css';

type FitLabelProps = {
  fit: StayFit;
  why?: ReactNode; // the best option's reason: when the place fits, it takes the place of the 50-hour line
};

// Whether this place fits the stay, in one line. (When the Sun and Earth are in view during the stay is
// drawn once, in the live view's timelines, not again on each card.) A place that fits gets
// a tick: nothing to act on. Beside it, the best option says why it won ("shortest time with no Sun and
// no Earth, of 10 places"), which already tells it stays inside the 50 hours; another place gives the
// 50-hour rule. A risky place gets the dark period's times; its Risky tag sits in the card's header,
// by the role badge. The full sentence, with the exact times, is in the card's details.
const FitLabel = ({ fit, why }: FitLabelProps) => {
  const { t } = useTranslation('compare');

  return (
    <div className={styles.fit} data-testid={testIds.siteColumns.fit} data-fit={fit.status}>
      {fit.status === 'fits' ? (
        <div className={styles.line}>
          <IconCheck />
          <span className={styles.visuallyHidden}>{t('fit.fits')}. </span>
          {why ?? <p className={styles.text}>{t('fit.fitsShort')}</p>}
        </div>
      ) : (
        <p className={styles.line}>
          {t('fit.riskyShort', {
            from: fit.fromLanding ? t('fit.landing') : formatDay(fit.fromMs),
            to: fit.toEnd ? t('fit.endOfStay') : formatDay(fit.toMs),
          })}
        </p>
      )}
    </div>
  );
};

export default FitLabel;

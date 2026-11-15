import { useTranslation } from 'react-i18next';
import type { SiteView } from '../../../backend/lib/types';
import { testIds } from '../../test-ids';
import { formatDay } from '../shared/formatTime';
import IconAlert from '../shared/IconAlert';
import IconCheck from '../shared/IconCheck';
import StayStrip from './StayStrip';
import type { StayFit } from './stayFit';
import styles from './FitLabel.module.css';

type FitLabelProps = {
  fit: StayFit;
  lanes: Pick<SiteView['lanes'], 'sun' | 'earth'>; // the Moon day from landing
  startMs: number; // the landing time
  stayH: number;
};

// Whether this place fits the stay, the stay drawn as a strip, and why in a few words.
// A place that fits gets a quiet line with a tick: nothing to act on. A risky place gets a framed
// warning, also on the best option, because "best" can mean the closest when no place fits.
// The full sentence, with the exact times, is in the card's details.
const FitLabel = ({ fit, lanes, startMs, stayH }: FitLabelProps) => {
  const { t } = useTranslation('compare');

  return (
    <div className={styles.fit} data-testid={testIds.siteColumns.fit} data-fit={fit.status}>
      {fit.status === 'fits' ? (
        <p className={styles.fits}>
          <IconCheck />
          <span className={styles.visuallyHidden}>{t('fit.fits')}. </span>
          {t('fit.fitsShort')}
        </p>
      ) : (
        <p className={styles.risky}>
          <IconAlert />
          {t('fit.risky')}
        </p>
      )}
      <StayStrip lanes={lanes} fit={fit} startMs={startMs} stayH={stayH} />
      {fit.status === 'risky' && (
        <p className={styles.reason}>
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

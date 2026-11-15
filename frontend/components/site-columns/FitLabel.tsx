import { useTranslation } from 'react-i18next';
import type { SiteView } from '../../../backend/lib/types';
import { testIds } from '../../test-ids';
import { formatDay } from '../shared/formatTime';
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

// Whether this place fits the stay in one line, then the stay drawn as a strip. A place that fits gets
// a tick: nothing to act on. A risky place gets the dark period's times; its Risky tag sits in the
// card's header, by the role badge. The full sentence, with the exact times, is in the card's details.
const FitLabel = ({ fit, lanes, startMs, stayH }: FitLabelProps) => {
  const { t } = useTranslation('compare');

  return (
    <div className={styles.fit} data-testid={testIds.siteColumns.fit} data-fit={fit.status}>
      {fit.status === 'fits' ? (
        <p className={styles.line}>
          <IconCheck />
          <span className={styles.visuallyHidden}>{t('fit.fits')}. </span>
          {t('fit.fitsShort')}
        </p>
      ) : (
        <p className={styles.line}>
          {t('fit.riskyShort', {
            from: fit.fromLanding ? t('fit.landing') : formatDay(fit.fromMs),
            to: fit.toEnd ? t('fit.endOfStay') : formatDay(fit.toMs),
          })}
        </p>
      )}
      <StayStrip lanes={lanes} fit={fit} startMs={startMs} stayH={stayH} />
    </div>
  );
};

export default FitLabel;

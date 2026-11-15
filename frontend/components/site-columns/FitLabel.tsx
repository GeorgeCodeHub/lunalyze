import { useTranslation } from 'react-i18next';
import { testIds } from '../../test-ids';
import { formatDay } from '../shared/formatTime';
import IconAlert from '../shared/IconAlert';
import IconCheck from '../shared/IconCheck';
import type { SiteView } from '../../../backend/lib/types';
import StayStrip from './StayStrip';
import type { StayFit } from './stayFit';
import styles from './FitLabel.module.css';

type FitLabelProps = {
  fit: StayFit;
  lanes: Pick<SiteView['lanes'], 'sun' | 'earth'>; // the Moon day from landing
  startMs: number; // the landing time
  stayH: number;
};

// The verdict for this place and this stay, the stay drawn as a strip, and why in a few words. "Fits" has a solid edge and a
// tick; "Risky" a dashed edge and a warning mark, so the two never differ by colour alone.
// The full sentence, with the exact times, is in the card's details.
const FitLabel = ({ fit, lanes, startMs, stayH }: FitLabelProps) => {
  const { t } = useTranslation('compare');

  return (
    <div className={styles.fit} data-testid={testIds.siteColumns.fit} data-fit={fit.status}>
      <p className={styles.verdict}>
        {fit.status === 'fits' ? <IconCheck /> : <IconAlert />}
        {t(`fit.${fit.status}`)}
      </p>
      <StayStrip lanes={lanes} fit={fit} startMs={startMs} stayH={stayH} />
      <p className={styles.reason}>
        {fit.status === 'fits'
          ? t('fit.fitsShort')
          : t('fit.riskyShort', {
              from: fit.fromLanding ? t('fit.landing') : formatDay(fit.fromMs),
              to: fit.toEnd ? t('fit.endOfStay') : formatDay(fit.toMs),
            })}
      </p>
    </div>
  );
};

export default FitLabel;

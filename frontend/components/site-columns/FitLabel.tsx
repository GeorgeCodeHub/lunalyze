import { useTranslation } from 'react-i18next';
import type { Stay } from '../../scenario';
import { testIds } from '../../test-ids';
import { formatDateTime } from '../shared/formatTime';
import IconAlert from '../shared/IconAlert';
import IconCheck from '../shared/IconCheck';
import { STAY_KEY } from '../shared/stayKeys';
import type { StayFit } from './stayFit';
import styles from './FitLabel.module.css';

type FitLabelProps = { fit: StayFit; stay: Stay };

// The verdict for this place and this stay, with the reason in one line. "Fits" is a solid block with
// a tick; "Risky" is a dashed outline with a warning mark, so the two never differ by colour alone.
const FitLabel = ({ fit, stay }: FitLabelProps) => {
  const { t } = useTranslation('compare');

  return (
    <div className={styles.fit} data-testid={testIds.siteColumns.fit} data-fit={fit.status}>
      <p className={styles.verdict}>
        {fit.status === 'fits' ? <IconCheck /> : <IconAlert />}
        {t(`fit.${fit.status}`)}
      </p>
      <p className={styles.reason}>
        {fit.status === 'fits'
          ? t('fit.fitsReason')
          : t('fit.riskyReason', {
              from: fit.fromLanding ? t('fit.landing') : t('fit.time', { time: formatDateTime(fit.fromMs) }),
              to: fit.toEnd ? t('fit.endOfStay') : t('fit.time', { time: formatDateTime(fit.toMs) }),
            })}
      </p>
      <p className={styles.checked}>{t(`fit.stay.${STAY_KEY[stay]}`)}</p>
    </div>
  );
};

export default FitLabel;

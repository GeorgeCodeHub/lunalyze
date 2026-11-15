import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { SiteView } from '../../../backend/lib/types';
import type { Stay } from '../../scenario';
import { testIds } from '../../test-ids';
import { formatDateTime, formatUpTo } from '../shared/formatTime';
import { STAY_KEY } from '../shared/stayKeys';
import { usePosition } from '../shared/usePosition';
import { groupLabelKey } from '../site-picker/siteIds';
import { caveatKinds } from './caveats';
import type { StayFit } from './stayFit';
import styles from './PlaceDetails.module.css';

type PlaceDetailsProps = {
  view: SiteView; // the time span shown
  now: SiteView; // the moment the playhead is on
  fit: StayFit;
  stay: Stay;
  terrain: boolean;
  children?: ReactNode; // the best option adds how it was chosen
};

// One step away from the card's face: the exact times behind a risky verdict, each caveat as a
// sentence, where the place is, and the two numbers for the moment the playhead is on.
const PlaceDetails = ({ view, now, fit, stay, terrain, children }: PlaceDetailsProps) => {
  const { t } = useTranslation('compare');
  const { t: tSites } = useTranslation('sites');
  const position = usePosition();

  const { site } = view;
  const { panelOutputPct, sunElDeg } = now.metrics;
  // "Fits" needs no more words than the card's face has. "Risky" adds the exact times.
  const risky =
    fit.status === 'risky'
      ? t('fit.riskyReason', {
          from: fit.fromLanding ? t('fit.landing') : t('fit.time', { time: formatDateTime(fit.fromMs) }),
          to: fit.toEnd ? t('fit.endOfStay') : t('fit.time', { time: formatDateTime(fit.toMs) }),
        })
      : null;

  return (
    <details className={styles.details} data-testid={testIds.siteColumns.details}>
      <summary className={styles.summary}>{t('details.summary')}</summary>
      <div className={styles.body}>
        {risky && <p>{risky}</p>}
        <p>{t(`fit.stay.${STAY_KEY[stay]}`)}</p>
        {children}
        {caveatKinds(view, terrain).map((kind) => (
          <p key={kind}>{t(`caveat.${kind}`)}</p>
        ))}
        <dl className={styles.facts}>
          <div>
            <dt>{t('details.place')}</dt>
            <dd>
              {tSites(groupLabelKey(site.group))} · {position(site.lat, site.lon)}
            </dd>
          </div>
          <div data-testid={testIds.metricCards.card} data-metric="panelOutputPct" data-value={panelOutputPct}>
            <dt>{t('metrics.sunVisible')}</dt>
            <dd>{t('metrics.percent', { value: formatUpTo(panelOutputPct, 1) })}</dd>
          </div>
          <div data-testid={testIds.metricCards.card} data-metric="sunElDeg" data-value={sunElDeg}>
            <dt>{t(sunElDeg >= 0 ? 'metrics.sunAbove' : 'metrics.sunBelow')}</dt>
            <dd>{t('metrics.degrees', { value: formatUpTo(Math.abs(sunElDeg), 1) })}</dd>
          </div>
        </dl>
      </div>
    </details>
  );
};

export default PlaceDetails;

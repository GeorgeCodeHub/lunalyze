import { useTranslation } from 'react-i18next';
import type { SiteView, Zoom } from '../../../backend/lib/types';
import { testIds } from '../../test-ids';
import { formatUpTo } from '../shared/formatTime';
import { useDuration } from '../shared/useDuration';
import MetricCard from './MetricCard';
import styles from './MetricCards.module.css';

// view: the time span shown (shares of time, longest dark period). now: the moment the playhead is on.
type MetricCardsProps = { view: SiteView; now: SiteView; zoom: Zoom };

const SHARE_OF = { day: 'metrics.overDay', lunarDay: 'metrics.overLunarDay', year: 'metrics.overYear' } as const;
const WITHIN = { day: 'metrics.inDay', lunarDay: 'metrics.inLunarDay', year: 'metrics.inYear' } as const;

const MetricCards = ({ view, now, zoom }: MetricCardsProps) => {
  const { t } = useTranslation('compare');
  const duration = useDuration();

  const { sunlitPct, earthPct, longestBlackoutH } = view.metrics;
  const { panelOutputPct, sunElDeg } = now.metrics;
  const percent = (value: number) => t('metrics.percent', { value: formatUpTo(value, 1) });

  return (
    <section className={styles.metrics} data-testid={testIds.metricCards.root}>
      <h3 className={styles.title}>{t('metrics.title')}</h3>
      <ul className={styles.grid}>
        <MetricCard
          metric="sunlitPct"
          raw={sunlitPct}
          label={t('metrics.sunlit')}
          value={percent(sunlitPct)}
          note={t(SHARE_OF[zoom])}
          meter={{ pct: sunlitPct, body: 'sun' }}
        />
        <MetricCard
          metric="earthPct"
          raw={earthPct}
          label={t('metrics.earth')}
          value={percent(earthPct)}
          note={t(SHARE_OF[zoom])}
          meter={{ pct: earthPct, body: 'earth' }}
        />
        <MetricCard
          metric="longestBlackoutH"
          raw={longestBlackoutH}
          label={t('metrics.blackout')}
          value={longestBlackoutH > 0 ? duration(longestBlackoutH) : t('metrics.noBlackout')}
          note={t(WITHIN[zoom])}
        />
        <MetricCard
          metric="panelOutputPct"
          raw={panelOutputPct}
          label={t('metrics.sunVisible')}
          value={percent(panelOutputPct)}
          note={t('metrics.atTime')}
          meter={{ pct: panelOutputPct, body: 'sun' }}
        />
        <MetricCard
          metric="sunElDeg"
          raw={sunElDeg}
          label={t('metrics.sunHeight')}
          value={t('metrics.degrees', { value: formatUpTo(Math.abs(sunElDeg), 1) })}
          note={t(sunElDeg >= 0 ? 'metrics.aboveLevel' : 'metrics.belowLevel')}
        />
      </ul>
    </section>
  );
};

export default MetricCards;

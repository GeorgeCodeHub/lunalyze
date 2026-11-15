import { useTranslation } from 'react-i18next';
import type { SiteView, Zoom } from '../../../backend/lib/types';
import { testIds } from '../../test-ids';
import { formatUpTo } from '../shared/formatTime';
import { useDuration } from '../shared/useDuration';
import MetricCard from './MetricCard';
import styles from './MetricCards.module.css';

type MetricCardsProps = { view: SiteView; zoom: Zoom }; // view: the time span shown

const SPAN = { day: 'metrics.spanDay', lunarDay: 'metrics.spanLunarDay', year: 'metrics.spanYear' } as const;

// The three numbers that decide between two places, side by side. Every number is a SiteView.metrics
// field. The time span they cover is named once, in the toolbar; here it is a heading for screen readers.
const MetricCards = ({ view, zoom }: MetricCardsProps) => {
  const { t } = useTranslation('compare');
  const duration = useDuration();

  const { sunlitPct, earthPct, longestBlackoutH } = view.metrics;
  const percent = (value: number) => t('metrics.percent', { value: formatUpTo(value, 1) });

  return (
    <section className={styles.metrics} data-testid={testIds.metricCards.root}>
      <h3 className={styles.title}>{t(SPAN[zoom])}</h3>
      <ul className={styles.tiles}>
        <MetricCard
          metric="sunlitPct"
          raw={sunlitPct}
          value={percent(sunlitPct)}
          label={t('metrics.sunlit')}
          meter={{ pct: sunlitPct, body: 'sun' }}
        />
        <MetricCard
          metric="earthPct"
          raw={earthPct}
          value={percent(earthPct)}
          label={t('metrics.earth')}
          meter={{ pct: earthPct, body: 'earth' }}
        />
        <MetricCard
          metric="longestBlackoutH"
          raw={longestBlackoutH}
          value={longestBlackoutH > 0 ? duration(longestBlackoutH, 'short') : t('metrics.noBlackout')}
          label={t('metrics.blackout')}
          note={t('metrics.longest')}
        />
      </ul>
    </section>
  );
};

export default MetricCards;

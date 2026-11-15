import { useTranslation } from 'react-i18next';
import type { SiteId } from '../../i18n';
import { testIds } from '../../test-ids';
import { formatUpTo } from '../shared/formatTime';
import IconAlert from '../shared/IconAlert';
import IconCheck from '../shared/IconCheck';
import type { Ranked } from '../site-columns/rankSites';
import { siteNameKey } from './siteIds';
import styles from './RankingColumn.module.css';

type RankingColumnProps = {
  rank: number; // 1 is the best option
  ranked: Ranked;
  best: boolean;
  yours: boolean; // the place the person chose
  onPick: () => void;
};

// The drawing: two columns, 12 wide with a gap of 4, in a plot 36 wide and 64 high. A column's
// height is its share of the time; its top is rounded and its foot is square on the baseline.
const PLOT = { width: 36, height: 64 };
const BAR = 12;
const LEFT = (PLOT.width - 2 * BAR - 4) / 2;

// One place in the ranked chart: how much of the time it has sunlight and Earth in view, whether it
// fits the stay, and its name. It is a button: choosing it makes it the place compared with the best option.
const RankingColumn = ({ rank, ranked, best, yours, onPick }: RankingColumnProps) => {
  const { t } = useTranslation('compare');
  const { t: tSites } = useTranslation('sites');

  const { site, metrics } = ranked.view;
  const percent = (value: number) => t('metrics.percent', { value: formatUpTo(value, 1) });
  const label = t('ranking.column', {
    rank,
    site: tSites(siteNameKey(site.id)),
    verdict: t(`fit.${ranked.fit.status}`),
    sun: percent(metrics.sunlitPct),
    earth: percent(metrics.earthPct),
  });
  const top = (pct: number) => PLOT.height - (Math.min(100, Math.max(0, pct)) / 100) * PLOT.height;

  return (
    <li
      className={styles.column}
      data-testid={testIds.ranking.column}
      data-site-id={site.id}
      data-fit={ranked.fit.status}
      data-best={best}
      data-yours={yours}
    >
      <button type="button" className={styles.button} aria-pressed={yours} aria-label={label} title={label} onClick={onPick}>
        <svg className={styles.plot} viewBox={`0 0 ${PLOT.width} ${PLOT.height}`} aria-hidden="true">
          {/* Each column runs 4 past the plot's foot, where it is cut off: so only its top is rounded. */}
          <rect className={styles.sun} x={LEFT} y={top(metrics.sunlitPct)} width={BAR} height={PLOT.height} rx="4" />
          <rect className={styles.earth} x={LEFT + BAR + 4} y={top(metrics.earthPct)} width={BAR} height={PLOT.height} rx="4" />
        </svg>
        <span className={styles.name}>
          {ranked.fit.status === 'fits' ? <IconCheck /> : <IconAlert />}
          {tSites(`${site.id as SiteId}.short`)}
        </span>
        <span className={styles.tag}>
          {best && t('ranking.best')}
          {best && yours && ' · '}
          {yours && t('ranking.yours')}
        </span>
      </button>
    </li>
  );
};

export default RankingColumn;

import { useTranslation } from 'react-i18next';
import { testIds } from '../../test-ids';
import BodyGlyph from '../shared/BodyGlyph';
import type { Ranked } from '../site-columns/rankSites';
import RankingColumn from './RankingColumn';
import styles from './RankingChart.module.css';

type RankingChartProps = {
  order: Ranked[]; // every compared place, best first
  loading: boolean;
  yourId: string | null; // the place the person chose, when it is a listed site
  onPick: (siteId: string) => void;
};

const TITLE_ID = 'ranking-chart-title';

// The answer at the top of the screen: every place the tool compared, best first, with the mark that
// says whether it fits the stay. Choosing a place here compares it with the best option.
const RankingChart = ({ order, loading, yourId, onPick }: RankingChartProps) => {
  const { t } = useTranslation('compare');

  if (order.length === 0 && !loading) return null;

  return (
    <section className={styles.chart} aria-labelledby={TITLE_ID} aria-busy={loading} data-testid={testIds.ranking.root}>
      <header className={styles.head}>
        <h2 id={TITLE_ID} className={styles.title}>
          {order.length === 0 ? t('rank.pending') : t('ranking.title', { count: order.length })}
        </h2>
        <ul className={styles.legend}>
          <li>
            <BodyGlyph body="sun" />
            {t('metrics.sunlit')}
          </li>
          <li>
            <BodyGlyph body="earth" />
            {t('metrics.earth')}
          </li>
        </ul>
      </header>
      <ol className={styles.columns}>
        {order.map((ranked, i) => (
          <RankingColumn
            key={ranked.view.site.id}
            rank={i + 1}
            ranked={ranked}
            best={i === 0}
            yours={ranked.view.site.id === yourId}
            onPick={() => onPick(ranked.view.site.id)}
          />
        ))}
      </ol>
    </section>
  );
};

export default RankingChart;

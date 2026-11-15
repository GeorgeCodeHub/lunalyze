import { useTranslation } from 'react-i18next';
import { useScenario } from '../../backend/lib/useScenario';
import { type Scenario, siteIdsOf } from '../scenario';
import { usePlaybackStore } from '../stores/compare';
import { testIds } from '../test-ids';
import { useAllSites } from '../useAllSites';
import DataCredits from './DataCredits';
import LiveView from './LiveView';
import RankingChart from './site-picker/RankingChart';
import ScenarioBar from './scenario-bar/ScenarioBar';
import IconAlert from './shared/IconAlert';
import { timeFrame } from './shared/timeFrame';
import BestPending from './site-columns/BestPending';
import { buildColumns } from './site-columns/columnModel';
import { pickPlaces } from './site-columns/pickPlaces';
import PlaceSlot from './site-columns/PlaceSlot';
import { rankSites } from './site-columns/rankSites';
import HowChosen from './site-columns/HowChosen';
import WhyBest from './site-columns/WhyBest';
import styles from './Compare.module.css';

type CompareProps = { scenario: Scenario; onChange: (next: Scenario) => void; onBack: () => void };

// The Compare screen once a place is picked: the tool's best option on one side, the place it is
// compared with on the other, and the live view between them. This is the one place that asks for
// data; every number below comes from useScenario, and the regions only draw what they are handed.
const Compare = ({ scenario, onChange, onBack }: CompareProps) => {
  const { t } = useTranslation('compare');
  const { t: tCommon } = useTranslation();
  const playheadH = usePlaybackStore((s) => s.offsetH);
  const pause = usePlaybackStore((s) => s.pause);
  // Every listed place over the Moon day from landing: the tool ranks them, and those lanes cover the stay.
  const all = useAllSites(scenario.start, scenario.terrain);
  const frame = timeFrame(scenario, playheadH);
  const ranking = rankSites(all.views, frame.startMs, frame.stayH);
  const picks = pickPlaces(
    scenario.places,
    ranking.order.map(({ view }) => view.site.id),
  );
  const siteIds = siteIdsOf([picks.best, picks.alternative]);
  const opts = { terrain: scenario.terrain };
  // The two places on screen (DATA_CONTRACT, "Play button"). shown: the time span picked, for the numbers,
  // lanes and paths. now: the playhead moment, for the sky and countdowns; they are the same at any
  // zoom, so the cheapest one is asked.
  const shown = useScenario(siteIds, scenario.start, scenario.zoom, opts);
  const now = useScenario(siteIds, new Date(frame.nowMs), 'day', opts);

  // Best option first, when there is one; then the place it is compared with.
  const columns = buildColumns(
    [picks.best, picks.alternative].flatMap((place) => place ?? []),
    shown,
    all,
    now,
  );
  const best = picks.best ? columns[0] : undefined;
  const alternative = picks.best ? columns[1] : columns[0];
  const ready = columns.flatMap((column) => (column.kind === 'ready' ? [column] : []));
  const loading = all.loading || columns.some((column) => column.kind === 'loading');
  const error = all.error ?? shown.error ?? now.error;
  const [yourId = null] = siteIdsOf([scenario.places[1] ?? scenario.places[0]]);

  const change = (next: Scenario) => {
    if (next.zoom !== scenario.zoom) pause(); // the play pace belongs to the time span, so a new span starts paused
    onChange(next);
  };
  return (
    <div className={styles.page} data-testid={testIds.compare.root}>
      <header className={styles.top}>
        <h1 className={styles.brand}>{tCommon('appTitle')}</h1>
        <button type="button" className={styles.startOver} onClick={onBack} data-testid={testIds.compare.startOver}>
          {t('screen.startOver')}
        </button>
      </header>
      <ScenarioBar scenario={scenario} onChange={change} />
      {error && (
        <p className={styles.error} role="alert" data-testid={testIds.compare.error}>
          <IconAlert />
          {t('screen.error')}
        </p>
      )}
      <RankingChart
        order={ranking.order}
        loading={all.loading}
        yourId={yourId}
        onPick={(id) => onChange({ ...scenario, places: [{ kind: 'site', id }] })}
      />
      <main className={styles.board}>
        <div className={styles.best}>
          {best ? (
            <PlaceSlot
              column={best}
              role="best"
              alsoYours={picks.bestIsYours}
              frame={frame}
              stay={scenario.stay}
              terrain={scenario.terrain}
              foot={<WhyBest reason={ranking.reason} checked={ranking.order.length} />}
              how={<HowChosen checked={ranking.order.length} leftOut={ranking.leftOut} />}
            />
          ) : (
            <BestPending loading={all.loading} />
          )}
        </div>
        <div className={styles.alternative}>
          {alternative && (
            <PlaceSlot
              column={alternative}
              role={picks.alternativeRole}
              frame={frame}
              stay={scenario.stay}
              terrain={scenario.terrain}
            />
          )}
        </div>
        <div className={styles.live}>
          <LiveView places={ready} loading={loading} frame={frame} />
        </div>
      </main>
      <DataCredits />
    </div>
  );
};

export default Compare;

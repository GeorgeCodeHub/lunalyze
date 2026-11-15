import { useTranslation } from 'react-i18next';
import { useScenario } from '../../backend/lib/useScenario';
import { placeId, type Scenario } from '../scenario';
import { usePlaybackStore } from '../stores/compare';
import { testIds } from '../test-ids';
import { useAllSites } from '../useAllSites';
import DataCredits from './DataCredits';
import LiveView from './LiveView';
import CopyLinkButton from './scenario-bar/CopyLinkButton';
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
import FocusFilters from './site-picker/FocusFilters';
import styles from './Compare.module.css';

type CompareProps = { scenario: Scenario; onChange: (next: Scenario) => void };

// The Compare screen once a place is picked: what matters most, then the tool's best option and the
// place it is compared with, side by side, and the live view. This is the one place that asks for
// data; every number below comes from useScenario, and the regions only draw what they are handed.
const Compare = ({ scenario, onChange }: CompareProps) => {
  const { t } = useTranslation('compare');
  const { t: tCommon } = useTranslation();
  const playheadH = usePlaybackStore((s) => s.offsetH);
  const pause = usePlaybackStore((s) => s.pause);
  // Every listed place over the Moon day from landing: the tool ranks them, and those lanes cover the stay.
  const all = useAllSites(scenario.start, scenario.terrain);
  const frame = timeFrame(scenario, playheadH);
  const ranking = rankSites(all.views, frame.startMs, frame.stayH, scenario.focus);
  const picks = pickPlaces(
    scenario.places,
    ranking.order.map(({ view }) => view.site.id),
  );
  const places = [picks.best, picks.alternative].flatMap((place) => place ?? []);
  const siteIds = places.map(placeId);
  const opts = { terrain: scenario.terrain };
  // The two places on screen (DATA_CONTRACT, "Play button"). shown: the time span picked, for the numbers,
  // lanes and paths. now: the playhead moment, for the sky and countdowns; they are the same at any
  // zoom, so the cheapest one is asked.
  const shown = useScenario(siteIds, scenario.start, scenario.zoom, opts);
  const now = useScenario(siteIds, new Date(frame.nowMs), 'day', opts);
  // Typed coordinates are not among the listed places, so their Moon day from landing is asked for here.
  const typedIds = places.flatMap((place) => (place.kind === 'coords' ? [placeId(place)] : []));
  const typed = useScenario(typedIds, scenario.start, 'lunarDay', opts);
  const stay = { views: [...all.views, ...typed.views], loading: all.loading || typed.loading };

  // Best option first, when there is one; then the place it is compared with.
  const columns = buildColumns(places, shown, stay, now);
  const best = picks.best ? columns[0] : undefined;
  const alternative = picks.best ? columns[1] : columns[0];
  const ready = columns.flatMap((column) => (column.kind === 'ready' ? [column] : []));
  const loading = all.loading || columns.some((column) => column.kind === 'loading');
  const error = all.error ?? shown.error ?? now.error ?? typed.error;

  const change = (next: Scenario) => {
    if (next.zoom !== scenario.zoom) pause(); // the play pace belongs to the time span, so a new span starts paused
    onChange(next);
  };
  return (
    <div className={styles.page} data-testid={testIds.compare.root}>
      <header className={styles.top}>
        <h1 className={styles.brand}>{tCommon('appTitle')}</h1>
        <CopyLinkButton />
      </header>
      <ScenarioBar scenario={scenario} onChange={change} />
      {error && (
        <p className={styles.error} role="alert" data-testid={testIds.compare.error}>
          <IconAlert />
          {t('screen.error')}
        </p>
      )}
      <FocusFilters focus={scenario.focus} onChange={(focus) => onChange({ ...scenario, focus })} />
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
              how={<HowChosen checked={ranking.order.length} leftOut={ranking.leftOut} focus={scenario.focus} />}
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

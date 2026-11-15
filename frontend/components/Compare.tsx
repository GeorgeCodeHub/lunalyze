import { useTranslation } from 'react-i18next';
import { useScenario } from '../../backend/lib/useScenario';
import { MAX_SITES, type Place, placeToken, type Scenario, uniquePlaces } from '../scenario';
import { usePlaybackStore } from '../stores/compare';
import { testIds } from '../test-ids';
import DataCredits from './DataCredits';
import ScenarioBar from './scenario-bar/ScenarioBar';
import IconAlert from './shared/IconAlert';
import { timeFrame } from './shared/timeFrame';
import { buildColumns } from './site-columns/columnModel';
import SiteColumns from './site-columns/SiteColumns';
import PolarMap from './site-picker/PolarMap';
import TimeControls from './timeline/TimeControls';
import styles from './Compare.module.css';

type CompareProps = { scenario: Scenario; onChange: (next: Scenario) => void; onBack: () => void };

const MAP_TITLE_ID = 'compare-map-title';

// The Compare screen once a place is picked: the layout, and the one place that asks for data.
// Every number below comes from useScenario; the regions only draw what they are handed.
const Compare = ({ scenario, onChange, onBack }: CompareProps) => {
  const { t } = useTranslation('compare');
  const { t: tCommon } = useTranslation();
  const playheadH = usePlaybackStore((s) => s.offsetH);
  const pause = usePlaybackStore((s) => s.pause);
  const siteIds = scenario.places.flatMap((place) => (place.kind === 'site' ? [place.id] : []));
  const frame = timeFrame(scenario, playheadH);
  const opts = { terrain: scenario.terrain };
  // Three windows on the same sites (DATA_CONTRACT, "Play button"). Files are fetched once and cached.
  // shown: the time span picked, for the lanes, metrics and paths.
  const shown = useScenario(siteIds, scenario.start, scenario.zoom, opts);
  // stay: the Moon day from landing, whose lanes cover every stay offered, for the fit label.
  const stay = useScenario(siteIds, scenario.start, 'lunarDay', opts);
  // now: the playhead moment, for the sky and countdowns. They are the same at any zoom, so the cheapest one is asked.
  const now = useScenario(siteIds, new Date(frame.nowMs), 'day', opts);

  const columns = buildColumns(scenario.places, shown, stay, now);
  const mapViews = columns.flatMap((column) => (column.kind === 'ready' ? [column.now] : []));
  const error = shown.error ?? stay.error ?? now.error;

  const change = (next: Scenario) => {
    if (next.zoom !== scenario.zoom) pause(); // the play pace belongs to the time span, so a new span starts paused
    onChange(next);
  };
  const addPlace = (place: Place) => onChange({ ...scenario, places: uniquePlaces([...scenario.places, place]).slice(0, MAX_SITES) });
  const removePlace = (key: string) => onChange({ ...scenario, places: scenario.places.filter((place) => placeToken(place) !== key) });

  return (
    <div className={styles.page} data-testid={testIds.compare.root}>
      <header className={styles.top}>
        <h1 className={styles.brand}>{tCommon('appTitle')}</h1>
        <button type="button" className={styles.startOver} onClick={onBack} data-testid={testIds.compare.startOver}>
          {t('screen.startOver')}
        </button>
      </header>
      <ScenarioBar scenario={scenario} onChange={change} />
      <div className={styles.time}>
        <TimeControls frame={frame} />
      </div>
      <main className={styles.main}>
        {error && (
          <p className={styles.error} role="alert" data-testid={testIds.compare.error}>
            <IconAlert />
            {t('screen.error')}
          </p>
        )}
        <SiteColumns
          columns={columns}
          frame={frame}
          stay={scenario.stay}
          terrain={scenario.terrain}
          pickedIds={siteIds}
          canAdd={scenario.places.length < MAX_SITES}
          onAdd={addPlace}
          onRemove={removePlace}
        />
        {mapViews.length > 0 && (
          <section className={styles.map} aria-labelledby={MAP_TITLE_ID} data-testid={testIds.compare.map}>
            <div className={styles.mapText}>
              <h2 id={MAP_TITLE_ID} className={styles.mapTitle}>
                {t('screen.mapTitle')}
              </h2>
              <p className={styles.mapHint}>{t('screen.mapHint')}</p>
            </div>
            <PolarMap views={mapViews} />
          </section>
        )}
      </main>
      <DataCredits />
    </div>
  );
};

export default Compare;

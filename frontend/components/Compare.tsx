import { type CSSProperties, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useScenario } from '../../backend/lib/useScenario';
import { MAX_PICKS, type Place, placeId, placeToken, type Scenario } from '../scenario';
import { usePlaybackStore } from '../stores/compare';
import { testIds } from '../test-ids';
import { useAllSites } from '../useAllSites';
import DataCredits from './DataCredits';
import LiveView from './LiveView';
import CopyLinkButton from './scenario-bar/CopyLinkButton';
import ScenarioBar from './scenario-bar/ScenarioBar';
import IconAlert from './shared/IconAlert';
import ResizeHandle from './shared/ResizeHandle';
import { timeFrame } from './shared/timeFrame';
import BestPending from './site-columns/BestPending';
import { buildColumns } from './site-columns/columnModel';
import { pickPlaces } from './site-columns/pickPlaces';
import { rankSites } from './site-columns/rankSites';
import SidePanel, { type SideEntry } from './site-columns/SidePanel';
import { liveKeys, SIDE_VIEW_START, type SideView } from './site-columns/sideView';
import HowChosen from './site-columns/HowChosen';
import WhyBest from './site-columns/WhyBest';
import styles from './Compare.module.css';

type CompareProps = { scenario: Scenario; onChange: (next: Scenario) => void };

// The Compare screen once a place is picked: what matters most, then the tool's best option and the
// place it is compared with, side by side, and the live view. This is the one place that asks for
// data; every number below comes from useScenario, and the regions only draw what they are handed.
const Compare = ({ scenario, onChange }: CompareProps) => {
  const { t } = useTranslation('compare');
  const { t: tCommon } = useTranslation();
  const playheadH = usePlaybackStore((s) => s.offsetH);
  const [sideWidth, setSideWidth] = useState<number | null>(null); // px; null: the default quarter of the window
  const [sideView, setSideView] = useState<SideView>(SIDE_VIEW_START); // compare or single: the live view follows it
  // Every listed place over the Moon day from landing: the tool ranks them, and those lanes cover the stay.
  const all = useAllSites(scenario.start, scenario.terrain);
  const frame = timeFrame(scenario, playheadH);
  const ranking = rankSites(all.views, frame.startMs, frame.stayH);
  const picks = pickPlaces(
    scenario.places,
    ranking.order.map(({ view }) => view.site.id),
  );
  // The best option first, when there is one; then up to 2 places the person picked (3 at most).
  const places = [picks.best, ...picks.compared.map((c) => c.place)].flatMap((place) => place ?? []);
  const siteIds = places.map(placeId);
  const opts = { terrain: scenario.terrain };
  // The two places on screen (DATA_CONTRACT, "Play button"). shown: the time span picked, for the numbers,
  // lanes and paths. now: the playhead moment, for the map, sky and 3D view; they are the same at any
  // zoom, so the cheapest one is asked.
  const shown = useScenario(siteIds, scenario.start, scenario.zoom, opts);
  const now = useScenario(siteIds, new Date(frame.nowMs), 'day', opts);
  // Typed coordinates are not among the listed places, so their Moon day from landing is asked for here.
  const typedIds = places.flatMap((place) => (place.kind === 'coords' ? [placeId(place)] : []));
  const typed = useScenario(typedIds, scenario.start, 'lunarDay', opts);
  const stay = { views: [...all.views, ...typed.views], loading: all.loading || typed.loading };

  // The cards: the best option first, when there is one; then the places compared with it.
  const columns = buildColumns(places, shown, stay, now);
  const best = picks.best ? columns[0] : undefined;
  const others = picks.best ? columns.slice(1) : columns;
  const ready = columns.flatMap((column) => (column.kind === 'ready' ? [column] : []));
  const loading = all.loading || columns.some((column) => column.kind === 'loading');
  const error = all.error ?? shown.error ?? now.error ?? typed.error;

  const yourPlaces = scenario.places.slice(0, MAX_PICKS);

  // The cross on a picked place's card: takes it out of the comparison. The last place stays, because
  // the comparison needs one.
  const removeFor = (place: Place) =>
    yourPlaces.length > 1
      ? () => onChange({ ...scenario, places: yourPlaces.filter((other) => placeToken(other) !== placeToken(place)) })
      : undefined;
  // The cards, in the side panel: the best option first, with why it won; then each place compared with it.
  const shared = { frame, stay: scenario.stay, terrain: scenario.terrain };
  const entries: SideEntry[] = [
    ...(best
      ? [
          {
            ...shared,
            column: best,
            role: 'best' as const,
            alsoYours: picks.bestIsYours,
            foot: <WhyBest reason={ranking.reason} checked={ranking.order.length} />,
            how: <HowChosen checked={ranking.order.length} leftOut={ranking.leftOut} />,
          },
        ]
      : []),
    ...others.map((column, i) => {
      const compared = picks.compared[i];
      return {
        ...shared,
        column,
        role: compared?.role ?? 'yourChoice',
        onRemove: compared?.role === 'yourChoice' ? removeFor(compared.place) : undefined,
      };
    }),
  ];

  // The side panel starts at a quarter of the window (420px at most) and can be dragged from 240px to 60%.
  const sideMin = 240;
  const sideMax = Math.max(sideMin, Math.round(window.innerWidth * 0.6));
  const sideNow = sideWidth ?? Math.min(window.innerWidth / 4, 420);
  const boardStyle = (sideWidth === null ? {} : { '--side-width': `${sideWidth}px` }) as CSSProperties;

  // The live view shows every place in Compare, and only the side panel's place in Single.
  const shownKeys = new Set(liveKeys(sideView, columns.map((column) => column.key)));

  return (
    <div className={styles.page} data-testid={testIds.compare.root}>
      <div className={styles.stars} aria-hidden="true" />
      <header className={styles.top}>
        <h1 className={styles.brand}>{tCommon('appTitle')}</h1>
        <CopyLinkButton />
      </header>
      <ScenarioBar scenario={scenario} onChange={onChange} />
      {error && (
        <p className={styles.error} role="alert" data-testid={testIds.compare.error}>
          <IconAlert />
          {t('screen.error')}
        </p>
      )}
      <main className={styles.board} style={boardStyle}>
        <div className={styles.sideWrap}>
          <div className={styles.side} data-testid={testIds.compare.side}>
            <SidePanel entries={entries} pending={best ? undefined : <BestPending loading={all.loading} />} view={sideView} onView={setSideView} />
          </div>
          <div className={styles.handle}>
            <ResizeHandle
              label={t('side.resize')}
              width={sideNow}
              min={sideMin}
              max={sideMax}
              onResize={setSideWidth}
              testId={testIds.compare.sideResize}
            />
          </div>
        </div>
        <div className={styles.live}>
          <LiveView places={ready.filter((column) => shownKeys.has(column.key))} loading={loading} frame={frame} />
        </div>
      </main>
      <DataCredits />
    </div>
  );
};

export default Compare;

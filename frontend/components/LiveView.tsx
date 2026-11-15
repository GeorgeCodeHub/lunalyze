import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SiteView } from '../../backend/lib/types';
import { testIds } from '../test-ids';
import HorizonStrip from './horizon-strip/HorizonStrip';
import LiveLegend from './LiveLegend';
import InfoTip from './shared/InfoTip';
import Segmented from './shared/Segmented';
import type { TimeFrame } from './shared/timeFrame';
import PolarMap from './site-picker/PolarMap';
import { siteNameKey } from './site-picker/siteIds';
import Terrain3DBoundary from './terrain-3d/Terrain3DBoundary';
import TimeControls from './timeline/TimeControls';
import Timeline from './timeline/Timeline';
import styles from './LiveView.module.css';

// The 3D view pulls in three.js, so it loads only when someone opens it.
const Terrain3D = lazy(() => import('./terrain-3d/Terrain3D'));

// view: the time span shown. now: the moment the playhead is on.
type LiveViewProps = { places: { view: SiteView; now: SiteView }[]; loading: boolean; frame: TimeFrame };

type Mode = 'map' | 'sky' | '3d';

const TITLE_ID = 'live-view-title';

// How to read each picture: behind the frame's "i" button, shown only when asked for.
const HELP = { map: 'live.helpMap', sky: 'horizon.legend', '3d': 'terrain3d.legend' } as const;

// The right of the screen: the play button and time slider first, so they are in sight with the
// picture; then both places at the moment the playhead is on, as a map, the sky or in 3D; then one
// timeline for each place, with what happens next. Press play and all of it moves.
const LiveView = ({ places, loading, frame }: LiveViewProps) => {
  const { t } = useTranslation('compare');
  const { t: tSites } = useTranslation('sites');
  const [mode, setMode] = useState<Mode>('map');

  const modes = [
    { value: 'map' as const, label: t('live.map') },
    { value: 'sky' as const, label: t('live.sky') },
    { value: '3d' as const, label: t('live.threeD') },
  ];
  const nameOf = (view: SiteView) => tSites(siteNameKey(view.site.id));

  return (
    <section className={styles.live} aria-labelledby={TITLE_ID} aria-busy={loading} data-testid={testIds.compare.live}>
      <header className={styles.head}>
        <h2 id={TITLE_ID} className={styles.title}>
          {t('live.title')}
        </h2>
      </header>
      {places.length === 0 ? (
        <p className={styles.empty} role={loading ? 'status' : undefined}>
          {t(loading ? 'live.loading' : 'live.empty')}
        </p>
      ) : (
        <>
          {/* The view area, framed like a map app's viewport: the picture, the view switch floating in
              its top corner, and the time player along its bottom edge. */}
          <div className={styles.stage}>
            {/* The frame's top row: the one legend for every picture, and the switch at the far end. In
                the row rather than over the picture, so neither covers a title or a horizon. */}
            <div className={styles.toolbar}>
              <LiveLegend approximate={mode === 'map' && places.some(({ now }) => now.site.precision === 'proxy')} />
              <InfoTip label={t('live.help')} text={t(HELP[mode])} testId={testIds.compare.help} />
              <div className={styles.switch}>
                <Segmented label={t('live.switch')} options={modes} value={mode} onChange={setMode} testId={testIds.compare.liveSwitch} />
              </div>
            </div>
            {/* The time player comes next, at the top: it is the main control of every picture. */}
            <div className={styles.time}>
              <TimeControls frame={frame} />
            </div>
            {mode === 'map' && (
              <div className={styles.map}>
                <PolarMap views={places.map((place) => place.now)} legend={false} credit={false} />
              </div>
            )}
            {mode === 'sky' && (
              <div className={styles.picture}>
                {places.map((place) => (
                  <HorizonStrip key={place.view.site.id} view={place.view} now={place.now} siteName={nameOf(place.view)} />
                ))}
              </div>
            )}
            {mode === '3d' && (
              <Terrain3DBoundary>
                <Suspense
                  fallback={
                    <p className={styles.empty} role="status">
                      {t('live.threeDLoading')}
                    </p>
                  }
                >
                  <Terrain3D places={places} />
                </Suspense>
              </Terrain3DBoundary>
            )}
          </div>
          <div className={styles.timelines}>
            <h3 className={styles.subtitle}>{t('timeline.title')}</h3>
            {places.map((place, i) => (
              <Timeline
                key={place.view.site.id}
                view={place.view}
                frame={frame}
                siteName={nameOf(place.view)}
                axis={i === places.length - 1}
              />
            ))}
            <p className={styles.key}>{t('timeline.legend')}</p>
          </div>
        </>
      )}
    </section>
  );
};

export default LiveView;

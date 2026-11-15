import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SiteView } from '../../backend/lib/types';
import { testIds } from '../test-ids';
import HorizonStrip from './horizon-strip/HorizonStrip';
import Segmented from './shared/Segmented';
import type { TimeFrame } from './shared/timeFrame';
import PolarMap from './site-picker/PolarMap';
import { siteNameKey } from './site-picker/siteIds';
import TimeControls from './timeline/TimeControls';
import Timeline from './timeline/Timeline';
import styles from './LiveView.module.css';

// The 3D view pulls in three.js, so it loads only when someone opens it.
const Terrain3D = lazy(() => import('./terrain-3d/Terrain3D'));

// view: the time span shown. now: the moment the playhead is on.
type LiveViewProps = { places: { view: SiteView; now: SiteView }[]; loading: boolean; frame: TimeFrame };

type Mode = 'map' | 'sky' | '3d';

const TITLE_ID = 'live-view-title';

// The middle of the screen: both places at the moment the playhead is on, as a map or as the sky from
// each place, with the play button and one timeline for each place underneath. Press play and all of it moves.
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
        <Segmented label={t('live.switch')} options={modes} value={mode} onChange={setMode} testId={testIds.compare.liveSwitch} />
      </header>
      {places.length === 0 ? (
        <p className={styles.empty} role={loading ? 'status' : undefined}>
          {t(loading ? 'live.loading' : 'live.empty')}
        </p>
      ) : (
        <>
          {mode === 'map' && (
            <div className={styles.map}>
              <p className={styles.hint}>{t('live.mapHint')}</p>
              <PolarMap views={places.map((place) => place.now)} />
            </div>
          )}
          {mode === 'sky' && (
            <div className={styles.picture}>
              {places.map((place) => (
                <HorizonStrip key={place.view.site.id} view={place.view} now={place.now} siteName={nameOf(place.view)} />
              ))}
              <p className={styles.note}>{t('horizon.legend')}</p>
            </div>
          )}
          {mode === '3d' && (
            <Suspense
              fallback={
                <p className={styles.empty} role="status">
                  {t('live.threeDLoading')}
                </p>
              }
            >
              <Terrain3D places={places} />
            </Suspense>
          )}
          <div className={styles.time}>
            <TimeControls frame={frame} />
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
            <p className={styles.note}>{t('timeline.legend')}</p>
          </div>
        </>
      )}
    </section>
  );
};

export default LiveView;

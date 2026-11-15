import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SiteView } from '../../../backend/lib/types';
import { useTerrain } from '../../../backend/lib/useTerrain';
import { testIds } from '../../test-ids';
import IconAlert from '../shared/IconAlert';
import type { LookAction } from './lookTurn';
import SceneControls from './SceneControls';
import TerrainCanvas from './TerrainCanvas';
import TerrainNote from './TerrainNote';
import { facingDirection } from './sceneMath';
import styles from './Terrain3D.module.css';

// view: the time span shown. now: the moment the playhead is on; the 3D view reads only now.
type TerrainSceneProps = { view: SiteView; now: SiteView; siteName: string };

// The theme's colours, read from the document so no colour is written twice.
const cssColor = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// One place's ground, lit by the Sun at the playhead time, with a marker for the Sun and one for Earth.
const TerrainScene = ({ view, now, siteName }: TerrainSceneProps) => {
  const { t } = useTranslation('compare');
  const { grid, loading, error } = useTerrain(view.site.id);
  const [colours] = useState(() => ({
    sun: cssColor('--color-sun'),
    earth: cssColor('--color-earth'),
    ground: cssColor('--color-regolith'),
    sky: cssColor('--color-sky'),
  }));
  const [facing, setFacing] = useState(() => facingDirection(now.sky.sun, view.site.lon));
  const [look, setLook] = useState<{ direction: LookAction | null; degrees?: number; n: number }>({ direction: null, n: 0 });
  const [heading, setHeading] = useState(0); // the bearing the view faces, whole degrees

  const boxRef = useRef<HTMLElement>(null);
  const status = error ? 'error' : loading || !grid ? 'loading' : 'ready';
  const { sun, earth } = now.sky;
  const state = t('terrain3d.state', {
    sun: t(sun.hidden ? 'terrain3d.behindHills' : 'terrain3d.inView'),
    earth: t(earth.hidden ? 'terrain3d.behindHills' : 'terrain3d.inView'),
  });
  // The picture is an image to a screen reader, so only a ready scene is one: messages stay readable.
  const imageProps =
    status === 'ready' ? { role: 'img', 'aria-label': `${t('terrain3d.label', { site: siteName })} ${state}` } : {};

  const face = (body: 'sun' | 'earth') => setFacing(facingDirection(now.sky[body], view.site.lon));
  const faceNorth = () => setFacing(facingDirection({ az: 0, el: 0 }, view.site.lon));

  return (
    <section className={styles.entry}>
      <h3 className={styles.title}>{t('terrain3d.title', { site: siteName })}</h3>
      <div className={styles.view}>
        <figure
          ref={boxRef}
          className={styles.box}
          data-testid={testIds.terrain3d.scene}
          data-site-id={view.site.id}
          data-status={status}
          data-sun-hidden={sun.hidden}
          data-earth-hidden={earth.hidden}
          aria-busy={status === 'loading' || undefined}
          {...imageProps}
        >
          {status === 'loading' && (
            <p className={styles.status} role="status">
              {t('terrain3d.loading')}
            </p>
          )}
          {status === 'error' && (
            <p className={styles.status} role="alert">
              <IconAlert />
              {t('terrain3d.error')}
            </p>
          )}
          {status === 'ready' && grid && (
            <TerrainCanvas
              grid={grid}
              site={view.site}
              sky={now.sky}
              colours={colours}
              facing={facing}
              look={look}
              onHeading={(degrees) => setHeading(Math.round(degrees))}
              portal={boxRef}
            />
          )}
        </figure>
        {/* Beside the figure, not inside it: the figure is an image to screen readers, so buttons in it
            would be hidden. Drawn over the picture's corners. */}
        {status === 'ready' && (
          <SceneControls
            heading={heading}
            onFace={face}
            onNorth={faceNorth}
            onLook={(action) => setLook((last) => ({ direction: action, n: last.n + 1 }))}
            onTurn={(degrees) => setLook((last) => ({ direction: null, degrees, n: last.n + 1 }))}
          />
        )}
      </div>
      {view.horizonIncomplete && <TerrainNote text={t('terrain3d.lowerBound')} />}
      {view.site.precision === 'proxy' && <TerrainNote text={t('terrain3d.approximate')} />}
    </section>
  );
};

export default TerrainScene;

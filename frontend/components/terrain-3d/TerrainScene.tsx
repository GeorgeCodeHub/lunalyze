import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SiteView } from '../../../backend/lib/types';
import { useTerrain } from '../../../backend/lib/useTerrain';
import { testIds } from '../../test-ids';
import IconAlert from '../shared/IconAlert';
import TerrainCanvas from './TerrainCanvas';
import TerrainNote from './TerrainNote';
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
    ground: cssColor('--color-ground'),
  }));

  const status = error ? 'error' : loading || !grid ? 'loading' : 'ready';
  const { sun, earth } = now.sky;
  const state = t('terrain3d.state', {
    sun: t(sun.hidden ? 'terrain3d.behindHills' : 'terrain3d.inView'),
    earth: t(earth.hidden ? 'terrain3d.behindHills' : 'terrain3d.inView'),
  });
  // The picture is an image to a screen reader, so only a ready scene is one: messages stay readable.
  const imageProps =
    status === 'ready' ? { role: 'img', 'aria-label': `${t('terrain3d.label', { site: siteName })} ${state}` } : {};

  return (
    <section className={styles.entry}>
      <h3 className={styles.title}>{t('terrain3d.title', { site: siteName })}</h3>
      <figure
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
          <TerrainCanvas grid={grid} site={view.site} sky={now.sky} colours={colours} />
        )}
      </figure>
      {view.horizonIncomplete && <TerrainNote text={t('terrain3d.lowerBound')} />}
      {view.site.precision === 'proxy' && <TerrainNote text={t('terrain3d.approximate')} />}
    </section>
  );
};

export default TerrainScene;

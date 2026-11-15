import { useTranslation } from 'react-i18next';
import type { SiteView } from '../../../backend/lib/types';
import { testIds } from '../../test-ids';
import { useSiteName } from '../shared/useSiteName';
import TerrainNote from './TerrainNote';
import TerrainScene from './TerrainScene';
import styles from './Terrain3D.module.css';

// view: the time span shown. now: the moment the playhead is on.
type Terrain3DProps = { places: { view: SiteView; now: SiteView }[] };

// The ground around each place, lit by the Sun at the playhead time. A place with no terrain data gets a note instead.
const Terrain3D = ({ places }: Terrain3DProps) => {
  const { t } = useTranslation('compare');
  const name = useSiteName();

  const nameOf = (view: SiteView) => name(view.site);

  return (
    <div className={styles.root} data-testid={testIds.terrain3d.root}>
      {places.map(({ view, now }) =>
        view.site.terrainModeled ? (
          <TerrainScene key={view.site.id} view={view} now={now} siteName={nameOf(view)} />
        ) : (
          <TerrainNote
            key={view.site.id}
            text={t('terrain3d.notModeled', { site: nameOf(view) })}
            testId={testIds.terrain3d.caveat}
            siteId={view.site.id}
          />
        ),
      )}
    </div>
  );
};

export default Terrain3D;

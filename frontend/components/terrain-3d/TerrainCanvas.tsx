import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useTranslation } from 'react-i18next';
import type { SiteView } from '../../../backend/lib/types';
import type { TerrainGrid } from '../../../backend/lib/useTerrain';
import { testIds } from '../../test-ids';
import SkyMarker from './SkyMarker';
import TerrainMesh from './TerrainMesh';
import { EXAGGERATION, sceneDirection } from './sceneMath';
import styles from './Terrain3D.module.css';

type TerrainCanvasProps = {
  grid: TerrainGrid;
  site: SiteView['site'];
  sky: SiteView['sky']; // at the playhead time
  colours: { sun: string; earth: string; ground: string };
};

const SUN_DISTANCE_KM = 40;
const MARKER_DISTANCE_KM = 18;

const scale = (v: [number, number, number], k: number): [number, number, number] => [v[0] * k, v[1] * k, v[2] * k];

// The 3D picture: the ground, the Sun's light and a marker each for the Sun and Earth, all placed from the sky at the playhead time.
const TerrainCanvas = ({ grid, site, sky, colours }: TerrainCanvasProps) => {
  const { t } = useTranslation('compare');

  const { sun, earth } = sky;
  const sunDir = sceneDirection(sun, site.lon, EXAGGERATION);
  const earthDir = sceneDirection(earth, site.lon, EXAGGERATION);
  const bodyLabel = (body: 'sun' | 'earth', hidden: boolean) =>
    hidden ? t('terrain3d.hiddenLabel', { body: t(`terrain3d.${body}`) }) : t(`terrain3d.${body}`);

  return (
    <Canvas
      className={styles.canvas}
      data-testid={testIds.terrain3d.canvas}
      shadows
      frameloop="demand"
      camera={{ position: [0, 12, 22], fov: 45, near: 0.1, far: 200 }}
    >
      <ambientLight intensity={0.25} />
      <directionalLight
        position={scale(sunDir, SUN_DISTANCE_KM)}
        color={colours.sun}
        intensity={3}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-near={1}
        shadow-camera-far={80}
      />
      <TerrainMesh grid={grid} lat={site.lat} lon={site.lon} colour={colours.ground} />
      <SkyMarker
        body="sun"
        position={scale(sunDir, MARKER_DISTANCE_KM)}
        hidden={sun.hidden}
        colour={colours.sun}
        label={bodyLabel('sun', sun.hidden)}
      />
      <SkyMarker
        body="earth"
        position={scale(earthDir, MARKER_DISTANCE_KM)}
        hidden={earth.hidden}
        colour={colours.earth}
        label={bodyLabel('earth', earth.hidden)}
      />
      <OrbitControls enablePan={false} enableDamping={false} minDistance={3} maxDistance={50} maxPolarAngle={Math.PI / 2 - 0.05} />
    </Canvas>
  );
};

export default TerrainCanvas;

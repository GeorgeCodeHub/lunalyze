import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import type { RefObject } from 'react';
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
  portal: RefObject<HTMLElement | null>; // where the labels attach: fixed from the first render
};

const SUN_DISTANCE_KM = 40;
const MARKER_DISTANCE_KM = 10; // close enough that any bearing and height, with its label, stays in the default frame
// Hoisted so the camera is not a new object each render, which would pull the view back on every tick.
const CAMERA = { position: [0, 10, 30] as [number, number, number], fov: 45, near: 0.1, far: 200 };
const TARGET: [number, number, number] = [0, 4, 0];

const scale = (v: [number, number, number], k: number): [number, number, number] => [v[0] * k, v[1] * k, v[2] * k];

// The 3D picture: the ground, the Sun's light and a marker each for the Sun and Earth, all placed from the sky at the playhead time.
const TerrainCanvas = ({ grid, site, sky, colours, portal }: TerrainCanvasProps) => {
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
      shadows="percentage"
      frameloop="demand"
      camera={CAMERA}
    >
      <ambientLight intensity={0.7} />
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
        portal={portal}
        colour={colours.sun}
        label={bodyLabel('sun', sun.hidden)}
      />
      <SkyMarker
        body="earth"
        position={scale(earthDir, MARKER_DISTANCE_KM)}
        hidden={earth.hidden}
        portal={portal}
        colour={colours.earth}
        label={bodyLabel('earth', earth.hidden)}
      />
      <OrbitControls target={TARGET} enablePan={false} enableDamping={false} minDistance={3} maxDistance={50} maxPolarAngle={Math.PI / 2 - 0.05} />
    </Canvas>
  );
};

export default TerrainCanvas;

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { projectPolar } from '../../../backend/lib/projectPolar';
import type { SiteView } from '../../../backend/lib/types';
import type { TerrainGrid } from '../../../backend/lib/useTerrain';
import { testIds } from '../../test-ids';
import CompassPoint from './CompassPoint';
import LookAround from './LookAround';
import SkyMarker from './SkyMarker';
import TerrainMesh from './TerrainMesh';
import { EXAGGERATION, eyeHeight, sceneDirection } from './sceneMath';
import styles from './Terrain3D.module.css';

type TerrainCanvasProps = {
  grid: TerrainGrid;
  site: SiteView['site'];
  sky: SiteView['sky']; // at the playhead time
  colours: { sun: string; earth: string; ground: string; sky: string };
  facing: [number, number, number]; // where the view turns on mount and on each "face" button
  portal: RefObject<HTMLElement | null>; // where the labels attach: fixed from the first render
};

const SUN_DISTANCE_KM = 40;
const COMPASS_KM = 15;
const COMPASS = [
  { key: 'north', az: 0 },
  { key: 'east', az: 90 },
  { key: 'south', az: 180 },
  { key: 'west', az: 270 },
] as const;
// Hoisted so neither is a new object each render, which would reset the view on every tick.
// near 1 m and far past the Sun and Earth: the log depth buffer keeps that range from z-fighting.
const CAMERA = { fov: 60, near: 0.001, far: 1000 };
const GL = { logarithmicDepthBuffer: true };

const scale = (v: [number, number, number], k: number): [number, number, number] => [v[0] * k, v[1] * k, v[2] * k];

// The view from the site: the ground lit by the Sun at the playhead time, the Sun and Earth far off, and the compass on the horizon.
const TerrainCanvas = ({ grid, site, sky, colours, facing, portal }: TerrainCanvasProps) => {
  const { t } = useTranslation('compare');

  const { sun, earth } = sky;
  const sunDir = sceneDirection(sun, site.lon, EXAGGERATION);
  const earthDir = sceneDirection(earth, site.lon, EXAGGERATION);
  const eyeY = eyeHeight(grid, projectPolar(site.lat, site.lon), EXAGGERATION);

  const bodyLabel = (body: 'sun' | 'earth', hidden: boolean) =>
    hidden ? t('terrain3d.hiddenLabel', { body: t(`terrain3d.${body}`) }) : t(`terrain3d.${body}`);

  return (
    <Canvas
      className={styles.canvas}
      data-testid={testIds.terrain3d.canvas}
      shadows="percentage"
      frameloop="demand"
      camera={CAMERA}
      gl={GL}
    >
      {/* The Moon's sky is black: no air to scatter the light. Solid, so the Sun's glare adds onto it. */}
      <color attach="background" args={[colours.sky]} />
      {/* Fill light, so the ground away from the Sun is grey rather than black. Part of it comes from overhead, as light
          bounced off sunlit hills would, so the shape of the ground shows even while the Sun is hidden. */}
      <ambientLight intensity={1} />
      <directionalLight position={[0, 1, 0]} intensity={0.9} />
      <directionalLight
        position={scale(sunDir, SUN_DISTANCE_KM)}
        intensity={3}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-bias={-0.0005}
        shadow-normalBias={0.05}
      />
      {/* Earthshine: Earth lights the ground faintly, but only while it is above the hills. */}
      {!earth.hidden && <directionalLight position={scale(earthDir, SUN_DISTANCE_KM)} color={colours.earth} intensity={0.8} />}
      <Suspense fallback={null}>
        <TerrainMesh grid={grid} lat={site.lat} lon={site.lon} colour={colours.ground} />
        <SkyMarker
          body="sun"
          direction={sunDir}
          sunDirection={sunDir}
          hidden={sun.hidden}
          portal={portal}
          colour={colours.sun}
          label={bodyLabel('sun', sun.hidden)}
        />
        <SkyMarker
          body="earth"
          direction={earthDir}
          sunDirection={sunDir}
          hidden={earth.hidden}
          portal={portal}
          colour={colours.earth}
          label={bodyLabel('earth', earth.hidden)}
        />
      </Suspense>
      {COMPASS.map(({ key, az }) => (
        <CompassPoint
          key={key}
          position={scale(sceneDirection({ az, el: 0 }, site.lon, EXAGGERATION), COMPASS_KM)}
          label={t(`terrain3d.${key}`)}
          portal={portal}
        />
      ))}
      <LookAround eyeY={eyeY} facing={facing} />
    </Canvas>
  );
};

export default TerrainCanvas;

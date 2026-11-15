import { Html } from '@react-three/drei';
import type { RefObject } from 'react';
import BodyGlyph from '../shared/BodyGlyph';
import EarthBody from './EarthBody';
import SunBody from './SunBody';
import { BODY_DISTANCE_KM, bodyRadius, EARTH_RADIUS_DEG, SUN_RADIUS_DEG } from './sceneMath';
import styles from './Terrain3D.module.css';

type SkyMarkerProps = {
  body: 'sun' | 'earth';
  direction: [number, number, number]; // unit vector from the site
  sunDirection: [number, number, number]; // lights Earth's day side
  hidden: boolean; // behind the hills: drawn as a wireframe
  colour: string;
  label: string;
  portal: RefObject<HTMLElement | null>;
};

// The Sun or Earth far out past the terrain, with its label above it.
const SkyMarker = ({ body, direction, sunDirection, hidden, colour, label, portal }: SkyMarkerProps) => {
  const radius = bodyRadius(body === 'sun' ? SUN_RADIUS_DEG : EARTH_RADIUS_DEG);
  const position = direction.map((d) => d * BODY_DISTANCE_KM) as [number, number, number];

  return (
    <group position={position}>
      {body === 'sun' ? (
        <SunBody radius={radius} colour={colour} hidden={hidden} />
      ) : (
        <EarthBody radius={radius} sunDirection={sunDirection} colour={colour} hidden={hidden} />
      )}
      {/* drei types portal as non-null, but it reads it only after mount. portal: Html otherwise re-parents its label once the canvas connects, and the unmount drops the Sun's label. */}
      <Html position={[0, radius * 2.2 + 4, 0]} center portal={portal as RefObject<HTMLElement>}>
        <span className={hidden ? styles.labelHidden : styles.label}>
          <BodyGlyph body={body} />
          {label}
        </span>
      </Html>
    </group>
  );
};

export default SkyMarker;

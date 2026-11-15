import { Html } from '@react-three/drei';
import type { RefObject } from 'react';
import styles from './Terrain3D.module.css';

type SkyMarkerProps = {
  body: 'sun' | 'earth';
  position: [number, number, number];
  hidden: boolean; // behind the hills: drawn as a wireframe
  colour: string;
  label: string;
  portal: RefObject<HTMLElement | null>;
};

// The Sun is a sphere and Earth an octahedron, the same circle and diamond as the other views.
const SkyMarker = ({ body, position, hidden, colour, label, portal }: SkyMarkerProps) => {
  return (
    <group position={position}>
      <mesh>
        {body === 'sun' ? <sphereGeometry args={[1.2, 24, 16]} /> : <octahedronGeometry args={[1.6]} />}
        <meshBasicMaterial color={colour} wireframe={hidden} />
      </mesh>
      {/* drei types portal as non-null, but it reads it only after mount. portal: Html otherwise re-parents its label once the canvas connects, and the unmount drops the Sun's label. */}
      <Html position={[0, 2.6, 0]} center portal={portal as RefObject<HTMLElement>}>
        <span className={hidden ? styles.labelHidden : styles.label}>{label}</span>
      </Html>
    </group>
  );
};

export default SkyMarker;

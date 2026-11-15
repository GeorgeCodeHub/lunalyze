import { Html } from '@react-three/drei';
import type { RefObject } from 'react';
import styles from './Terrain3D.module.css';

type CompassPointProps = { position: [number, number, number]; label: string; portal: RefObject<HTMLElement | null> };

// One compass letter on the horizon, so the viewer knows which way they face.
const CompassPoint = ({ position, label, portal }: CompassPointProps) => {
  return (
    <Html position={position} center portal={portal as RefObject<HTMLElement>}>
      <span className={styles.compass}>{label}</span>
    </Html>
  );
};

export default CompassPoint;

import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { type ComponentRef, useEffect, useRef } from 'react';
import type { PerspectiveCamera } from 'three';

type LookAroundProps = { eyeY: number; facing: [number, number, number] };

const LOOK_KM = 0.001; // the controls orbit a point 1 m ahead of the eye, which turns the head without moving it
const FOV_MIN = 8;
const FOV_MAX = 75;

// Stand at the site and look around: drag turns the view, the wheel zooms by narrowing the field of view.
const LookAround = ({ eyeY, facing }: LookAroundProps) => {
  const invalidate = useThree((state) => state.invalidate);

  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);

  // Turn to face `facing`: on mount and whenever a "face" button picks a new direction.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    c.object.position.set(0, eyeY, 0);
    c.target.set(facing[0] * LOOK_KM, eyeY + facing[1] * LOOK_KM, facing[2] * LOOK_KM);
    c.update();
  }, [eyeY, facing]);

  useEffect(() => {
    const c = controls.current;
    const element = c?.domElement;
    if (!c || !element) return;
    const camera = c.object as PerspectiveCamera;
    const zoom = (event: WheelEvent) => {
      event.preventDefault();
      camera.fov = Math.min(FOV_MAX, Math.max(FOV_MIN, camera.fov * Math.exp(event.deltaY * 0.001)));
      camera.updateProjectionMatrix();
      invalidate();
    };
    element.addEventListener('wheel', zoom, { passive: false });
    return () => element.removeEventListener('wheel', zoom);
  }, [invalidate]);

  return (
    <OrbitControls
      ref={controls}
      enablePan={false}
      enableZoom={false}
      enableDamping={false}
      rotateSpeed={-0.35}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI - 0.1}
    />
  );
};

export default LookAround;

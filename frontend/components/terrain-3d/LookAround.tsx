import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { type ComponentRef, useEffect, useRef } from 'react';
import type { PerspectiveCamera } from 'three';
import { FOV_MAX, FOV_MIN, headingOf, type LookAction, lookTurn, POLAR_MAX, POLAR_MIN, tiltedPolar, zoomedFov } from './lookTurn';

// look: the latest arrow-pad press (n counts presses, so the same direction twice turns twice).
// lon: the site's longitude, to turn the view's direction into a bearing. onHeading: the bearing, as it changes.
type LookAroundProps = {
  eyeY: number;
  facing: [number, number, number];
  look: { direction: LookAction | null; n: number };
  lon: number;
  onHeading: (degrees: number) => void;
};

const LOOK_KM = 0.001; // the controls orbit a point 1 m ahead of the eye, which turns the head without moving it

// Stand at the site and look around: drag turns the view, the wheel zooms by narrowing the field of view.
const LookAround = ({ eyeY, facing, look, lon, onHeading }: LookAroundProps) => {
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

  // A press on the pad or the zoom buttons: turn from where the view looks now, or zoom, by one step.
  useEffect(() => {
    const c = controls.current;
    if (!c || look.direction === null) return;
    const camera = c.object as PerspectiveCamera;
    const turn = lookTurn(look.direction);
    c.setAzimuthalAngle(c.getAzimuthalAngle() + turn.azimuth);
    c.setPolarAngle(tiltedPolar(c.getPolarAngle(), turn.polar));
    camera.fov = zoomedFov(camera.fov, look.direction);
    camera.updateProjectionMatrix();
    c.update();
    invalidate();
  }, [look, invalidate]);

  // Tell the compass which way the view faces: now, and on every turn (drag, pad, face buttons).
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const report = () => onHeading(headingOf(c.target.x - c.object.position.x, c.target.z - c.object.position.z, lon));
    report();
    c.addEventListener('change', report);
    return () => c.removeEventListener('change', report);
  }, [lon, onHeading]);

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
      minPolarAngle={POLAR_MIN}
      maxPolarAngle={POLAR_MAX}
    />
  );
};

export default LookAround;

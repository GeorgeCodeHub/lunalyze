import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { type ComponentRef, useEffect, useRef } from 'react';
import { type PerspectiveCamera, Spherical, Vector3 } from 'three';
import { FACE_TURN_MS, FOV_MAX, FOV_MIN, headingOf, type LookAction, lookTurn, POLAR_MAX, POLAR_MIN, tiltedPolar, turnStep, zoomedFov } from './lookTurn';

// look: the latest arrow-pad press (n counts presses, so the same direction twice turns twice).
// lon: the site's longitude, to turn the view's direction into a bearing. onHeading: the bearing, as it changes.
type LookAroundProps = {
  eyeY: number;
  facing: [number, number, number];
  look: { direction: LookAction | null; degrees?: number; n: number }; // degrees: a free turn left (+) or right (-), from the compass
  lon: number;
  onHeading: (degrees: number) => void;
};

const LOOK_KM = 0.001; // the controls orbit a point 1 m ahead of the eye, which turns the head without moving it

// Stand at the site and look around: drag turns the view, the wheel zooms by narrowing the field of view.
const LookAround = ({ eyeY, facing, look, lon, onHeading }: LookAroundProps) => {
  const invalidate = useThree((state) => state.invalidate);

  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const placed = useRef(false); // the first facing is set at once; the face buttons' turn smoothly

  // Turn to face `facing`: at once on mount, then smoothly whenever a "face" button picks a new
  // direction. A drag stops the turn where it is; with reduced motion the view jumps.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    c.object.position.set(0, eyeY, 0);
    const aim = (direction: Vector3) => {
      c.target.copy(c.object.position).addScaledVector(direction.normalize(), LOOK_KM);
      c.update();
      invalidate();
    };
    const to = new Spherical().setFromVector3(new Vector3(...facing));
    const from = new Spherical().setFromVector3(new Vector3().subVectors(c.target, c.object.position));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = placed.current && !reduced ? FACE_TURN_MS : 0; // 0: straight there
    placed.current = true;
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = duration > 0 ? (now - start) / duration : 1;
      const { theta, phi } = turnStep(from, to, t);
      aim(new Vector3().setFromSpherical(new Spherical(1, phi, theta)));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    const stop = () => cancelAnimationFrame(frame);
    step(start);
    c.addEventListener('start', stop);
    return () => {
      cancelAnimationFrame(frame);
      c.removeEventListener('start', stop);
    };
  }, [eyeY, facing, invalidate]);

  // A press on the pad or the zoom buttons: turn from where the view looks now, or zoom, by one step.
  useEffect(() => {
    const c = controls.current;
    if (!c || (look.direction === null && !look.degrees)) return;
    const camera = c.object as PerspectiveCamera;
    const turn = lookTurn(look.direction);
    c.setAzimuthalAngle(c.getAzimuthalAngle() + turn.azimuth + ((look.degrees ?? 0) * Math.PI) / 180);
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

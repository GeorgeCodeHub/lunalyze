/** A direction on the 3D view's arrow pad. */
export type LookDirection = 'up' | 'left' | 'right' | 'down';

/** The 3D view's zoom buttons. */
export type ZoomDirection = 'in' | 'out';

/** A press on the pad or the zoom buttons. */
export type LookAction = LookDirection | ZoomDirection;

/** The pad's order on screen: up on top, left and right in the middle, down at the bottom. */
export const LOOK_DIRECTIONS: LookDirection[] = ['up', 'left', 'right', 'down'];

const TURN = Math.PI / 12; // 15° left or right per press
const TILT = Math.PI / 18; // 10° up or down per press

/** How far the view can tilt: just short of straight up and straight down, as when dragging. */
export const POLAR_MIN = 0.1;
export const POLAR_MAX = Math.PI - 0.1;

const TURNS: Record<LookDirection, { azimuth: number; polar: number }> = {
  up: { azimuth: 0, polar: TILT },
  down: { azimuth: 0, polar: -TILT },
  left: { azimuth: TURN, polar: 0 },
  right: { azimuth: -TURN, polar: 0 },
};

/**
 * How one press turns the view, as changes to the orbit controls' angles (radians). The controls orbit
 * a point just ahead of the eye, so the view turns the same way as the angles: a larger azimuth looks
 * left, a larger polar angle looks up. Anything that is not a pad direction turns nothing.
 */
export const lookTurn = (direction: string | null): { azimuth: number; polar: number } =>
  (direction !== null && Object.hasOwn(TURNS, direction) ? TURNS[direction as LookDirection] : undefined) ?? { azimuth: 0, polar: 0 };

/**
 * The polar angle after a tilt, kept between just short of straight up and just short of straight down.
 * An angle that is not a number (the controls not ready) gives a level view; a tilt that is not a number
 * tilts nothing.
 */
export const tiltedPolar = (polar: number, by: number) => {
  if (!Number.isFinite(polar)) return Math.PI / 2;
  return Math.min(POLAR_MAX, Math.max(POLAR_MIN, polar + (Number.isFinite(by) ? by : 0)));
};

/** How far the view can zoom, as the camera's field of view in degrees: narrow is close, wide is far. */
export const FOV_MIN = 8;
export const FOV_MAX = 75;
const ZOOM_STEP = 1.25; // each press narrows or widens the view by a quarter

/**
 * The field of view after a zoom press: "in" narrows it, "out" widens it, kept between FOV_MIN and
 * FOV_MAX. Anything else keeps it. A field of view that is not a number (the camera not ready) stays as it is.
 */
export const zoomedFov = (fov: number, direction: string | null) => {
  if (!Number.isFinite(fov)) return fov;
  const factor = direction === 'in' ? 1 / ZOOM_STEP : direction === 'out' ? ZOOM_STEP : 1;
  return Math.min(FOV_MAX, Math.max(FOV_MIN, fov * factor));
};

/** The eight compass points, clockwise from north. */
export const COMPASS_POINTS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as const;
export type CompassPoint = (typeof COMPASS_POINTS)[number];

/**
 * The bearing the view faces, in degrees clockwise from local north (0 to 360), from the view's direction
 * in the scene (x, z) at the site's longitude. The inverse of sceneDirection: a bearing az at longitude
 * lon points along (sin(az + lon), -cos(az + lon)) in x and z.
 */
export const headingOf = (x: number, z: number, lon: number) => {
  const degrees = (Math.atan2(x, -z) * 180) / Math.PI - lon;
  return ((degrees % 360) + 360) % 360;
};

/** The nearest of the eight compass points to a bearing (any number of degrees, wrapped). */
export const compassPoint = (heading: number): CompassPoint => {
  const wrapped = Number.isFinite(heading) ? ((heading % 360) + 360) % 360 : 0;
  return COMPASS_POINTS[Math.round(wrapped / 45) % 8];
};

/**
 * Where a point lies around a dial's centre, in degrees clockwise from straight up (0 to 360). Screen y
 * runs down. The centre itself has no direction: it reads as up.
 */
export const dialAngle = (cx: number, cy: number, x: number, y: number) => {
  if (x === cx && y === cy) return 0;
  const degrees = (Math.atan2(x - cx, cy - y) * 180) / Math.PI;
  return (degrees + 360) % 360;
};

/** The shortest turn from one angle to another, in degrees: clockwise positive, between -180 and 180. */
export const angleDelta = (from: number, to: number) => {
  const delta = (((to - from) % 360) + 540) % 360 - 180;
  return delta === -180 ? 180 : delta;
};

/** How long a "face" button takes to turn the view, in milliseconds. */
export const FACE_TURN_MS = 700;

/**
 * One moment of a smooth turn between two directions, as angles in radians (theta around the vertical,
 * phi down from straight up), at t from 0 (start) to 1 (end): slow at both ends, fast in the middle,
 * and round the shorter way. A t outside 0..1 is held to it.
 */
export const turnStep = (from: { theta: number; phi: number }, to: { theta: number; phi: number }, t: number) => {
  const k = Math.min(1, Math.max(0, t));
  const eased = k < 0.5 ? 4 * k ** 3 : 1 - (2 - 2 * k) ** 3 / 2;
  const dTheta = Math.atan2(Math.sin(to.theta - from.theta), Math.cos(to.theta - from.theta));
  return { theta: from.theta + dTheta * eased, phi: from.phi + (to.phi - from.phi) * eased };
};

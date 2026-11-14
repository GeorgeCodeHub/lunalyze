// Sun and Earth direction as seen from a point on the Moon.
// Checked against JPL Horizons in lunar.test.ts (max error < 0.01°).
import { Body, GeoMoon, GeoVector, Horizon, Equator, KM_PER_AU, Observer, RotationAxis } from 'astronomy-engine';

export type AzEl = { az: number; el: number };
type V3 = [number, number, number];

export const R_MOON_KM = 1737.4;
const RAD = Math.PI / 180;

const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const mix = (a: V3, ka: number, b: V3, kb: number, c: V3, kc: number): V3 => [
  a[0] * ka + b[0] * kb + c[0] * kc,
  a[1] * ka + b[1] * kb + c[1] * kc,
  a[2] * ka + b[2] * kb + c[2] * kc,
];
const unit = (a: V3): V3 => {
  const n = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / n, a[1] / n, a[2] / n];
};

/**
 * Azimuth and elevation (degrees) of the Sun and Earth centres, no terrain, spherical Moon.
 * lat: degrees north. lonE: degrees east. hKm: height above the 1737.4 km sphere.
 * az: 0 = north, 90 = east, range 0..360. el: degrees above the local horizontal plane.
 */
export const sky = (lat: number, lonE: number, hKm: number, date: Date): { sun: AzEl; earth: AzEl } => {
  // Moon body-fixed axes in J2000 equatorial coordinates (IAU rotation model).
  const axis = RotationAxis(Body.Moon, date);
  const pole: V3 = [axis.north.x, axis.north.y, axis.north.z];
  const ra = axis.ra * 15 * RAD;
  const node: V3 = [-Math.sin(ra), Math.cos(ra), 0]; // where the Moon's equator crosses the J2000 equator
  const w = axis.spin * RAD;
  const x = mix(node, Math.cos(w), cross(pole, node), Math.sin(w), pole, 0); // lon 0, lat 0
  const y = cross(pole, x);

  const cl = Math.cos(lat * RAD);
  const up = mix(x, cl * Math.cos(lonE * RAD), y, cl * Math.sin(lonE * RAD), pole, Math.sin(lat * RAD));
  const east = unit(cross(pole, up));
  const north = cross(up, east);

  const r = (R_MOON_KM + hKm) / KM_PER_AU;
  const moon = GeoMoon(date);
  const site: V3 = [moon.x + up[0] * r, moon.y + up[1] * r, moon.z + up[2] * r]; // geocentric, AU
  const sun = GeoVector(Body.Sun, date, true); // light time + aberration: worth 0.006° on the Sun

  const azEl = (target: V3): AzEl => {
    const d = unit([target[0] - site[0], target[1] - site[1], target[2] - site[2]]);
    const az = Math.atan2(dot(d, east), dot(d, north)) / RAD;
    return { az: (az + 360) % 360, el: Math.asin(dot(d, up)) / RAD };
  };
  return { sun: azEl([sun.x, sun.y, sun.z]), earth: azEl([0, 0, 0]) };
};

/** Sun path at a place on Earth for 24 h from `start`, one [az, el] per hour (25 points). No refraction. */
export const earthSunPath = (lat: number, lonE: number, start: Date): [number, number][] => {
  const obs = new Observer(lat, lonE, 0);
  return Array.from({ length: 25 }, (_, h) => {
    const t = new Date(start.getTime() + h * 3600e3);
    const eq = Equator(Body.Sun, t, obs, true, true);
    const hor = Horizon(t, obs, eq.ra, eq.dec);
    return [hor.azimuth, hor.altitude];
  });
};

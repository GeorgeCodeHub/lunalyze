import { expect, test } from 'vitest';
import { sky, type AzEl } from './lunar';

// Reference values from JPL Horizons (ssd.jpl.nasa.gov/api/horizons.api), fetched 2026-11-14.
// Observer table, CENTER coord@301 (Moon surface, MEAN_ME frame, DE441), height 0 km,
// QUANTITIES 4 (apparent azimuth and elevation, airless). Targets: Sun (10) and Earth (399).
// [lat, lonE, UTC, sunAz, sunEl, earthAz, earthEl]
const HORIZONS: [number, number, string, number, number, number, number][] = [
  [-89.68, -166.0, '2028-03-01T00:00Z', 289.448091, -0.874211, 159.83944, 6.179449], // Point A
  [-89.68, -166.0, '2026-11-15T12:00Z', 274.331667, 1.580062, 162.686533, -3.253164],
  [-86.04, 2.7, '2028-03-01T00:00Z', 120.624786, -3.002138, 351.032885, 10.39463], // Malapert M1
  [-86.04, 2.7, '2026-11-15T12:00Z', 105.708409, 0.485598, 353.99658, 0.990261],
  [0.6742, 23.4731, '2028-03-01T00:00Z', 88.886499, -9.956893, 255.46979, 59.376976], // Apollo 11
  [0.6742, 23.4731, '2026-11-15T12:00Z', 91.623207, 5.111382, 274.653674, 63.043031],
  [-45.4561, 177.5886, '2028-03-01T00:00Z', 297.917496, 23.490887, 175.27588, -37.903896], // Chang'e 4
  [-45.4561, 177.5886, '2026-11-15T12:00Z', 284.018188, 15.53323, 178.679778, -47.405049],
];

const RAD = Math.PI / 180;
/** Angle on the sky between two directions, degrees. */
const separation = (a: AzEl, b: AzEl): number => {
  const c =
    Math.sin(a.el * RAD) * Math.sin(b.el * RAD) +
    Math.cos(a.el * RAD) * Math.cos(b.el * RAD) * Math.cos((a.az - b.az) * RAD);
  return Math.acos(Math.min(1, c)) / RAD;
};

test('sky() matches all 16 JPL Horizons fixtures to better than 0.01°', () => {
  const errors = HORIZONS.flatMap(([lat, lon, utc, sunAz, sunEl, earthAz, earthEl]) => {
    const got = sky(lat, lon, 0, new Date(utc));
    return [separation(got.sun, { az: sunAz, el: sunEl }), separation(got.earth, { az: earthAz, el: earthEl })];
  });
  console.log('Horizons errors (deg):', errors.map((e) => e.toFixed(4)).join(' '), '| max', Math.max(...errors).toFixed(4));
  expect(errors).toHaveLength(16);
  expect(Math.max(...errors)).toBeLessThan(0.01);
});

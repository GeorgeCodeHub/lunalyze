import { expect, test } from 'vitest';
import { sky } from './lunar';
import { sunlitFraction } from './sunlit';

// Point A, 24 h from 2028-03-01T00:00Z: Sun az runs 289.4° down to about 285° at h≈8.7 (JPL Horizons fixtures in lunar.test.ts).
const LAT = -89.68;
const LON = -166.0;
const START = new Date('2028-03-01T00:00:00Z');
const flat = (el: number) => Array<number>(720).fill(el);

test('a mask at 90° leaves the Sun hidden for all 24 samples', () => {
  expect(sunlitFraction(flat(90), LAT, LON, START, 24)).toBe(0);
});

test('a mask at -90° leaves the Sun visible for all 24 samples', () => {
  expect(sunlitFraction(flat(-90), LAT, LON, START, 24)).toBe(1);
});

test('a step mask (index < 570 open, else wall) counts 15 of 24 samples', () => {
  const step = Array.from({ length: 720 }, (_, i) => (i < 570 ? -90 : 90));
  expect(sunlitFraction(step, LAT, LON, START, 24)).toBe(0.625);
});

test('a mask with the wrong length throws', () => {
  expect(() => sunlitFraction(Array<number>(719).fill(0), LAT, LON, START, 24)).toThrow();
  expect(() => sunlitFraction(Array<number>(721).fill(0), LAT, LON, START, 24)).toThrow();
});

test('fewer than one hour throws instead of returning NaN', () => {
  expect(() => sunlitFraction(flat(0), LAT, LON, START, 0)).toThrow();
  expect(() => sunlitFraction(flat(0), LAT, LON, START, NaN)).toThrow();
  expect(() => sunlitFraction(flat(0), LAT, LON, START, 0.5)).toThrow();
});

test('a Sun exactly at the mask elevation is hidden (strict >)', () => {
  const { el } = sky(LAT, LON, 0.002, START).sun;
  expect(sunlitFraction(flat(el), LAT, LON, START, 1)).toBe(0);
});

import { expect, test } from 'vitest';
import { MAP_BOX_FALLBACK, MARK_PX, mapView } from './mapUnits';

// A map 200 units across (half = 100). In a 200 × 125 px box its full width fits: 1 map unit per pixel.
const HALF = 100;
const view = (pins: { x: number; y: number }[], w = 200, h = 125) => mapView(pins, w, h, HALF);
const at = (x: number, y: number) => ({ x, y });

test.each([
  { name: 'no pins: the full width, around the pole', pins: [], x: -100, y: -62.5 },
  { name: 'one pin at the pole', pins: [at(0, 0)], x: -100, y: -62.5 },
  { name: 'centred on two pins top to bottom', pins: [at(0, -20), at(0, 40)], x: -100, y: -52.5 },
  { name: 'a pin near the top edge: the view stops at the top of the picture', pins: [at(0, -95)], x: -100, y: -100 },
  { name: 'a pin near the bottom edge: the view stops at the bottom of the picture', pins: [at(0, 95)], x: -100, y: -25 },
  { name: 'pins further apart than the box: centred between them', pins: [at(0, -60), at(0, 70)], x: -100, y: -57.5 },
  { name: 'pins at opposite corners: centred, on the picture', pins: [at(-100, -100), at(100, 100)], x: -100, y: -62.5 },
  { name: 'a pin far to one side: a wide box shows the full width anyway', pins: [at(95, 0)], x: -100, y: -62.5 },
])('a wide box shows the full width, 1 unit per px: $name', ({ pins, x, y }) => {
  expect(view(pins)).toEqual({ x, y, width: 200, height: 125, k: 1 });
});

test.each([
  { name: 'one pin at the pole', pins: [at(0, 0)], x: -50 },
  { name: 'a pin near the right edge: the view stops at the right of the picture', pins: [at(90, 0)], x: 0 },
  { name: 'a pin near the left edge: the view stops at the left of the picture', pins: [at(-90, 0)], x: -100 },
  { name: 'centred on two pins side to side', pins: [at(-20, 0), at(40, 0)], x: -40 },
])('a tall box shows the full height, half a unit per px: $name', ({ pins, x }) => {
  expect(view(pins, 200, 400)).toEqual({ x, y: -100, width: 100, height: 200, k: 0.5 });
});

test('a square box shows the whole map', () => {
  expect(view([at(-60, 70)], 400, 400)).toEqual({ x: -100, y: -100, width: 200, height: 200, k: 0.5 });
});

test.each([
  { w: 200, h: 125 },
  { w: 300, h: 120 },
  { w: 200, h: 400 },
  { w: 916, h: 580 },
  { w: 320, h: 320 },
  { w: 120, h: 900 },
])('in a $w × $h box the picture covers the view and nothing is stretched, wherever the pins are', ({ w, h }) => {
  for (const pins of [[], [at(0, 0)], [at(0, -60), at(0, 70)], [at(-100, -100), at(100, 100)], [at(99, -99)], [at(-99, 99)]]) {
    const v = view(pins, w, h);
    expect(v.width / v.height).toBeCloseTo(w / h, 9);
    expect(v.x).toBeGreaterThanOrEqual(-HALF - 1e-9);
    expect(v.y).toBeGreaterThanOrEqual(-HALF - 1e-9);
    expect(v.x + v.width).toBeLessThanOrEqual(HALF + 1e-9);
    expect(v.y + v.height).toBeLessThanOrEqual(HALF + 1e-9);
    expect(Math.max(v.width, v.height)).toBeCloseTo(2 * HALF, 9); // as much of the map as the box allows
  }
});

test('before it is measured, the box is 480 × 300 px, so a Sun or Earth line is a quarter of the half-map', () => {
  expect(MAP_BOX_FALLBACK).toEqual({ w: 480, h: 300 });
  const v = mapView([], MAP_BOX_FALLBACK.w, MAP_BOX_FALLBACK.h, HALF);
  expect(MARK_PX.line * v.k).toBeCloseTo(0.25 * HALF, 9);
});

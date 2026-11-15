import { expect, test } from 'vitest';
import { MAP_BOX_FALLBACK, MARK_PX, mapView } from './mapUnits';

// A map 200 units across (half = 100) in a 200 × 125 px box: 1 map unit per pixel at full width, with
// 10 px of room kept around the outermost pins.
const HALF = 100;
const ROOM = 10;
const view = (pins: number[], w = 200, h = 125) => mapView(pins, w, h, HALF, ROOM);

test.each([
  { name: 'no pins: the full width, around the pole', pins: [], x: -100, y: -62.5, width: 200, height: 125, k: 1, fullWidth: true },
  { name: 'one pin at the pole', pins: [0], x: -100, y: -62.5, width: 200, height: 125, k: 1, fullWidth: true },
  { name: 'centred on two pins', pins: [-20, 40], x: -100, y: -52.5, width: 200, height: 125, k: 1, fullWidth: true },
  { name: 'a pin near the top edge: kept on the map', pins: [-95], x: -100, y: -100, width: 200, height: 125, k: 1, fullWidth: true },
  { name: 'a pin near the bottom edge: kept on the map', pins: [95], x: -100, y: -25, width: 200, height: 125, k: 1, fullWidth: true },
  { name: 'pins just fitting with their room', pins: [-52.5, 52.5], x: -100, y: -62.5, width: 200, height: 125, k: 1, fullWidth: true },
])('$name', ({ pins, x, y, width, height, k, fullWidth }) => {
  expect(view(pins)).toEqual({ x, y, width, height, k, fullWidth });
});

test('pins too far apart: zoomed out just enough to hold them and their room, with dark sides', () => {
  const v = view([-60, 70]); // 130 apart, plus 2 × 10 px of room, in a 125 px tall box
  expect(v.fullWidth).toBe(false);
  expect(v.k).toBeCloseTo(130 / 105, 9);
  expect(v.width).toBeCloseTo(200 * (130 / 105), 9);
  expect(v.height).toBeCloseTo(125 * (130 / 105), 9);
  expect(v.x).toBeCloseTo(-v.width / 2, 9); // centred: the map in the middle, dark at both sides
  expect(v.y).toBeCloseTo(5 - v.height / 2, 9); // centred on the pins (5 is their middle)
  expect(v.y).toBeLessThan(-60 - ROOM * v.k + 1e-9); // the top pin keeps its room
  expect(v.y + v.height).toBeGreaterThan(70 + ROOM * v.k - 1e-9); // and so does the bottom one
});

test('the view always has the box shape, so nothing is stretched', () => {
  for (const pins of [[], [0], [-60, 70], [-100, 100]]) {
    const v = view(pins, 300, 120);
    expect(v.width / v.height).toBeCloseTo(300 / 120, 9);
  }
});

test('a box taller than the map is wide: the whole map, centred, dark above and below', () => {
  expect(view([0], 200, 400)).toEqual({ x: -100, y: -200, width: 200, height: 400, k: 1, fullWidth: true });
});

test('a box too short to keep any room falls back to the full width', () => {
  expect(view([-60, 70], 200, 15).fullWidth).toBe(true);
});

test('before it is measured, the box is 480 × 300 px, so a Sun or Earth line is a quarter of the half-map', () => {
  expect(MAP_BOX_FALLBACK).toEqual({ w: 480, h: 300 });
  const v = mapView([], MAP_BOX_FALLBACK.w, MAP_BOX_FALLBACK.h, HALF);
  expect(MARK_PX.line * v.k).toBeCloseTo(0.25 * HALF, 9);
});

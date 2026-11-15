import { expect, test } from 'vitest';
import type { TerrainGrid } from '../../../backend/lib/useTerrain';
import { buildTerrainMesh, EXAGGERATION, sceneDirection } from './sceneMath';

const grid = (width: number, height: number, heightsM: number[], origin = { x: -80, y: 80 }): TerrainGrid => ({
  siteId: 't',
  width,
  height,
  pixelM: 80,
  origin,
  heightsM: Float32Array.from(heightsM),
});
const bump = grid(3, 3, [0, 0, 0, 0, 10, 0, 0, 0, 0]);
const at = (positions: Float32Array, v: number) => [...positions.slice(v * 3, v * 3 + 3)];

test('a 3 x 3 grid becomes 9 vertices around the site, the site at the origin', () => {
  const { positions, index } = buildTerrainMesh(bump, { x: 0, y: 0 }, 1, 2);

  expect(positions.length).toBe(27);
  const [x4, y4, z4] = at(positions, 4);
  expect(x4).toBeCloseTo(0, 6);
  expect(y4).toBeCloseTo(0, 6);
  expect(z4).toBeCloseTo(0, 6);
  const v0 = at(positions, 0);
  expect(v0[0]).toBeCloseTo(-0.08, 6);
  expect(v0[1]).toBeCloseTo(-0.0200074, 6); // 10 m lower than the site, x2, plus the curve of the Moon
  expect(v0[2]).toBeCloseTo(-0.08, 6);
  const v1 = at(positions, 1);
  expect(v1[0]).toBeCloseTo(0, 6);
  expect(v1[1]).toBeCloseTo(-0.0200037, 6);
  expect(v1[2]).toBeCloseTo(-0.08, 6);
  expect(index.length).toBe(24);
  expect([...index.slice(0, 6)]).toEqual([0, 3, 1, 1, 3, 4]);
});

test('the triangles of a 500 x 500 grid sampled every second pixel', () => {
  const big = grid(500, 500, new Array(250000).fill(0), { x: -19960, y: 19960 });
  const { positions, index } = buildTerrainMesh(big, { x: 0, y: 0 }, 2, 2.5);

  expect(positions.length).toBe(62500 * 3);
  expect(index.length).toBe(372006);
  expect(index.reduce((m, v) => Math.max(m, v), 0)).toBe(62499); // no triangle points past the last vertex
});

test('a site at the edge of the grid, or off it, uses the nearest pixel for the height and does not throw', () => {
  const corner = buildTerrainMesh(bump, { x: -80, y: 80 }, 1, 1).positions; // pixel (0,0)
  expect(corner.length).toBe(27);
  expect(corner[1]).toBeCloseTo(0, 6); // vertex 0 sits at the site's own height
  const off = buildTerrainMesh(bump, { x: 9000, y: -9000 }, 1, 1).positions; // clamps to pixel (2,2)
  expect(Number.isFinite(off[1])).toBe(true);
  expect(off[1 + 3 * 8]).toBeLessThan(0.0001); // vertex 8 is the clamped pixel: height 0, curve only
});

test('a step that does not divide the grid still indexes only real pixels', () => {
  const { positions, index } = buildTerrainMesh(bump, { x: 0, y: 0 }, 2, 1); // columns 0 and 2
  expect(positions.length).toBe(4 * 3);
  expect(index.length).toBe(6);
  expect(positions.every(Number.isFinite)).toBe(true);
});

test.each([
  [0, 0, 0, [0, 0, -1]],
  [90, 0, 0, [1, 0, 0]],
  [0, 0, 90, [1, 0, 0]],
  [0, 45, 0, [0, 0.92848, -0.37139]],
  [30, 5, -60, [-0.48845, 0.21367, -0.84603]],
  [0, -10, 0, [0, -0.40337, -0.91504]],
])('sceneDirection az %d, el %d, lon %d', (az, el, lon, expected) => {
  const v = sceneDirection({ az, el }, lon, 2.5);
  expected.forEach((e, i) => expect(v[i]).toBeCloseTo(e, 5));
  expect(Math.hypot(...v)).toBeCloseTo(1, 6);
});

test('a body straight up points up, and a body below the horizon points down', () => {
  expect(sceneDirection({ az: 0, el: 90 }, 0, EXAGGERATION)[1]).toBeCloseTo(1, 6);
  expect(sceneDirection({ az: 123, el: -0.5 }, 40, EXAGGERATION)[1]).toBeLessThan(0);
});

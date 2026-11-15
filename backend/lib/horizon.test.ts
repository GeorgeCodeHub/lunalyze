import { deflateSync } from 'node:zlib';
import { expect, test } from 'vitest';
import { BANDS, computeMask, cropTerrain, decodeTile, type LoadTile, TILE, typedSite } from './horizon';

// Synthetic DEMs, made here: the real tiles are not in git. `pnpm horizon-parity` checks the real ones.
const flat: LoadTile = async () => new Int16Array(TILE * TILE);

/** Heights of 500 m (1000 DN) on every pixel more than 10 km toward 0° longitude from y0, flat elsewhere. */
const wallNorthOf =
  (y0: number): LoadTile =>
  async (dem, row) => {
    const tile = new Int16Array(TILE * TILE);
    for (let j = 0; j < TILE; j++) {
      const y = ((dem.n - 1) / 2 - (row * TILE + j)) * dem.scale;
      if (y > y0 + 10000) tile.fill(1000, j * TILE, (j + 1) * TILE);
    }
    return tile;
  };

test('flat ground: every bin is the dip of a 2 m mast on the 1737.4 km sphere, and complete', async () => {
  const mask = await computeMask('@-89:0', -89, 0, BANDS, flat);
  expect(mask.elevDeg).toHaveLength(720);
  expect(new Set(mask.elevDeg)).toEqual(new Set([-0.087]));
  expect(mask.incomplete.every((v) => !v)).toBe(true);
  expect(mask).toMatchObject({ siteId: '@-89:0', mastM: 2, azStepDeg: 0.5 });
});

test('a 500 m wall 10 km north rises in the north bins only (azimuth 0 = north)', async () => {
  // At longitude 0, north points along +y, away from the pole. y0 of -89° 0° is 2 R tan(0.5°).
  const y0 = 2 * 1737400 * Math.tan((0.5 * Math.PI) / 180);
  const mask = await computeMask('@-89:0', -89, 0, BANDS, wallNorthOf(y0));
  expect(mask.elevDeg[0]).toBe(2.68); // north: atan(498 m / 10.02 km), the first full-height sample, less the 0.165° curvature drop
  expect(mask.elevDeg[180]).toBe(-0.087); // east, along the wall: no gain
  expect(mask.elevDeg[360]).toBe(-0.087); // south
});

test('rays that leave every DEM before their reach are incomplete; the others are not', async () => {
  // -76° 0° is about 30 km inside the 240 m DEM's edge. North (away from the pole) runs off it; south does not.
  const mask = await computeMask('@-76:0', -76, 0, BANDS, flat);
  expect(mask.incomplete[0]).toBe(true); // north, toward the edge
  expect(mask.incomplete[360]).toBe(false); // south, toward the pole
});

test('cropTerrain: 500 × 500 at 80 m from the 80 m DEM, and from the 240 m DEM past its edge', async () => {
  // Each DEM answers with its own height: 80 m tiles 50 m (100 DN), 240 m tiles 100 m (200 DN).
  const byDem: LoadTile = async (dem) => new Int16Array(TILE * TILE).fill(dem.scale === 80 ? 100 : 200);
  const heights = async (lat: number) => new Set((await cropTerrain({ id: 'x', lat, lon: 0 }, byDem)).heightsM);

  const near = await cropTerrain({ id: '@-89:0', lat: -89, lon: 0 }, byDem);
  expect(near).toMatchObject({ siteId: '@-89:0', width: 500, height: 500, pixelM: 80, origin: { x: -19960, y: 50280 } });
  expect(new Set(near.heightsM)).toEqual(new Set([50]));
  expect(await heights(-80.3)).toEqual(new Set([50, 100])); // the 80 m DEM's edge crosses the crop
  expect(await heights(-78)).toEqual(new Set([100])); // past the 80 m DEM: all 240 m
});

test('typedSite: the place for an @lat:lon id, terrain modeled only inside the DEMs', () => {
  expect(typedSite('@-85.3:31.4')).toEqual({
    id: '@-85.3:31.4',
    lat: -85.3,
    lon: 31.4,
    kind: 'typed',
    precision: 'exact',
    terrainModeled: true,
    group: 'Typed coordinates',
    source: 'LRO LOLA polar DEMs (20 m, 80 m, 240 m); horizon computed in the browser',
  });
  expect(typedSite('@-65:15')?.terrainModeled).toBe(false); // north of the 240 m DEM
  expect(typedSite('@-91:0')).toBeNull();
  expect(typedSite('@:10')).toBeNull();
  expect(typedSite('point-a')).toBeNull();
});

test('decodeTile reverses dem_tiles.py: row deltas that wrap, low bytes then high bytes, zlib', async () => {
  const want = new Int16Array(TILE * TILE);
  want.set([0, 100, -100, 32767, -32768, 5]);
  want.set([-2000, -1999], TILE); // the second row starts again from 0
  const delta = new Int16Array(TILE * TILE);
  for (let k = 0; k < want.length; k++) delta[k] = k % TILE === 0 ? want[k] : want[k] - want[k - 1];
  const bytes = new Uint8Array(delta.buffer);
  const planes = new Uint8Array(bytes.length);
  for (let k = 0; k < delta.length; k++) [planes[k], planes[delta.length + k]] = [bytes[2 * k], bytes[2 * k + 1]];

  const got = await decodeTile(new Blob([deflateSync(planes)]).stream());
  expect([...got.subarray(0, 6)]).toEqual([0, 100, -100, 32767, -32768, 5]);
  expect([...got.subarray(TILE, TILE + 2)]).toEqual([-2000, -1999]);
});

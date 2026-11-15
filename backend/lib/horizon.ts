// Horizon masks for typed coordinates, computed from the LOLA DEM tiles that backend/scripts/dem_tiles.py writes.
// A port of horizon() in backend/scripts/horizon_masks.py with the same sampling, so it reproduces the
// committed masks: `pnpm horizon-parity` checks every listed site.
import type { HorizonMask } from './realView';
import type { Site } from './types';
import type { TerrainGrid } from './useTerrain';

const R = 1737400; // lunar sphere radius, m
const MAST_M = 2;
const AZ_STEP = 0.5;
const N_AZ = 720;
const NEAR_M = 5000; // an 80 m DEM step skips peaks near the observer, so sample every 20 m out to 5 km
const NEAR_STEP_M = 20;
export const TILE = 512; // must match TILE in backend/scripts/dem_tiles.py

/** A south-polar stereographic DEM: n × n pixels of `scale` metres, centred on the pole. */
export type Dem = { name: string; n: number; scale: number };
const DEM_20M: Dem = { name: 'ldem_85s_20m', n: 15168, scale: 20 };
const DEM_80M: Dem = { name: 'ldem_80s_80m', n: 7600, scale: 80 };
const DEM_240M: Dem = { name: 'ldem_75s_240m', n: 3812, scale: 240 };

/** Fine to coarse, each DEM out to its reach in metres: the bands horizon_masks.py uses for its finest sites. */
export type Band = { dem: Dem; reach: number };
export const BANDS: Band[] = [
  { dem: DEM_20M, reach: 20000 },
  { dem: DEM_80M, reach: 100000 },
  { dem: DEM_240M, reach: 300000 },
];

/** Reads one tile of a DEM: TILE × TILE heights in DN (metres × 2), row-major. */
export type LoadTile = (dem: Dem, row: number, col: number) => Promise<Int16Array>;

const rad = (deg: number) => (deg * Math.PI) / 180;

/** South polar stereographic: x toward 90°E, y toward 0° longitude, metres. */
const polarXY = (lat: number, lon: number): [number, number] => {
  const rho = 2 * R * Math.tan(rad(90 + lat) / 2);
  return [rho * Math.sin(rad(lon)), rho * Math.cos(rad(lon))];
};

/** Pixel coordinates of (x, y) in a DEM; pixel centres sit on integers. */
const pixel = ({ n, scale }: Dem, x: number, y: number): [number, number] => [(n - 1) / 2 + x / scale, (n - 1) / 2 - y / scale];

/** True when a point is far enough inside the coarsest DEM for every horizon ray to start on it. */
const covered = (lat: number, lon: number) => {
  const [i, j] = pixel(DEM_240M, ...polarXY(lat, lon));
  return i >= 1 && i <= DEM_240M.n - 2 && j >= 1 && j <= DEM_240M.n - 2;
};

/** The place for a typed-coordinates id, `@lat:lon` (as in the app's links), or null when the id is not one. */
export const typedSite = (id: string): Site | null => {
  if (!id.startsWith('@')) return null;
  const [lat, lon] = id
    .slice(1)
    .split(':')
    .map((v) => (v.trim() === '' ? NaN : Number(v)));
  if (!(Math.abs(lat) <= 90 && Math.abs(lon) <= 180)) return null; // NaN fails too
  return {
    id,
    lat,
    lon,
    kind: 'typed',
    precision: 'exact',
    terrainModeled: covered(lat, lon),
    group: 'Typed coordinates',
    source: 'LRO LOLA polar DEMs (20 m, 80 m, 240 m); horizon computed in the browser',
  };
};

/** A DEM's tiles that were loaded, by row × tiles-per-row + column. */
type Grid = { dem: Dem; perRow: number; tiles: Map<number, Int16Array> };

const px = ({ dem, perRow, tiles }: Grid, i: number, j: number) => {
  const tile = tiles.get(Math.floor(j / TILE) * perRow + Math.floor(i / TILE));
  if (!tile) throw new Error(`${dem.name}: pixel ${i},${j} is outside the loaded tiles`);
  return tile[(j % TILE) * TILE + (i % TILE)];
};

/** Bilinear height in metres, NaN outside the DEM (sample() in horizon_masks.py). */
const sample = (grid: Grid, x: number, y: number) => {
  const { n } = grid.dem;
  const [i, j] = pixel(grid.dem, x, y);
  if (!(i >= 0 && i <= n - 1 && j >= 0 && j <= n - 1)) return NaN;
  const i0 = Math.min(Math.floor(i), n - 2);
  const j0 = Math.min(Math.floor(j), n - 2);
  const fi = i - i0;
  const fj = j - j0;
  return (
    (px(grid, i0, j0) * (1 - fi) * (1 - fj) +
      px(grid, i0 + 1, j0) * fi * (1 - fj) +
      px(grid, i0, j0 + 1) * (1 - fi) * fj +
      px(grid, i0 + 1, j0 + 1) * fi * fj) *
    0.5
  );
};

/** Height from the grid of band `first`, falling back to each coarser band's grid; NaN where none holds the point. */
const sampleFrom = (grids: Grid[], first: number, x: number, y: number) => {
  for (let k = first; k < grids.length; k++) {
    const h = sample(grids[k], x, y);
    if (!Number.isNaN(h)) return h;
  }
  return NaN;
};

/** numpy.arange for these whole-metre steps. */
const arange = (start: number, stop: number, step: number) =>
  Array.from({ length: Math.max(0, Math.ceil((stop - start) / step)) }, (_, i) => start + i * step);

/** Sample distances along each ray and the band each one belongs to. */
const rayDistances = (bands: Band[]) => {
  const d: number[] = [];
  const band: number[] = [];
  let start = 0;
  bands.forEach(({ dem, reach }, k) => {
    let ds = arange(start + dem.scale, reach + dem.scale / 2, dem.scale);
    if (start < NEAR_M) {
      const near = arange(start + NEAR_STEP_M, Math.min(reach, NEAR_M) + NEAR_STEP_M / 2, NEAR_STEP_M);
      ds = [...near, ...ds.filter((v) => v > NEAR_M)];
    }
    ds.forEach((v) => {
      d.push(v);
      band.push(k);
    });
    start = reach;
  });
  return { d, band };
};

/** Loads every tile of a DEM that holds a pixel in columns iMin..iMax and rows jMin..jMax, clipped to the DEM. */
const loadGrid = async (dem: Dem, [iMin, iMax]: number[], [jMin, jMax]: number[], loadTile: LoadTile): Promise<Grid> => {
  const perRow = Math.ceil(dem.n / TILE);
  const span = (lo: number, hi: number) => arange(Math.max(0, Math.floor(lo / TILE)), Math.min(perRow - 1, Math.floor(hi / TILE)) + 1, 1);
  const wanted = span(jMin, jMax).flatMap((row) => span(iMin, iMax).map((col) => [row, col] as const));
  const loaded = await Promise.all(wanted.map(([row, col]) => loadTile(dem, row, col)));
  return { dem, perRow, tiles: new Map(wanted.map(([row, col], k) => [row * perRow + col, loaded[k]])) };
};

/** Unit vector of a stereographic point on the sphere. */
const unit = (x: number, y: number): [number, number, number] => {
  const d = 4 * R * R + x * x + y * y;
  return [(4 * R * x) / d, (4 * R * y) / d, (4 * R * R - x * x - y * y) / d];
};

/**
 * The horizon at a 2 m mast, 720 bins of 0.5° azimuth, from the DEM tiles of `bands` (fine to coarse).
 * A bin is incomplete when its ray left every DEM before its reach: the true horizon may be higher.
 */
export const computeMask = async (id: string, lat: number, lon: number, bands: Band[], loadTile: LoadTile): Promise<HorizonMask> => {
  const [x0, y0] = polarXY(lat, lon);
  const grids = await Promise.all(
    bands.map(({ dem, reach }) => {
      const margin = reach + 2 * dem.scale; // every sample of the band, and of the finer bands that fall back to it
      const [iMin, jMin] = pixel(dem, x0 - margin, y0 + margin);
      const [iMax, jMax] = pixel(dem, x0 + margin, y0 - margin);
      return loadGrid(dem, [iMin, iMax], [jMin, jMax], loadTile);
    }),
  );

  const ground = sampleFrom(grids, 0, x0, y0);
  if (Number.isNaN(ground)) throw new Error(`${id}: outside the DEMs`);
  const ro = R + ground + MAST_M;
  const u0 = unit(x0, y0);
  const { d, band } = rayDistances(bands);

  const elevDeg: number[] = [];
  const incomplete: boolean[] = [];
  for (let r = 0; r < N_AZ; r++) {
    const beta = rad(AZ_STEP * r + lon); // bearing = azimuth + longitude
    const sin = Math.sin(beta);
    const cos = Math.cos(beta);
    let best = -Infinity;
    let missing = false;
    for (let s = 0; s < d.length; s++) {
      const x = x0 + sin * d[s];
      const y = y0 + cos * d[s];
      const h = sampleFrom(grids, band[s], x, y);
      if (Number.isNaN(h)) {
        missing = true; // the ray left the DEMs: nothing beyond this point counts
        break;
      }
      const u = unit(x, y);
      const cross = Math.hypot(u0[1] * u[2] - u0[2] * u[1], u0[2] * u[0] - u0[0] * u[2], u0[0] * u[1] - u0[1] * u[0]);
      const theta = Math.atan2(cross, u0[0] * u[0] + u0[1] * u[1] + u0[2] * u[2]);
      const rt = R + h;
      best = Math.max(best, (Math.atan2(rt * Math.cos(theta) - ro, rt * Math.sin(theta)) * 180) / Math.PI);
    }
    if (best === -Infinity) throw new Error(`${id}: the ray at ${AZ_STEP * r}° has no terrain`);
    elevDeg.push(Math.round(best * 1000) / 1000);
    incomplete.push(missing);
  }
  return { siteId: id, mastM: MAST_M, azStepDeg: AZ_STEP, elevDeg, incomplete };
};

const CROP = 500;

/**
 * The 500 × 500 terrain crop for the 3D view around a place, as terrain_crop() in horizon_masks.py makes it for the
 * listed sites: the 80 m DEM, and the nearest 240 m pixel past its edge.
 */
export const cropTerrain = async (site: Pick<Site, 'id' | 'lat' | 'lon'>, loadTile: LoadTile): Promise<TerrainGrid> => {
  const [x, y] = polarXY(site.lat, site.lon);
  const n80 = DEM_80M.n;
  const off80 = (n80 - 1) / 2;
  const off240 = (DEM_240M.n - 1) / 2;
  const i0 = Math.floor(off80 + x / DEM_80M.scale) - (CROP / 2 - 1);
  const j0 = Math.floor(off80 - y / DEM_80M.scale) - (CROP / 2 - 1);
  // An 80 m pixel index to the 240 m one under it. (k + 1917) / 3 is never a half, so rounding matches numpy's rint.
  const to240 = (k: number) => Math.min(DEM_240M.n - 1, Math.max(0, Math.round(off240 + ((k - off80) * DEM_80M.scale) / DEM_240M.scale)));
  const last = [i0 + CROP - 1, j0 + CROP - 1];
  const [g80, g240] = await Promise.all([
    loadGrid(DEM_80M, [i0, last[0]], [j0, last[1]], loadTile),
    loadGrid(DEM_240M, [to240(i0), to240(last[0])], [to240(j0), to240(last[1])], loadTile),
  ]);

  const heightsM = new Float32Array(CROP * CROP);
  for (let r = 0; r < CROP; r++) {
    for (let c = 0; c < CROP; c++) {
      const i = i0 + c;
      const j = j0 + r;
      const inside = i >= 0 && i < n80 && j >= 0 && j < n80;
      heightsM[r * CROP + c] = (inside ? px(g80, i, j) : px(g240, to240(i), to240(j))) * 0.5;
    }
  }
  const origin = { x: (i0 - off80) * DEM_80M.scale, y: (off80 - j0) * DEM_80M.scale };
  return { siteId: site.id, width: CROP, height: CROP, pixelM: DEM_80M.scale, origin, heightsM };
};

/** A tile from backend/public/data/dem/. The tiles are made by backend/scripts/dem_tiles.py and are not in git. */
export const fetchTile: LoadTile = async (dem, row, col) => {
  const path = `data/dem/${dem.name}/${row}-${col}.bin`;
  const r = await fetch(import.meta.env.BASE_URL + path);
  // An SPA host answers a missing file with 200 and index.html.
  if (!r.ok || !r.body || r.headers.get('content-type')?.includes('html')) {
    throw new Error(`${path}: HTTP ${r.status}; run backend/scripts/dem_tiles.py`);
  }
  return decodeTile(r.body);
};

/** One tile as dem_tiles.py writes it: row deltas (wrapping int16), low bytes then high bytes, zlib-deflated. */
export const decodeTile = async (body: ReadableStream<Uint8Array<ArrayBuffer>>): Promise<Int16Array> => {
  // "deflate" is the zlib format (RFC 1950) that Python's zlib.compress writes.
  // Source: https://developer.mozilla.org/en-US/docs/Web/API/DecompressionStream/DecompressionStream
  const bytes = new Uint8Array(await new Response(body.pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
  const count = TILE * TILE;
  if (bytes.length !== count * 2) throw new Error(`DEM tile: ${bytes.length} bytes, expected ${count * 2}`);
  const out = new Int16Array(count);
  for (let j = 0; j < TILE; j++) {
    let v = 0;
    for (let i = 0; i < TILE; i++) {
      const k = j * TILE + i;
      v = ((v + (bytes[k] | (bytes[count + k] << 8))) << 16) >> 16; // int16 wrap, as numpy's astype('<i2')
      out[k] = v;
    }
  }
  return out;
};

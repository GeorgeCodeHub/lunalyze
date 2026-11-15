import { mapDirection } from '../../../backend/lib/projectPolar';
import type { TerrainGrid } from '../../../backend/lib/useTerrain';

// Scene frame, in km: three x = grid +x (toward 90°E), y = up, z = -grid y. The origin is the site,
// at the height of the pixel nearest it. Pure maths: no three import, so tests can assert literal numbers.

export const EXAGGERATION = 2.5; // hills and the light's vertical are both scaled by this
export const MOON_RADIUS_M = 1737400; // the same R as projectPolar.ts, which does not export it
export const MESH_STEP = 1; // every pixel: the view stands on the ground, so it needs the full detail
export const EYE_KM = 0.005; // the viewer's eye, above the highest ground right around the site
// The Sun and Earth sit far past the terrain, drawn at twice their real angular size (radius, degrees) so Earth's phase reads.
export const BODY_DISTANCE_KM = 400;
export const BODY_SIZE = 2;
export const SUN_RADIUS_DEG = 0.267;
export const EARTH_RADIUS_DEG = 0.95; // Earth seen from the Moon, about 1.9° across
export const GROUND_TILE_KM = 2; // the ground photo repeats every 2 km, so its craters read as small ones nearby

/** The pixel nearest `centre` (polar stereographic m), clamped to the grid. */
const sitePixel = (grid: TerrainGrid, centre: { x: number; y: number }) => ({
  col: Math.min(grid.width - 1, Math.max(0, Math.round((centre.x - grid.origin.x) / grid.pixelM))),
  row: Math.min(grid.height - 1, Math.max(0, Math.round((grid.origin.y - centre.y) / grid.pixelM))),
});

/** Vertices and triangles of the ground around `centre` (polar stereographic m), sampling every `step`th pixel. */
export const buildTerrainMesh = (
  grid: TerrainGrid,
  centre: { x: number; y: number },
  step: number,
  exaggeration: number,
): { positions: Float32Array; index: Uint32Array } => {
  const { width, height, pixelM, origin, heightsM } = grid;
  const nx = Math.ceil(width / step);
  const ny = Math.ceil(height / step);

  const site = sitePixel(grid, centre);
  const siteH = heightsM[site.row * width + site.col];

  const positions = new Float32Array(nx * ny * 3);
  for (let i = 0; i < ny; i++) {
    for (let j = 0; j < nx; j++) {
      const r = i * step;
      const c = j * step;
      const X = origin.x + pixelM * c - centre.x;
      const Y = origin.y - pixelM * r - centre.y;
      const y = exaggeration * (heightsM[r * width + c] - siteH - (X * X + Y * Y) / (2 * MOON_RADIUS_M));
      const v = (i * nx + j) * 3;
      positions[v] = X / 1000;
      positions[v + 1] = y / 1000;
      positions[v + 2] = -Y / 1000;
    }
  }

  const index = new Uint32Array((nx - 1) * (ny - 1) * 6);
  let k = 0;
  for (let i = 0; i < ny - 1; i++) {
    for (let j = 0; j < nx - 1; j++) {
      const a = i * nx + j;
      const b = a + 1;
      const c = a + nx;
      const d = c + 1;
      index.set([a, c, b, b, c, d], k);
      k += 6;
    }
  }
  return { positions, index };
};

/** Unit vector toward a body in the scene frame. The vertical is scaled like the terrain, so shadows match the horizon mask. */
export const sceneDirection = (
  body: { az: number; el: number },
  lon: number,
  exaggeration: number,
): [number, number, number] => {
  const { dx, dy } = mapDirection(body.az, lon);
  const el = (body.el * Math.PI) / 180;
  const x = dx * Math.cos(el);
  const y = exaggeration * Math.sin(el);
  const z = -dy * Math.cos(el);
  const len = Math.hypot(x, y, z);
  return [x / len, y / len, z / len];
};

/** Eye height (scene km): EYE_KM above the highest of the site pixel and its 8 neighbours, so the ground near the viewer stays below the eye. */
export const eyeHeight = (grid: TerrainGrid, centre: { x: number; y: number }, exaggeration: number): number => {
  const { width, height, heightsM } = grid;
  const { col, row } = sitePixel(grid, centre);
  const siteH = heightsM[row * width + col];
  let top = siteH;
  for (let r = Math.max(0, row - 1); r <= Math.min(height - 1, row + 1); r++)
    for (let c = Math.max(0, col - 1); c <= Math.min(width - 1, col + 1); c++) top = Math.max(top, heightsM[r * width + c]);
  return (exaggeration * (top - siteH)) / 1000 + EYE_KM;
};

/** Where "face the Sun / Earth" turns the view: the body's bearing, looking at it, or at the horizon if it is below. */
export const facingDirection = (body: { az: number; el: number }, lon: number): [number, number, number] =>
  sceneDirection({ az: body.az, el: Math.max(body.el, 0) }, lon, EXAGGERATION);

/** Radius (scene km) of a body of angular radius `deg` drawn at BODY_DISTANCE_KM and BODY_SIZE. */
export const bodyRadius = (deg: number): number => BODY_DISTANCE_KM * Math.tan((BODY_SIZE * deg * Math.PI) / 180);

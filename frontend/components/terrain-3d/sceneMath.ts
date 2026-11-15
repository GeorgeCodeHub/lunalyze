import { mapDirection } from '../../../backend/lib/projectPolar';
import type { TerrainGrid } from '../../../backend/lib/useTerrain';

// Scene frame, in km: three x = grid +x (toward 90°E), y = up, z = -grid y. The origin is the site,
// at the height of the pixel nearest it. Pure maths: no three import, so tests can assert literal numbers.

export const EXAGGERATION = 2.5; // hills and the light's vertical are both scaled by this
export const MOON_RADIUS_M = 1737400; // the same R as projectPolar.ts, which does not export it
export const MESH_STEP = 2; // every 2nd pixel: 250 x 250 vertices

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

  const siteCol = Math.min(width - 1, Math.max(0, Math.round((centre.x - origin.x) / pixelM)));
  const siteRow = Math.min(height - 1, Math.max(0, Math.round((origin.y - centre.y) / pixelM)));
  const siteH = heightsM[siteRow * width + siteCol];

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

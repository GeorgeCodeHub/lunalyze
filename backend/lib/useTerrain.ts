import { useQuery } from '@tanstack/react-query';
import { cropTerrain, fetchTile, typedSite } from './horizon';

// The lazy 3D chunk imports this file, so it must stay free of the sky code: TanStack Query and horizon.ts only.

export type TerrainGrid = {
  siteId: string;
  width: number; // columns, 500
  height: number; // rows, 500
  pixelM: number; // 80
  origin: { x: number; y: number }; // south-polar stereographic m, centre of pixel (0,0); +x → 90°E, +y → 0° lon
  heightsM: Float32Array; // width·height, row-major; m above the 1737.4 km sphere (int16 LE × 0.5)
};
export type TerrainMeta = Omit<TerrainGrid, 'heightsM'>;

export const decodeTerrain = (meta: TerrainMeta, bin: ArrayBuffer): TerrainGrid => {
  const n = meta.width * meta.height;
  if (bin.byteLength !== n * 2) {
    throw new Error(`terrain ${meta.siteId}: ${bin.byteLength} bytes, expected ${n * 2}`);
  }
  const view = new DataView(bin);
  const heightsM = new Float32Array(n);
  for (let i = 0; i < n; i++) heightsM[i] = view.getInt16(i * 2, true) * 0.5;
  return { ...meta, heightsM };
};

const fetchOk = async (path: string): Promise<Response> => {
  const r = await fetch(import.meta.env.BASE_URL + path);
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return r;
};

const fetchTerrain = async (siteId: string): Promise<TerrainGrid> => {
  const base = `data/terrain/${siteId}`;
  const [jsonRes, binRes] = await Promise.all([fetchOk(`${base}.json`), fetchOk(`${base}.bin`)]);
  // An SPA host answers a missing file with 200 and index.html, so a non-JSON answer is a failure.
  if (!(jsonRes.headers.get('content-type')?.includes('json') ?? false)) throw new Error(`${base}.json: not JSON`);
  const [meta, bin] = await Promise.all([jsonRes.json() as Promise<TerrainMeta>, binRes.arrayBuffer()]);
  return decodeTerrain(meta, bin);
};

/** Terrain crop for one site, or for typed coordinates (`@lat:lon`), cut from the DEM tiles. Call only for sites with terrainModeled true. */
export const useTerrain = (siteId: string): { grid: TerrainGrid | null; loading: boolean; error: Error | null } => {
  const q = useQuery({
    queryKey: ['data', 'terrain', siteId],
    queryFn: () => {
      const typed = typedSite(siteId);
      return typed ? cropTerrain(typed, fetchTile) : fetchTerrain(siteId);
    },
    staleTime: 'static',
    retry: false,
  });
  return { grid: q.data ?? null, loading: q.isPending, error: q.error };
};

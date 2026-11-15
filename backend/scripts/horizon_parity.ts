// Horizon parity: backend/lib/horizon.ts on the DEM tiles, against the masks and 3D terrain crops horizon_masks.py
// committed. Typed coordinates get both from horizon.ts, so it must give the listed sites their own files back.
// Run: pnpm horizon-parity (after `uv run backend/scripts/dem_tiles.py`)
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { BANDS, computeMask, cropTerrain, decodeTile, type LoadTile } from '../lib/horizon';
import type { HorizonMask } from '../lib/realView';
import type { Site } from '../lib/types';

const GATE_DEG = 0.002; // masks are rounded to 0.001°
const FINE_SITES = new Set(['point-a', 'point-b', 'point-c', 'point-d']); // FINE_SITES in horizon_masks.py

const loadTile: LoadTile = async (dem, row, col) => {
  const path = `backend/public/data/dem/${dem.name}/${row}-${col}.bin`;
  const bytes = await readFile(path).catch((err: Error) => {
    throw new Error(`Cannot read ${path} (run from the repo root, after uv run backend/scripts/dem_tiles.py): ${err.message}`, { cause: err });
  });
  return decodeTile(new Blob([bytes]).stream());
};

const sites = (JSON.parse(readFileSync('backend/public/data/sites.json', 'utf8')) as Site[]).filter((s) => s.terrainModeled);
let failed = false;
console.log('| Site | Max difference ° | Incomplete bins match | Terrain crop matches | ms | Gate |');
console.log('| --- | --- | --- | --- | --- | --- |');
for (const site of sites) {
  const committed = JSON.parse(readFileSync(`backend/public/data/masks/${site.id}.json`, 'utf8')) as HorizonMask;
  const bands = FINE_SITES.has(site.id) ? BANDS : BANDS.slice(1);
  const began = performance.now();
  const mask = await computeMask(site.id, site.lat, site.lon, bands, loadTile);
  const ms = Math.round(performance.now() - began);
  const diff = Math.max(...mask.elevDeg.map((v, i) => Math.abs(v - committed.elevDeg[i])));
  const same = mask.incomplete.every((v, i) => v === committed.incomplete[i]);
  const crop = await cropTerrain(site, loadTile);
  const bin = new Int16Array(new Uint8Array(readFileSync(`backend/public/data/terrain/${site.id}.bin`)).buffer);
  const meta = JSON.parse(readFileSync(`backend/public/data/terrain/${site.id}.json`, 'utf8')) as { origin: { x: number; y: number } };
  const cropSame = crop.origin.x === meta.origin.x && crop.origin.y === meta.origin.y && bin.every((v, i) => v * 0.5 === crop.heightsM[i]);
  const pass = diff <= GATE_DEG && same && cropSame;
  failed ||= !pass;
  console.log(`| ${site.id} | ${diff.toFixed(3)} | ${same} | ${cropSame} | ${ms} | ${pass ? 'PASS' : 'FAIL'} |`);
}
console.log(`\nPASS when every bin is within ${GATE_DEG}° of the committed mask, the incomplete bins are the same, and the crop is identical.`);
if (failed) process.exit(1);

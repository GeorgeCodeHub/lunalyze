// Writes backend/public/data/fixtures/<siteId>.json: real Sun/Earth positions, FAKE terrain.
// Run: pnpm fixtures
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { type FixtureFile, LUNAR_DAY_H, viewAt } from '../lib/fixtureView';
import { earthSunPath, sky } from '../lib/lunar';
import type { Site } from '../lib/types';

const SITE_IDS = ['point-a', 'malapert-m1', 'apollo-11'];
const T0 = new Date('2028-03-01T00:00:00Z');
const MAST_KM = 0.002;
const ATHENS = { lat: 37.98, lon: 23.73 };
const HOUR = 3600e3;

const r3 = (v: number) => Math.round(v * 1000) / 1000;

/** Fake horizon: three sines, at most 1.9° in total, different per site. Flat where terrain is not modeled. */
const silhouette = (site: Site): [number, number][] => {
  const seed = [...site.id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return Array.from({ length: 721 }, (_, i) => {
    const a = (i * 0.5 * Math.PI) / 180;
    const el = 0.9 * Math.sin(a + seed) + 0.6 * Math.sin(3 * a + 2 * seed) + 0.4 * Math.sin(7 * a + 3 * seed);
    return [i * 0.5, site.terrainModeled ? r3(el) : 0];
  });
};

const readSites = (): Site[] => {
  try {
    return JSON.parse(readFileSync('backend/public/data/sites.json', 'utf8'));
  } catch (err) {
    throw new Error(`Cannot read backend/public/data/sites.json (run from the repo root): ${(err as Error).message}`, {
      cause: err,
    });
  }
};

/** Write to a temp file, then rename: a failed write never leaves a half-written fixture behind. */
const writeAtomic = (path: string, text: string) => {
  writeFileSync(`${path}.tmp`, text);
  renameSync(`${path}.tmp`, path);
};

const sites = readSites();
mkdirSync('backend/public/data/fixtures', { recursive: true });

for (const id of SITE_IDS) {
  const site = sites.find((s) => s.id === id);
  if (!site) throw new Error(`${id} is not in backend/public/data/sites.json`);

  const sun: [number, number][] = [];
  const earth: [number, number][] = [];
  for (let h = 0; h <= Math.floor(LUNAR_DAY_H); h++) {
    const s = sky(site.lat, site.lon, MAST_KM, new Date(T0.getTime() + h * HOUR));
    sun.push([r3(s.sun.az), r3(s.sun.el)]);
    earth.push([r3(s.earth.az), r3(s.earth.el)]);
  }

  const raw = {
    fixture: true as const,
    siteId: id,
    t0: T0.toISOString(),
    stepH: 1 as const,
    terrain: silhouette(site),
    sun,
    earth,
    athensSunPath: earthSunPath(ATHENS.lat, ATHENS.lon, T0).map(([az, el]): [number, number] => [r3(az), r3(el)]),
  };
  const file: FixtureFile = { ...raw, view: viewAt({ ...raw, view: null as never }, site, T0, 'lunarDay', true) };
  writeAtomic(`backend/public/data/fixtures/${id}.json`, JSON.stringify(file) + '\n');
  const m = file.view.metrics;
  console.log(`${id}: sunlit ${m.sunlitPct}%  earth ${m.earthPct}%  longest blackout ${m.longestBlackoutH} h (fake terrain)`);
}

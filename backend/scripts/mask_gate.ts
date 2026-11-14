// Mask gate: sunlit % at a 2 m mast from the committed horizon masks, against reference values.
// Run: pnpm mask-gate
import { readFileSync } from 'node:fs';
import { sunlitFraction } from '../lib/sunlit';

const GATE_PCT = 7;
const START = new Date('2028-03-01T00:00:00Z');
const HOURS_18_6_YR = Math.round(18.6 * 365.25 * 24);
const HOURS_1_YR = 365 * 24;
const SITES = [
  { id: 'point-a', reference: 81 },
  { id: 'point-b', reference: 82 },
  { id: 'point-c', reference: 85 },
  { id: 'point-d', reference: 86 },
  { id: 'malapert-m1', reference: 74 },
];

const readJson = <T>(path: string): T => {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch (err) {
    throw new Error(`Cannot read ${path} (run from the repo root): ${(err as Error).message}`, { cause: err });
  }
};

const sites = readJson<{ id: string; lat: number; lon: number }[]>('backend/public/data/sites.json');

const rows = SITES.map(({ id, reference }) => {
  const site = sites.find((s) => s.id === id);
  if (!site) throw new Error(`${id} is not in backend/public/data/sites.json`);
  const maskPath = `backend/public/data/masks/${id}.json`;
  const { elevDeg } = readJson<{ elevDeg: number[] }>(maskPath);
  if (!Array.isArray(elevDeg) || elevDeg.length !== 720) throw new Error(`${maskPath} must hold 720 elevDeg values`);
  const long = sunlitFraction(elevDeg, site.lat, site.lon, START, HOURS_18_6_YR) * 100;
  const year = sunlitFraction(elevDeg, site.lat, site.lon, START, HOURS_1_YR) * 100;
  const diff = long - reference;
  return `| ${id} | ${long.toFixed(1)} | ${year.toFixed(1)} | ${reference.toFixed(1)} | ${diff.toFixed(1)} | ${Math.abs(diff) <= GATE_PCT ? 'PASS' : 'FAIL'} |`;
});

console.log('| Site | 18.6 yr % | 1 yr % | Reference % | Difference | Gate |');
console.log('| --- | --- | --- | --- | --- | --- |');
rows.forEach((row) => console.log(row));
console.log(`
Basis: hourly samples from 2028-03-01T00:00:00Z. 18.6 yr = ${HOURS_18_6_YR} h (gates, PASS when |Difference| <= ${GATE_PCT}); 1 yr = ${HOURS_1_YR} h (information only).
Sunlit = Sun centre elevation above the mask elevation at the Sun azimuth (strict), the app's sunlitPct rule.
Observer height: sky() puts the mast 2 m above the 1737.4 km sphere; the masks use the DEM ground + 2 m. The two differ.
Reference values come from literature whose basis is unverified.`);

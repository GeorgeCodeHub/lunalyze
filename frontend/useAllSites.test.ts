import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import type { Site } from '../backend/lib/types';
import { SITE_BATCHES } from './useAllSites';

const sites: Site[] = JSON.parse(readFileSync('backend/public/data/sites.json', 'utf8'));

test('the batches cover every site in sites.json once, at most 3 at a time', () => {
  expect([...SITE_BATCHES.flat()].sort()).toEqual(sites.map((s) => s.id).sort());
  expect(SITE_BATCHES).toHaveLength(5); // useAllSites calls useScenario once per batch
  for (const batch of SITE_BATCHES) expect(batch.length).toBeLessThanOrEqual(3);
});

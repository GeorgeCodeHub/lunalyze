import { expect, test } from 'vitest';
import { readSites } from './testing/readFixture';
import { SITE_BATCHES } from './useAllSites';

test('the batches cover every site in sites.json once, at most 3 at a time', () => {
  const sites = readSites();

  expect(sites).not.toHaveLength(0); // an empty list would make the comparison below pass without checking anything
  expect([...SITE_BATCHES.flat()].sort()).toEqual(sites.map((s) => s.id).sort());
  expect(SITE_BATCHES).toHaveLength(5); // useAllSites calls useScenario once per batch
  for (const batch of SITE_BATCHES) expect(batch.length).toBeLessThanOrEqual(3);
});

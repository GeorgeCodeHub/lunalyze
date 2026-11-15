import { expect, test } from 'vitest';
import { resources } from '../i18n';
import { readSites } from '../testing/readFixture';

test('every site in sites.json has a name, short name and blurb, and every group has a label', () => {
  const sites = readSites();
  const en = resources.en.sites as Record<string, Record<string, string>>;
  expect(sites).not.toHaveLength(0); // an empty list would pass the loop below without checking anything
  for (const s of sites) {
    expect(en[s.id]?.name, s.id).toBeTruthy();
    expect(en[s.id]?.short, s.id).toBeTruthy();
    expect(en[s.id]?.blurb, s.id).toBeTruthy();
    expect(en.groups[s.group], s.group).toBeTruthy();
  }
});

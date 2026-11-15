import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import type { Site } from '../../backend/lib/types';
import { resources } from '../i18n';

test('every site in sites.json has a name, short name and blurb, and every group has a label', () => {
  const sites: Site[] = JSON.parse(readFileSync('backend/public/data/sites.json', 'utf8'));
  const en = resources.en.sites as Record<string, Record<string, string>>;
  expect(sites).not.toHaveLength(0); // an empty list would pass the loop below without checking anything
  for (const s of sites) {
    expect(en[s.id]?.name, s.id).toBeTruthy();
    expect(en[s.id]?.short, s.id).toBeTruthy();
    expect(en[s.id]?.blurb, s.id).toBeTruthy();
    expect(en.groups[s.group], s.group).toBeTruthy();
  }
});

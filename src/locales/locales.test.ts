import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import type { Site } from '../lib/types';
import { resources } from '../i18n';

test('every site in sites.json has a name and blurb, and every group has a label', () => {
  const sites: Site[] = JSON.parse(readFileSync('public/data/sites.json', 'utf8'));
  const en = resources.en.sites as Record<string, Record<string, string>>;
  expect(sites).toHaveLength(13);
  for (const s of sites) {
    expect(en[s.id]?.name, s.id).toBeTruthy();
    expect(en[s.id]?.blurb, s.id).toBeTruthy();
    expect(en.groups[s.group], s.group).toBeTruthy();
  }
});

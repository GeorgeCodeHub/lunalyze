import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import type { Site } from '../lib/types';
import { resources } from '../i18n';

const keys = (o: object, prefix = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));

test('en and el have exactly the same keys in every namespace', () => {
  expect(Object.keys(resources.el)).toEqual(Object.keys(resources.en));
  for (const ns of Object.keys(resources.en) as (keyof typeof resources.en)[]) {
    expect(keys(resources.el[ns]).sort(), ns).toEqual(keys(resources.en[ns]).sort());
  }
});

test('every site in sites.json has a name and blurb, and every group has a label', () => {
  const sites: Site[] = JSON.parse(readFileSync('public/data/sites.json', 'utf8'));
  const en = resources.en.sites as Record<string, Record<string, string>>;
  for (const s of sites) {
    expect(en[s.id]?.name, s.id).toBeTruthy();
    expect(en[s.id]?.blurb, s.id).toBeTruthy();
    expect(en.groups[s.group], s.group).toBeTruthy();
  }
});

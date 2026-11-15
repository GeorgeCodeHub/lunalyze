import { expect, test } from 'vitest';
import { resources } from '../../i18n';
import { readSites } from '../../testing/readFixture';
import { PICKER_GROUPS, siteNameKey } from './siteIds';

const sites = readSites();
const listedIds = PICKER_GROUPS.flatMap(({ ids }) => ids);

test('the picker lists every site in sites.json once, under its own group', () => {
  const listed = PICKER_GROUPS.flatMap(({ group, ids }) => ids.map((id) => `${id}:${group}`));

  expect(sites).not.toHaveLength(0); // an empty file would make the comparison below pass vacuously
  expect([...listed].sort()).toEqual(sites.map((s) => `${s.id}:${s.group}`).sort());
});

test('no site is listed twice and no group is empty or repeated', () => {
  expect(new Set(listedIds).size).toBe(listedIds.length);
  expect(new Set(PICKER_GROUPS.map((g) => g.group)).size).toBe(PICKER_GROUPS.length);
  for (const { group, ids } of PICKER_GROUPS) expect(ids, group).not.toHaveLength(0);
});

test('every listed group has a label in the sites copy', () => {
  const groups = resources.en.sites.groups as Record<string, string>;

  for (const { group } of PICKER_GROUPS) expect(groups[group], group).toBeTruthy();
});

test('siteNameKey builds the copy key, also for an unknown id from the URL', () => {
  expect(siteNameKey('point-a')).toBe('point-a.name');
  expect(siteNameKey('not-a-site')).toBe('not-a-site.name');
  expect(siteNameKey('')).toBe('.name');
});

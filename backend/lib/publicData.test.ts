import { existsSync, readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

const sites: { id: string; terrainModeled: boolean }[] = JSON.parse(readFileSync('backend/public/data/sites.json', 'utf8'));
const modeled = sites.filter((s) => s.terrainModeled);

test('every terrain-modeled site has a mask file', () => {
  expect(modeled).toHaveLength(11); // guards against a vacuous pass
  expect(modeled.filter((s) => !existsSync(`backend/public/data/masks/${s.id}.json`)).map((s) => s.id)).toEqual([]);
});

test('no fixtures folder ships', () => {
  expect(existsSync('backend/public/data/fixtures')).toBe(false);
});

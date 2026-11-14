import { expect, test } from 'vitest';
import { readScenario, scenarioSearch } from './scenario';

test('no picked place means the setup step', () => {
  expect(readScenario('')).toBeNull();
  expect(readScenario('?sites=')).toBeNull();
});

test('a scenario survives the round trip through the URL', () => {
  const s = { siteIds: ['point-a', 'malapert-m1'], start: new Date('2028-03-05T06:30:00Z'), zoom: 'year' as const, stay: 2 as const };

  expect(scenarioSearch(s)).toBe('?sites=point-a,malapert-m1&t=2028-03-05T06:30Z&zoom=year&stay=2');
  expect(readScenario(scenarioSearch(s))).toEqual(s);
});

test('bad values fall back to the defaults, and at most 3 places are kept', () => {
  expect(readScenario('?sites=a,b,c,d&t=nope&zoom=week&stay=7')).toEqual({
    siteIds: ['a', 'b', 'c'],
    start: new Date('2028-03-01T00:00:00Z'),
    zoom: 'lunarDay',
    stay: 1,
  });
});

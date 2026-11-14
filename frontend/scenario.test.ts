import { expect, test } from 'vitest';
import { readScenario, type Scenario, scenarioSearch } from './scenario';

test('no picked place means the setup step', () => {
  expect(readScenario('')).toBeNull();
  expect(readScenario('?sites=')).toBeNull();
});

test('a scenario survives the round trip through the URL', () => {
  const s: Scenario = {
    places: [
      { kind: 'site', id: 'point-a' },
      { kind: 'coords', lat: -85.25, lon: 31.4 },
    ],
    start: new Date('2028-03-05T06:30:00Z'),
    zoom: 'year',
    stay: 14,
  };

  expect(scenarioSearch(s)).toBe('?sites=point-a,@-85.25:31.4&t=2028-03-05T06:30Z&zoom=year&stay=14');
  expect(readScenario(scenarioSearch(s))).toEqual(s);
});

test('bad values fall back to the defaults, and at most 3 places are kept', () => {
  expect(readScenario('?sites=a,b,c,d&t=nope&zoom=week&stay=2')).toEqual({
    places: [
      { kind: 'site', id: 'a' },
      { kind: 'site', id: 'b' },
      { kind: 'site', id: 'c' },
    ],
    start: new Date('2028-03-01T00:00:00Z'),
    zoom: 'lunarDay',
    stay: 7,
  });
});

test('coordinates off the map or half missing are dropped from a shared link', () => {
  expect(readScenario('?sites=@90.5:0,@-10:,@:20,@x:y,@-90:180')?.places).toEqual([{ kind: 'coords', lat: -90, lon: 180 }]);
  expect(readScenario('?sites=@91:0')).toBeNull();
});

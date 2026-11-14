import { describe, expect, test } from 'vitest';
import { DEFAULT_SCENARIO, MAX_SITES, ZOOMS, parseScenario, serializeScenario, type Scenario } from './scenarioUrl';
import { ZOOM } from './realView';

const KNOWN = ['point-a', 'point-b', 'im-1', 'change-4'];
const D0 = new Date('2028-03-01T00:00Z');
const FULL: Scenario = { sites: ['point-a', 'im-1'], date: new Date(Date.UTC(2028, 5, 15, 12, 30)), zoom: 'year', terrain: false };
const FULL_QS = 'sites=point-a,im-1&date=2028-06-15T12:30Z&zoom=year&terrain=off';

describe('parseScenario', () => {
  test.each(['', '?'])('%j gives the defaults (criterion 6)', (search) =>
    expect(parseScenario(search, KNOWN)).toEqual({ sites: [], date: D0, zoom: 'day', terrain: true }));

  test('reads each value, with or without encoding (criterion 7)', () => {
    expect(parseScenario('?' + FULL_QS, KNOWN)).toEqual(FULL);
    expect(parseScenario('?sites=point-a%2Cim-1&date=2028-06-15T12%3A30Z&zoom=year&terrain=off', KNOWN)).toEqual(FULL);
  });

  test('the leading ? is optional', () => expect(parseScenario(FULL_QS, KNOWN)).toEqual(FULL));

  test.each([
    'point-a,nosuch',
    'point-a,point-b,im-1,change-4',
    'point-a,point-a',
    'point-a,,im-1',
    'nosuch',
    ',',
  ])('sites=%s gives [] (criterion 8)', (v) => expect(parseScenario(`?sites=${v}`, KNOWN).sites).toEqual([]));

  test('three distinct known ids are kept, in order', () =>
    expect(parseScenario('?sites=im-1,point-b,point-a', KNOWN).sites).toEqual(['im-1', 'point-b', 'point-a']));

  test.each([
    '2028-02-30T00:00Z',
    '2028-03-01T24:00Z',
    '2028-03-01',
    '2028-03-01T00:00:00Z',
    '2028-03-01T00:00+02:00',
    '2028-13-01T00:00Z',
    '2028-03-01T25:00Z',
    '2028-03-01T00:60Z',
    '2027-02-29T00:00Z',
    'nope',
    '',
  ])('date=%s gives the default date', (v) => expect(parseScenario(`?date=${v}`, KNOWN).date).toEqual(D0));

  test('a leap day is valid', () =>
    expect(parseScenario('?date=2028-02-29T10:15Z', KNOWN).date).toEqual(new Date(Date.UTC(2028, 1, 29, 10, 15))));

  test.each(['week', 'Day', ''])('zoom=%s gives day', (v) => expect(parseScenario(`?zoom=${v}`, KNOWN).zoom).toBe('day'));

  test.each(['on', 'false', '', 'OFF'])('terrain=%j gives true', (v) =>
    expect(parseScenario(`?terrain=${v}`, KNOWN).terrain).toBe(true));

  test('one bad value does not drop the others', () =>
    expect(parseScenario('?zoom=week&date=2028-06-15T12:30Z', KNOWN)).toEqual({
      sites: [],
      date: new Date(Date.UTC(2028, 5, 15, 12, 30)),
      zoom: 'day',
      terrain: true,
    }));

  test('returns a fresh default date each time', () => {
    const a = parseScenario('', KNOWN);
    a.date.setUTCFullYear(1999);
    expect(parseScenario('', KNOWN).date).toEqual(D0);
    expect(DEFAULT_SCENARIO.date).toEqual(D0);
  });
});

describe('serializeScenario', () => {
  test('the default scenario is empty, the full one is exact, in fixed order (criterion 9)', () => {
    expect(serializeScenario(DEFAULT_SCENARIO)).toBe('');
    expect(serializeScenario(FULL)).toBe(FULL_QS);
  });

  test('a default value is left out on its own (criterion 10)', () => {
    expect(serializeScenario({ ...DEFAULT_SCENARIO, zoom: 'lunarDay' })).toBe('zoom=lunarDay');
    expect(serializeScenario({ ...DEFAULT_SCENARIO, terrain: true })).not.toContain('terrain=');
    expect(serializeScenario({ ...DEFAULT_SCENARIO, terrain: false })).toBe('terrain=off');
    expect(serializeScenario({ ...DEFAULT_SCENARIO, date: new Date('2028-03-01T00:00:45Z') })).toBe('');
    expect(serializeScenario({ ...DEFAULT_SCENARIO, date: new Date('2028-03-01T00:01Z') })).toBe('date=2028-03-01T00:01Z');
  });

  test('a site id is URL-encoded', () =>
    expect(serializeScenario({ ...DEFAULT_SCENARIO, sites: ['a&b', 'c d'] })).toBe('sites=a%26b,c%20d'));
});

describe('round trip and zoom list (criterion 11)', () => {
  test('parse(serialize(s)) equals s', () => expect(parseScenario(serializeScenario(FULL), KNOWN)).toEqual(FULL));
  test('every zoom round-trips', () =>
    ZOOMS.forEach((zoom) => {
      const s = { ...DEFAULT_SCENARIO, zoom };
      expect(parseScenario(serializeScenario(s), KNOWN)).toEqual(s);
    }));
  test('ZOOMS is the three zooms and matches the keys of realView ZOOM', () => {
    expect(ZOOMS).toEqual(['day', 'lunarDay', 'year']);
    expect([...ZOOMS]).toEqual(Object.keys(ZOOM));
  });
  test('MAX_SITES is 3', () => expect(MAX_SITES).toBe(3));
});

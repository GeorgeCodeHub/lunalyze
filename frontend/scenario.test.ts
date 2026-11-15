import { afterEach, expect, test, vi } from 'vitest';
import { parseScenario } from '../backend/lib/scenarioUrl';
import { readScenario, type Scenario, scenarioSearch, writeScenarioUrl } from './scenario';

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
    terrain: true,
  };

  expect(scenarioSearch(s)).toBe('?sites=point-a,@-85.25:31.4&date=2028-03-05T06:30Z&zoom=year&stay=14');
  expect(readScenario(scenarioSearch(s))).toEqual(s);
});

test('terrain off is written as terrain=off and read back; anything else means on', () => {
  const s: Scenario = {
    places: [{ kind: 'site', id: 'point-a' }],
    start: new Date('2028-03-01T00:00:00Z'),
    zoom: 'lunarDay',
    stay: 7,
    terrain: false,
  };

  expect(scenarioSearch(s)).toBe('?sites=point-a&date=2028-03-01T00:00Z&zoom=lunarDay&stay=7&terrain=off');
  expect(readScenario(scenarioSearch(s))).toEqual(s);
  expect(readScenario('?sites=point-a&terrain=on')?.terrain).toBe(true);
  expect(readScenario('?sites=point-a&terrain=')?.terrain).toBe(true);
});

test('bad values fall back to the defaults, and at most 3 places are kept', () => {
  expect(readScenario('?sites=a,b,c,d&date=nope&zoom=week&stay=2')).toEqual({
    places: [
      { kind: 'site', id: 'a' },
      { kind: 'site', id: 'b' },
      { kind: 'site', id: 'c' },
    ],
    start: new Date('2028-03-01T00:00:00Z'),
    zoom: 'lunarDay',
    stay: 7,
    terrain: true,
  });
});

test('a place named twice in a link is kept once', () => {
  expect(readScenario('?sites=point-a,@-85:31,point-a,@-85:31,haworth')?.places).toEqual([
    { kind: 'site', id: 'point-a' },
    { kind: 'coords', lat: -85, lon: 31 },
    { kind: 'site', id: 'haworth' },
  ]);
});

test('a link made before the rename still opens: t is read when date is missing', () => {
  expect(readScenario('?sites=point-a&t=2028-04-02T05:00Z')?.start).toEqual(new Date('2028-04-02T05:00:00Z'));
  expect(readScenario('?sites=point-a&t=2028-04-02T05:00Z&date=2028-06-01T00:00Z')?.start).toEqual(
    new Date('2028-06-01T00:00:00Z'),
  );
});

test('coordinates off the map or half missing are dropped from a shared link', () => {
  expect(readScenario('?sites=@90.5:0,@-10:,@:20,@x:y,@-90:180')?.places).toEqual([{ kind: 'coords', lat: -90, lon: 180 }]);
  expect(readScenario('?sites=@91:0')).toBeNull();
});

test('the backend URL reader reads the sites, date, zoom and terrain this module writes', () => {
  const s: Scenario = {
    places: [
      { kind: 'site', id: 'point-a' },
      { kind: 'site', id: 'malapert-m1' },
    ],
    start: new Date('2028-03-05T06:30:00Z'),
    zoom: 'year',
    stay: 14,
    terrain: false,
  };

  expect(parseScenario(scenarioSearch(s), ['point-a', 'malapert-m1'])).toEqual({
    sites: ['point-a', 'malapert-m1'],
    date: s.start,
    zoom: 'year',
    terrain: false,
  });
});

const LINKED: Scenario = {
  places: [{ kind: 'site', id: 'point-a' }],
  start: new Date('2028-03-01T00:00:00Z'),
  zoom: 'lunarDay',
  stay: 7,
  terrain: true,
};
const LINK = '?sites=point-a&date=2028-03-01T00:00Z&zoom=lunarDay&stay=7';

afterEach(() => vi.unstubAllGlobals());

test.each(['push', 'replace'] as const)('writeScenarioUrl %s puts the scenario in the address bar and reports it', (mode) => {
  const history = { state: { kept: true }, pushState: vi.fn(), replaceState: vi.fn() };
  vi.stubGlobal('window', { history });

  expect(writeScenarioUrl(mode, LINKED)).toBe(true);
  if (mode === 'push') {
    expect(history.pushState).toHaveBeenCalledWith(null, '', LINK);
    expect(history.replaceState).not.toHaveBeenCalled();
  } else {
    expect(history.replaceState).toHaveBeenCalledWith({ kept: true }, '', LINK); // the entry's own state is kept
    expect(history.pushState).not.toHaveBeenCalled();
  }
});

test.each(['push', 'replace'] as const)('writeScenarioUrl %s reports a browser that refuses the update, and does not throw', (mode) => {
  const refuse = () => {
    throw new Error('SecurityError: too many history updates');
  };
  vi.stubGlobal('window', { history: { state: null, pushState: refuse, replaceState: refuse } });

  expect(writeScenarioUrl(mode, LINKED)).toBe(false);
});

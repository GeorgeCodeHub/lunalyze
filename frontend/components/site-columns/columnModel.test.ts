import { expect, test } from 'vitest';
import type { Site, SiteView } from '../../../backend/lib/types';
import type { Place } from '../../scenario';
import { buildColumns } from './columnModel';

// buildColumns only reads view.site.id; the rest is filled in so the object is a whole SiteView.
// The numbers are parameters, so a test that cares about one can set it.
const view = (id: string, { sunlitPct = 31.1, earthPct = 34.6, sunHours = 11.71 }: { sunlitPct?: number; earthPct?: number; sunHours?: number } = {}): SiteView => ({
  site: { id, lat: -89.68, lon: -166, kind: 'reference', precision: 'exact', terrainModeled: true, group: 'Reference points', source: 'test' } satisfies Site,
  horizonIncomplete: false,
  metrics: { sunElDeg: -0.874, sunlitPct, earthPct, longestBlackoutH: 276.2, panelOutputPct: 100 },
  countdown: { sun: { kind: 'set', hours: sunHours }, earth: { kind: 'set', hours: 37.12 } },
  sky: {
    terrain: [[0, 0], [360, 0]],
    sun: { az: 289.448, el: -0.874, hidden: false },
    earth: { az: 159.84, el: 6.178, hidden: false },
    sunPath: [],
    earthPath: [],
    athensSunPath: [],
  },
  lanes: { sun: [], earth: [], both: [] },
});

const loaded = (...ids: string[]) => ({ views: ids.map((id) => view(id)), loading: false });
const loading = (...ids: string[]) => ({ views: ids.map((id) => view(id)), loading: true });
const site = (id: string): Place => ({ kind: 'site', id });
const kinds = (...args: Parameters<typeof buildColumns>) => buildColumns(...args).map((c) => `${c.key}:${c.kind}`);

test('a place is ready once all three of its views have loaded, each kept in its own slot', () => {
  const shown = view('point-a', { sunlitPct: 48.8 });
  const stay = view('point-a', { sunlitPct: 31.1 });
  const now = view('point-a', { sunHours: 5 });
  expect(
    buildColumns([site('point-a')], { views: [shown], loading: false }, { views: [stay], loading: false }, { views: [now], loading: false }),
  ).toEqual([{ kind: 'ready', key: 'point-a', view: shown, stayView: stay, now }]);
});

test('no places gives no columns, whatever has loaded', () => {
  expect(buildColumns([], loaded(), loaded(), loaded())).toEqual([]);
  expect(buildColumns([], loaded('point-a'), loading('point-a'), loaded())).toEqual([]);
});

test('with nothing loaded at all, a listed site is loading while a load runs and missing once it is over', () => {
  expect(kinds([site('point-a')], loading(), loading(), loading())).toEqual(['point-a:loading']);
  expect(kinds([site('point-a')], loaded(), loaded(), loaded())).toEqual(['point-a:missing']);
});

test('columns keep the order the places were picked in, not the order views arrived', () => {
  const all = loaded('haworth', 'point-a');
  expect(kinds([site('point-a'), site('haworth')], all, all, all)).toEqual(['point-a:ready', 'haworth:ready']);
});

test.each([
  ['the playhead view', 2],
  ['the stay view', 1],
  ['the view of the time span shown', 0],
])('a place still waiting for %s is loading', (_, waiting) => {
  const have = loaded('point-a');
  const sources = [have, have, have];
  sources[waiting] = loading();
  expect(kinds([site('point-a')], sources[0], sources[1], sources[2])).toEqual(['point-a:loading']);
});

test('ready wins while the playhead view reloads in the background', () => {
  const have = loaded('point-a');
  expect(kinds([site('point-a')], have, have, loading('point-a'))).toEqual(['point-a:ready']);
});

test('a listed site with no view once loading is over is missing', () => {
  const have = loaded('point-a');
  expect(kinds([site('point-a'), site('haworth')], have, have, have)).toEqual(['point-a:ready', 'haworth:missing']);
});

test('an id that is not on the list is unknown, even while others load; so is an empty id', () => {
  expect(kinds([site('nowhere'), site('point-a')], loading(), loading(), loading())).toEqual(['nowhere:unknown', 'point-a:loading']);
  expect(kinds([site('')], loaded(), loaded(), loaded())).toEqual([':unknown']);
});

test.each([
  [-85.3, 31.4, '@-85.3:31.4'],
  [90, 180, '@90:180'],
  [-90, -180, '@-90:-180'],
  [0, 0, '@0:0'],
])('typed coordinates (%s, %s) are keyed by their link token, and missing once loading is over with no view', (lat, lon, key) => {
  const place: Place = { kind: 'coords', lat, lon };
  expect(buildColumns([place], loaded(), loaded(), loaded())).toEqual([{ kind: 'missing', key, place }]);
});

test('typed coordinates are ready once their three views load, and loading until then', () => {
  const typed: Place = { kind: 'coords', lat: -89.68, lon: -166 };
  const have = loaded('@-89.68:-166', 'point-a');
  expect(kinds([typed, site('point-a')], have, have, have)).toEqual(['@-89.68:-166:ready', 'point-a:ready']);
  expect(kinds([typed], loading(), have, have)).toEqual(['@-89.68:-166:loading']);
});

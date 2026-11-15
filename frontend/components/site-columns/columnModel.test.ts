import { expect, test } from 'vitest';
import type { Site, SiteView } from '../../../backend/lib/types';
import type { Place } from '../../scenario';
import { buildColumns } from './columnModel';

const view = (id: string): SiteView => ({
  site: { id } as Site,
  horizonIncomplete: false,
  metrics: { sunElDeg: 0, sunlitPct: 0, earthPct: 0, longestBlackoutH: 0, panelOutputPct: 0 },
  countdown: { sun: { kind: 'set', hours: 1 }, earth: { kind: 'set', hours: 1 } },
  sky: { terrain: [], sun: { az: 0, el: 0, hidden: false }, earth: { az: 0, el: 0, hidden: false }, sunPath: [], earthPath: [], athensSunPath: [] },
  lanes: { sun: [], earth: [], both: [] },
});

const loaded = (...ids: string[]) => ({ views: ids.map(view), loading: false });
const loading = (...ids: string[]) => ({ views: ids.map(view), loading: true });
const site = (id: string): Place => ({ kind: 'site', id });
const kinds = (...args: Parameters<typeof buildColumns>) => buildColumns(...args).map((c) => `${c.key}:${c.kind}`);

test('a place is ready once all three of its views have loaded', () => {
  const a = view('point-a');
  const b = view('point-a');
  const c = view('point-a');
  expect(
    buildColumns([site('point-a')], { views: [a], loading: false }, { views: [b], loading: false }, { views: [c], loading: false }),
  ).toEqual([{ kind: 'ready', key: 'point-a', view: a, stayView: b, now: c }]);
});

test('columns keep the order the places were picked in, not the order views arrived', () => {
  const all = loaded('haworth', 'point-a');
  expect(kinds([site('point-a'), site('haworth')], all, all, all)).toEqual(['point-a:ready', 'haworth:ready']);
});

test('a place still waiting for any of its views is loading', () => {
  const have = loaded('point-a');
  expect(kinds([site('point-a')], have, have, loading())).toEqual(['point-a:loading']);
  expect(kinds([site('point-a')], loading(), have, have)).toEqual(['point-a:loading']);
});

test('ready wins while the playhead view reloads in the background', () => {
  const have = loaded('point-a');
  expect(kinds([site('point-a')], have, have, loading('point-a'))).toEqual(['point-a:ready']);
});

test('a listed site with no view once loading is over is missing', () => {
  const have = loaded('point-a');
  expect(kinds([site('point-a'), site('haworth')], have, have, have)).toEqual(['point-a:ready', 'haworth:missing']);
});

test('an id that is not on the list is unknown, even while others load', () => {
  expect(kinds([site('nowhere'), site('point-a')], loading(), loading(), loading())).toEqual(['nowhere:unknown', 'point-a:loading']);
});

test('typed coordinates get their own column, keyed by their link token', () => {
  expect(buildColumns([{ kind: 'coords', lat: -85.3, lon: 31.4 }], loaded(), loaded(), loaded())).toEqual([
    { kind: 'typed', key: '@-85.3:31.4', lat: -85.3, lon: 31.4 },
  ]);
});

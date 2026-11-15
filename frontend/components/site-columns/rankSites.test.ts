import { expect, test } from 'vitest';
import type { Interval, Site, SiteView } from '../../../backend/lib/types';
import { rankSites } from './rankSites';

const START = Date.parse('2028-03-01T00:00:00Z');
const HOUR = 3600e3;
const WEEK_H = 168;
const lane = (...periods: [number, number][]): Interval[] =>
  periods.map(([from, to]) => [new Date(START + from * HOUR).toISOString(), new Date(START + to * HOUR).toISOString()]);

type Opts = { sun?: [number, number][]; earth?: [number, number][]; sunlitPct?: number; earthPct?: number; mapped?: boolean; incomplete?: boolean };

/** A place whose Sun and Earth are in view for the given hours after landing. Default: sunlit all week. */
const place = (id: string, { sun = [[0, 200]], earth = [], sunlitPct = 30, earthPct = 30, mapped = true, incomplete = false }: Opts = {}): SiteView => ({
  site: { id, lat: -89, lon: 0, kind: 'reference', precision: 'exact', terrainModeled: mapped, group: 'Reference points', source: 'test' } satisfies Site,
  horizonIncomplete: incomplete,
  metrics: { sunElDeg: 1, sunlitPct, earthPct, longestBlackoutH: 0, panelOutputPct: 100 },
  countdown: { sun: { kind: 'set', hours: 1 }, earth: { kind: 'set', hours: 1 } },
  sky: { terrain: [[0, 0], [360, 0]], sun: { az: 0, el: 1, hidden: false }, earth: { az: 0, el: 1, hidden: false }, sunPath: [], earthPath: [], athensSunPath: [] },
  lanes: { sun: lane(...sun), earth: lane(...earth), both: [] },
});

const rank = (...views: SiteView[]) => {
  const { order, reason, leftOut } = rankSites(views, START, WEEK_H);
  return { ids: order.map((r) => r.view.site.id), reason, leftOut };
};

test('no places gives an empty ranking', () => {
  expect(rank()).toEqual({ ids: [], reason: 'only', leftOut: [] });
});

test('one place is first because it is the only one', () => {
  expect(rank(place('a'))).toEqual({ ids: ['a'], reason: 'only', leftOut: [] });
});

test('a place that fits the stay comes before one that does not, whatever its sunlight', () => {
  const risky = place('risky', { sun: [[0, 20]], sunlitPct: 90 }); // dark from hour 20 to the end of the week
  const fits = place('fits', { sunlitPct: 10 });
  expect(rank(risky, fits)).toEqual({ ids: ['fits', 'risky'], reason: 'onlyFit', leftOut: [] });
});

test('among places that fit, the shortest dark period wins', () => {
  const dark40 = place('dark40', { sun: [[0, 60], [100, 200]], sunlitPct: 80 });
  const dark10 = place('dark10', { sun: [[0, 60], [70, 200]], sunlitPct: 20 });
  expect(rank(dark40, dark10)).toEqual({ ids: ['dark10', 'dark40'], reason: 'dark', leftOut: [] });
});

test('a dark period less than half an hour longer is not a difference; sunlight decides', () => {
  const a = place('a', { sun: [[0, 60], [70, 200]], sunlitPct: 20 });
  const b = place('b', { sun: [[0, 60], [70.4, 200]], sunlitPct: 40 });
  expect(rank(a, b)).toEqual({ ids: ['b', 'a'], reason: 'sunlight', leftOut: [] });
});

test('level on darkness and sunlight, the most Earth in view wins; level on everything is a tie by id', () => {
  expect(rank(place('a', { earthPct: 10 }), place('b', { earthPct: 60 }))).toEqual({ ids: ['b', 'a'], reason: 'earth', leftOut: [] });
  expect(rank(place('b'), place('a'))).toEqual({ ids: ['a', 'b'], reason: 'tie', leftOut: [] });
});

test('when no place fits, the first one is the closest: the shortest dark period', () => {
  const dark148 = place('dark148', { sun: [[0, 20]] });
  const dark100 = place('dark100', { sun: [[0, 68]] });
  expect(rank(dark148, dark100)).toEqual({ ids: ['dark100', 'dark148'], reason: 'closest', leftOut: [] });
});

test('places without mapped hills are not ranked, and places with an incomplete horizon are named as left out', () => {
  const flat = place('apollo', { mapped: false, sunlitPct: 99 });
  const partial = place('im-1', { incomplete: true, sunlitPct: 99 });
  expect(rank(flat, partial, place('a'))).toEqual({ ids: ['a'], reason: 'only', leftOut: ['im-1'] });
});

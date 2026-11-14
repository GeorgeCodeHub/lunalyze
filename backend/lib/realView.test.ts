import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { earthSunPath } from './lunar';
import { discFraction, type HorizonMask, HOUR, maskElev, realView } from './realView';
import type { Site, Zoom } from './types';

const sites: Site[] = JSON.parse(readFileSync('backend/public/data/sites.json', 'utf8'));
const site = (id: string) => sites.find((s) => s.id === id) as Site;
const maskOf = (id: string): HorizonMask => JSON.parse(readFileSync(`backend/public/data/masks/${id}.json`, 'utf8'));
const synthetic = (deg: number): HorizonMask => ({
  siteId: 'synthetic',
  mastM: 2,
  azStepDeg: 0.5,
  elevDeg: Array(720).fill(deg),
  incomplete: Array(720).fill(false),
});

const T = new Date('2028-03-05T06:30:00Z');
const apollo = site('apollo-11');
const change4 = site('change-4');
const iso = (ms: number) => new Date(ms).toISOString();

describe('maskElev (criterion 1)', () => {
  const e = Array.from({ length: 720 }, (_, i) => i);
  test.each([
    [0, 0],
    [0.499, 0],
    [0.5, 1],
    [1.0, 2],
    [359.75, 719], // last bin
    [359.999, 719],
    [360, 0], // wraps to bin 0
  ])('az %s reads bin %s', (az, bin) => expect(maskElev(e, az)).toBe(bin));
});

describe('discFraction (criterion 2)', () => {
  test.each([
    [0, 0.5],
    [0.266, 1],
    [1, 1],
    [-0.266, 0],
    [-5, 0],
  ])('above %s gives %s', (above, share) => expect(discFraction(above)).toBe(share));
  test('half way up the disc radius', () => {
    expect(discFraction(0.133)).toBeCloseTo(0.80449, 4);
    expect(discFraction(-0.133)).toBeCloseTo(0.19551, 4);
  });
});

describe('path lengths (criterion 3)', () => {
  test.each([
    ['day', 25],
    ['lunarDay', 709],
    ['year', 731],
  ] as [Zoom, number][])('%s has %s points, the first is the sky at t', (zoom, n) => {
    const v = realView(apollo, null, T, zoom, true);
    expect(v.sky.sunPath).toHaveLength(n);
    expect(v.sky.earthPath).toHaveLength(n);
    expect(v.sky.sunPath[0]).toEqual([v.sky.sun.az, v.sky.sun.el]);
    expect(v.sky.earthPath[0]).toEqual([v.sky.earth.az, v.sky.earth.el]);
  });
});

describe('terrain (criterion 4)', () => {
  const flat = [[0, 0], [360, 0]];
  test('a mask with terrain on gives 721 points that close at 360', () => {
    const mask = maskOf('point-a');
    const { terrain } = realView(site('point-a'), mask, T, 'day', true).sky;
    expect(terrain).toHaveLength(721);
    expect(terrain[0]).toEqual([0, mask.elevDeg[0]]);
    expect(terrain[719]).toEqual([359.5, mask.elevDeg[719]]);
    expect(terrain[720]).toEqual([360, mask.elevDeg[0]]);
    for (let i = 0; i < 720; i++) expect(terrain[i]).toEqual([i * 0.5, mask.elevDeg[i]]);
  });
  test('no mask, or terrain off, gives the flat horizon', () => {
    expect(realView(site('point-a'), null, T, 'day', true).sky.terrain).toEqual(flat);
    expect(realView(site('point-a'), maskOf('point-a'), T, 'day', false).sky.terrain).toEqual(flat);
  });
});

describe('visibility uses the mask (criteria 5 and 10)', () => {
  const wall = synthetic(90);
  const walled = realView(apollo, wall, T, 'lunarDay', true);
  const open = realView(apollo, null, T, 'lunarDay', true);

  test('a 90 degree mask hides everything', () => {
    expect(walled.metrics.sunlitPct).toBe(0);
    expect(walled.metrics.earthPct).toBe(0);
    expect(walled.lanes.sun).toEqual([]);
    expect(walled.sky.sun.hidden).toBe(true);
    expect(walled.metrics.panelOutputPct).toBe(0);
    expect(walled.countdown.sun).toEqual({ kind: 'rise', hours: null });
  });
  test('a 0 degree mask equals no mask, for metrics, countdown and lanes', () => {
    const zero = realView(apollo, synthetic(0), T, 'lunarDay', true);
    expect(zero.metrics).toEqual(open.metrics);
    expect(zero.countdown).toEqual(open.countdown);
    expect(zero.lanes).toEqual(open.lanes);
  });
  test('a 90 degree mask with terrain off equals no mask', () => {
    expect(realView(apollo, wall, T, 'lunarDay', false)).toEqual(open);
  });
  test('sunElDeg is the raw elevation, not horizon-relative', () => {
    expect(walled.metrics.sunElDeg).toBe(open.metrics.sunElDeg);
    expect(walled.metrics.sunElDeg).toBe(open.sky.sun.el);
    expect(walled.sky.sun.el).toBe(open.sky.sun.el);
  });
});

describe('apollo-11, flat, lunarDay (criterion 6)', () => {
  const v = realView(apollo, null, T, 'lunarDay', true);
  test('metrics', () => {
    expect(v.metrics.sunlitPct).toBe(50.1);
    expect(v.metrics.earthPct).toBe(100);
    expect(v.metrics.longestBlackoutH).toBe(0);
    expect(v.metrics.panelOutputPct).toBe(100);
    expect(v.metrics.sunElDeg).toBe(42.05);
  });
  test('Earth is up the whole window', () => {
    expect(v.lanes.earth).toEqual([['2028-03-05T06:30:00.000Z', '2028-04-03T19:13:00.000Z']]);
    expect(v.countdown.earth).toEqual({ kind: 'set', hours: null });
  });
  test('Sun lane has two periods', () => {
    expect(v.lanes.sun).toEqual([
      ['2028-03-05T06:30:00.000Z', '2028-03-16T14:59:00.000Z'],
      ['2028-03-31T08:55:00.000Z', '2028-04-03T19:13:00.000Z'],
    ]);
  });
});

describe('change-4, far side, flat, lunarDay (criterion 7)', () => {
  const v = realView(change4, null, T, 'lunarDay', true);
  test('Earth never rises', () => {
    expect(v.metrics.earthPct).toBe(0);
    expect(v.lanes.earth).toEqual([]);
    expect(v.lanes.both).toEqual([]);
    expect(v.countdown.earth).toEqual({ kind: 'rise', hours: null });
  });
  test('Sun is down at t and rises in about 326 h', () => {
    expect(v.countdown.sun).toEqual({ kind: 'rise', hours: 326.16 });
    expect(v.metrics.longestBlackoutH).toBe(326.2);
    expect(v.metrics.sunlitPct).toBe(49.1);
    expect(v.metrics.panelOutputPct).toBe(0);
    expect(v.lanes.sun).toEqual([['2028-03-18T20:40:00.000Z', '2028-04-02T08:58:00.000Z']]);
  });
});

describe('countdown to about a minute (criterion 8)', () => {
  const { sun } = realView(apollo, null, T, 'day', true).countdown;
  const h = sun.hours as number;
  const at = (dtH: number) => realView(apollo, null, new Date(T.getTime() + (h + dtH) * HOUR), 'day', true);
  test('Sun sets in about 272.5 h', () => {
    expect(sun).toEqual({ kind: 'set', hours: 272.48 });
  });
  test('the Sun is up a minute before and down a minute after', () => {
    expect(at(-1 / 60).sky.sun.hidden).toBe(false);
    expect(at(1 / 60).sky.sun.hidden).toBe(true);
  });
  test('the disc straddling the horizon: hidden centre, about half the panel output', () => {
    expect(at(-1 / 60).metrics.panelOutputPct).toBe(51.8);
    expect(at(1 / 60).metrics.panelOutputPct).toBe(47.8);
    expect(at(1 / 60).metrics.sunElDeg).toBe(-0.009);
  });
});

describe('lanes per zoom (criterion 9)', () => {
  test('day: the whole 24 h', () => {
    const v = realView(apollo, null, T, 'day', true);
    expect(v.lanes.sun).toEqual([[iso(T.getTime()), iso(T.getTime() + 24 * HOUR)]]);
  });
  test('year: 13 ordered intervals inside the window', () => {
    const v = realView(apollo, null, T, 'year', true);
    expect(v.lanes.sun).toHaveLength(13);
    expect(v.metrics.sunlitPct).toBe(51.5);
    for (const [a, b] of v.lanes.sun) {
      expect(Date.parse(a)).toBeLessThan(Date.parse(b));
      expect(Date.parse(a)).toBeGreaterThanOrEqual(T.getTime());
      expect(Date.parse(b)).toBeLessThanOrEqual(T.getTime() + 8760 * HOUR);
    }
  });
});

describe('athensSunPath (criterion 11)', () => {
  test('starts at t, 25 hourly points', () => {
    const v = realView(apollo, null, T, 'day', true);
    expect(v.sky.athensSunPath).toEqual(earthSunPath(37.98, 23.73, T));
    expect(v.sky.athensSunPath).toHaveLength(25);
  });
  test('at the equinox the highest point is index 11, at 90 - 37.98 degrees', () => {
    const { athensSunPath } = realView(apollo, null, new Date('2028-03-20T00:00:00Z'), 'day', true).sky;
    const top = athensSunPath.reduce((best, p, i) => (p[1] > athensSunPath[best][1] ? i : best), 0);
    expect(top).toBe(11);
    expect(athensSunPath[11][1]).toBeCloseTo(51.631, 2);
    expect(athensSunPath[11][0]).toBeCloseTo(191.167, 2);
  });
  test('moves with t', () => {
    const a = realView(apollo, null, T, 'day', true).sky.athensSunPath[0];
    const b = realView(apollo, null, new Date(T.getTime() + 6 * HOUR), 'day', true).sky.athensSunPath[0];
    expect(a).not.toEqual(b);
  });
});

describe('horizonIncomplete (criterion 12)', () => {
  const files = readdirSync('backend/public/data/masks').filter((f) => f.endsWith('.json'));
  test('there are 11 mask files', () => expect(files).toHaveLength(11));
  test.each(files.map((f) => f.replace('.json', '')))('%s', (id) => {
    const mask = maskOf(id);
    const s = site(id);
    expect(realView(s, mask, T, 'day', true).horizonIncomplete).toBe(id === 'im-1');
    expect(realView(s, mask, T, 'day', false).horizonIncomplete).toBe(false);
  });
  test('no mask is false', () => expect(realView(apollo, null, T, 'day', true).horizonIncomplete).toBe(false));
});

describe('a bad mask (criterion 13)', () => {
  test('elevDeg of the wrong length throws', () => {
    const bad = { ...synthetic(0), elevDeg: Array(719).fill(0) };
    expect(() => realView(apollo, bad, T, 'day', true)).toThrow('mask must have 720 points, got 719');
  });
  test('incomplete of the wrong length throws', () => {
    const bad = { ...synthetic(0), incomplete: Array(721).fill(false) };
    expect(() => realView(apollo, bad, T, 'day', true)).toThrow('mask must have 720 points, got 721');
  });
  test('it throws even with terrain off', () => {
    const bad = { ...synthetic(0), elevDeg: [] };
    expect(() => realView(apollo, bad, T, 'day', false)).toThrow('mask must have 720 points, got 0');
  });
});

test('every view is real data (criterion 14)', () => {
  for (const zoom of ['day', 'lunarDay', 'year'] as Zoom[]) {
    expect(realView(apollo, null, T, zoom, true).fixture).toBe(false);
  }
  expect(realView(site('point-a'), maskOf('point-a'), T, 'day', false).fixture).toBe(false);
});

test('year zoom stays within a second', () => {
  const start = performance.now();
  realView(site('point-a'), maskOf('point-a'), T, 'year', true);
  expect(performance.now() - start).toBeLessThan(1000);
});

import { readFileSync, readdirSync } from 'node:fs';
import { expect, test } from 'vitest';
import { type FixtureFile, viewAt } from './fixtureView';
import type { Site } from './types';

const site = { id: 'test' } as Site;
const T0 = '2028-03-01T00:00:00.000Z';
const at = (h: number) => new Date(Date.parse(T0) + h * 3600e3);

// Sun at azimuth 90 going 2° → 1° → -1° → -2° → 2° (repeats every 4 h). Earth fixed at 5°. Horizon 0.5° everywhere.
const fx: FixtureFile = {
  fixture: true,
  siteId: 'test',
  t0: T0,
  stepH: 1,
  terrain: Array.from({ length: 721 }, (_, i) => [i * 0.5, 0.5]),
  sun: [[90, 2], [90, 1], [90, -1], [90, -2], [90, 2]],
  earth: [[180, 5], [180, 5], [180, 5], [180, 5], [180, 5]],
  athensSunPath: [],
  view: null as never,
};

test('interpolates the Sun between hourly samples and flags it hidden behind terrain', () => {
  expect(viewAt(fx, site, at(0.5), 'day', true).sky.sun).toEqual({ az: 90, el: 1.5, hidden: false });
  expect(viewAt(fx, site, at(1.5), 'day', true).sky.sun).toEqual({ az: 90, el: 0, hidden: true });
  expect(viewAt(fx, site, at(1.5), 'day', false).sky.sun.hidden).toBe(true); // flat horizon: exactly 0° is not up
  expect(viewAt(fx, site, at(1.4), 'day', false).sky.sun.hidden).toBe(false); // 0.2° clears a flat horizon
});

test('countdowns: Sun sets when it meets the horizon, Earth never sets', () => {
  const v = viewAt(fx, site, at(0), 'day', true);
  expect(v.countdown.sun.kind).toBe('set');
  expect(v.countdown.sun.hours).toBeCloseTo(1.25, 1); // crosses 0.5° a quarter of the way from 1° to -1°
  expect(v.countdown.earth).toEqual({ kind: 'set', hours: null });

  const night = viewAt(fx, site, at(2), 'day', true);
  expect(night.countdown.sun.kind).toBe('rise');
  expect(night.countdown.sun.hours).toBeCloseTo(1.625, 1);
  expect(viewAt(fx, site, at(0), 'day', false).countdown.sun.hours).toBeCloseTo(1.5, 1); // flat horizon sets later
});

test('lanes and metrics cover the zoom window that starts at t', () => {
  const v = viewAt(fx, site, at(0), 'day', true);
  expect(v.lanes.sun).toHaveLength(7); // up at the start, then six more rises in 24 h
  expect(v.lanes.sun[0]).toEqual(['2028-03-01T00:00:00.000Z', '2028-03-01T01:15:00.000Z']);
  expect(v.lanes.earth).toEqual([['2028-03-01T00:00:00.000Z', '2028-03-02T00:00:00.000Z']]);
  expect(v.lanes.both).toEqual(v.lanes.sun);
  expect(v.metrics.sunlitPct).toBeCloseTo(40.6, 0); // (1.25 h + 0.375 h) of every 4 h
  expect(v.metrics.earthPct).toBe(100);
  expect(v.metrics.longestBlackoutH).toBe(0);
  expect(v.metrics.panelOutputPct).toBe(100);
  expect(v.sky.sunPath).toHaveLength(25);
  expect(v.fixture).toBe(true);
});

test('committed fixture files match the current code (re-run `npm run fixtures` if this fails)', () => {
  const files = readdirSync('public/data/fixtures').filter((f) => f.endsWith('.json'));
  expect(files).toHaveLength(3);
  for (const f of files) {
    const file: FixtureFile = JSON.parse(readFileSync(`public/data/fixtures/${f}`, 'utf8'));
    expect(file.sun).toHaveLength(709);
    expect(file.terrain).toHaveLength(721);
    expect(Math.max(...file.terrain.map(([, el]) => Math.abs(el)))).toBeLessThanOrEqual(2);
    expect(viewAt(file, file.view.site, new Date(file.t0), 'lunarDay', true)).toEqual(file.view);
  }
});

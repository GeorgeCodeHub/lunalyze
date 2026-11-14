// Builds a SiteView from a fixture file (hourly samples + fake terrain).
// Fixture-grade maths only: G6 replaces this with the real engine behind the same useScenario signature.
import { countdown, HOUR, hours, intervals, iso, round, ZOOM } from './realView';
import type { Body, Interval, Site, SiteView, Zoom } from './types';

type Pair = [number, number]; // [az, el] degrees

/** Shape of backend/public/data/fixtures/<siteId>.json */
export type FixtureFile = {
  fixture: true;
  siteId: string;
  t0: string; // ISO UTC of sample 0
  stepH: 1;
  terrain: Pair[]; // fake silhouette, azimuth 0..360 every 0.5° (721 points)
  sun: Pair[]; // one per hour for one lunar day (709 points)
  earth: Pair[];
  athensSunPath: Pair[]; // Sun at Athens, one per hour for 24 h from t0 (25 points)
  view: SiteView; // snapshot at t0, zoom 'lunarDay', terrain on
};

const SUN_RADIUS_DEG = 0.266;
const FLAT: Pair[] = [[0, 0], [360, 0]];

/** Position at time ms. Samples repeat after the last one, so any date works (dates outside the fixture are not real). */
const at = (samples: Pair[], t0: number, ms: number): Pair => {
  const period = samples.length - 1;
  const h = ((((ms - t0) / HOUR) % period) + period) % period;
  const i = Math.floor(h);
  const f = h - i;
  const [a0, e0] = samples[i];
  const [a1, e1] = samples[i + 1];
  const da = ((a1 - a0 + 540) % 360) - 180; // shortest way round
  return [(a0 + da * f + 360) % 360, e0 + (e1 - e0) * f];
};

const horizon = (terrain: Pair[] | null, az: number): number => {
  if (!terrain) return 0;
  const i = Math.min(Math.floor(az * 2), terrain.length - 2);
  return terrain[i][1] + (terrain[i + 1][1] - terrain[i][1]) * (az * 2 - i);
};

/** The SiteView for the window that starts at t. terrainOn = false uses a flat 0° horizon. */
export const viewAt = (fx: FixtureFile, site: Site, t: Date, zoom: Zoom, terrainOn: boolean): SiteView => {
  const t0 = Date.parse(fx.t0);
  const ms = t.getTime();
  const terrain = terrainOn ? fx.terrain : null;
  const { spanH, stepH } = ZOOM[zoom];

  const above = (samples: Pair[], time: number) => {
    const [az, el] = at(samples, t0, time);
    return el - horizon(terrain, az);
  };
  const sunUp = (time: number) => above(fx.sun, time) > 0;
  const earthUp = (time: number) => above(fx.earth, time) > 0;
  const body = (samples: Pair[]): Body => {
    const [az, el] = at(samples, t0, ms);
    return { az: round(az, 3), el: round(el, 3), hidden: el <= horizon(terrain, az) };
  };
  const path = (samples: Pair[]): Pair[] =>
    Array.from({ length: Math.floor(spanH / stepH) + 1 }, (_, i) => {
      const [az, el] = at(samples, t0, ms + i * stepH * HOUR);
      return [round(az, 3), round(el, 3)];
    });

  const sunLane = intervals(sunUp, ms, spanH);
  const earthLane = intervals(earthUp, ms, spanH);
  const bothLane = intervals((x) => sunUp(x) && earthUp(x), ms, spanH);
  const blackout = intervals((x) => !sunUp(x) && !earthUp(x), ms, spanH);
  const lane = (iv: [number, number][]): Interval[] => iv.map(([a, b]) => [iso(a), iso(b)]);
  // Fraction of the Sun's disc above the horizon, as a straight line between "just hidden" and "just clear".
  const disc = Math.min(1, Math.max(0, (above(fx.sun, ms) + SUN_RADIUS_DEG) / (2 * SUN_RADIUS_DEG)));
  const sun = body(fx.sun);

  return {
    site,
    fixture: true,
    horizonIncomplete: false,
    metrics: {
      sunElDeg: sun.el,
      sunlitPct: round((100 * hours(sunLane)) / spanH, 1),
      earthPct: round((100 * hours(earthLane)) / spanH, 1),
      longestBlackoutH: round(Math.max(0, ...blackout.map(([a, b]) => (b - a) / HOUR)), 1),
      panelOutputPct: round(100 * disc, 1),
    },
    countdown: { sun: countdown(sunUp, ms), earth: countdown(earthUp, ms) },
    sky: {
      terrain: terrainOn ? fx.terrain : FLAT,
      sun,
      earth: body(fx.earth),
      sunPath: path(fx.sun),
      earthPath: path(fx.earth),
      athensSunPath: fx.athensSunPath,
    },
    lanes: { sun: lane(sunLane), earth: lane(earthLane), both: lane(bothLane) },
  };
};

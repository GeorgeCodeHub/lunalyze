// Builds the real SiteView from lunar.ts positions and a horizon mask (G6). Pure; no I/O.
import { earthSunPath, sky } from './lunar';
import type { Body, Countdown, Interval, Site, SiteView, Zoom } from './types';

type Pair = [number, number]; // [az, el] degrees

/** Shape of backend/public/data/masks/<siteId>.json */
export type HorizonMask = {
  siteId: string;
  mastM: number; // 2
  azStepDeg: number; // 0.5
  elevDeg: number[]; // 720; index i = azimuth i × 0.5°; lower bounds where incomplete[i]
  incomplete: boolean[]; // 720
};

export const HOUR = 3600e3;
export const MAST_KM = 0.002; // G10: observer 2 m above the 1737.4 km sphere
export const LUNAR_DAY_H = 29.53 * 24;
/** Window length and path sampling step, in hours, for each zoom. The window starts at t. */
export const ZOOM: Record<Zoom, { spanH: number; stepH: number }> = {
  day: { spanH: 24, stepH: 1 },
  lunarDay: { spanH: LUNAR_DAY_H, stepH: 1 },
  year: { spanH: 365 * 24, stepH: 12 },
};
const MASK_POINTS = 720; // 0.5° azimuth step
const SUN_RADIUS_DEG = 0.266;
const FLAT: Pair[] = [[0, 0], [360, 0]];

export const round = (v: number, digits: number) => Math.round(v * 10 ** digits) / 10 ** digits;
export const iso = (ms: number) => new Date(Math.round(ms / 60e3) * 60e3).toISOString();

/** Periods inside [start, start + spanH] where vis() is true. Hourly scan, edges bisected to about 1 minute. */
// shortcut: hourly scan, a set and rise inside one hour can be missed; sample finer if a site needs it.
export const intervals = (vis: (ms: number) => boolean, start: number, spanH: number): [number, number][] => {
  const out: [number, number][] = [];
  const end = start + spanH * HOUR;
  let prevT = start;
  let prev = vis(start);
  let open = prev ? start : null;
  for (let next = start + HOUR; prevT < end; next += HOUR) {
    const t = Math.min(next, end);
    const cur = vis(t);
    if (cur !== prev) {
      let a = prevT;
      let b = t;
      for (let k = 0; k < 6; k++) {
        const mid = (a + b) / 2;
        if (vis(mid) === prev) a = mid;
        else b = mid;
      }
      const edge = (a + b) / 2;
      if (open !== null) out.push([open, edge]);
      open = prev ? null : edge;
    }
    prevT = t;
    prev = cur;
  }
  if (open !== null) out.push([open, end]);
  return out;
};

export const hours = (iv: [number, number][]) => iv.reduce((sum, [a, b]) => sum + (b - a) / HOUR, 0);

export const countdown = (vis: (ms: number) => boolean, ms: number): Countdown => {
  const iv = intervals(vis, ms, LUNAR_DAY_H); // look one lunar day ahead; null = no change in that time
  if (vis(ms)) {
    const setAt = iv[0][1];
    return { kind: 'set', hours: setAt < ms + LUNAR_DAY_H * HOUR ? round((setAt - ms) / HOUR, 2) : null };
  }
  return { kind: 'rise', hours: iv.length ? round((iv[0][0] - ms) / HOUR, 2) : null };
};

/** Step lookup, the PGDA-69-gated rule (G3): elevDeg[floor(az * 2) % 720]. */
export const maskElev = (elevDeg: number[], az: number): number => elevDeg[Math.floor(az * 2) % MASK_POINTS];

/** Share (0..1) of the Sun's disc above the horizon; aboveDeg = Sun centre el − horizon el (G6). */
export const discFraction = (aboveDeg: number): number => {
  const x = Math.min(1, Math.max(-1, aboveDeg / SUN_RADIUS_DEG));
  return 0.5 + (Math.asin(x) + x * Math.sqrt(1 - x * x)) / Math.PI;
};

/** The real SiteView for the window that starts at t. mask null = flat 0° horizon (terrainModeled false, G1).
 *  terrainOn false = flat horizon. Throws on a mask that is not 720 bins. fixture is always false. */
export const realView = (site: Site, mask: HorizonMask | null, t: Date, zoom: Zoom, terrainOn: boolean): SiteView => {
  if (mask && (mask.elevDeg.length !== MASK_POINTS || mask.incomplete.length !== MASK_POINTS)) {
    const got = mask.elevDeg.length !== MASK_POINTS ? mask.elevDeg.length : mask.incomplete.length;
    throw new Error(`mask must have ${MASK_POINTS} points, got ${got}`);
  }
  const elev = mask && terrainOn ? mask.elevDeg : null;
  const ms = t.getTime();
  const { spanH, stepH } = ZOOM[zoom];

  // One sky() per distinct instant: scans, countdowns and paths share samples.
  const cache = new Map<number, ReturnType<typeof sky>>();
  const skyAt = (time: number) => {
    let s = cache.get(time);
    if (!s) {
      s = sky(site.lat, site.lon, MAST_KM, new Date(time));
      cache.set(time, s);
    }
    return s;
  };
  const horizon = (az: number) => (elev ? maskElev(elev, az) : 0);
  const sunAbove = (time: number) => {
    const { az, el } = skyAt(time).sun;
    return el - horizon(az);
  };
  const sunUp = (time: number) => sunAbove(time) > 0;
  const earthUp = (time: number) => {
    const { az, el } = skyAt(time).earth;
    return el - horizon(az) > 0;
  };
  const body = (which: 'sun' | 'earth'): Body => {
    const { az, el } = skyAt(ms)[which];
    return { az: round(az, 3), el: round(el, 3), hidden: el <= horizon(az) };
  };
  const path = (which: 'sun' | 'earth'): Pair[] =>
    Array.from({ length: Math.floor(spanH / stepH) + 1 }, (_, i) => {
      const { az, el } = skyAt(ms + i * stepH * HOUR)[which];
      return [round(az, 3), round(el, 3)];
    });

  const sunLane = intervals(sunUp, ms, spanH);
  const earthLane = intervals(earthUp, ms, spanH);
  const bothLane = intervals((x) => sunUp(x) && earthUp(x), ms, spanH);
  const blackout = intervals((x) => !sunUp(x) && !earthUp(x), ms, spanH);
  const lane = (iv: [number, number][]): Interval[] => iv.map(([a, b]) => [iso(a), iso(b)]);
  const sun = body('sun');

  return {
    site,
    fixture: false,
    horizonIncomplete: terrainOn && mask !== null && mask.incomplete.some(Boolean),
    metrics: {
      sunElDeg: sun.el,
      sunlitPct: round((100 * hours(sunLane)) / spanH, 1),
      earthPct: round((100 * hours(earthLane)) / spanH, 1),
      longestBlackoutH: round(Math.max(0, ...blackout.map(([a, b]) => (b - a) / HOUR)), 1),
      panelOutputPct: round(100 * discFraction(sunAbove(ms)), 1),
    },
    countdown: { sun: countdown(sunUp, ms), earth: countdown(earthUp, ms) },
    sky: {
      terrain: elev ? [...elev.map((e, i): Pair => [i * 0.5, e]), [360, elev[0]]] : FLAT,
      sun,
      earth: body('earth'),
      sunPath: path('sun'),
      earthPath: path('earth'),
      athensSunPath: earthSunPath(37.98, 23.73, t),
    },
    lanes: { sun: lane(sunLane), earth: lane(earthLane), both: lane(bothLane) },
  };
};

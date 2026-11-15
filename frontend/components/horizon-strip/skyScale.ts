export type Pair = [number, number]; // [direction, height] in degrees, as in SiteView.sky

/** How a body looks in the sky (DESIGN.md, visibility states). */
export type SkyStatus = 'visible' | 'partly' | 'hidden';

/** Which direction sits in the middle of the strip. 'south': north, east, south, west, north. 'north': south, west, north, east, south. */
export type StripCentre = 'south' | 'north';

/** The strip's drawing size in SVG units; toXY turns sky angles into these. */
export const STRIP = { width: 720, height: 280 } as const;

const RANGES = [10, 20, 45, 90];

/**
 * How many degrees above and below level ground the strip shows: the smallest of 10, 20, 45 and 90
 * that holds every point of the given paths with a little room. Near the pole the Sun and Earth stay
 * within a few degrees of the horizon (10); at Apollo 11 the Sun climbs overhead (90).
 */
export const heightRange = (paths: Pair[][]): number => {
  let top = 0;
  for (const path of paths) for (const [, el] of path) top = Math.max(top, Math.abs(el));
  return RANGES.find((r) => top * 1.08 <= r) ?? 90;
};

/**
 * The strip is cut open at one direction, and Earth barely moves in the Moon's sky. So the cut goes
 * on the side away from Earth: when Earth sits within 90° of north, north goes in the middle.
 */
export const stripCentre = (earthAz: number): StripCentre => (earthAz < 90 || earthAz > 270 ? 'north' : 'south');

/** A direction as the strip draws it: unchanged with south in the middle, turned half a circle with north there. */
export const stripAz = (az: number, centre: StripCentre): number => (centre === 'north' ? (az + 180) % 360 : az);

/** A path with its directions turned for the strip (see stripAz). */
export const turnPath = (path: Pair[], centre: StripCentre): Pair[] => path.map(([az, el]) => [stripAz(az, centre), el]);

/**
 * The horizon outline (direction 0 to 360) as the strip draws it, left edge to right edge.
 * With north in the middle the two halves swap places, so the outline still runs from 0 to 360.
 */
export const turnTerrain = (terrain: Pair[], centre: StripCentre): Pair[] => {
  if (centre === 'south' || terrain.length === 0) return terrain;
  const turned: Pair[] = [
    ...terrain.filter(([az]) => az >= 180).map(([az, el]): Pair => [az - 180, el]),
    ...terrain.filter(([az]) => az <= 180).map(([az, el]): Pair => [az + 180, el]),
  ];
  // A flat outline has only its two end points; carry them out to the strip's edges.
  const first = turned[0];
  const last = turned[turned.length - 1];
  return [...(first[0] > 0 ? [[0, first[1]] as Pair] : []), ...turned, ...(last[0] < 360 ? [[360, last[1]] as Pair] : [])];
};

/** A path cut where it crosses the strip's edge: a jump of more than 180° starts a new line (DATA_CONTRACT). */
export const splitPath = (path: Pair[]): Pair[][] => {
  const lines: Pair[][] = [];
  let line: Pair[] = [];
  for (const point of path) {
    const last = line.at(-1);
    if (last && Math.abs(point[0] - last[0]) > 180) {
      lines.push(line);
      line = [];
    }
    line.push(point);
  }
  if (line.length > 0) lines.push(line);
  return lines;
};

/** The Sun by how much of its disc shows: all of it, some of it, or none. */
export const sunStatus = (panelOutputPct: number): SkyStatus => {
  if (panelOutputPct >= 100) return 'visible';
  return panelOutputPct <= 0 ? 'hidden' : 'partly';
};

export const earthStatus = (hidden: boolean): SkyStatus => (hidden ? 'hidden' : 'visible');

// Stopgap: the fit check belongs in backend/lib (design brief, request 1 for George). Until it is
// there, this reads the lanes useScenario already returns and only compares them with the limit.
// It puts no number of its own on screen: the times it reports are lane edges from backend/lib,
// or the landing time and end of stay the user chose.
import { HOUR, LUNAR_DAY_H } from '../../../backend/lib/realView';
import type { SiteView } from '../../../backend/lib/types';

/** DATA_CONTRACT: the limit on one period with no Sun and no Earth, hours. */
export const DARK_LIMIT_H = 50;

/**
 * fits: no dark period in the stay is longer than the limit. risky: the longest one, from → to (ms).
 * fromLanding / toEnd: that period starts at the landing time / runs to the end of the stay checked.
 */
export type StayFit =
  | { status: 'fits' }
  | { status: 'risky'; fromMs: number; toMs: number; fromLanding: boolean; toEnd: boolean };

/**
 * lanes: the Sun and Earth lanes of the Moon-day window that starts at startMs (the landing time).
 * That window covers every stay offered; the 30-day stay ("one full Moon day") is checked to its end, 29.53 days.
 */
export const stayFit = (lanes: Pick<SiteView['lanes'], 'sun' | 'earth'>, startMs: number, stayH: number): StayFit => {
  const endMs = startMs + Math.min(stayH, LUNAR_DAY_H) * HOUR;
  const lit = [...lanes.sun, ...lanes.earth]
    .map(([from, to]) => [Math.max(Date.parse(from), startMs), Math.min(Date.parse(to), endMs)])
    .filter(([from, to]) => to > from)
    .sort((a, b) => a[0] - b[0]);

  // Walk the lit periods in order; every gap between them is a dark period.
  let longest = { fromMs: startMs, toMs: startMs };
  let darkFrom = startMs;
  for (const [from, to] of lit) {
    if (from - darkFrom > longest.toMs - longest.fromMs) longest = { fromMs: darkFrom, toMs: from };
    darkFrom = Math.max(darkFrom, to);
  }
  if (endMs - darkFrom > longest.toMs - longest.fromMs) longest = { fromMs: darkFrom, toMs: endMs };

  if (longest.toMs - longest.fromMs <= DARK_LIMIT_H * HOUR) return { status: 'fits' };
  return { status: 'risky', ...longest, fromLanding: longest.fromMs === startMs, toEnd: longest.toMs === endMs };
};

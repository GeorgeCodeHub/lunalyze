// Stopgap, like stayFit: choosing the best place belongs in backend/lib (design brief, requests 1 and 5
// for George). Until it is there, this only puts in order the views useScenario already returns. It puts
// no number of its own on screen.
import { HOUR } from '../../../backend/lib/realView';
import type { SiteView } from '../../../backend/lib/types';
import type { Focus } from '../../scenario';
import { type StayFit, stayFit } from './stayFit';

export type Ranked = { view: SiteView; fit: StayFit };

/** What places are compared on, after "fits the stay": the dark period, sunlight, Earth in view. */
type Measure = 'dark' | 'sunlight' | 'earth';

/**
 * Why the first place is first.
 * only: nothing else could be checked. closest: no place fits, this one comes nearest.
 * onlyFit: the only place that fits. tie: level with the next place on everything.
 * dark / sunlight / earth: ahead of the next place on what matters most (the focus).
 * darkNext / sunlightNext / earthNext: level on what matters most, and ahead on the next measure.
 */
export type WinReason = 'only' | 'closest' | 'onlyFit' | 'tie' | Measure | `${Measure}Next`;

export type Ranking = {
  order: Ranked[]; // best first
  reason: WinReason;
  leftOut: string[]; // south-pole site ids not ranked: their horizon is only a lower bound
};

// Whole hours: countdowns and lane edges are good to about a minute, so a smaller gap is not a real difference.
const darkHours = (r: Ranked) => Math.round(r.fit.darkMs / HOUR);
const fits = (r: Ranked) => r.fit.status === 'fits';

/** Below 0: a is better on this measure. 0: level. */
const BY: Record<Measure, (a: Ranked, b: Ranked) => number> = {
  dark: (a, b) => darkHours(a) - darkHours(b),
  sunlight: (a, b) => b.view.metrics.sunlitPct - a.view.metrics.sunlitPct,
  earth: (a, b) => b.view.metrics.earthPct - a.view.metrics.earthPct,
};

/** The measures in the order the tool uses them, for each focus. */
const MEASURES: Record<Focus, Measure[]> = {
  both: ['dark', 'sunlight', 'earth'],
  sun: ['sunlight', 'dark', 'earth'],
  earth: ['earth', 'dark', 'sunlight'],
};

/**
 * Fits the stay first. When neither fits, the shorter dark period comes first, whatever the focus:
 * the closest to fitting. Then the measures in the focus's order, then the site id.
 */
const byRank = (measures: Measure[]) => (a: Ranked, b: Ranked) =>
  Number(fits(b)) - Number(fits(a)) ||
  (fits(a) ? 0 : BY.dark(a, b)) ||
  measures.reduce((diff, measure) => diff || BY[measure](a, b), 0) ||
  a.view.site.id.localeCompare(b.view.site.id);

const reasonFor = ([first, second]: Ranked[], measures: Measure[]): WinReason => {
  if (!second) return 'only';
  if (!fits(first)) return 'closest';
  if (!fits(second)) return 'onlyFit';
  const decider = measures.findIndex((measure) => BY[measure](first, second) !== 0);
  if (decider === -1) return 'tie';
  return decider === 0 ? measures[0] : `${measures[decider]}Next`;
};

/**
 * views: the Moon-day views (the window that starts at startMs, the landing time) of every listed place.
 * focus: what matters most (the quick filters).
 * Only places with mapped hills are ranked: the far-off comparison sites (Apollo 11, Chang'e 4) have a flat
 * horizon, and a place whose height map ends early has numbers that are only upper limits.
 */
export const rankSites = (views: SiteView[], startMs: number, stayH: number, focus: Focus = 'both'): Ranking => {
  const measures = MEASURES[focus];
  const mapped = views.filter((view) => view.site.terrainModeled);
  const order = mapped
    .filter((view) => !view.horizonIncomplete)
    .map((view) => ({ view, fit: stayFit(view.lanes, startMs, stayH) }))
    .sort(byRank(measures));
  return {
    order,
    reason: order.length > 0 ? reasonFor(order, measures) : 'only',
    leftOut: mapped.filter((view) => view.horizonIncomplete).map((view) => view.site.id),
  };
};

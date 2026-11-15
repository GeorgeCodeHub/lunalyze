// Stopgap, like stayFit: choosing the best place belongs in backend/lib (design brief, requests 1 and 5
// for George). Until it is there, this only puts in order the views useScenario already returns. It puts
// no number of its own on screen.
import { HOUR } from '../../../backend/lib/realView';
import type { SiteView } from '../../../backend/lib/types';
import { type StayFit, stayFit } from './stayFit';

export type Ranked = { view: SiteView; fit: StayFit };

/**
 * Why the first place is first.
 * only: nothing else could be checked. closest: no place fits, this one comes nearest.
 * onlyFit: the only place that fits. dark: the shortest time with no Sun and no Earth during the stay.
 * sunlight / earth: level on that with the next place, and ahead on sunlight / on Earth in view.
 * tie: level with the next place on everything.
 */
export type WinReason = 'only' | 'closest' | 'onlyFit' | 'dark' | 'sunlight' | 'earth' | 'tie';

export type Ranking = {
  order: Ranked[]; // best first
  reason: WinReason;
  leftOut: string[]; // south-pole site ids not ranked: their horizon is only a lower bound
};

// Whole hours: countdowns and lane edges are good to about a minute, so a smaller gap is not a real difference.
const darkHours = (r: Ranked) => Math.round(r.fit.darkMs / HOUR);
const fits = (r: Ranked) => r.fit.status === 'fits';

/** Fits the stay first; then the shortest dark period in the stay; then most sunlight; then most Earth in view. */
const byRank = (a: Ranked, b: Ranked) =>
  Number(fits(b)) - Number(fits(a)) ||
  darkHours(a) - darkHours(b) ||
  b.view.metrics.sunlitPct - a.view.metrics.sunlitPct ||
  b.view.metrics.earthPct - a.view.metrics.earthPct ||
  a.view.site.id.localeCompare(b.view.site.id);

const reasonFor = ([first, second]: Ranked[]): WinReason => {
  if (!second) return 'only';
  if (!fits(first)) return 'closest';
  if (!fits(second)) return 'onlyFit';
  if (darkHours(first) !== darkHours(second)) return 'dark';
  if (first.view.metrics.sunlitPct !== second.view.metrics.sunlitPct) return 'sunlight';
  return first.view.metrics.earthPct !== second.view.metrics.earthPct ? 'earth' : 'tie';
};

/**
 * views: the Moon-day views (the window that starts at startMs, the landing time) of every listed place.
 * Only places with mapped hills are ranked: the far-off comparison sites (Apollo 11, Chang'e 4) have a flat
 * horizon, and a place whose height map ends early has numbers that are only upper limits.
 */
export const rankSites = (views: SiteView[], startMs: number, stayH: number): Ranking => {
  const mapped = views.filter((view) => view.site.terrainModeled);
  const order = mapped
    .filter((view) => !view.horizonIncomplete)
    .map((view) => ({ view, fit: stayFit(view.lanes, startMs, stayH) }))
    .sort(byRank);
  return {
    order,
    reason: order.length > 0 ? reasonFor(order) : 'only',
    leftOut: mapped.filter((view) => view.horizonIncomplete).map((view) => view.site.id),
  };
};

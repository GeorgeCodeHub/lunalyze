import type { SiteView } from '../../../backend/lib/types';

/** Where a place's numbers stop being exact. Each has a short name for the card and a sentence for its details. */
export type CaveatKind = 'terrainOff' | 'terrainNotModeled' | 'approximate' | 'horizonIncomplete';

/** terrain: the hills switch. Off means a flat horizon everywhere, so the other hill caveats do not apply. */
export const caveatKinds = (view: SiteView, terrain: boolean): CaveatKind[] => [
  ...(terrain ? [] : (['terrainOff'] as const)),
  ...(terrain && !view.site.terrainModeled ? (['terrainNotModeled'] as const) : []),
  ...(view.site.precision === 'proxy' ? (['approximate'] as const) : []),
  ...(view.horizonIncomplete ? (['horizonIncomplete'] as const) : []),
];

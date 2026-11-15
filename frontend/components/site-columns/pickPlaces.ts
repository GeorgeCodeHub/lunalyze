import { MAX_PICKS, type Place, placeToken } from '../../scenario';

/** What a place is on the screen: the tool's best option, or a place it is compared with. */
export type Role = 'best' | 'yourChoice' | 'nextBest' | 'alternative';

/** A place compared with the best option, and what it is on the screen. */
export type Compared = { place: Place; role: Exclude<Role, 'best'> };

export type Picks = {
  best: Place | null; // null until the places are ranked
  bestIsYours: boolean; // the tool's best option is one of the places the person picked
  compared: Compared[]; // the places shown under the best option, in the order picked
};

const sitePlace = (id: string): Place => ({ kind: 'site', id });

/**
 * The places the screen compares: the tool's best option, then up to 2 places the person picked.
 * places: the picked places, from the link. rankedIds: the ranked site ids, best first.
 * A picked place that is the best option is not shown twice: the best option's card says it is
 * theirs. When nothing is left to compare it with, the next best place is.
 */
export const pickPlaces = (places: Place[], rankedIds: string[]): Picks => {
  const bestId = rankedIds[0];
  const best = bestId === undefined ? null : sitePlace(bestId);
  const isBest = (place: Place) => best !== null && placeToken(place) === placeToken(best);
  const yours = places.slice(0, MAX_PICKS);
  const bestIsYours = yours.some(isBest);
  const compared = yours.filter((place) => !isBest(place)).map((place): Compared => ({ place, role: 'yourChoice' }));
  if (compared.length > 0) return { best, bestIsYours, compared };

  const nextId = rankedIds[1];
  return { best, bestIsYours, compared: nextId === undefined ? [] : [{ place: sitePlace(nextId), role: 'nextBest' }] };
};

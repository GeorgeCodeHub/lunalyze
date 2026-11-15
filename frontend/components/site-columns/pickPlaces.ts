import { type Place, placeToken } from '../../scenario';

/** What a place is on the screen: the tool's best option, or the place it is compared with. */
export type Role = 'best' | 'yourChoice' | 'nextBest' | 'alternative';

export type Picks = {
  best: Place | null; // null until the places are ranked
  bestIsYours: boolean; // the tool's best option is the place chosen in setup
  alternative: Place | null;
  alternativeRole: Exclude<Role, 'best'>;
};

const sitePlace = (id: string): Place => ({ kind: 'site', id });

/**
 * The two places the screen compares.
 * places: [the place chosen in setup, a place chosen with the "compare with" dropdown, if any].
 * rankedIds: the ranked site ids, best first.
 * The alternative is the dropdown's place; without one, the setup place; and when the setup place is
 * itself the best option, the next best. The best option is never shown twice.
 */
export const pickPlaces = (places: Place[], rankedIds: string[]): Picks => {
  const [yours, chosen] = places;
  const bestId = rankedIds[0];
  const best = bestId === undefined ? null : sitePlace(bestId);
  const isBest = (place: Place | undefined) => place !== undefined && best !== null && placeToken(place) === placeToken(best);
  const bestIsYours = isBest(yours);

  if (chosen && !isBest(chosen)) {
    const alternativeRole = yours && placeToken(chosen) === placeToken(yours) ? 'yourChoice' : 'alternative';
    return { best, bestIsYours, alternative: chosen, alternativeRole };
  }
  if (yours && !bestIsYours) return { best, bestIsYours, alternative: yours, alternativeRole: 'yourChoice' };
  const nextId = rankedIds[1];
  return { best, bestIsYours, alternative: nextId === undefined ? null : sitePlace(nextId), alternativeRole: 'nextBest' };
};

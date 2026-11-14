import { type Place, validCoords } from '../../scenario';

// What the place field holds while the user fills it in: a known site picked from the list, or
// coordinates typed as "latitude, longitude". Only one is set at a time; `coords` keeps the raw
// text so half-typed values like "-85," survive.
export type PlaceDraft = { siteId: string; coords: string };

export const EMPTY_DRAFT: PlaceDraft = { siteId: '', coords: '' };

/** The draft for a shared scenario's first place: the place the mission wants to land. */
export const draftFrom = (place: Place | undefined): PlaceDraft => {
  if (!place) return EMPTY_DRAFT;
  if (place.kind === 'site') return { ...EMPTY_DRAFT, siteId: place.id };
  return { ...EMPTY_DRAFT, coords: `${place.lat}, ${place.lon}` };
};

/** "-85.3, 31.4" (comma, semicolon or space between; − or - for minus) as two numbers, or null. */
export const parseCoords = (text: string): { lat: number; lon: number } | null => {
  const parts = text.replaceAll('−', '-').trim().split(/[\s,;]+/);
  if (parts.length !== 2) return null;
  const [lat, lon] = parts.map(Number);
  return validCoords(lat, lon) ? { lat, lon } : null;
};

/** The place a draft stands for: null when empty, 'invalid' for coordinates that are not on the map. */
export const placeFrom = (draft: PlaceDraft): Place | 'invalid' | null => {
  if (draft.coords.trim() !== '') {
    const coords = parseCoords(draft.coords);
    return coords ? { kind: 'coords', ...coords } : 'invalid';
  }
  return draft.siteId ? { kind: 'site', id: draft.siteId } : null;
};

// The scenario lives in the URL so it can be shared:
// ?sites=point-a,@-85.2:31.4&date=2028-03-01T00:00Z&zoom=lunarDay&stay=7&terrain=off (zoom: always lunarDay, see ZOOM)
// A place is a site id from the list, or @latitude:longitude for coordinates the user typed in.
// sites, date, zoom and terrain are written the way backend/lib/scenarioUrl.ts reads them, so both
// read the same links. This module adds what that one cannot carry: typed coordinates and the stay.
import type { Zoom } from '../backend/lib/types';

// Mission length on the surface, in Earth days. The choices follow real landings: about a day
// (Apollo 11), 3 days (Apollo 15–17), a week (Artemis III plan), 14 days (robot landers that work
// through one Moon daytime) and 30 days (longer stays planned for later Artemis missions).
export type Stay = 1 | 3 | 7 | 14 | 30;

// lat: degrees north (-90..90). lon: degrees east (-180..180), as in backend/lib/types.ts.
export type Place = { kind: 'site'; id: string } | { kind: 'coords'; lat: number; lon: number };

// terrain false = hills ignored: a flat horizon everywhere (the flat-or-terrain switch).
export type Scenario = { places: Place[]; start: Date; zoom: Zoom; stay: Stay; terrain: boolean };

export const MAX_SITES = 3;
/** How many places the person picks. With the tool's best option that makes 3: as many as one data request draws. */
export const MAX_PICKS = 2;
/**
 * The time span the screen shows: always one Moon day (29.5 days). It holds every stay, up to 30 days,
 * and one full turn of light and dark. Links still carry it, for backend/lib/scenarioUrl.ts, whose own
 * default is a day; older links that ask for 24 hours or a year open on a Moon day too.
 */
export const ZOOM: Zoom = 'lunarDay';
export const STAYS: Stay[] = [1, 3, 7, 14, 30];
export const DEFAULT_STAY: Stay = 7;
export const DEFAULT_START = new Date('2028-03-01T00:00:00Z');

const asStay = (v: string | null): Stay | null => STAYS.find((s) => String(s) === v) ?? null;

// Typed coordinates are limited to the south pole region the live map shows, where the hills come from the LOLA
// DEMs. The copy in setup.where.coordsHint and coordsError gives the same numbers.
export const MAX_LAT = -78;

/** True for a latitude and longitude the tool can work out: from MAX_LAT to the south pole, any longitude. */
export const validCoords = (lat: number, lon: number) =>
  Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= MAX_LAT && Math.abs(lon) <= 180;

/** A place as written in the URL. Two places with the same token are the same place. */
export const placeToken = (p: Place) => (p.kind === 'site' ? encodeURIComponent(p.id) : `@${p.lat}:${p.lon}`);

/** A place from its URL token, or null when it is coordinates off the map. */
const readPlace = (token: string): Place | null => {
  if (!token.startsWith('@')) return { kind: 'site', id: token };
  const [lat, lon] = token.slice(1).split(':').map((v) => (v.trim() === '' ? NaN : Number(v)));
  return validCoords(lat, lon) ? { kind: 'coords', lat, lon } : null;
};

/** The id useScenario takes for a place: a site id, or @latitude:longitude for typed coordinates. */
export const placeId = (p: Place) => (p.kind === 'site' ? p.id : placeToken(p));

/** The ids of the listed sites among the places; typed coordinates have none. */
export const siteIdsOf = (places: (Place | null)[]): string[] => places.flatMap((place) => (place?.kind === 'site' ? [place.id] : []));

/** The places with repeats removed, the first of each kept. */
export const uniquePlaces = (places: Place[]): Place[] => {
  const seen = new Set<string>();
  return places.filter((p) => {
    const token = placeToken(p);
    if (seen.has(token)) return false;
    seen.add(token);
    return true;
  });
};

/** The scenario in a URL search string, or null when no place is picked yet (the setup step). */
export const readScenario = (search: string): Scenario | null => {
  const params = new URLSearchParams(search);
  const places = uniquePlaces(
    (params.get('sites') ?? '')
      .split(',')
      .filter(Boolean)
      .flatMap((token) => readPlace(token) ?? []),
  ).slice(0, MAX_SITES);
  if (places.length === 0) return null;

  const start = new Date(params.get('date') ?? params.get('t') ?? ''); // t: links made before the rename
  return {
    places,
    start: Number.isNaN(start.getTime()) ? DEFAULT_START : start,
    zoom: ZOOM,
    stay: asStay(params.get('stay')) ?? DEFAULT_STAY,
    terrain: params.get('terrain') !== 'off',
  };
};

/** The URL search string for a scenario. Commas stay readable in shared links. */
export const scenarioSearch = (s: Scenario): string =>
  '?' +
  [
    `sites=${s.places.map(placeToken).join(',')}`,
    `date=${s.start.toISOString().slice(0, 16)}Z`,
    `zoom=${s.zoom}`,
    `stay=${s.stay}`,
    ...(s.terrain ? [] : ['terrain=off']),
  ].join('&');

/**
 * Puts the scenario in the address bar. 'push' adds a browser-history entry (Back returns to the
 * setup step); 'replace' rewrites the current one. A browser can refuse the update (Safari allows
 * 100 in 30 seconds): then the address bar keeps the last link it accepted, and this returns false.
 * The caller still shows the scenario either way.
 */
export const writeScenarioUrl = (mode: 'push' | 'replace', scenario: Scenario): boolean => {
  const search = scenarioSearch(scenario);
  try {
    if (mode === 'push') window.history.pushState(null, '', search);
    else window.history.replaceState(window.history.state, '', search);
    return true;
  } catch {
    return false;
  }
};

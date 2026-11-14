// The scenario lives in the URL so it can be shared:
// ?sites=point-a,@-85.2:31.4&t=2028-03-01T00:00Z&zoom=lunarDay&stay=7
// A place is a site id from the list, or @latitude:longitude for coordinates the user typed in.
import type { Zoom } from '../backend/lib/types';

// Mission length on the surface, in Earth days. The choices follow real landings: about a day
// (Apollo 11), 3 days (Apollo 15–17), a week (Artemis III plan), 14 days (robot landers that work
// through one Moon daytime) and 30 days (longer stays planned for later Artemis missions).
export type Stay = 1 | 3 | 7 | 14 | 30;

// lat: degrees north (-90..90). lon: degrees east (-180..180), as in backend/lib/types.ts.
export type Place = { kind: 'site'; id: string } | { kind: 'coords'; lat: number; lon: number };

export type Scenario = { places: Place[]; start: Date; zoom: Zoom; stay: Stay };

export const MAX_SITES = 3;
export const ZOOMS: Zoom[] = ['day', 'lunarDay', 'year'];
export const STAYS: Stay[] = [1, 3, 7, 14, 30];
export const DEFAULT_STAY: Stay = 7;
export const DEFAULT_START = new Date('2028-03-01T00:00:00Z'); // the start of the test data

const isZoom = (v: string | null): v is Zoom => ZOOMS.includes(v as Zoom);
const asStay = (v: string | null): Stay | null => STAYS.find((s) => String(s) === v) ?? null;

/** True for a latitude and longitude on the Moon's map. */
export const validCoords = (lat: number, lon: number) =>
  Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;

const placeToken = (p: Place) => (p.kind === 'site' ? encodeURIComponent(p.id) : `@${p.lat}:${p.lon}`);

/** A place from its URL token, or null when it is coordinates off the map. */
const readPlace = (token: string): Place | null => {
  if (!token.startsWith('@')) return { kind: 'site', id: token };
  const [lat, lon] = token.slice(1).split(':').map((v) => (v.trim() === '' ? NaN : Number(v)));
  return validCoords(lat, lon) ? { kind: 'coords', lat, lon } : null;
};

/** The scenario in a URL search string, or null when no place is picked yet (the setup step). */
export const readScenario = (search: string): Scenario | null => {
  const params = new URLSearchParams(search);
  const places = (params.get('sites') ?? '')
    .split(',')
    .filter(Boolean)
    .flatMap((token) => readPlace(token) ?? [])
    .slice(0, MAX_SITES);
  if (places.length === 0) return null;

  const start = new Date(params.get('t') ?? '');
  const zoom = params.get('zoom');
  return {
    places,
    start: Number.isNaN(start.getTime()) ? DEFAULT_START : start,
    zoom: isZoom(zoom) ? zoom : 'lunarDay',
    stay: asStay(params.get('stay')) ?? DEFAULT_STAY,
  };
};

/** The URL search string for a scenario. Commas stay readable in shared links. */
export const scenarioSearch = (s: Scenario): string =>
  '?' +
  [
    `sites=${s.places.map(placeToken).join(',')}`,
    `t=${s.start.toISOString().slice(0, 16)}Z`,
    `zoom=${s.zoom}`,
    `stay=${s.stay}`,
  ].join('&');

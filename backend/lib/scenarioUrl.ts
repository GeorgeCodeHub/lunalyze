import type { Zoom } from './types';

export type Scenario = { sites: string[]; date: Date; zoom: Zoom; terrain: boolean };

// shortcut: ZOOMS repeats the Zoom union by hand; scenarioUrl.test.ts pins it to realView's ZOOM keys
export const ZOOMS: readonly Zoom[] = ['day', 'lunarDay', 'year'];
export const MAX_SITES = 3;
export const DEFAULT_SCENARIO: Scenario = { sites: [], date: new Date('2028-03-01T00:00Z'), zoom: 'day', terrain: true };

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z$/;

/** YYYY-MM-DDTHH:mmZ. d must be a valid Date. */
const minuteIso = (d: Date): string => `${d.toISOString().slice(0, 16)}Z`;

const parseSites = (raw: string | null, knownIds: readonly string[]): string[] => {
  if (!raw) return [];
  const ids = raw.split(',');
  const known = new Set(knownIds);
  const ok = ids.length <= MAX_SITES && new Set(ids).size === ids.length && ids.every((id) => known.has(id));
  return ok ? ids : [];
};

const parseDate = (raw: string | null): Date => {
  if (raw === null || !DATE_FORMAT.test(raw)) return new Date(DEFAULT_SCENARIO.date);
  const d = new Date(raw);
  // The round trip rejects Feb 30 and 24:00, which V8 rolls over to the next day.
  return Number.isNaN(d.getTime()) || minuteIso(d) !== raw ? new Date(DEFAULT_SCENARIO.date) : d;
};

/** search: location.search, with or without the leading '?'. Each invalid value falls back to its default. */
export const parseScenario = (search: string, knownIds: readonly string[]): Scenario => {
  const params = new URLSearchParams(search);
  const zoom = params.get('zoom');
  return {
    sites: parseSites(params.get('sites'), knownIds),
    date: parseDate(params.get('date')),
    zoom: ZOOMS.find((z) => z === zoom) ?? DEFAULT_SCENARIO.zoom,
    terrain: params.get('terrain') !== 'off',
  };
};

/** Query string without '?', '' when every value is the default. Order: sites, date, zoom, terrain.
 *  date is written to the minute: YYYY-MM-DDTHH:mmZ. s.date must be a valid Date. */
export const serializeScenario = (s: Scenario): string => {
  const parts: string[] = [];
  if (s.sites.length > 0) parts.push(`sites=${s.sites.map(encodeURIComponent).join(',')}`);
  const date = minuteIso(s.date);
  if (date !== minuteIso(DEFAULT_SCENARIO.date)) parts.push(`date=${date}`);
  if (s.zoom !== DEFAULT_SCENARIO.zoom) parts.push(`zoom=${s.zoom}`);
  if (!s.terrain) parts.push('terrain=off');
  return parts.join('&');
};

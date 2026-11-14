// The scenario lives in the URL so it can be shared: ?sites=point-a,malapert-m1&t=2028-03-01T00:00Z&zoom=lunarDay&stay=1
import type { Zoom } from '../backend/lib/types';

export type Stay = 0.5 | 1 | 2 | 3; // mission length on the surface, in Moon days

export type Scenario = { siteIds: string[]; start: Date; zoom: Zoom; stay: Stay };

export const MAX_SITES = 3;
export const ZOOMS: Zoom[] = ['day', 'lunarDay', 'year'];
export const STAYS: Stay[] = [0.5, 1, 2, 3];
export const DEFAULT_START = new Date('2028-03-01T00:00:00Z'); // the start of the test data

const isZoom = (v: string | null): v is Zoom => ZOOMS.includes(v as Zoom);
const asStay = (v: string | null): Stay | null => STAYS.find((s) => String(s) === v) ?? null;

/** The scenario in a URL search string, or null when no place is picked yet (the setup step). */
export const readScenario = (search: string): Scenario | null => {
  const params = new URLSearchParams(search);
  const siteIds = (params.get('sites') ?? '').split(',').filter(Boolean).slice(0, MAX_SITES);
  if (siteIds.length === 0) return null;

  const start = new Date(params.get('t') ?? '');
  const zoom = params.get('zoom');
  return {
    siteIds,
    start: Number.isNaN(start.getTime()) ? DEFAULT_START : start,
    zoom: isZoom(zoom) ? zoom : 'lunarDay',
    stay: asStay(params.get('stay')) ?? 1,
  };
};

/** The URL search string for a scenario. Commas stay readable in shared links. */
export const scenarioSearch = (s: Scenario): string =>
  '?' +
  [
    `sites=${s.siteIds.map(encodeURIComponent).join(',')}`,
    `t=${s.start.toISOString().slice(0, 16)}Z`,
    `zoom=${s.zoom}`,
    `stay=${s.stay}`,
  ].join('&');

import type { SiteView } from '../../../backend/lib/types';
import { type Place, placeToken } from '../../scenario';
import { PICKER_GROUPS } from '../site-picker/siteIds';

type Loaded = { views: SiteView[]; loading: boolean };

/** What one column shows for a picked place. key is the place's URL token, unique on the screen. */
export type ColumnModel =
  // view: the time span shown. stayView: the Moon day from landing (for the fit label). now: the playhead moment.
  | { kind: 'ready'; key: string; view: SiteView; stayView: SiteView; now: SiteView }
  | { kind: 'loading'; key: string; siteId: string }
  // Coordinates the user typed: useScenario has no results for them yet (design brief, request 6).
  | { kind: 'typed'; key: string; lat: number; lon: number }
  // An id that is not in the site list, from a hand-edited link.
  | { kind: 'unknown'; key: string; siteId: string }
  // A listed site with no view: no hills data for it yet, or its data failed to load.
  | { kind: 'missing'; key: string; siteId: string };

const KNOWN_IDS = new Set<string>(PICKER_GROUPS.flatMap(({ ids }) => ids));
const viewOf = (views: SiteView[], id: string) => views.find((v) => v.site.id === id);

/** One column per picked place, in the order picked. A place is ready once all three of its views have loaded. */
export const buildColumns = (places: Place[], shown: Loaded, stay: Loaded, now: Loaded): ColumnModel[] =>
  places.map((place): ColumnModel => {
    const key = placeToken(place);
    if (place.kind === 'coords') return { kind: 'typed', key, lat: place.lat, lon: place.lon };

    const siteId = place.id;
    const view = viewOf(shown.views, siteId);
    const stayView = viewOf(stay.views, siteId);
    const nowView = viewOf(now.views, siteId);
    if (view && stayView && nowView) return { kind: 'ready', key, view, stayView, now: nowView };
    if (!KNOWN_IDS.has(siteId)) return { kind: 'unknown', key, siteId };
    return { kind: shown.loading || stay.loading || now.loading ? 'loading' : 'missing', key, siteId };
  });

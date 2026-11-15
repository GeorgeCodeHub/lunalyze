import type { SiteView } from '../../../backend/lib/types';
import { type Place, placeId, placeToken } from '../../scenario';
import { PICKER_GROUPS } from '../site-picker/siteIds';

type Loaded = { views: SiteView[]; loading: boolean };

/** What one column shows for a picked place. key is the place's URL token, unique on the screen. */
export type ColumnModel =
  // view: the time span shown. stayView: the Moon day from landing (for the fit label). now: the playhead moment.
  | { kind: 'ready'; key: string; view: SiteView; stayView: SiteView; now: SiteView }
  | { kind: 'loading'; key: string; place: Place }
  // An id that is not in the site list, from a hand-edited link.
  | { kind: 'unknown'; key: string; siteId: string }
  // A listed site or typed coordinates with no view: no hills data for it yet, or its data failed to load.
  | { kind: 'missing'; key: string; place: Place };

const KNOWN_IDS = new Set<string>(PICKER_GROUPS.flatMap(({ ids }) => ids));
const viewOf = (views: SiteView[], id: string) => views.find((v) => v.site.id === id);

/** One column per picked place, in the order picked. A place is ready once all three of its views have loaded. */
export const buildColumns = (places: Place[], shown: Loaded, stay: Loaded, now: Loaded): ColumnModel[] =>
  places.map((place): ColumnModel => {
    const key = placeToken(place);
    const id = placeId(place);
    const view = viewOf(shown.views, id);
    const stayView = viewOf(stay.views, id);
    const nowView = viewOf(now.views, id);
    if (view && stayView && nowView) return { kind: 'ready', key, view, stayView, now: nowView };
    if (place.kind === 'site' && !KNOWN_IDS.has(place.id)) return { kind: 'unknown', key, siteId: place.id };
    return { kind: shown.loading || stay.loading || now.loading ? 'loading' : 'missing', key, place };
  });

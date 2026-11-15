import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { BANDS, computeMask, fetchTile, typedSite } from './horizon';
import { type HorizonMask, realView } from './realView';
import type { Site, SiteView, Zoom } from './types';

const isJson = (r: Response) => r.headers.get('content-type')?.includes('json') ?? false;

const fetchJson = async <T>(path: string): Promise<T> => {
  const r = await fetch(import.meta.env.BASE_URL + path);
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  if (!isJson(r)) throw new Error(`${path}: not JSON`);
  return r.json();
};

// A missing mask file means "no data for this site yet" (null); any other failure throws.
// An SPA host answers a missing file with 200 and index.html, so a non-JSON answer is missing too.
const fetchMask = async (id: string): Promise<HorizonMask | null> => {
  const path = `data/masks/${id}.json`;
  const r = await fetch(import.meta.env.BASE_URL + path);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return isJson(r) ? r.json() : null;
};

/**
 * Everything the Compare screen shows for the given sites, for the window that starts at t.
 * A site id is an id from sites.json, or `@lat:lon` for typed coordinates: its horizon is computed from the
 * LOLA DEM tiles, the way horizon_masks.py makes the listed sites' masks. Off the DEMs it gets a flat horizon.
 * opts.terrain = false uses a flat horizon (the flat-or-terrain switch).
 *
 * The data is real: Sun and Earth positions against the horizon masks.
 * A site with terrainModeled false gets a flat 0° horizon and stays in `views`. With terrain off every site
 * does: no mask is fetched, so a missing or failing mask file changes nothing. With terrain on, an id that is
 * not in sites.json (nothing is fetched for it) and a modeled site with no mask file yet are left out of `views`. Any other load failure, for the site list, a mask or the computation, is returned as
 * `error`; the views that did load are still returned.
 * Each view is computed in its query function, cached per site, t, zoom and terrain. A failed view is not retried.
 * When t changes and zoom and terrain do not, each site already shown keeps its view from the last t that
 * fully loaded while the new one loads (`loading` stays true), so the screen does not blink during playback.
 */
export const useScenario = (
  siteIds: string[],
  t: Date,
  zoom: Zoom,
  opts: { terrain: boolean } = { terrain: true },
): { views: SiteView[]; loading: boolean; error: Error | null } => {
  const queryClient = useQueryClient();
  // The last scenario that fully loaded. useQueries gives placeholderData no previous data, so it is remembered here.
  const [shown, setShown] = useState({ t: t.getTime(), zoom, terrain: opts.terrain, ids: siteIds });
  const shownIds = new Set(shown.ids);
  const results = useQueries({
    queries: siteIds.map((id) => ({
      queryKey: ['view', id, t.getTime(), zoom, opts.terrain],
      staleTime: 'static' as const, // a pure function of the key: never recompute on focus or mount
      retry: false, // a failed load shows as `error` at once
      placeholderData: () =>
        shownIds.has(id) && shown.zoom === zoom && shown.terrain === opts.terrain
          ? queryClient.getQueryData<SiteView | null>(['view', id, shown.t, zoom, opts.terrain])
          : undefined,
      queryFn: async (): Promise<SiteView | null> => {
        const site = id.startsWith('@')
          ? typedSite(id)
          : (
              await queryClient.query({
                queryKey: ['data', 'sites'],
                queryFn: () => fetchJson<Site[]>('data/sites.json'),
                staleTime: 'static',
                gcTime: Infinity, // read only via query(), which never resets the 5-min clean-up timer
              })
            ).find((s) => s.id === id);
        if (!site) return null;
        if (!site.terrainModeled || !opts.terrain) return realView(site, null, t, zoom, opts.terrain);
        const mask = await queryClient.query({
          queryKey: ['data', 'masks', id],
          queryFn: () => (site.kind === 'typed' ? computeMask(id, site.lat, site.lon, BANDS, fetchTile) : fetchMask(id)),
          staleTime: 'static',
          gcTime: Infinity,
        });
        return mask ? realView(site, mask, t, zoom, opts.terrain) : null;
      },
    })),
  });

  const loading = results.some((q) => q.isPending || q.isPlaceholderData);
  const error = results.find((q) => q.error)?.error ?? null;
  const views = results.flatMap((q) => (q.data ? [q.data] : []));

  // Storing information from previous renders: https://react.dev/reference/react/useState#storing-information-from-previous-renders
  if (
    !loading &&
    (shown.t !== t.getTime() || shown.zoom !== zoom || shown.terrain !== opts.terrain || shown.ids.join() !== siteIds.join())
  ) {
    setShown({ t: t.getTime(), zoom, terrain: opts.terrain, ids: siteIds });
  }

  return { views, loading, error };
};

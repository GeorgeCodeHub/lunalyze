import { useQueries, useQueryClient } from '@tanstack/react-query';
import { type HorizonMask, realView } from './realView';
import type { Site, SiteView, Zoom } from './types';

const fetchJson = async <T>(path: string): Promise<T> => {
  const r = await fetch(import.meta.env.BASE_URL + path);
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return r.json();
};

// A missing mask file means "no data for this site yet" (null); any other failure throws.
const fetchMask = async (id: string): Promise<HorizonMask | null> => {
  const path = `data/masks/${id}.json`;
  const r = await fetch(import.meta.env.BASE_URL + path);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return r.json();
};

/**
 * Everything the Compare screen shows for the given sites, for the window that starts at t.
 * opts.terrain = false uses a flat horizon (the flat-or-terrain switch).
 *
 * The data is real (view.fixture === false): Sun and Earth positions against the horizon masks.
 * A site with terrainModeled false gets a flat 0° horizon and stays in `views`. An id that is not in
 * sites.json (nothing is fetched for it) and a modeled site with no mask file yet are left out of
 * `views`. Any other load failure, for the site list, a mask or the computation, is returned as
 * `error`; the views that did load are still returned.
 * Each view is computed in its query function, cached per site, t, zoom and terrain.
 */
export const useScenario = (
  siteIds: string[],
  t: Date,
  zoom: Zoom,
  opts: { terrain: boolean } = { terrain: true },
): { views: SiteView[]; loading: boolean; error: Error | null } => {
  const queryClient = useQueryClient();
  const results = useQueries({
    queries: siteIds.map((id) => ({
      queryKey: ['view', id, t.getTime(), zoom, opts.terrain],
      staleTime: 'static' as const, // a pure function of the key: never recompute on focus or mount
      queryFn: async (): Promise<SiteView | null> => {
        const sites = await queryClient.query({
          queryKey: ['data', 'sites'],
          queryFn: () => fetchJson<Site[]>('data/sites.json'),
          staleTime: 'static',
        });
        const site = sites.find((s) => s.id === id);
        if (!site) return null;
        if (!site.terrainModeled) return realView(site, null, t, zoom, opts.terrain);
        const mask = await queryClient.query({
          queryKey: ['data', 'masks', id],
          queryFn: () => fetchMask(id),
          staleTime: 'static',
        });
        return mask ? realView(site, mask, t, zoom, opts.terrain) : null;
      },
    })),
  });

  const loading = results.some((q) => q.isPending);
  const error = results.find((q) => q.error)?.error ?? null;
  const views = results.flatMap((q) => (q.data ? [q.data] : []));

  return { views, loading, error };
};

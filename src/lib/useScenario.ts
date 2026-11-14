import { useQueries, useQuery } from '@tanstack/react-query';
import { type FixtureFile, viewAt } from './fixtureView';
import type { Site, SiteView, Zoom } from './types';

const fetchJson = async <T>(path: string): Promise<T> => {
  const r = await fetch(import.meta.env.BASE_URL + path);
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return r.json();
};

/**
 * Everything the Compare screen shows for the given sites, for the window that starts at t.
 * opts.terrain = false uses a flat horizon (the flat-or-terrain switch).
 *
 * Today this serves fixtures (view.fixture === true: fake terrain, never show its numbers as real).
 * G6/G7 swap in real masks behind this same signature, so components do not change.
 * A site with no data yet is left out of `views`. `error` is set when the site list fails to load.
 */
export const useScenario = (
  siteIds: string[],
  t: Date,
  zoom: Zoom,
  opts: { terrain: boolean } = { terrain: true },
): { views: SiteView[]; loading: boolean; error: Error | null } => {
  const sites = useQuery({ queryKey: ['data', 'sites'], queryFn: () => fetchJson<Site[]>('data/sites.json') });
  const fixtures = useQueries({
    queries: siteIds.map((id) => ({
      queryKey: ['data', 'fixtures', id],
      queryFn: () => fetchJson<FixtureFile>(`data/fixtures/${id}.json`),
      retry: false, // a missing fixture means "no data yet", not a network blip
    })),
  });

  const loading = sites.isPending || fixtures.some((q) => q.isPending);
  const views = fixtures.flatMap(({ data: fx }) => {
    const site = fx && sites.data?.find((s) => s.id === fx.siteId);
    return fx && site ? [viewAt(fx, site, t, zoom, opts.terrain)] : [];
  });

  return { views, loading, error: sites.error };
};

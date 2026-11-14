import { useEffect, useMemo, useState } from 'react';
import { type FixtureFile, viewAt } from './fixtureView';
import type { Site, SiteView, Zoom } from './types';

const cache = new Map<string, Promise<unknown>>();
function getJson<T>(path: string): Promise<T> {
  let p = cache.get(path);
  if (!p) {
    p = fetch(import.meta.env.BASE_URL + path).then((r) => {
      if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
      return r.json();
    });
    cache.set(path, p);
  }
  return p as Promise<T>;
}

type Loaded = { key: string; sites: Site[]; fixtures: (FixtureFile | null)[] };

/**
 * Everything the Compare screen shows for the given sites, for the window that starts at t.
 * opts.terrain = false uses a flat horizon (the flat-or-terrain switch).
 *
 * Today this serves fixtures (view.fixture === true: fake terrain, never show its numbers as real).
 * G6/G7 swap in real masks behind this same signature, so components do not change.
 * A site with no data yet is left out of `views`.
 */
export function useScenario(
  siteIds: string[],
  t: Date,
  zoom: Zoom,
  opts: { terrain: boolean } = { terrain: true },
): { views: SiteView[]; loading: boolean } {
  const key = siteIds.join(',');
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    let live = true;
    const ids = key ? key.split(',') : [];
    Promise.all([
      getJson<Site[]>('data/sites.json'),
      Promise.all(ids.map((id) => getJson<FixtureFile>(`data/fixtures/${id}.json`).catch(() => null))),
    ])
      .then(([sites, fixtures]) => live && setLoaded({ key, sites, fixtures }))
      .catch((err) => {
        console.error(err);
        if (live) setLoaded({ key, sites: [], fixtures: [] });
      });
    return () => {
      live = false;
    };
  }, [key]);

  const ms = t.getTime();
  const data = loaded?.key === key ? loaded : null;
  const views = useMemo(() => {
    if (!data) return [];
    return data.fixtures.flatMap((fx) => {
      const site = fx && data.sites.find((s) => s.id === fx.siteId);
      return fx && site ? [viewAt(fx, site, new Date(ms), zoom, opts.terrain)] : [];
    });
  }, [data, ms, zoom, opts.terrain]);

  return { views, loading: !data };
}

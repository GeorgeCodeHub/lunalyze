// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, expect, test, vi } from 'vitest';
import { useScenario } from './useScenario';

// Serves backend/public/ from disk and records requested paths. Paths in `failing` answer 500; other missing files are 404.
const requested: string[] = [];
const failing = new Set<string>();
beforeEach(() => {
  requested.length = 0;
  failing.clear();
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal('fetch', async (url: string) => {
    const path = new URL(url, 'http://localhost').pathname;
    requested.push(path);
    if (failing.has(path)) return new Response('', { status: 500 });
    try {
      return new Response(readFileSync('backend/public' + path, 'utf8'));
    } catch {
      return new Response('', { status: 404 });
    }
  });
});

const T = new Date('2028-03-05T06:30:00Z');

/** Renders useScenario and waits until it stops loading. `at` re-renders with the current opts at the given t and waits. */
const renderScenario = async (siteIds: string[], opts: { terrain: boolean }, t = T) => {
  let got: ReturnType<typeof useScenario> = { views: [], loading: true, error: null };
  const Probe = () => {
    got = useScenario(siteIds, t, 'day', { ...opts });
    return null;
  };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  const root = createRoot(document.createElement('div'));
  const rerender = () =>
    act(() =>
      root.render(
        <QueryClientProvider client={client}>
          <Probe />
        </QueryClientProvider>,
      ),
    );
  const settle = () =>
    vi.waitFor(async () => {
      await act(async () => {}); // let the fetches land and React re-render
      expect(got.loading).toBe(false);
    });
  rerender();
  const first = got;
  await settle();
  return {
    first,
    get: () => got,
    at: async (next: Date) => {
      t = next;
      rerender();
      await settle();
    },
  };
};

test('useScenario returns real views, one per site, in the order asked', async () => {
  const opts = { terrain: true };
  const r = await renderScenario(['apollo-11', 'haworth', 'point-a'], opts);
  expect(r.first).toEqual({ views: [], loading: true, error: null });

  const got = r.get();
  expect(got.views.map((v) => v.site.id)).toEqual(['apollo-11', 'haworth', 'point-a']);
  expect(got.views.every((v) => !v.fixture)).toBe(true);
  expect(got.error).toBeNull();
  expect(got.views[0].sky.terrain).toEqual([[0, 0], [360, 0]]); // terrainModeled false: flat, stays in views
  expect(got.views[2].sky.terrain).toHaveLength(721);

  opts.terrain = false;
  await r.at(T);
  expect(r.get().views[2].sky.terrain).toEqual([[0, 0], [360, 0]]);
});

test('horizonIncomplete is true for im-1 and false for point-a', async () => {
  expect((await renderScenario(['im-1'], { terrain: true })).get().views[0].horizonIncomplete).toBe(true);
  expect((await renderScenario(['point-a'], { terrain: true })).get().views[0].horizonIncomplete).toBe(false);
});

test('no sites picked gives no views, no error, and stops loading', async () => {
  expect((await renderScenario([], { terrain: true })).get()).toEqual({ views: [], loading: false, error: null });
});

test('an id that is not in sites.json is left out and nothing is fetched for it', async () => {
  const got = (await renderScenario(['nosuch', 'point-a'], { terrain: true })).get();
  expect(got.views.map((v) => v.site.id)).toEqual(['point-a']);
  expect(got.error).toBeNull();
  expect(requested).not.toContain('/data/masks/nosuch.json');
});

test('a mask that fails to load is reported as an error, and the other sites still load', async () => {
  failing.add('/data/masks/point-b.json');
  const got = (await renderScenario(['point-b', 'point-a'], { terrain: true })).get();
  expect(got.error?.message).toBe('data/masks/point-b.json: HTTP 500');
  expect(got.views.map((v) => v.site.id)).toEqual(['point-a']);
});

test('files are fetched once, even when t changes', async () => {
  const r = await renderScenario(['point-a'], { terrain: true });
  const sun = r.get().views[0].sky.sun;
  await r.at(new Date(T.getTime() + 3600e3));
  expect(r.get().views[0].sky.sun).not.toEqual(sun);
  expect(requested.filter((p) => p === '/data/masks/point-a.json')).toHaveLength(1);
  expect(requested.filter((p) => p === '/data/sites.json')).toHaveLength(1);
});

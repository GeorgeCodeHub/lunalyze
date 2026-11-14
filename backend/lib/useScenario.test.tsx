// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, expect, test, vi } from 'vitest';
import type { Zoom } from './types';
import { useScenario } from './useScenario';

// Serves backend/public/ from disk and records requested paths. Paths in `failing` answer 500; other missing files are 404.
const requested: string[] = [];
const failing = new Set<string>();
const htmlFallback = new Set<string>(); // paths answered like an SPA host: 200 with index.html
const missing = new Set<string>(); // paths answered 404 even though the file exists
beforeEach(() => {
  requested.length = 0;
  failing.clear();
  htmlFallback.clear();
  missing.clear();
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal('fetch', async (url: string) => {
    const path = new URL(url, 'http://localhost').pathname;
    requested.push(path);
    if (failing.has(path)) return new Response('', { status: 500 });
    if (missing.has(path)) return new Response('', { status: 404 });
    if (htmlFallback.has(path)) return new Response('<!doctype html>', { headers: { 'content-type': 'text/html' } });
    try {
      return new Response(readFileSync('backend/public' + path, 'utf8'), {
        headers: { 'content-type': 'application/json' },
      });
    } catch {
      return new Response('', { status: 404 });
    }
  });
});

const T = new Date('2028-03-05T06:30:00Z');

/**
 * Renders useScenario and waits until it stops loading. `at` re-renders with the current opts at the given t and waits.
 * `change` re-renders with new arguments and does not wait. `defaults` are the client's query defaults.
 */
const renderScenario = async (
  siteIds: string[],
  opts: { terrain: boolean },
  t = T,
  defaults: { retry?: false } = { retry: false },
) => {
  let got: ReturnType<typeof useScenario> = { views: [], loading: true, error: null };
  let zoom: Zoom = 'day';
  let renders = 0;
  const Probe = () => {
    renders++;
    got = useScenario(siteIds, t, zoom, { ...opts });
    return null;
  };
  const client = new QueryClient({ defaultOptions: { queries: { ...defaults, staleTime: Infinity } } });
  let root = createRoot(document.createElement('div'));
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
    renders: () => renders,
    unmount: () => act(() => root.unmount()),
    remount: () => {
      root = createRoot(document.createElement('div'));
      return rerender();
    },
    at: async (next: Date) => {
      t = next;
      rerender();
      await settle();
    },
    change: (next: { t?: Date; zoom?: Zoom; terrain?: boolean; siteIds?: string[] }) => {
      t = next.t ?? t;
      zoom = next.zoom ?? zoom;
      opts = { terrain: next.terrain ?? opts.terrain };
      siteIds = next.siteIds ?? siteIds;
      rerender();
    },
    settle,
  };
};

test('useScenario returns real views, one per site, in the order asked', async () => {
  const opts = { terrain: true };
  const r = await renderScenario(['apollo-11', 'haworth', 'point-a'], opts);
  expect(r.first).toEqual({ views: [], loading: true, error: null });

  const got = r.get();
  expect(got.views.map((v) => v.site.id)).toEqual(['apollo-11', 'haworth', 'point-a']);
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

test('a modeled site with no mask file yet is left out, with no error', async () => {
  missing.add('/data/masks/point-b.json');
  const got = (await renderScenario(['point-b', 'point-a'], { terrain: true })).get();
  expect(got.error).toBeNull();
  expect(got.views.map((v) => v.site.id)).toEqual(['point-a']);
});

test('a mask answered with an HTML page counts as missing: the site is left out, with no error', async () => {
  htmlFallback.add('/data/masks/point-b.json');
  const got = (await renderScenario(['point-b', 'point-a'], { terrain: true })).get();
  expect(got.error).toBeNull();
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

test('files are still fetched once after the 5-minute cache clean-up has passed', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  try {
    const r = await renderScenario(['point-a'], { terrain: true });
    await act(async () => {
      vi.advanceTimersByTime(5 * 60e3 + 1000);
    });
    await r.at(new Date(T.getTime() + 3600e3));
    expect(r.get().views).toHaveLength(1);
    expect(requested.filter((p) => p === '/data/masks/point-a.json')).toHaveLength(1);
    expect(requested.filter((p) => p === '/data/sites.json')).toHaveLength(1);
  } finally {
    vi.useRealTimers();
  }
});

test('a failing view is not retried: error at once, one request, the other site loads', async () => {
  failing.add('/data/masks/point-b.json');
  const got = (await renderScenario(['point-b', 'point-a'], { terrain: true }, T, {})).get(); // the app's client defaults
  expect(got.error?.message).toBe('data/masks/point-b.json: HTTP 500');
  expect(got.views.map((v) => v.site.id)).toEqual(['point-a']);
  expect(requested.filter((p) => p === '/data/masks/point-b.json')).toHaveLength(1);
});

test('when only t changes the previous view stays until the new one loads', async () => {
  const r = await renderScenario(['point-a'], { terrain: true });
  const before = r.get().views[0];
  r.change({ t: new Date(T.getTime() + 3600e3) });
  expect(r.get().loading).toBe(true);
  expect(r.get().views.map((v) => v.site.id)).toEqual(['point-a']);
  expect(r.get().views[0]).toBe(before);
  await r.settle();
  expect(r.get().loading).toBe(false);
  expect(r.get().views[0].sky.sun).not.toEqual(before.sky.sun);
});

test('a new zoom, terrain or site list does not keep stale views', async () => {
  const next = new Date(T.getTime() + 3600e3);

  const zoom = await renderScenario(['point-a'], { terrain: true });
  zoom.change({ t: next, zoom: 'lunarDay' });
  expect(zoom.get().views).toEqual([]);
  expect(zoom.get().loading).toBe(true);

  const terrain = await renderScenario(['point-a'], { terrain: true });
  terrain.change({ t: next, terrain: false });
  expect(terrain.get().views).toEqual([]);
  expect(terrain.get().loading).toBe(true);

  const sites = await renderScenario(['point-a'], { terrain: true });
  sites.change({ t: next, siteIds: ['point-a', 'haworth'] });
  expect(sites.get().views.map((v) => v.site.id)).toEqual(['point-a']);
  expect(sites.get().loading).toBe(true);
});

test('playback outrunning compute keeps the last fully loaded view, never blank', async () => {
  const r = await renderScenario(['point-a'], { terrain: true });
  const before = r.get().views[0];
  for (const h of [1, 2, 3]) {
    r.change({ t: new Date(T.getTime() + h * 3600e3) });
    expect(r.get().views[0]).toBe(before);
    expect(r.get().loading).toBe(true);
  }
  await r.settle();
  expect(r.get().views).toHaveLength(1);
  expect(r.get().views[0]).not.toBe(before);
});

test('adding a site while t moves: the old site keeps its view, the new one joins after loading', async () => {
  const r = await renderScenario(['point-a'], { terrain: true });
  const before = r.get().views[0];
  r.change({ t: new Date(T.getTime() + 3600e3), siteIds: ['point-a', 'haworth'] });
  expect(r.get().views[0]).toBe(before);
  await r.settle();
  expect(r.get().views.map((v) => v.site.id)).toEqual(['point-a', 'haworth']);
});

test('a site that fails on a new t is reported while the other site still has its view', async () => {
  failing.add('/data/masks/point-b.json');
  const r = await renderScenario(['point-a'], { terrain: true });
  r.change({ t: new Date(T.getTime() + 3600e3), siteIds: ['point-a', 'point-b'] });
  await r.settle();
  expect(r.get().error?.message).toBe('data/masks/point-b.json: HTTP 500');
  expect(r.get().views.map((v) => v.site.id)).toEqual(['point-a']);
  expect(requested.filter((p) => p === '/data/masks/point-b.json')).toHaveLength(1);
});

test('the render-time setShown settles: no render loop after loading, with sites, none, or a changed scenario', async () => {
  const r = await renderScenario(['point-a'], { terrain: true });
  r.change({ t: new Date(T.getTime() + 3600e3), zoom: 'lunarDay', terrain: false, siteIds: ['haworth'] });
  await r.settle();
  const n = r.renders();
  await act(async () => {});
  await act(async () => {});
  expect(r.renders()).toBe(n);
  expect(n).toBeLessThan(30);

  const empty = await renderScenario([], { terrain: true });
  const m = empty.renders();
  await act(async () => {});
  expect(empty.renders()).toBe(m);
  expect(m).toBeLessThan(5);
});

test('unmount and remount: a fresh mount shows the cached view without a blank frame', async () => {
  const r = await renderScenario(['point-a'], { terrain: true });
  await r.unmount();
  await r.remount();
  await r.settle();
  expect(r.get().views.map((v) => v.site.id)).toEqual(['point-a']);
});

test('returning to a zoom, terrain or site that was cached earlier does not show that old view as a placeholder', async () => {
  const next = new Date(T.getTime() + 3600e3);

  const zoom = await renderScenario(['point-a'], { terrain: true });
  zoom.change({ zoom: 'lunarDay' });
  await zoom.settle();
  zoom.change({ t: next, zoom: 'day' }); // ['view', id, T, 'day', ...] is cached, but is not the last shown scenario
  expect(zoom.get().views).toEqual([]);

  const terrain = await renderScenario(['point-a'], { terrain: true });
  terrain.change({ terrain: false });
  await terrain.settle();
  terrain.change({ t: next, terrain: true });
  expect(terrain.get().views).toEqual([]);

  const sites = await renderScenario(['point-a', 'haworth'], { terrain: true });
  sites.change({ siteIds: ['point-a'] });
  await sites.settle();
  sites.change({ t: next, siteIds: ['point-a', 'haworth'] });
  expect(sites.get().views.map((v) => v.site.id)).toEqual(['point-a']);
});

test('after a new t has loaded, the next t keeps that view, not the one before it', async () => {
  const r = await renderScenario(['point-a'], { terrain: true });
  await r.at(new Date(T.getTime() + 3600e3));
  const second = r.get().views[0];
  r.change({ t: new Date(T.getTime() + 7200e3) });
  expect(r.get().views[0]).toBe(second);
});

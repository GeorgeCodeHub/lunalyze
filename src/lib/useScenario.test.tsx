// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, expect, test, vi } from 'vitest';
import { useScenario } from './useScenario';

// Serves public/ from disk. "broken" fails with a server error; other missing files are 404.
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal('fetch', async (url: string) => {
    const path = new URL(url, 'http://localhost').pathname;
    if (path.includes('broken')) return new Response('', { status: 500 });
    try {
      return new Response(readFileSync('public' + path, 'utf8'));
    } catch {
      return new Response('', { status: 404 });
    }
  });
});

/** Renders useScenario and waits until it stops loading. `rerender` re-renders with the current opts. */
const renderScenario = async (siteIds: string[], opts: { terrain: boolean }) => {
  let got: ReturnType<typeof useScenario> = { views: [], loading: true, error: null };
  const Probe = () => {
    got = useScenario(siteIds, new Date('2028-03-05T06:30:00Z'), 'day', opts);
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
  rerender();
  const first = got;
  await vi.waitFor(async () => {
    await act(async () => {}); // let the fetches land and React re-render
    expect(got.loading).toBe(false);
  });
  return { first, get: () => got, rerender };
};

test('useScenario loads fixtures and returns one view per site, in the order asked', async () => {
  const opts = { terrain: true };
  const r = await renderScenario(['apollo-11', 'haworth', 'point-a'], opts);
  expect(r.first).toEqual({ views: [], loading: true, error: null });

  const got = r.get();
  expect(got.views.map((v) => v.site.id)).toEqual(['apollo-11', 'point-a']); // haworth has no fixture yet
  expect(got.views.every((v) => v.fixture)).toBe(true);
  expect(got.error).toBeNull(); // a missing file is "no data yet", not an error
  expect(got.views[0].site.group).toBe('Apollo');
  expect(got.views[1].sky.terrain).toHaveLength(721);

  opts.terrain = false;
  r.rerender();
  expect(r.get().views[1].sky.terrain).toEqual([[0, 0], [360, 0]]);
});

test('no sites picked gives no views, no error, and stops loading', async () => {
  expect((await renderScenario([], { terrain: true })).get()).toEqual({ views: [], loading: false, error: null });
});

test('a site whose data fails to load is reported as an error, and the other sites still load', async () => {
  const got = (await renderScenario(['broken', 'point-a'], { terrain: true })).get();
  expect(got.error?.message).toBe('data/fixtures/broken.json: HTTP 500');
  expect(got.views.map((v) => v.site.id)).toEqual(['point-a']);
});

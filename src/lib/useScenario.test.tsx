// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, test, vi } from 'vitest';
import { useScenario } from './useScenario';

test('useScenario loads fixtures and returns one view per site, in the order asked', async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal('fetch', async (url: string) => {
    try {
      return new Response(readFileSync('public' + new URL(url, 'http://localhost').pathname, 'utf8'));
    } catch {
      return new Response('', { status: 404 });
    }
  });

  let got: ReturnType<typeof useScenario> = { views: [], loading: true, error: null };
  let terrain = true;
  const Probe = () => {
    got = useScenario(['apollo-11', 'haworth', 'point-a'], new Date('2028-03-05T06:30:00Z'), 'day', { terrain });
    return null;
  };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  const root = createRoot(document.createElement('div'));
  const render = () =>
    root.render(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    );
  act(render);
  expect(got).toEqual({ views: [], loading: true, error: null });

  await vi.waitFor(async () => {
    await act(async () => {}); // let the fetches land and React re-render
    expect(got.loading).toBe(false);
  });
  expect(got.views.map((v) => v.site.id)).toEqual(['apollo-11', 'point-a']); // haworth has no fixture yet
  expect(got.views.every((v) => v.fixture)).toBe(true);
  expect(got.error).toBeNull();
  expect(got.views[0].site.group).toBe('Apollo');
  expect(got.views[1].sky.terrain).toHaveLength(721);

  terrain = false;
  act(render);
  expect(got.views[1].sky.terrain).toEqual([[0, 0], [360, 0]]);
});

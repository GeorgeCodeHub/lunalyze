// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import '../../i18n';
import type { Body, SiteView } from '../../../backend/lib/types';
import { testIds } from '../../test-ids';
import Terrain3D from './Terrain3D';

// The canvas draws nothing here (no WebGL): it is a div that shows whether the scene mounted it.
vi.mock('@react-three/fiber', async () => {
  const { createElement } = await import('react');
  const { testIds: ids } = await import('../../test-ids');
  return { Canvas: () => createElement('div', { 'data-testid': ids.terrain3d.canvas }) };
});
vi.mock('@react-three/drei', () => ({ OrbitControls: () => null, Html: () => null }));

const requested: string[] = [];
const failing = new Set<string>();
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  requested.length = 0;
  failing.clear();
  vi.stubGlobal('fetch', async (url: string) => {
    const path = new URL(url, 'http://localhost').pathname;
    requested.push(path);
    if (failing.has(path)) return new Response('', { status: 500 });
    try {
      return new Response(new Uint8Array(readFileSync('backend/public' + path)), {
        headers: { 'content-type': path.endsWith('.json') ? 'application/json' : 'application/octet-stream' },
      });
    } catch {
      return new Response('', { status: 404 });
    }
  });
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const all = (id: string) => [...container.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`)];
const body = (hidden: boolean): Body => ({ az: 10, el: hidden ? -1 : 5, hidden });

type Opts = { terrainModeled?: boolean; precision?: 'exact' | 'proxy'; horizonIncomplete?: boolean; sun?: Body; earth?: Body };
// The 3D view reads only site, horizonIncomplete and now.sky.sun / earth; the rest of a SiteView is filled with zeros.
const place = (id: string, o: Opts = {}) => {
  const view = {
    site: { id, lat: -85, lon: 10, kind: 'landed', precision: o.precision ?? 'exact', terrainModeled: o.terrainModeled ?? true, group: 'CLPS', source: '' },
    horizonIncomplete: o.horizonIncomplete ?? false,
    sky: { terrain: [], sun: o.sun ?? body(false), earth: o.earth ?? body(false), sunPath: [], earthPath: [], athensSunPath: [] },
  } as unknown as SiteView;
  return { view, now: view };
};

const render = async (places: ReturnType<typeof place>[]) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  const ui = (p: typeof places) => (
    <QueryClientProvider client={client}>
      <Terrain3D places={p} />
    </QueryClientProvider>
  );
  act(() => root.render(ui(places)));
  return { rerender: (p: typeof places) => act(() => root.render(ui(p))) };
};
const settle = () =>
  vi.waitFor(async () => {
    await act(async () => {});
    expect(all(testIds.terrain3d.scene).filter((s) => s.dataset.status === 'loading')).toEqual([]);
  });

test('a modeled place loads into a scene with a canvas; a place without terrain gets only a caveat and no fetch', async () => {
  await render([place('point-a'), place('apollo-11', { terrainModeled: false })]);

  expect(all(testIds.terrain3d.root)).toHaveLength(1);
  const [scene] = all(testIds.terrain3d.scene);
  expect(all(testIds.terrain3d.scene)).toHaveLength(1);
  expect(scene.dataset.siteId).toBe('point-a');
  expect(scene.dataset.status).toBe('loading');
  expect(scene.getAttribute('aria-busy')).toBe('true');
  expect(scene.getAttribute('role')).toBeNull();
  expect(all(testIds.terrain3d.canvas)).toHaveLength(0);

  await settle();

  expect(scene.dataset.status).toBe('ready');
  expect(scene.getAttribute('aria-busy')).toBeNull();
  expect(scene.getAttribute('role')).toBe('img');
  expect(scene.getAttribute('aria-label')).toBeTruthy();
  expect(all(testIds.terrain3d.canvas)).toHaveLength(1);
  expect(scene.contains(all(testIds.terrain3d.canvas)[0])).toBe(true);
  expect(all(testIds.terrain3d.caveat).map((c) => c.dataset.siteId)).toEqual(['apollo-11']);
  expect(requested.filter((p) => p.includes('terrain/apollo-11'))).toEqual([]);
  expect(requested.sort()).toEqual(['/data/terrain/point-a.bin', '/data/terrain/point-a.json']);
});

test('a failed terrain fetch gives the scene the error status and no canvas', async () => {
  failing.add('/data/terrain/point-a.bin');
  await render([place('point-a')]);
  await settle();

  const [scene] = all(testIds.terrain3d.scene);
  expect(scene.dataset.status).toBe('error');
  expect(scene.querySelector('[role="alert"]')).not.toBeNull();
  expect(scene.getAttribute('role')).toBeNull();
  expect(all(testIds.terrain3d.canvas)).toHaveLength(0);
});

test('one failing place does not stop the other from loading', async () => {
  failing.add('/data/terrain/point-a.json');
  await render([place('point-a'), place('point-b')]);
  await settle();

  expect(all(testIds.terrain3d.scene).map((s) => `${s.dataset.siteId}:${s.dataset.status}`)).toEqual(['point-a:error', 'point-b:ready']);
  expect(all(testIds.terrain3d.canvas)).toHaveLength(1);
});

test('when no place has terrain, there are only caveats: no scene, no canvas, no fetch', async () => {
  await render([place('apollo-11', { terrainModeled: false }), place('change-4', { terrainModeled: false })]);
  await settle();

  expect(all(testIds.terrain3d.caveat).map((c) => c.dataset.siteId)).toEqual(['apollo-11', 'change-4']);
  expect(all(testIds.terrain3d.scene)).toHaveLength(0);
  expect(all(testIds.terrain3d.canvas)).toHaveLength(0);
  expect(requested).toEqual([]);
});

test('an empty place list renders an empty root', async () => {
  await render([]);

  expect(all(testIds.terrain3d.root)).toHaveLength(1);
  expect(all(testIds.terrain3d.scene)).toHaveLength(0);
  expect(all(testIds.terrain3d.caveat)).toHaveLength(0);
});

test('data-sun-hidden and data-earth-hidden follow now.sky, and the label for a screen reader follows them', async () => {
  const { rerender } = await render([place('point-a', { sun: body(false), earth: body(false) })]);
  await settle();
  const scene = () => all(testIds.terrain3d.scene)[0];
  expect([scene().dataset.sunHidden, scene().dataset.earthHidden]).toEqual(['false', 'false']);
  const visibleLabel = scene().getAttribute('aria-label');

  rerender([place('point-a', { sun: body(true), earth: body(false) })]);
  expect([scene().dataset.sunHidden, scene().dataset.earthHidden]).toEqual(['true', 'false']);
  const sunHiddenLabel = scene().getAttribute('aria-label');
  expect(sunHiddenLabel).not.toBe(visibleLabel);

  rerender([place('point-a', { sun: body(false), earth: body(true) })]);
  expect([scene().dataset.sunHidden, scene().dataset.earthHidden]).toEqual(['false', 'true']);
  expect(scene().getAttribute('aria-label')).not.toBe(sunHiddenLabel);
  expect(scene().dataset.status).toBe('ready'); // a new playhead time does not reload the terrain
  expect(requested.filter((p) => p.endsWith('.bin'))).toHaveLength(1);
});

test('a ready scene gets a "face" button for the Sun and Earth, outside the picture; a failed one gets none', async () => {
  failing.add('/data/terrain/point-a.json');
  await render([place('point-a'), place('point-b')]);
  await settle();

  const buttons = all(testIds.terrain3d.face);
  expect(buttons.map((b) => b.dataset.body)).toEqual(['sun', 'earth']);
  const [failed, ready] = all(testIds.terrain3d.scene);
  expect(buttons.every((b) => b.tagName === 'BUTTON' && !ready.contains(b) && !failed.contains(b))).toBe(true);
  expect(ready.parentElement?.contains(buttons[0])).toBe(true);
  act(() => buttons[1].click()); // turning the view is the canvas's job: the scene stays as it was
  expect(ready.dataset.status).toBe('ready');
});

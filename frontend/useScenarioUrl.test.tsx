// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, expect, test } from 'vitest';
import type { Scenario } from '../backend/lib/scenarioUrl';
import TerrainSwitch from './components/scenario-bar/TerrainSwitch';
import './i18n';
import { testIds } from './test-ids';
import { useScenarioUrl } from './useScenarioUrl';

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

type Hook = ReturnType<typeof useScenarioUrl>;

const mount = async (withSwitch = false) => {
  let got = {} as Hook;
  const Probe = () => {
    got = useScenarioUrl();
    return withSwitch ? <TerrainSwitch terrain={got.scenario.terrain} onChange={(terrain) => got.update({ terrain })} /> : null;
  };
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  await act(async () =>
    root.render(
      <QueryClientProvider client={new QueryClient()}>
        <Probe />
      </QueryClientProvider>,
    ),
  );
  return {
    get: () => got,
    update: (patch: Partial<Scenario>) => act(async () => got.update(patch)),
    toggle: () =>
      act(async () => host.querySelector<HTMLInputElement>(`[data-testid="${testIds.scenarioBar.terrainSwitch}"]`)?.click()),
    unmount: () => act(() => root.unmount()),
  };
};

test('on mount the hook reads location.search', async () => {
  history.replaceState(null, '', '/?zoom=year&terrain=off');
  const m = await mount();
  expect(m.get().scenario.zoom).toBe('year');
  expect(m.get().scenario.terrain).toBe(false);
  await m.unmount();
});

test('an unknown site id gives no sites', async () => {
  history.replaceState(null, '', '/?sites=nosuch');
  const m = await mount();
  expect(m.get().scenario.sites).toEqual([]);
  await m.unmount();
});

test('a known site id is read', async () => {
  history.replaceState(null, '', '/?sites=point-a,im-1');
  const m = await mount();
  expect(m.get().scenario.sites).toEqual(['point-a', 'im-1']);
  await m.unmount();
});

test('update replaces the entry, keeps path and hash, and updates the scenario', async () => {
  history.replaceState(null, '', '/p#h');
  const length = history.length;
  const m = await mount();
  await m.update({ terrain: false });
  expect(location.search).toBe('?terrain=off');
  expect(location.pathname).toBe('/p');
  expect(location.hash).toBe('#h');
  expect(history.length).toBe(length);
  expect(m.get().scenario.terrain).toBe(false);
  await m.update({ terrain: true });
  expect(location.search).toBe('');
  expect(location.pathname).toBe('/p');
  expect(location.hash).toBe('#h');
  await m.unmount();
});

test('update keeps the other values in the URL', async () => {
  history.replaceState(null, '', '/?zoom=year');
  const m = await mount();
  await m.update({ terrain: false });
  expect(location.search).toBe('?zoom=year&terrain=off');
  await m.unmount();
});

test('the terrain switch wired to the hook changes the URL, and clicking again restores it', async () => {
  history.replaceState(null, '', '/');
  const m = await mount(true);
  await m.toggle();
  expect(location.search).toBe('?terrain=off');
  await m.toggle();
  expect(location.search).toBe('');
  await m.unmount();
});

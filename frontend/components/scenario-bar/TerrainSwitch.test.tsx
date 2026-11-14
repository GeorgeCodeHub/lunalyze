// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, expect, test, vi } from 'vitest';
import '../../i18n';
import { testIds } from '../../test-ids';
import TerrainSwitch from './TerrainSwitch';

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

const mount = async (terrain: boolean, onChange = vi.fn()) => {
  const host = document.createElement('div');
  const root = createRoot(host);
  await act(async () =>
    root.render(
      <QueryClientProvider client={new QueryClient()}>
        <TerrainSwitch terrain={terrain} onChange={onChange} />
      </QueryClientProvider>,
    ),
  );
  const input = host.querySelector<HTMLInputElement>(`[data-testid="${testIds.scenarioBar.terrainSwitch}"]`)!;
  return { input, onChange };
};

test.each([true, false])('is a checkbox switch whose checked equals terrain=%s, with no aria-checked', async (terrain) => {
  const { input } = await mount(terrain);
  expect(input.tagName).toBe('INPUT');
  expect(input.getAttribute('type')).toBe('checkbox');
  expect(input.getAttribute('role')).toBe('switch');
  expect(input.checked).toBe(terrain);
  expect(input.hasAttribute('aria-checked')).toBe(false);
});

test.each([true, false])('one click calls onChange once with the opposite of terrain=%s', async (terrain) => {
  const { input, onChange } = await mount(terrain);
  await act(async () => input.click());
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith(!terrain);
});

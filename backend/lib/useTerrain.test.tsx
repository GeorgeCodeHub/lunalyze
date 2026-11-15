// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, expect, test, vi } from 'vitest';
import { decodeTerrain, useTerrain } from './useTerrain';

// Serves backend/public/ from disk and records requested paths. `answer` overrides a path.
const requested: string[] = [];
const answer = new Map<string, () => Response>();
beforeEach(() => {
  requested.length = 0;
  answer.clear();
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal('fetch', async (url: string) => {
    const path = new URL(url, 'http://localhost').pathname;
    requested.push(path);
    const override = answer.get(path);
    if (override) return override();
    try {
      const bytes = new Uint8Array(readFileSync('backend/public' + path));
      return new Response(bytes, { headers: { 'content-type': path.endsWith('.json') ? 'application/json' : 'application/octet-stream' } });
    } catch {
      return new Response('', { status: 404 });
    }
  });
});

const renderTerrain = async (siteId: string) => {
  let got: ReturnType<typeof useTerrain> = { grid: null, loading: true, error: null };
  const Probe = () => {
    got = useTerrain(siteId);
    return null;
  };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const root = createRoot(document.createElement('div'));
  act(() =>
    root.render(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    ),
  );
  await vi.waitFor(async () => {
    await act(async () => {});
    expect(got.loading).toBe(false);
  });
  act(() => root.unmount());
  return got;
};

const META = { siteId: 'x', width: 2, height: 2, pixelM: 80, origin: { x: 0, y: 0 } };
const int16 = (...values: number[]) => {
  const buf = new ArrayBuffer(values.length * 2);
  values.forEach((v, i) => new DataView(buf).setInt16(i * 2, v, true));
  return buf;
};

test('decodeTerrain reads little-endian int16 as half metres', () => {
  const grid = decodeTerrain(META, int16(2, -4, 0, 7));
  expect([...grid.heightsM]).toEqual([1, -2, 0, 3.5]);
  expect(grid.width).toBe(2);
  expect(grid.siteId).toBe('x');
});

test('decodeTerrain throws when the byte length is not width x height x 2', () => {
  expect(() => decodeTerrain(META, int16(2, -4, 0))).toThrow();
  expect(() => decodeTerrain(META, int16(2, -4, 0, 7, 1))).toThrow();
  expect(() => decodeTerrain(META, new ArrayBuffer(0))).toThrow();
});

test('useTerrain loads point-a: the 500 x 500 grid with the real heights', async () => {
  const { grid, loading, error } = await renderTerrain('point-a');

  expect(error).toBeNull();
  expect(loading).toBe(false);
  expect(grid?.width).toBe(500);
  expect(grid?.height).toBe(500);
  expect(grid?.pixelM).toBe(80);
  expect(grid?.heightsM.length).toBe(250000);
  expect(grid?.heightsM[0]).toBe(-440.5);
  expect(grid?.heightsM[249 * 500 + 249]).toBe(1596);
  expect(grid?.heightsM[249999]).toBe(-248.5);
  expect(requested.sort()).toEqual(['/data/terrain/point-a.bin', '/data/terrain/point-a.json']);
});

test.each([
  ['a 404 on the json', () => answer.set('/data/terrain/point-a.json', () => new Response('', { status: 404 }))],
  ['a 404 on the bin', () => answer.set('/data/terrain/point-a.bin', () => new Response('', { status: 404 }))],
  ['a 500 on the bin', () => answer.set('/data/terrain/point-a.bin', () => new Response('', { status: 500 }))],
  [
    'an index.html answer for the json',
    () => answer.set('/data/terrain/point-a.json', () => new Response('<!doctype html>', { headers: { 'content-type': 'text/html' } })),
  ],
  ['a short bin', () => answer.set('/data/terrain/point-a.bin', () => new Response(new Uint8Array(100)))],
  ['a bin with no bytes', () => answer.set('/data/terrain/point-a.bin', () => new Response(new Uint8Array(0)))],
])('useTerrain reports an error and no grid for %s', async (_name, arrange) => {
  arrange();
  const { grid, loading, error } = await renderTerrain('point-a');

  expect(loading).toBe(false);
  expect(error).not.toBeNull();
  expect(grid).toBeNull();
});

test('useTerrain reports an error when the fetch itself rejects', async () => {
  vi.stubGlobal('fetch', async () => {
    throw new TypeError('network down');
  });
  const { grid, error } = await renderTerrain('point-a');

  expect(error).not.toBeNull();
  expect(grid).toBeNull();
});

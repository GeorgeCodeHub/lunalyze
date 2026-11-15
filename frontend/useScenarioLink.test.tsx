// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { type Scenario, scenarioSearch } from './scenario';
import { useScenarioLink } from './useScenarioLink';

type Link = ReturnType<typeof useScenarioLink>;

/** A scenario for one listed place; each test names the parts it cares about. */
const scenarioFor = (id: string, { stay = 7, terrain = true }: { stay?: Scenario['stay']; terrain?: boolean } = {}): Scenario => ({
  places: [{ kind: 'site', id }],
  start: new Date('2028-03-01T00:00:00Z'),
  zoom: 'lunarDay',
  stay,
  terrain,
  focus: 'both',
});

let root: Root;

/** Renders the hook and returns a way to read what it gave on its latest render. */
const mount = () => {
  let latest = {} as Link;
  const Probe = () => {
    latest = useScenarioLink();
    return null;
  };
  act(() => root.render(<Probe />));
  return { scenario: () => latest.scenario, write: (...args: Parameters<Link['write']>) => act(() => latest.write(...args)) };
};
const goBackTo = (search: string) =>
  act(() => {
    window.history.replaceState(null, '', `/${search}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  });

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  window.history.replaceState(null, '', '/');
  root = createRoot(document.createElement('div'));
});

afterEach(() => {
  vi.restoreAllMocks();
  goBackTo(''); // also forgets a link the browser refused in the test
  act(() => root.unmount());
});

test('no link means no scenario: the setup step', () => {
  const link = mount();

  expect(link.scenario()).toBeNull();
});

test('a link in the address bar is the scenario', () => {
  const linked = scenarioFor('point-a', { stay: 14, terrain: false });
  window.history.replaceState(null, '', `/${scenarioSearch(linked)}`);
  const link = mount();

  expect(link.scenario()).toEqual(linked);
});

test.each(['push', 'replace'] as const)('write %s puts the scenario in the address bar and on screen', (mode) => {
  const link = mount();
  const next = scenarioFor('malapert-m1');
  const entries = window.history.length;

  link.write(mode, next);

  expect(window.location.search).toBe(scenarioSearch(next));
  expect(link.scenario()).toEqual(next);
  expect(window.history.length).toBe(mode === 'push' ? entries + 1 : entries);
});

test('Back and Forward show what the address bar holds', () => {
  const link = mount();
  link.write('push', scenarioFor('point-a'));

  goBackTo('');
  expect(link.scenario()).toBeNull();

  const other = scenarioFor('haworth', { stay: 30 });
  goBackTo(scenarioSearch(other));
  expect(link.scenario()).toEqual(other);
});

test.each(['push', 'replace'] as const)('a browser that refuses a %s still shows the scenario, until Back', (mode) => {
  const first = scenarioFor('point-a');
  window.history.replaceState(null, '', `/${scenarioSearch(first)}`);
  const link = mount();
  vi.spyOn(window.history, mode === 'push' ? 'pushState' : 'replaceState').mockImplementation(() => {
    throw new Error('SecurityError: too many history updates');
  });
  const next = scenarioFor('im-2', { terrain: false });

  link.write(mode, next);

  expect(link.scenario()).toEqual(next); // on screen
  expect(window.location.search).toBe(scenarioSearch(first)); // the address bar kept the last link it accepted

  vi.restoreAllMocks();
  goBackTo(scenarioSearch(first));
  expect(link.scenario()).toEqual(first);
});

test('a link with no usable place reads as no scenario', () => {
  window.history.replaceState(null, '', '/?sites=@91:0&date=2028-03-01T00:00Z');
  const link = mount();

  expect(link.scenario()).toBeNull();
});

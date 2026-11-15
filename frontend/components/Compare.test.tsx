// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import '../i18n';
import { readScenario, type Scenario } from '../scenario';
import { usePlaybackStore } from '../stores/compare';
import { testIds } from '../test-ids';
import Compare from './Compare';

// No WebGL here: the canvas is a div and the controls and labels draw nothing.
vi.mock('@react-three/fiber', async () => {
  const { createElement } = await import('react');
  const { testIds: ids } = await import('../test-ids');
  return { Canvas: () => createElement('div', { 'data-testid': ids.terrain3d.canvas }) };
});
// The real 3D panel, unless a test flips `broken`: then it throws on render, like a canvas that cannot start.
const panel = vi.hoisted(() => ({ broken: false }));
vi.mock('./terrain-3d/Terrain3D', async (importActual) => {
  const actual = await importActual<typeof import('./terrain-3d/Terrain3D')>();
  return {
    default: (props: Parameters<typeof actual.default>[0]) => {
      if (panel.broken) throw new Error('no WebGL');
      return actual.default(props);
    },
  };
});
vi.mock('@react-three/drei', () => ({ OrbitControls: () => null, Html: () => null }));

// The real data files are served from backend/public/, so the numbers below are the app's own.
const failing = new Set<string>(); // paths answered 500
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  failing.clear();
  panel.broken = false;
  usePlaybackStore.getState().reset();
  vi.stubGlobal('fetch', async (url: string) => {
    const path = new URL(url, 'http://localhost').pathname;
    if (failing.has(path)) return new Response('', { status: 500 });
    try {
      return new Response(readFileSync('backend/public' + path, 'utf8'), { headers: { 'content-type': 'application/json' } });
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

const all = (id: string, from: ParentNode = container) => [...from.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`)];
const one = <E extends HTMLElement>(id: string, from: ParentNode = container) => from.querySelector(`[data-testid="${id}"]`) as E;
/** Each place card as "role:site:status". */
const cards = () => all(testIds.siteColumns.column).map((c) => `${c.dataset.role}:${c.dataset.siteId ?? '-'}:${c.dataset.status}`);
const metrics = (card: HTMLElement) => all(testIds.metricCards.card, card).map((m) => `${m.dataset.metric}=${m.dataset.value}`);

/** The cards still waiting for data, as "role:site:status". */
const waiting = () => cards().filter((c) => c.endsWith(':loading') || c.endsWith(':ranking'));

/** Waits, inside act so React accepts every update, until no card is waiting for data. */
const settle = async () => {
  for (let attempt = 0; attempt < 1000; attempt++) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5)); // the fetches land and React re-renders
    });
    if (waiting().length === 0) return;
  }
  throw new Error(`the data did not load in time; still waiting: ${waiting().join(', ')}`);
};

type HarnessProps = { search: string; changes: Scenario[] };

// Holds the scenario the way App does, and records every scenario the screen asks for.
const Harness = ({ search, changes }: HarnessProps) => {
  const [scenario, setScenario] = useState(() => readScenario(search) as Scenario);

  const change = (next: Scenario) => {
    changes.push(next);
    setScenario(next);
  };

  return <Compare scenario={scenario} onChange={change} />;
};

/** Renders the Compare screen for a link and waits for the data. changes: every scenario it asked for. */
const mount = async (search: string) => {
  const changes: Scenario[] = [];
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  act(() =>
    root.render(
      <QueryClientProvider client={client}>
        <Harness search={search} changes={changes} />
      </QueryClientProvider>,
    ),
  );
  const first = cards();
  await settle();
  return { changes, first };
};

const WEEK = '?sites=malapert-m1&date=2028-03-01T00:00Z&zoom=lunarDay&stay=7';

// The place menu in the toolbar: one tick box per listed place.
const options = () => all(testIds.scenarioBar.placeOption) as HTMLInputElement[];
const option = (siteId: string) => options().find((o) => o.dataset.siteId === siteId) as HTMLInputElement;
const ticked = () => options().filter((o) => o.checked).map((o) => o.dataset.siteId);
const tick = async (siteId: string) => {
  await act(async () => option(siteId).click());
  await settle();
};
const removeCard = async (index: number) => {
  await act(async () => all(testIds.siteColumns.remove)[index].click());
  await settle();
};

test('shows the best of the south-pole places on one side and the setup place on the other, with real numbers', async () => {
  const { first } = await mount(WEEK);

  expect(first).toEqual(['best:-:ranking', 'yourChoice:malapert-m1:loading']);
  expect(cards()).toEqual(['best:im-2:ready', 'yourChoice:malapert-m1:ready']);
  const [best, yours] = all(testIds.siteColumns.column);
  // The Compare view: each small card carries the three numbers that decide.
  expect(metrics(best)).toEqual(['sunlitPct=38.6', 'earthPct=84.5', 'longestBlackoutH=25.8']);
  expect(metrics(yours)).toEqual(['sunlitPct=0', 'earthPct=53.6', 'longestBlackoutH=329.1']);
  expect(all(testIds.siteColumns.fit).map((f) => f.dataset.fit)).toEqual(['fits', 'fits']);
  expect(all(testIds.siteColumns.role).map((r) => r.dataset.role)).toEqual(['best', 'yourChoice']);
  expect(all(testIds.compare.error)).toHaveLength(0);
});

test('Compare shows every place small, at once; Single shows one in full, with a switch to the others', async () => {
  await mount(WEEK);

  const mode = () => one(testIds.compare.sideMode);
  const pressed = (id: string) => [...one(id).querySelectorAll('button')].map((b) => b.getAttribute('aria-pressed'));
  expect(mode().dataset.value).toBe('compare');
  expect(all(testIds.compare.sidePlace)).toHaveLength(0);
  for (const card of all(testIds.siteColumns.column)) {
    expect(card.dataset.compact).toBe('true');
    expect(all(testIds.siteColumns.details, card)).toHaveLength(0); // no details on a small card
    expect(all(testIds.metricCards.card, card).map((m) => m.dataset.metric)).toEqual(['sunlitPct', 'earthPct', 'longestBlackoutH']);
  }
  // Malapert M1 is an approximate location: the mark sits beside its coordinates, in the card's header.
  expect(all(testIds.siteColumns.caveat).map((caveat) => caveat.dataset.kind)).toEqual(['approximate']);
  expect(one(testIds.siteColumns.caveat).closest('header')).not.toBeNull();
  // One timeline per place, in the live view.
  const timelines = all(testIds.timeline.root, one(testIds.compare.live));
  expect(timelines.map((tl) => tl.dataset.siteId)).toEqual(['im-2', 'malapert-m1']);

  // Single: the best option first, in full, with its details closed; the switch shows the other place.
  await act(async () => (mode().querySelectorAll('button')[1] as HTMLButtonElement).click());
  expect(mode().dataset.value).toBe('single');
  expect(cards()).toEqual(['best:im-2:ready']);
  expect(pressed(testIds.compare.sidePlace)).toEqual(['true', 'false']);
  const details = () => one<HTMLDetailsElement>(testIds.siteColumns.details);
  expect(details().open).toBe(false);
  expect(metrics(details())).toEqual(['panelOutputPct=0', 'sunElDeg=-1.361']);

  await act(async () => (one(testIds.compare.sidePlace).querySelectorAll('button')[1] as HTMLButtonElement).click());
  expect(cards()).toEqual(['yourChoice:malapert-m1:ready']);
  expect(pressed(testIds.compare.sidePlace)).toEqual(['false', 'true']);
  expect(metrics(details())).toEqual(['panelOutputPct=0', 'sunElDeg=-3.001']);

  // Back to Compare: both small cards again.
  await act(async () => (mode().querySelectorAll('button')[0] as HTMLButtonElement).click());
  expect(cards()).toEqual(['best:im-2:ready', 'yourChoice:malapert-m1:ready']);
});

test('says why the best option won: of the 10 ranked places, the shortest dark period in a week', async () => {
  await mount(WEEK);

  const why = all(testIds.siteColumns.why);
  expect(why).toHaveLength(1); // only the best option explains itself
  expect(why[0].dataset.reason).toBe('dark');
  expect(why[0].dataset.checked).toBe('10'); // 11 mapped places, IM-1 left out: its horizon is incomplete
  // The best option fits, so its reason is its fit line: the 50-hour line is not repeated on its card.
  const [bestFit, yourFit] = all(testIds.siteColumns.fit);
  expect(bestFit.dataset.fit).toBe('fits');
  expect(bestFit.contains(why[0])).toBe(true);
  expect(all(testIds.siteColumns.why, yourFit)).toHaveLength(0);
});

test('a 30-day stay: the best option is the only place that fits, and the setup place is risky', async () => {
  await mount('?sites=malapert-m1&date=2028-03-01T00:00Z&zoom=lunarDay&stay=30');

  expect(cards()).toEqual(['best:im-2:ready', 'yourChoice:malapert-m1:ready']);
  expect(all(testIds.siteColumns.fit).map((f) => f.dataset.fit)).toEqual(['fits', 'risky']);
  expect(one(testIds.siteColumns.why).dataset.reason).toBe('onlyFit');
  // The Risky tag sits in the risky card's header, beside its role badge; the card that fits has none.
  const [bestCard, yourCard] = all(testIds.siteColumns.column);
  expect(all(testIds.siteColumns.risky, bestCard)).toHaveLength(0);
  expect(all(testIds.siteColumns.risky, yourCard)).toHaveLength(1);
  expect(one(testIds.siteColumns.risky, yourCard).parentElement).toBe(one(testIds.siteColumns.role, yourCard).parentElement);
});

test('when the setup place is the best option, it is compared with the next best', async () => {
  await mount('?sites=im-2&date=2028-03-01T00:00Z&zoom=lunarDay&stay=7');

  const [best, next] = cards();
  expect(best).toBe('best:im-2:ready');
  expect(next.startsWith('nextBest:')).toBe(true);
  expect(next.endsWith(':ready')).toBe(true);
  expect(next).not.toContain(':im-2:');
});

test('places are ticked in the toolbar menu: up to 2 beside the best option, and the cards follow', async () => {
  const { changes } = await mount(WEEK);

  const button = () => one(testIds.scenarioBar.places);
  expect(options()).toHaveLength(13); // every listed place
  expect(ticked()).toEqual(['malapert-m1']);
  expect(button().dataset.count).toBe('1');
  expect(option('malapert-m1').disabled).toBe(true); // the last place cannot be unticked
  for (const card of all(testIds.siteColumns.column)) expect(card.querySelectorAll('select')).toHaveLength(0);

  await tick('point-a');
  expect(changes.at(-1)?.places).toEqual([
    { kind: 'site', id: 'malapert-m1' },
    { kind: 'site', id: 'point-a' },
  ]);
  expect(cards()).toEqual(['best:im-2:ready', 'yourChoice:malapert-m1:ready', 'yourChoice:point-a:ready']);
  expect(button().dataset.count).toBe('2');
  // Two are picked: the 11 others wait, and either picked one can be unticked.
  expect(options().filter((o) => o.disabled)).toHaveLength(11);
  expect(option('malapert-m1').disabled).toBe(false);

  await tick('malapert-m1');
  expect(changes.at(-1)?.places).toEqual([{ kind: 'site', id: 'point-a' }]);
  expect(cards()).toEqual(['best:im-2:ready', 'yourChoice:point-a:ready']);

  // Ticking the place the tool ranks first: it is not shown twice, and the other pick stays beside it.
  await tick('im-2');
  expect(ticked()).toEqual(['point-a', 'im-2']); // in menu order: reference points, then commercial landers
  expect(cards()).toEqual(['best:im-2:ready', 'yourChoice:point-a:ready']);
});

test.each([
  { sites: 'malapert-m1,haworth', cards: ['best:im-2:ready', 'yourChoice:malapert-m1:ready', 'yourChoice:haworth:ready'] },
  { sites: 'im-2,haworth', cards: ['best:im-2:ready', 'yourChoice:haworth:ready'] }, // the best is theirs: shown once
  { sites: 'malapert-m1,haworth,nobile', cards: ['best:im-2:ready', 'yourChoice:malapert-m1:ready', 'yourChoice:haworth:ready'] }, // 2 picks at most
])('a link with places $sites: the best option, then each picked place, 3 cards at most', async ({ sites, cards: expected }) => {
  await mount(`?sites=${sites}&date=2028-03-01T00:00Z&zoom=lunarDay&stay=7`);

  expect(cards()).toEqual(expected);
  expect(all(testIds.timeline.root, one(testIds.compare.live))).toHaveLength(expected.length);
});

test.each([
  { sites: 'malapert-m1,haworth', remove: 0, left: [{ kind: 'site', id: 'haworth' }], cards: ['best:im-2:ready', 'yourChoice:haworth:ready'] },
  { sites: 'malapert-m1,haworth', remove: 1, left: [{ kind: 'site', id: 'malapert-m1' }], cards: ['best:im-2:ready', 'yourChoice:malapert-m1:ready'] },
  // The best option is also picked: only the other pick has a cross; removing it brings in the next best.
  { sites: 'im-2,haworth', remove: 0, left: [{ kind: 'site', id: 'im-2' }], cards: ['best:im-2:ready'] },
])('the cross on a picked card ($sites, card $remove) takes it out', async ({ sites, remove, left, cards: expected }) => {
  const { changes } = await mount(`?sites=${sites}&date=2028-03-01T00:00Z&zoom=lunarDay&stay=7`);
  expect(all(testIds.siteColumns.remove, one(testIds.siteColumns.column))).toHaveLength(0); // never on the best option

  await removeCard(remove);

  expect(changes.at(-1)?.places).toEqual(left);
  expect(cards().slice(0, expected.length)).toEqual(expected);
  // One place is left: it has no cross, because the comparison needs it.
  expect(all(testIds.siteColumns.remove)).toHaveLength(0);
});

test('coordinates typed in the toolbar are used on Enter; bad ones show an error and change nothing', async () => {
  const { changes } = await mount(WEEK);

  const coords = () => one<HTMLInputElement>(testIds.scenarioBar.coords);
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  const typeAndEnter = async (text: string) => {
    await act(async () => {
      setter?.call(coords(), text);
      coords().dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => coords().closest('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await settle();
  };
  expect(coords().value).toBe(''); // the place is a listed one

  await typeAndEnter('-91, 10');
  expect(all(testIds.scenarioBar.coordsError)).toHaveLength(1);
  expect(coords().getAttribute('aria-invalid')).toBe('true');
  expect(changes).toHaveLength(0);

  await typeAndEnter('-85.3, 31.4');
  expect(all(testIds.scenarioBar.coordsError)).toHaveLength(0);
  // The coordinates join the listed place picked before them: 2 places, beside the best option.
  expect(changes.at(-1)?.places).toEqual([
    { kind: 'coords', lat: -85.3, lon: 31.4 },
    { kind: 'site', id: 'malapert-m1' },
  ]);
  expect(cards()).toEqual(['best:im-2:ready', 'yourChoice:-:typed', 'yourChoice:malapert-m1:ready']);
  expect(coords().value).toBe('-85.3, 31.4');
  expect(ticked()).toEqual(['malapert-m1']);

  // Removing the typed place's card empties the coordinates field.
  await removeCard(0);
  expect(changes.at(-1)?.places).toEqual([{ kind: 'site', id: 'malapert-m1' }]);
  expect(coords().value).toBe('');
  expect(cards()).toEqual(['best:im-2:ready', 'yourChoice:malapert-m1:ready']);
});

test('the Share button sits in the page header, once, and not in the toolbar', async () => {
  await mount(WEEK);

  expect(all(testIds.scenarioBar.copyLink)).toHaveLength(1);
  expect(all(testIds.scenarioBar.copyLink, one(testIds.scenarioBar.root))).toHaveLength(0);
  expect(one(testIds.scenarioBar.copyLink).dataset.status).toBe('idle');
});

test('typed coordinates: the best option still shows, and the other card says why it is empty', async () => {
  await mount('?sites=@-85.3:31.4&date=2028-03-01T00:00Z&zoom=lunarDay&stay=7');

  expect(cards()).toEqual(['best:im-2:ready', 'yourChoice:-:typed']);
  // The toolbar shows the coordinates in their field, and offers every listed place in its menu.
  expect(one<HTMLInputElement>(testIds.scenarioBar.coords).value).toBe('-85.3, 31.4');
  expect(ticked()).toEqual([]);
  expect(options()).toHaveLength(13);
});

test('the live view opens on the map and switches to the sky from each place; both have one timeline per place', async () => {
  await mount(WEEK);

  const live = one(testIds.compare.live);
  expect(one(testIds.compare.liveSwitch).dataset.value).toBe('map');
  expect(all(testIds.polarMap.pin, live).map((p) => p.dataset.siteId)).toEqual(['im-2', 'malapert-m1']);
  expect(all(testIds.horizonStrip.root, live)).toHaveLength(0);
  expect(all(testIds.timeline.root, live).map((t) => t.dataset.siteId)).toEqual(['im-2', 'malapert-m1']);
  expect(all(testIds.timeline.lane, live).map((l) => `${l.dataset.lane}:${l.dataset.bars}`)).toEqual([
    'sun:2', 'earth:2', // IM-2
    'sun:0', 'earth:2', // Malapert M1: no sunlight this Moon day (no "Both" row: the overlap shows it)
  ]);

  await act(async () => one(testIds.compare.liveSwitch).querySelectorAll('button')[1].click());

  expect(one(testIds.compare.liveSwitch).dataset.value).toBe('sky');
  expect(all(testIds.polarMap.pin, live)).toHaveLength(0);
  expect(all(testIds.horizonStrip.root, live).map((s) => `${s.dataset.range}/${s.dataset.centre}`)).toEqual(['20/north', '20/north']);
  expect(all(testIds.horizonStrip.body, live).map((b) => `${b.dataset.body}:${b.dataset.status}`)).toEqual([
    'earth:visible', 'sun:hidden',
    'earth:visible', 'sun:hidden',
  ]);
  expect(all(testIds.timeline.root, live)).toHaveLength(2);
});

test('the cards carry no dropdown, and both timelines frame the same stay', async () => {
  await mount(WEEK);

  for (const card of all(testIds.siteColumns.column)) expect(card.querySelectorAll('select')).toHaveLength(0);
  const stays = all(testIds.timeline.stay);
  expect(stays).toHaveLength(2);
  // A week of the 29.53-day span: both frames have the same width, 237 of 1000 units.
  expect(stays.map((s) => Math.round(Number(s.getAttribute('width'))))).toEqual([237, 237]);
});

test('the scrubber moves a day with Shift and an arrow key, and the play button starts and stops', async () => {
  await mount(WEEK);

  const key = (k: string) =>
    act(async () => {
      one(testIds.timeline.scrubber).dispatchEvent(new KeyboardEvent('keydown', { key: k, shiftKey: true, bubbles: true }));
    });
  expect(one(testIds.timeline.readout).dataset.offsetH).toBe('0');
  await key('ArrowRight');
  await key('ArrowRight');
  expect(one(testIds.timeline.readout).dataset.offsetH).toBe('48');
  await key('ArrowLeft');
  expect(one(testIds.timeline.readout).dataset.offsetH).toBe('24');
  await settle();
  // One Moon day is 708.72 hours; the playhead sits 24 hours in on both timelines.
  expect(all(testIds.timeline.playhead).map((p) => p.dataset.x)).toEqual(['34', '34']);

  await act(async () => one(testIds.timeline.play).click());
  expect(one(testIds.timeline.play).dataset.status).toBe('playing');
  await act(async () => one(testIds.timeline.play).click());
  expect(one(testIds.timeline.play).dataset.status).toBe('paused');
});

test('hills ignored: every mapped place is ranked, and each card carries the flat-horizon caveat', async () => {
  await mount(`${WEEK}&terrain=off`);

  expect(one(testIds.siteColumns.why).dataset.checked).toBe('11'); // no horizon is incomplete when hills are ignored
  expect(all(testIds.siteColumns.caveat).filter((c) => c.dataset.kind === 'terrainOff')).toHaveLength(2);
  expect(one<HTMLInputElement>(testIds.scenarioBar.terrainSwitch).checked).toBe(false);
});

test('a site list that fails to load shows the error, no best option, and no live view pictures', async () => {
  failing.add('/data/sites.json');
  await mount(WEEK);

  expect(all(testIds.compare.error)).toHaveLength(1);
  expect(cards()).toEqual(['best:-:unranked', 'yourChoice:malapert-m1:missing']);
  expect(all(testIds.polarMap.pin)).toHaveLength(0);
  expect(all(testIds.timeline.root)).toHaveLength(0);
});

test('the live view has a third mode, 3D, that loads the terrain panel with one scene per place', async () => {
  await mount(WEEK);

  const live = one(testIds.compare.live);
  const buttons = () => [...one(testIds.compare.liveSwitch).querySelectorAll('button')];
  expect(buttons()).toHaveLength(3);
  expect(all(testIds.terrain3d.root, live)).toHaveLength(0);
  // Each button, in order, sets its own mode.
  const values: string[] = [];
  for (const i of [0, 1, 2]) {
    await act(async () => buttons()[i].click());
    values.push(one(testIds.compare.liveSwitch).dataset.value as string);
  }
  expect(values).toEqual(['map', 'sky', '3d']);
  expect(buttons().map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'true']);

  await vi.waitFor(async () => {
    await act(async () => {}); // let the lazy chunk and the terrain files land
    expect(all(testIds.terrain3d.root, live)).toHaveLength(1);
  });
  await vi.waitFor(async () => {
    await act(async () => {});
    expect(all(testIds.terrain3d.scene, live).map((s) => s.dataset.siteId)).toEqual(['im-2', 'malapert-m1']);
  });
  expect(all(testIds.polarMap.pin, live)).toHaveLength(0);
  expect(all(testIds.horizonStrip.root, live)).toHaveLength(0);
  expect(all(testIds.timeline.root, live)).toHaveLength(2); // the timelines stay under every mode
});

test('when the 3D panel throws, the live view shows a notice and the rest of the screen stays', async () => {
  await mount(WEEK);
  const live = one(testIds.compare.live);
  const timelines = all(testIds.timeline.root, live).length;
  const logged = vi.spyOn(console, 'error').mockImplementation(() => {}); // React logs the expected render error
  panel.broken = true;

  await act(async () => one(testIds.compare.liveSwitch).querySelectorAll('button')[2].click());
  await vi.waitFor(async () => {
    await act(async () => {});
    expect(all(testIds.terrain3d.unavailable, live)).toHaveLength(1);
  });
  logged.mockRestore();

  expect(all(testIds.terrain3d.unavailable, live)[0].getAttribute('role')).toBe('alert');
  expect(all(testIds.terrain3d.root, live)).toHaveLength(0);
  expect(one(testIds.compare.liveSwitch).dataset.value).toBe('3d');
  expect(all(testIds.timeline.root, live)).toHaveLength(timelines);
  expect(timelines).toBe(2);
  expect(all(testIds.siteColumns.column)).toHaveLength(2);
});

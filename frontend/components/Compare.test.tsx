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

// The real data files are served from backend/public/, so the numbers below are the app's own.
const failing = new Set<string>(); // paths answered 500
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  failing.clear();
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

const settle = () =>
  vi.waitFor(
    async () => {
      await act(async () => {}); // let the fetches land and React re-render
      expect(cards().filter((c) => c.endsWith(':loading') || c.endsWith(':ranking'))).toEqual([]);
    },
    { timeout: 10000 },
  );

type HarnessProps = { search: string; changes: Scenario[] };

// Holds the scenario the way App does, and records every scenario the screen asks for.
const Harness = ({ search, changes }: HarnessProps) => {
  const [scenario, setScenario] = useState(() => readScenario(search) as Scenario);

  const change = (next: Scenario) => {
    changes.push(next);
    setScenario(next);
  };

  return <Compare scenario={scenario} onChange={change} onBack={() => {}} />;
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

const pick = async (id: string, value: string) => {
  await act(async () => {
    const select = one<HTMLSelectElement>(id);
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await settle();
};

const WEEK = '?sites=malapert-m1&date=2028-03-01T00:00Z&zoom=lunarDay&stay=7';

test('shows the best of the south-pole places on one side and the setup place on the other, with real numbers', async () => {
  const { first } = await mount(WEEK);

  expect(first).toEqual(['best:-:ranking', 'yourChoice:malapert-m1:loading']);
  expect(cards()).toEqual(['best:im-2:ready', 'yourChoice:malapert-m1:ready']);
  const [best, yours] = all(testIds.siteColumns.column);
  expect(metrics(best)).toEqual(['sunlitPct=38.6', 'earthPct=84.5', 'longestBlackoutH=25.8', 'panelOutputPct=0', 'sunElDeg=-1.361']);
  expect(metrics(yours)).toEqual(['sunlitPct=0', 'earthPct=53.6', 'longestBlackoutH=329.1', 'panelOutputPct=0', 'sunElDeg=-3.001']);
  expect(all(testIds.siteColumns.fit).map((f) => f.dataset.fit)).toEqual(['fits', 'fits']);
  expect(all(testIds.siteColumns.role).map((r) => r.dataset.role)).toEqual(['best', 'yourChoice']);
  expect(all(testIds.compare.error)).toHaveLength(0);
});

test('a card shows three numbers and two next events; the rest sits in its details, closed at first', async () => {
  await mount(WEEK);

  for (const card of all(testIds.siteColumns.column)) {
    const details = one<HTMLDetailsElement>(testIds.siteColumns.details, card);
    expect(details.open).toBe(false);
    // On the face: the three numbers that decide. In the details: the two for the moment shown.
    expect(all(testIds.metricCards.card, card).filter((m) => !details.contains(m)).map((m) => m.dataset.metric)).toEqual([
      'sunlitPct',
      'earthPct',
      'longestBlackoutH',
    ]);
    expect(all(testIds.metricCards.card, details).map((m) => m.dataset.metric)).toEqual(['panelOutputPct', 'sunElDeg']);
    expect(all(testIds.countdowns.chip, card).map((chip) => chip.dataset.body)).toEqual(['sun', 'earth']);
  }
  // Malapert M1 is an approximate location: the caveat stays on the face of its card, as a short mark.
  expect(all(testIds.siteColumns.caveat).map((caveat) => caveat.dataset.kind)).toEqual(['approximate']);
});

test('says why the best option won: of the 10 ranked places, the shortest dark period in a week', async () => {
  await mount(WEEK);

  const why = all(testIds.siteColumns.why);
  expect(why).toHaveLength(1); // only the best option explains itself
  expect(why[0].dataset.reason).toBe('dark');
  expect(why[0].dataset.checked).toBe('10'); // 11 mapped places, IM-1 left out: its horizon is incomplete
});

test('a 30-day stay: the best option is the only place that fits, and the setup place is risky', async () => {
  await mount('?sites=malapert-m1&date=2028-03-01T00:00Z&zoom=lunarDay&stay=30');

  expect(cards()).toEqual(['best:im-2:ready', 'yourChoice:malapert-m1:ready']);
  expect(all(testIds.siteColumns.fit).map((f) => f.dataset.fit)).toEqual(['fits', 'risky']);
  expect(one(testIds.siteColumns.why).dataset.reason).toBe('onlyFit');
});

test('when the setup place is the best option, it is compared with the next best', async () => {
  await mount('?sites=im-2&date=2028-03-01T00:00Z&zoom=lunarDay&stay=7');

  const [best, next] = cards();
  expect(best).toBe('best:im-2:ready');
  expect(next.startsWith('nextBest:')).toBe(true);
  expect(next.endsWith(':ready')).toBe(true);
  expect(next).not.toContain(':im-2:');
});

test('the place is changed in the toolbar: the card follows, and the cards themselves have no dropdown', async () => {
  const { changes } = await mount(WEEK);

  const place = () => one<HTMLSelectElement>(testIds.scenarioBar.place);
  expect(place().value).toBe('malapert-m1');
  expect([...place().options].map((o) => o.value)).toHaveLength(13); // every listed place
  for (const card of all(testIds.siteColumns.column)) expect(card.querySelectorAll('select')).toHaveLength(0);

  await pick(testIds.scenarioBar.place, 'point-a');
  expect(cards()).toEqual(['best:im-2:ready', 'yourChoice:point-a:ready']);
  expect(changes.at(-1)?.places).toEqual([{ kind: 'site', id: 'point-a' }]);
  expect(place().value).toBe('point-a');

  // Picking the place the tool already ranks first: it is marked as the person's choice, and the next best joins it.
  await pick(testIds.scenarioBar.place, 'im-2');
  expect(cards()[0]).toBe('best:im-2:ready');
  expect(cards()[1].startsWith('nextBest:')).toBe(true);
  expect(place().value).toBe('im-2');
});

test('a link with a second place: that place is the one compared, and the toolbar shows it', async () => {
  await mount('?sites=malapert-m1,haworth&date=2028-03-01T00:00Z&zoom=lunarDay&stay=7');

  expect(cards()).toEqual(['best:im-2:ready', 'alternative:haworth:ready']);
  expect(one<HTMLSelectElement>(testIds.scenarioBar.place).value).toBe('haworth');
});

test('typed coordinates: the best option still shows, and the other card says why it is empty', async () => {
  await mount('?sites=@-85.3:31.4&date=2028-03-01T00:00Z&zoom=lunarDay&stay=7');

  expect(cards()).toEqual(['best:im-2:ready', 'yourChoice:-:typed']);
  // The toolbar shows that the place is typed, and offers every listed place instead.
  expect(one<HTMLSelectElement>(testIds.scenarioBar.place).value).toBe('');
  expect([...one<HTMLSelectElement>(testIds.scenarioBar.place).options].map((o) => o.value).filter(Boolean)).toHaveLength(13);
});

test('the live view opens on the map and switches to the sky from each place; both have one timeline per place', async () => {
  await mount(WEEK);

  const live = one(testIds.compare.live);
  expect(one(testIds.compare.liveSwitch).dataset.value).toBe('map');
  expect(all(testIds.polarMap.pin, live).map((p) => p.dataset.siteId)).toEqual(['im-2', 'malapert-m1']);
  expect(all(testIds.horizonStrip.root, live)).toHaveLength(0);
  expect(all(testIds.timeline.root, live).map((t) => t.dataset.siteId)).toEqual(['im-2', 'malapert-m1']);
  expect(all(testIds.timeline.lane, live).map((l) => `${l.dataset.lane}:${l.dataset.bars}`)).toEqual([
    'sun:2', 'earth:2', 'both:1', // IM-2
    'sun:0', 'earth:2', 'both:0', // Malapert M1: no sunlight this Moon day
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

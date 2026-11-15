// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, describe, expect, test } from 'vitest';
import { POLAR_MAP } from '../../../backend/lib/projectPolar';
import type { Site, SiteView } from '../../../backend/lib/types';
import '../../i18n';
import { testIds } from '../../test-ids';
import PolarMap from './PolarMap';

const sites: Site[] = JSON.parse(readFileSync('backend/public/data/sites.json', 'utf8'));
const site = (id: string) => sites.find((s) => s.id === id) as Site;

type Opts = { sunHidden?: boolean; earthHidden?: boolean; sunAz?: number; earthAz?: number; incomplete?: boolean };
const view = (id: string, { sunHidden = false, earthHidden = false, sunAz = 0, earthAz = 90, incomplete = false }: Opts = {}): SiteView => ({
  site: site(id),
  horizonIncomplete: incomplete,
  metrics: { sunElDeg: 1, sunlitPct: 50, earthPct: 50, longestBlackoutH: 0, panelOutputPct: 50 },
  countdown: { sun: { kind: 'set', hours: 1 }, earth: { kind: 'set', hours: 1 } },
  sky: {
    terrain: [[0, 0], [360, 0]],
    sun: { az: sunAz, el: 1, hidden: sunHidden },
    earth: { az: earthAz, el: 1, hidden: earthHidden },
    sunPath: [],
    earthPath: [],
    athensSunPath: [],
  },
  lanes: { sun: [], earth: [], both: [] },
});

const mount = async (views: SiteView[]) => {
  const host = document.createElement('div');
  const root = createRoot(host);
  const client = new QueryClient();
  await act(async () => root.render(<QueryClientProvider client={client}><PolarMap views={views} /></QueryClientProvider>));
  const all = (id: string, from: ParentNode = host) => [...from.querySelectorAll(`[data-testid="${id}"]`)];
  return { host, all, one: (id: string, from: ParentNode = host) => from.querySelector(`[data-testid="${id}"]`) };
};

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

const THREE = () => [view('point-a', { sunHidden: false, earthHidden: true }), view('im-1', { sunHidden: true, earthHidden: false }), view('change-4')];
const pins = (m: Awaited<ReturnType<typeof mount>>) => m.all(testIds.polarMap.pin);
const lineOf = (pin: Element, body: string) => pin.querySelector(`[data-testid="${testIds.polarMap.bodyLine}"][data-body="${body}"]`) as Element;

describe('pins (criteria 6, 14)', () => {
  test('point-a, im-1, change-4 give two pins in views order', async () => {
    const m = await mount(THREE());
    expect(pins(m).map((p) => p.getAttribute('data-site-id'))).toEqual(['point-a', 'im-1']);
  });
  test('data-precision is exact or proxy', async () => {
    const m = await mount([view('point-a'), view('point-c'), view('im-1'), view('nobile')]);
    expect(pins(m).map((p) => p.getAttribute('data-precision'))).toEqual(['exact', 'proxy', 'exact', 'proxy']);
  });
});

describe('body lines (criteria 7, 9)', () => {
  test('each pin holds a sun and an earth line with data-status from sky.<body>.hidden', async () => {
    const m = await mount(THREE());
    const got = pins(m).map((p) =>
      m.all(testIds.polarMap.bodyLine, p).map((l) => [l.getAttribute('data-body'), l.getAttribute('data-status')]),
    );
    expect(got).toEqual([
      [['sun', 'visible'], ['earth', 'hidden']],
      [['sun', 'hidden'], ['earth', 'visible']],
    ]);
  });
  test('sun ends in a circle, earth in a rect, and no other marker', async () => {
    const m = await mount([view('point-a')]);
    const [pin] = pins(m);
    const shapes = (body: string) => m.all(testIds.polarMap.bodyMarker, lineOf(pin, body)).map((e) => e.tagName.toLowerCase());
    expect(shapes('sun')).toEqual(['circle']);
    expect(shapes('earth')).toEqual(['rect']);
  });
  test('a bearing of 0 at lon 0 runs up the screen, 90 runs right (SVG y is negated)', async () => {
    // malapert-m1 sits near lon 0 (2.7), so map north and east are close to screen up and right
    const m = await mount([view('malapert-m1', { sunAz: 0, earthAz: 90 })]);
    const num = (e: Element, a: string) => Number(e.getAttribute(a));
    const sun = m.one(testIds.polarMap.bodyStroke, lineOf(pins(m)[0], 'sun')) as Element;
    const earth = m.one(testIds.polarMap.bodyStroke, lineOf(pins(m)[0], 'earth')) as Element;
    expect(num(sun, 'y2')).toBeLessThan(num(sun, 'y1')); // north (away from the pole at ~0 lon) is +y map = up
    expect(num(earth, 'x2')).toBeGreaterThan(num(earth, 'x1')); // east at lon ~0 is +x
    // line length is 0.25 H, in map units (kilometres)
    const len = Math.hypot(num(sun, 'x2') - num(sun, 'x1'), num(sun, 'y2') - num(sun, 'y1'));
    expect(len).toBeCloseTo((0.25 * POLAR_MAP.halfWidthM) / 1000, 3);
  });
});

describe('dash by attribute (criterion 8)', () => {
  test('BodyLine.module.css sets stroke-dasharray only under [data-status=hidden]', () => {
    const css = readFileSync('frontend/components/site-picker/BodyLine.module.css', 'utf8');
    const rules = css.split('}').map((r) => r.split('{') as [string, string?]);
    const dashed = rules.filter(([, body]) => body?.includes('stroke-dasharray'));
    expect(dashed.length).toBeGreaterThan(0);
    for (const [selector] of dashed) expect(selector).toContain("[data-status='hidden']");
  });
});

describe('off-map notes (criterion 10)', () => {
  test('one note per off-map view with its data-site-id, none for on-map sites', async () => {
    const m = await mount(THREE());
    expect(m.all(testIds.polarMap.offMap).map((n) => n.getAttribute('data-site-id'))).toEqual(['change-4']);
  });
  test('two off-map views give two notes, in views order and no pins', async () => {
    const m = await mount([view('change-4'), view('apollo-11')]);
    expect(m.all(testIds.polarMap.offMap).map((n) => n.getAttribute('data-site-id'))).toEqual(['change-4', 'apollo-11']);
    expect(pins(m)).toHaveLength(0);
  });
  test('no note when every view is on the map', async () => {
    const m = await mount([view('point-a'), view('im-1')]);
    expect(m.all(testIds.polarMap.offMap)).toHaveLength(0);
  });
});

describe('empty, credit, image (criteria 11, 12, 13)', () => {
  test('views=[] renders the map and credit with no pins, lines or notes', async () => {
    const m = await mount([]);
    expect(m.all(testIds.polarMap.root)).toHaveLength(1);
    expect(m.all(testIds.polarMap.image)).toHaveLength(1);
    expect(m.all(testIds.polarMap.credit)).toHaveLength(1);
    expect(pins(m)).toHaveLength(0);
    expect(m.all(testIds.polarMap.bodyLine)).toHaveLength(0);
    expect(m.all(testIds.polarMap.offMap)).toHaveLength(0);
  });
  test('the svg is role=img with a label that differs when no places are picked', async () => {
    const label = async (views: SiteView[]) => (await mount(views)).one(testIds.polarMap.svg)?.getAttribute('aria-label');
    const [empty, one] = [await label([]), await label([view('point-a')])];
    expect((await mount([])).one(testIds.polarMap.svg)?.getAttribute('role')).toBe('img');
    expect(empty).toBeTruthy();
    expect(one).toBeTruthy();
    expect(empty).not.toBe(one);
  });
  test('the credit is rendered for every count of views', async () => {
    for (const views of [[view('point-a')], THREE(), [view('change-4')]]) {
      expect((await mount(views)).all(testIds.polarMap.credit)).toHaveLength(1);
    }
  });
  test('the image href is BASE_URL + POLAR_MAP.path and fills the viewBox', async () => {
    const m = await mount([]);
    const img = m.one(testIds.polarMap.image) as Element;
    expect(img.getAttribute('href')).toBe(import.meta.env.BASE_URL + POLAR_MAP.path);
    expect(img.getAttribute('href')).toBe('/data/map/south-pole-hillshade.png');
    const H = POLAR_MAP.halfWidthM / 1000; // the map is drawn in kilometres
    expect(m.one(testIds.polarMap.svg)?.getAttribute('viewBox')).toBe(`${-H} ${-H} ${2 * H} ${2 * H}`);
    expect([img.getAttribute('x'), img.getAttribute('y'), img.getAttribute('width'), img.getAttribute('height')]).toEqual([
      String(-H), String(-H), String(2 * H), String(2 * H),
    ]);
  });
});

describe('many views', () => {
  test('all 13 sites: 11 pins with 22 body lines, 2 off-map notes', async () => {
    const m = await mount(sites.map((s) => view(s.id)));
    expect(pins(m)).toHaveLength(11);
    expect(m.all(testIds.polarMap.bodyLine)).toHaveLength(22);
    expect(m.all(testIds.polarMap.offMap)).toHaveLength(2);
  });
  test('a pin sits at (x, -y) of the projection: point-a is left of and below the pole in screen terms', async () => {
    const m = await mount([view('point-a')]);
    const c = m.one(testIds.polarMap.pinDot) as Element;
    // point-a projects to x -2347 m, y -9415 m; the map is drawn in kilometres, and SVG y is +9.415
    expect(Number(c.getAttribute('cx'))).toBeCloseTo(-2.347488, 5);
    expect(Number(c.getAttribute('cy'))).toBeCloseTo(9.415262, 5);
  });
});

describe('legend', () => {
  test('hidden with no pins; four items for exact pins; a fifth when any pin is a proxy', async () => {
    const items = async (views: SiteView[]) => (await mount(views)).one(testIds.polarMap.legend)?.children.length ?? 0;
    expect(await items([])).toBe(0);
    expect(await items([view('change-4')])).toBe(0);
    expect(await items([view('point-a'), view('im-1')])).toBe(4);
    expect(await items([view('point-a'), view('point-c')])).toBe(5);
  });
});

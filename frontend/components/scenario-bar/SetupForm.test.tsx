// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import '../../i18n';
import { DEFAULT_START, type Scenario } from '../../scenario';
import { testIds } from '../../test-ids';
import SetupForm from './SetupForm';

let container: HTMLDivElement;
let root: Root;

const all = (id: string) => [...container.querySelectorAll(`[data-testid="${id}"]`)];
const one = <E extends Element>(id: string) => container.querySelector(`[data-testid="${id}"]`) as E;
const siteSelect = () => one<HTMLSelectElement>(testIds.setup.siteSelect);
const coordsInput = () => one<HTMLInputElement>(testIds.setup.coords);

const setValue = (select: HTMLSelectElement, value: string) =>
  act(() => {
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
// Sets the value through the native setter so React sees a real change, as when the user types.
const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
const type = (input: HTMLInputElement, value: string) =>
  act(() => {
    valueSetter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
const submit = () => act(() => one<HTMLButtonElement>(testIds.setup.submit).click());
const render = (onSubmit: (s: Scenario) => void = vi.fn(), initial: Scenario | null = null) =>
  act(() => root.render(<SetupForm initial={initial} onSubmit={onSubmit} />));

/** DEFAULT_START's day at the given UTC hour. */
const startAt = (hour: number) => {
  const d = new Date(DEFAULT_START);
  d.setUTCHours(hour);
  return d;
};

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test('asks for one place: a site list and a coordinates field, then the hour and the stay', () => {
  render();

  expect(all(testIds.setup.siteSelect)).toHaveLength(1);
  expect(all(testIds.setup.coords)).toHaveLength(1);
  expect(siteSelect().querySelectorAll('optgroup')).toHaveLength(5);
  expect(one<HTMLSelectElement>(testIds.setup.hour).options).toHaveLength(24);
  expect(one<HTMLSelectElement>(testIds.setup.stay).options).toHaveLength(5);
});

test('asks for a place before submitting, and moves focus to the site list', () => {
  const onSubmit = vi.fn();
  render(onSubmit);

  submit();

  expect(onSubmit).not.toHaveBeenCalled();
  expect(all(testIds.setup.siteError)).toHaveLength(1);
  expect(siteSelect().getAttribute('aria-invalid')).toBe('true');
  expect(coordsInput().getAttribute('aria-invalid')).toBe('true');
  expect(document.activeElement).toBe(siteSelect());
});

test('submits the picked site, a 24-hour UTC start and the stay', () => {
  const onSubmit = vi.fn<(s: Scenario) => void>();
  render(onSubmit);

  setValue(siteSelect(), 'malapert-m1');
  setValue(one(testIds.setup.hour), '18');
  setValue(one(testIds.setup.stay), '14');
  submit();

  expect(all(testIds.setup.siteError)).toHaveLength(0);
  expect(onSubmit).toHaveBeenCalledWith({
    places: [{ kind: 'site', id: 'malapert-m1' }],
    start: startAt(18),
    zoom: 'lunarDay',
    stay: 14,
    terrain: true,
    focus: 'both',
  });
});

test.each([
  ['00', 0],
  ['23', 23],
])('accepts the first and last hour of the day (%s:00 UTC)', (hourValue, hour) => {
  const onSubmit = vi.fn<(s: Scenario) => void>();
  render(onSubmit);

  setValue(siteSelect(), 'point-a');
  setValue(one(testIds.setup.hour), hourValue);
  submit();

  expect(onSubmit.mock.calls[0][0].start).toEqual(startAt(hour));
});

test('accepts the shortest and longest stay', () => {
  const onSubmit = vi.fn<(s: Scenario) => void>();
  render(onSubmit);

  setValue(siteSelect(), 'point-a');
  setValue(one(testIds.setup.stay), '1');
  submit();
  setValue(one(testIds.setup.stay), '30');
  submit();

  expect(onSubmit.mock.calls.map(([s]) => s.stay)).toEqual([1, 30]);
});

test('starts from a shared scenario: its first place, date, hour and stay; the rest is kept', () => {
  const shared: Scenario = {
    places: [
      { kind: 'coords', lat: -85.25, lon: 31.4 },
      { kind: 'site', id: 'haworth' },
    ],
    start: startAt(23),
    zoom: 'day',
    stay: 1,
    terrain: false,
    focus: 'sun',
  };
  const onSubmit = vi.fn<(s: Scenario) => void>();
  render(onSubmit, shared);

  expect(siteSelect().value).toBe('');
  expect(coordsInput().value).toBe('-85.25, 31.4');
  expect(one<HTMLSelectElement>(testIds.setup.hour).value).toBe('23');
  submit();

  // The time span, the hills switch, what matters most and the other compared places are not asked
  // here, so they stay.
  expect(onSubmit).toHaveBeenCalledWith(shared);
});

test('changing the landing place keeps the other compared places, without repeating one', () => {
  const shared: Scenario = {
    places: [
      { kind: 'site', id: 'point-a' },
      { kind: 'site', id: 'haworth' },
      { kind: 'site', id: 'im-2' },
    ],
    start: startAt(0),
    zoom: 'lunarDay',
    stay: 7,
    terrain: true,
    focus: 'both',
  };
  const onSubmit = vi.fn<(s: Scenario) => void>();
  render(onSubmit, shared);

  setValue(siteSelect(), 'nobile');
  submit();
  setValue(siteSelect(), 'im-2');
  submit();

  expect(onSubmit.mock.calls.map(([s]) => s.places.map((p) => (p.kind === 'site' ? p.id : '')))).toEqual([
    ['nobile', 'haworth', 'im-2'],
    ['im-2', 'haworth'],
  ]);
});

test('an empty date falls back to the default start instead of an invalid date', () => {
  const onSubmit = vi.fn<(s: Scenario) => void>();
  render(onSubmit);

  setValue(siteSelect(), 'point-a');
  type(one(testIds.setup.date), '');
  submit();

  expect(onSubmit.mock.calls[0][0].start).toEqual(DEFAULT_START);
});

test.each([
  ['-78, 180', -78, 180],
  ['-90, -180', -90, -180],
  ['−85.3 31.4', -85.3, 31.4],
  [' -80;0 ', -80, 0],
])('submits coordinates written as "%s"', (text, lat, lon) => {
  const onSubmit = vi.fn<(s: Scenario) => void>();
  render(onSubmit);

  type(coordsInput(), text);
  submit();

  expect(onSubmit.mock.calls[0][0].places).toEqual([{ kind: 'coords', lat, lon }]);
});

test.each(['90.01, 0', '-85, -180.01', '-77.99, 0', '0, 0', '-85', '-85, 31, 2', 'north, east'])(
  'blocks coordinates "%s" and moves focus to them',
  (text) => {
    const onSubmit = vi.fn();
    render(onSubmit);

    type(coordsInput(), text);
    submit();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(all(testIds.setup.coordsError)).toHaveLength(1);
    expect(all(testIds.setup.siteError)).toHaveLength(0);
    expect(coordsInput().getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(coordsInput());
  },
);

test('typing coordinates clears the picked site, and picking a site clears them', () => {
  render();

  setValue(siteSelect(), 'haworth');
  type(coordsInput(), '-85, 31');
  expect(siteSelect().value).toBe('');

  setValue(siteSelect(), 'point-a');
  expect(coordsInput().value).toBe('');
});

test('fixing the coordinates clears the error and submits', () => {
  const onSubmit = vi.fn<(s: Scenario) => void>();
  render(onSubmit);

  type(coordsInput(), '-91, 10');
  submit();
  type(coordsInput(), '-89.5, 10');

  expect(all(testIds.setup.coordsError)).toHaveLength(0);
  submit();
  expect(onSubmit.mock.calls[0][0].places).toEqual([{ kind: 'coords', lat: -89.5, lon: 10 }]);
});

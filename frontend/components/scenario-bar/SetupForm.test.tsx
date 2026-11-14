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

const byId = (id: string) => [...container.querySelectorAll<HTMLSelectElement>(`[data-testid="${id}"]`)];
const one = <E extends Element>(id: string) => container.querySelector(`[data-testid="${id}"]`) as E;
const placeSelect = (slot: number) => byId(testIds.setup.siteSelect)[slot - 1];

const setValue = (select: HTMLSelectElement, value: string) =>
  act(() => {
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
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

test('shows three place dropdowns, one each for date hour, flexibility and stay', () => {
  render();

  expect(byId(testIds.setup.siteSelect)).toHaveLength(3);
  expect(one<HTMLSelectElement>(testIds.setup.hour).options).toHaveLength(24);
  expect(one<HTMLSelectElement>(testIds.setup.zoom).options).toHaveLength(3);
  expect(one<HTMLSelectElement>(testIds.setup.stay).options).toHaveLength(4);
  expect(placeSelect(1).querySelectorAll('optgroup')).toHaveLength(5);
});

test('asks for a place before submitting, and moves focus to the first place', () => {
  const onSubmit = vi.fn();
  render(onSubmit);

  submit();

  expect(onSubmit).not.toHaveBeenCalled();
  expect(byId(testIds.setup.siteError)).toHaveLength(1);
  expect(placeSelect(1).getAttribute('aria-invalid')).toBe('true');
  expect(document.activeElement).toBe(placeSelect(1));
});

test('submits the picked places, a 24-hour UTC start, flexibility and stay', () => {
  const onSubmit = vi.fn<(s: Scenario) => void>();
  render(onSubmit);

  setValue(placeSelect(1), 'point-a');
  setValue(placeSelect(2), 'malapert-m1');
  setValue(one(testIds.setup.hour), '18');
  setValue(one(testIds.setup.zoom), 'year');
  setValue(one(testIds.setup.stay), '2');
  submit();

  expect(byId(testIds.setup.siteError)).toHaveLength(0);
  expect(onSubmit).toHaveBeenCalledWith({
    siteIds: ['point-a', 'malapert-m1'],
    start: startAt(18),
    zoom: 'year',
    stay: 2,
  });
});

test.each([
  ['00', 0],
  ['23', 23],
])('accepts the first and last hour of the day (%s:00 UTC)', (hourValue, hour) => {
  const onSubmit = vi.fn<(s: Scenario) => void>();
  render(onSubmit);

  setValue(placeSelect(1), 'point-a');
  setValue(one(testIds.setup.hour), hourValue);
  submit();

  expect(onSubmit.mock.calls[0][0].start).toEqual(startAt(hour));
});

test('accepts the shortest and longest stay, and the narrowest and widest window', () => {
  const onSubmit = vi.fn<(s: Scenario) => void>();
  render(onSubmit);

  setValue(placeSelect(1), 'point-a');
  setValue(one(testIds.setup.stay), '0.5');
  setValue(one(testIds.setup.zoom), 'day');
  submit();
  setValue(one(testIds.setup.stay), '3');
  setValue(one(testIds.setup.zoom), 'year');
  submit();

  expect(onSubmit.mock.calls.map(([s]) => [s.stay, s.zoom])).toEqual([
    [0.5, 'day'],
    [3, 'year'],
  ]);
});

test('starts from a shared scenario: places, date, hour, window and stay are filled in', () => {
  const shared: Scenario = { siteIds: ['haworth', 'point-b'], start: startAt(23), zoom: 'day', stay: 0.5 };
  const onSubmit = vi.fn<(s: Scenario) => void>();
  render(onSubmit, shared);

  expect(byId(testIds.setup.siteSelect).map((s) => s.value)).toEqual(['haworth', 'point-b', '']);
  expect(one<HTMLSelectElement>(testIds.setup.hour).value).toBe('23');
  submit();

  expect(onSubmit).toHaveBeenCalledWith(shared);
});

test('an empty date falls back to the default start instead of an invalid date', () => {
  const onSubmit = vi.fn<(s: Scenario) => void>();
  render(onSubmit);

  setValue(placeSelect(1), 'point-a');
  act(() => {
    const date = one<HTMLInputElement>(testIds.setup.date);
    date.value = '';
    date.dispatchEvent(new Event('input', { bubbles: true }));
    date.dispatchEvent(new Event('change', { bubbles: true }));
  });
  submit();

  expect(onSubmit.mock.calls[0][0].start).toEqual(DEFAULT_START);
});

test('a place picked in one dropdown is left out of the others', () => {
  render();

  setValue(placeSelect(1), 'haworth');

  const optionValues = (slot: number) => [...placeSelect(slot).options].map((o) => o.value);
  expect(optionValues(1)).toContain('haworth');
  expect(optionValues(2)).not.toContain('haworth');
  expect(optionValues(3)).not.toContain('haworth');
});

test('clearing a middle place keeps the others in order', () => {
  const onSubmit = vi.fn<(s: Scenario) => void>();
  render(onSubmit);

  setValue(placeSelect(1), 'point-a');
  setValue(placeSelect(2), 'point-b');
  setValue(placeSelect(3), 'haworth');
  setValue(placeSelect(2), '');
  submit();

  expect(onSubmit.mock.calls[0][0].siteIds).toEqual(['point-a', 'haworth']);
});

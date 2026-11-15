// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import '../../i18n';
import { testIds } from '../../test-ids';
import WhenFields from './WhenFields';

let container: HTMLDivElement;
let root: Root;

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

const all = (id: string) => [...container.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`)];
const one = (id: string) => container.querySelector<HTMLElement>(`[data-testid="${id}"]`) as HTMLElement;
const month = () => one(testIds.when.month).dataset.month;
const days = () => all(testIds.when.day);
const day = (iso: string) => days().find((d) => d.dataset.day === iso) as HTMLButtonElement;
const focused = () => days().find((d) => d.tabIndex === 0)?.dataset.day;
const pressed = () => days().filter((d) => d.getAttribute('aria-pressed') === 'true').map((d) => d.dataset.day);
const key = (k: string) =>
  act(() => {
    one(testIds.when.calendar).querySelector('[role="group"]')?.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
  });

const render = (date: string, onDate = vi.fn()) => {
  act(() =>
    root.render(<WhenFields date={date} hour="00" onDate={onDate} onHour={vi.fn()} dateTestId="date" hourTestId="hour" />),
  );
  return onDate;
};

test("the calendar opens on the field's month, six weeks Monday first, with the field's day chosen", () => {
  render('2028-03-01');

  expect(month()).toBe('2028-03');
  expect(days()).toHaveLength(42);
  expect(days()[0].dataset.day).toBe('2028-02-28');
  expect(pressed()).toEqual(['2028-03-01']);
  expect(focused()).toBe('2028-03-01');
  // Days from the months around it are marked, so they can be drawn quieter.
  expect(day('2028-02-28').dataset.outside).toBe('true');
  expect(day('2028-03-31').dataset.outside).toBe('false');
  // The field's own button opens this calendar, not the browser's.
  expect(one(testIds.when.open).getAttribute('popovertarget')).toBe(one(testIds.when.calendar).id);
});

test.each([
  { name: 'a day this month', pick: '2028-03-15' },
  { name: 'a day of the month before, shown on the page', pick: '2028-02-28' },
  { name: 'a day of the month after, shown on the page', pick: '2028-04-09' },
])('clicking $name sets the field to it', ({ pick }) => {
  const onDate = render('2028-03-01');

  act(() => day(pick).click());

  expect(onDate).toHaveBeenCalledWith(pick);
});

test('the arrows change the month, across the year as well', () => {
  render('2028-12-15');

  act(() => (one(testIds.when.nextMonth) as HTMLButtonElement).click());
  expect(month()).toBe('2029-01');
  act(() => (one(testIds.when.prevMonth) as HTMLButtonElement).click());
  act(() => (one(testIds.when.prevMonth) as HTMLButtonElement).click());
  expect(month()).toBe('2028-11');
});

test.each([
  { key: 'ArrowRight', from: '2028-03-01', to: '2028-03-02', month: '2028-03' },
  { key: 'ArrowLeft', from: '2028-03-01', to: '2028-02-29', month: '2028-02' }, // into the leap day, and its month
  { key: 'ArrowDown', from: '2028-03-29', to: '2028-04-05', month: '2028-04' },
  { key: 'ArrowUp', from: '2028-03-01', to: '2028-02-23', month: '2028-02' },
  { key: 'PageDown', from: '2028-03-20', to: '2028-04-01', month: '2028-04' },
  { key: 'PageUp', from: '2028-01-20', to: '2027-12-01', month: '2027-12' },
  { key: 'Enter', from: '2028-03-01', to: '2028-03-01', month: '2028-03' }, // not a moving key: the native click picks
])('$key from $from moves to $to', ({ key: k, from, to, month: expected }) => {
  render(from);

  key(k);

  expect(focused()).toBe(to);
  expect(month()).toBe(expected);
});

test.each([
  { name: 'empty', value: '' },
  { name: 'half-typed', value: '2028-0' },
  { name: 'not a real day', value: '2028-02-30' },
])('a field that is $name opens on the default landing month with no day chosen', ({ value }) => {
  render(value);

  expect(month()).toBe('2028-03');
  expect(pressed()).toEqual([]);
  expect(focused()).toBe('2028-03-01');
});

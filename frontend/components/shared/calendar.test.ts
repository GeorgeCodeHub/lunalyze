import { expect, test } from 'vitest';
import { isIsoDay, monthGrid, monthOf, shiftDay, shiftMonth } from './calendar';

test.each([
  { value: '2028-03-01', ok: true },
  { value: '2028-02-29', ok: true }, // 2028 is a leap year
  { value: '2027-02-29', ok: false }, // 2027 is not
  { value: '2028-02-30', ok: false },
  { value: '2028-13-01', ok: false },
  { value: '2028-3-1', ok: false }, // half-typed
  { value: '', ok: false },
  { value: 'not a date', ok: false },
])('isIsoDay($value) is $ok', ({ value, ok }) => {
  expect(isIsoDay(value)).toBe(ok);
});

test('monthOf keeps the year and month', () => {
  expect(monthOf('2028-03-15')).toBe('2028-03');
});

test.each([
  { month: '2028-03', by: 1, result: '2028-04' },
  { month: '2028-03', by: -1, result: '2028-02' },
  { month: '2028-12', by: 1, result: '2029-01' }, // across the year
  { month: '2028-01', by: -1, result: '2027-12' },
  { month: '2028-03', by: 0, result: '2028-03' },
  { month: '2028-03', by: 12, result: '2029-03' },
])('shiftMonth($month, $by) is $result', ({ month, by, result }) => {
  expect(shiftMonth(month, by)).toBe(result);
});

test.each([
  { day: '2028-03-01', by: 1, result: '2028-03-02' },
  { day: '2028-03-01', by: -1, result: '2028-02-29' }, // into a leap-day February
  { day: '2028-12-31', by: 1, result: '2029-01-01' },
  { day: '2028-03-01', by: 7, result: '2028-03-08' },
  { day: '2028-03-01', by: -7, result: '2028-02-23' },
])('shiftDay($day, $by) is $result', ({ day, by, result }) => {
  expect(shiftDay(day, by)).toBe(result);
});

test.each([
  { month: '2028-03', first: '2028-02-28', last: '2028-04-09' }, // 1 March 2028 is a Wednesday
  { month: '2027-03', first: '2027-03-01', last: '2027-04-11' }, // 1 March 2027 is a Monday: no days before
  { month: '2028-10', first: '2028-09-25', last: '2028-11-05' }, // 1 October 2028 is a Sunday: six days before
  { month: '2029-01', first: '2029-01-01', last: '2029-02-11' }, // 1 January 2029 is a Monday
  { month: '2028-01', first: '2027-12-27', last: '2028-02-06' }, // 1 January 2028 is a Saturday: the page starts in the year before
])('monthGrid($month): six weeks from $first to $last, Monday first', ({ month, first, last }) => {
  const days = monthGrid(month);
  expect(days).toHaveLength(42);
  expect(days[0]).toBe(first);
  expect(days[41]).toBe(last);
  expect(new Date(`${days[0]}T00:00:00Z`).getUTCDay()).toBe(1); // a Monday
  expect(days).toContain(`${month}-01`);
});

// Date maths for the calendar menu, on ISO strings in UTC (the app's dates are all UTC):
// a month is 'YYYY-MM', a day is 'YYYY-MM-DD'.

const DAY_MS = 86_400_000;

/** True for a real day written as YYYY-MM-DD (not 2028-02-30, not half-typed). */
export const isIsoDay = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const ms = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(ms) && new Date(ms).toISOString().slice(0, 10) === value;
};

/** The day's month: '2028-03-01' → '2028-03'. */
export const monthOf = (day: string) => day.slice(0, 7);

/** The month `by` months later (or earlier, when negative). */
export const shiftMonth = (month: string, by: number) => {
  const [year, m] = month.split('-').map(Number);
  return new Date(Date.UTC(year, m - 1 + by, 1)).toISOString().slice(0, 7);
};

/** The day `by` days later (or earlier, when negative). */
export const shiftDay = (day: string, by: number) => new Date(Date.parse(`${day}T00:00:00Z`) + by * DAY_MS).toISOString().slice(0, 10);

/** The 42 days a month's page shows: six weeks, Monday first, from the Monday on or before the 1st. */
export const monthGrid = (month: string) => {
  const [year, m] = month.split('-').map(Number);
  const first = Date.UTC(year, m - 1, 1);
  const mondayBefore = first - ((new Date(first).getUTCDay() + 6) % 7) * DAY_MS;
  return Array.from({ length: 42 }, (_, i) => new Date(mondayBefore + i * DAY_MS).toISOString().slice(0, 10));
};

/** The day's time in milliseconds, for formatting. */
export const dayMs = (day: string) => Date.parse(`${day}T00:00:00Z`);

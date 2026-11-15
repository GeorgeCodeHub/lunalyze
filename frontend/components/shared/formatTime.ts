// Dates and numbers as text. Everything goes through Intl with 'en'; dates are UTC (AGENTS.md).
const UTC = { timeZone: 'UTC', hourCycle: 'h23' } as const;

const dateTime = new Intl.DateTimeFormat('en', { ...UTC, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const dayMonth = new Intl.DateTimeFormat('en', { ...UTC, day: 'numeric', month: 'short' });
const hourMinute = new Intl.DateTimeFormat('en', { ...UTC, hour: '2-digit', minute: '2-digit' });
const monthYear = new Intl.DateTimeFormat('en', { ...UTC, month: 'short', year: 'numeric' });
const monthYearLong = new Intl.DateTimeFormat('en', { ...UTC, month: 'long', year: 'numeric' });
const weekdayNarrow = new Intl.DateTimeFormat('en', { ...UTC, weekday: 'narrow' });
const dayNumber = new Intl.DateTimeFormat('en', { ...UTC, day: 'numeric' });
const dateLong = new Intl.DateTimeFormat('en', { ...UTC, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/** "Mar 1, 2028, 14:00" */
export const formatDateTime = (ms: number) => dateTime.format(ms);
/** "Mar 1" */
export const formatDay = (ms: number) => dayMonth.format(ms);
/** "14:00" */
export const formatClock = (ms: number) => hourMinute.format(ms);
/** "Mar 2028" */
export const formatMonth = (ms: number) => monthYear.format(ms);
/** "March 2028" */
export const formatMonthLong = (ms: number) => monthYearLong.format(ms);
/** "W" */
export const formatWeekdayNarrow = (ms: number) => weekdayNarrow.format(ms);
/** "1" */
export const formatDayNumber = (ms: number) => dayNumber.format(ms);
/** "Wednesday, March 1, 2028" */
export const formatDateLong = (ms: number) => dateLong.format(ms);

/** A number with a fixed count of decimals: formatNumber(86.04, 2) → "86.04", formatNumber(2.7, 2) → "2.70". */
export const formatNumber = (value: number, decimals = 0) =>
  new Intl.NumberFormat('en', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);

/** A number with at most this many decimals: formatUpTo(31.1, 1) → "31.1", formatUpTo(100, 1) → "100". */
export const formatUpTo = (value: number, decimals: number) =>
  new Intl.NumberFormat('en', { maximumFractionDigits: decimals }).format(value);

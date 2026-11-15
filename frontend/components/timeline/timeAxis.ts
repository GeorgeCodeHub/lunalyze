import { HOUR } from '../../../backend/lib/realView';
import { formatClock, formatDay, formatMonth } from '../shared/formatTime';
import type { TimeFrame } from '../shared/timeFrame';

/** Width of a lane in SVG units. A time maps to (time − start) / span × UNITS. */
export const UNITS = 1000;

/** Five evenly spaced labels along the time span: clock times for a day, dates for a Moon day, months for a year. */
export const axisTicks = (frame: Pick<TimeFrame, 'startMs' | 'spanH' | 'zoom'>): { ms: number; label: string }[] =>
  [0, 0.25, 0.5, 0.75, 1].map((share) => {
    const ms = frame.startMs + share * frame.spanH * HOUR;
    if (frame.zoom === 'day') return { ms, label: formatClock(ms) };
    return { ms, label: frame.zoom === 'lunarDay' ? formatDay(ms) : formatMonth(ms) };
  });

/** Where a time sits along a lane, in SVG units from the left edge. */
export const laneX = (ms: number, frame: Pick<TimeFrame, 'startMs' | 'spanH'>) => ((ms - frame.startMs) / (frame.spanH * HOUR)) * UNITS;

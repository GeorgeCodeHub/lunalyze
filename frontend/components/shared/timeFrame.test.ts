import { expect, test } from 'vitest';
import { PLAYBACK, timeFrame } from './timeFrame';

const start = new Date('2028-03-01T00:00:00Z');
const START = start.getTime();

test('the frame holds the span, the stay and the playhead as a time', () => {
  expect(timeFrame({ start, zoom: 'lunarDay', stay: 7 }, 30)).toEqual({
    zoom: 'lunarDay',
    startMs: START,
    spanH: 708.72,
    endH: 708,
    stayH: 168,
    offsetH: 30,
    nowMs: START + 30 * 3600e3,
  });
});

test('each time span has its own length and last whole hour', () => {
  expect(timeFrame({ start, zoom: 'day', stay: 1 }, 0)).toMatchObject({ spanH: 24, endH: 24, stayH: 24, nowMs: START });
  expect(timeFrame({ start, zoom: 'year', stay: 30 }, 0)).toMatchObject({ spanH: 8760, endH: 8760, stayH: 720 });
});

test('a playhead outside the span is brought inside', () => {
  expect(timeFrame({ start, zoom: 'day', stay: 7 }, 500).offsetH).toBe(24);
  expect(timeFrame({ start, zoom: 'day', stay: 7 }, 500).nowMs).toBe(START + 24 * 3600e3);
  expect(timeFrame({ start, zoom: 'lunarDay', stay: 7 }, 9000).offsetH).toBe(708);
  expect(timeFrame({ start, zoom: 'day', stay: 7 }, -5).offsetH).toBe(0);
});

test('playback moves in whole hours, so the playhead stays on the 1-hour steps of the scrubber', () => {
  expect(PLAYBACK).toEqual({
    day: { stepH: 1, tickMs: 500 },
    lunarDay: { stepH: 6, tickMs: 150 },
    year: { stepH: 72, tickMs: 150 },
  });
});

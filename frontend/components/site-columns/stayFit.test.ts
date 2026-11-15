import { expect, test } from 'vitest';
import type { Interval } from '../../../backend/lib/types';
import { DARK_LIMIT_H, stayFit } from './stayFit';

const START = Date.parse('2028-03-01T00:00:00Z');
const HOUR = 3600e3;
const at = (h: number) => new Date(START + h * HOUR).toISOString();
const lane = (...periods: [number, number][]): Interval[] => periods.map(([from, to]) => [at(from), at(to)]);
const WEEK_H = 168;

test('the limit is 50 hours', () => {
  expect(DARK_LIMIT_H).toBe(50);
});

test('light for the whole stay fits', () => {
  expect(stayFit({ sun: lane([0, 200]), earth: [] }, START, WEEK_H)).toEqual({ status: 'fits', darkMs: 0 });
});

test('a dark period of exactly 50 hours fits; one minute more is risky', () => {
  expect(stayFit({ sun: lane([0, 20], [70, 168]), earth: [] }, START, WEEK_H)).toEqual({ status: 'fits', darkMs: 50 * HOUR });
  expect(stayFit({ sun: lane([0, 20], [70 + 1 / 60, 168]), earth: [] }, START, WEEK_H)).toEqual({
    status: 'risky',
    darkMs: 50 * HOUR + 60e3,
    fromMs: START + 20 * HOUR,
    toMs: START + 70 * HOUR + 60e3,
    fromLanding: false,
    toEnd: false,
  });
});

test('Earth in view fills a gap in the sunlight, and the other way round', () => {
  const sun = lane([0, 20], [100, 168]);
  expect(stayFit({ sun, earth: [] }, START, WEEK_H).status).toBe('risky');
  expect(stayFit({ sun, earth: lane([15, 60]) }, START, WEEK_H)).toEqual({ status: 'fits', darkMs: 40 * HOUR }); // 60 → 100
  expect(stayFit({ sun: lane([15, 60]), earth: sun }, START, WEEK_H)).toEqual({ status: 'fits', darkMs: 40 * HOUR });
});

test('the longest dark period is the one reported', () => {
  const fit = stayFit({ sun: lane([0, 10], [65, 70], [130, 168]), earth: [] }, START, WEEK_H);
  expect(fit).toEqual({
    status: 'risky',
    darkMs: 60 * HOUR,
    fromMs: START + 70 * HOUR,
    toMs: START + 130 * HOUR,
    fromLanding: false,
    toEnd: false,
  });
});

test('nothing in view at all is dark from landing to the end of the stay', () => {
  expect(stayFit({ sun: [], earth: [] }, START, WEEK_H)).toEqual({
    status: 'risky',
    darkMs: WEEK_H * HOUR,
    fromMs: START,
    toMs: START + WEEK_H * HOUR,
    fromLanding: true,
    toEnd: true,
  });
});

test('only the stay counts: darkness after it ends does not make it risky', () => {
  const lanes = { sun: lane([0, 60]), earth: [] }; // dark from hour 60 on
  expect(stayFit(lanes, START, 72)).toEqual({ status: 'fits', darkMs: 12 * HOUR }); // 3 days: 12 dark hours
  expect(stayFit(lanes, START, WEEK_H)).toEqual({
    status: 'risky',
    darkMs: 108 * HOUR,
    fromMs: START + 60 * HOUR,
    toMs: START + WEEK_H * HOUR,
    fromLanding: false,
    toEnd: true,
  });
});

test('a one-day stay always fits: it is shorter than the limit', () => {
  expect(stayFit({ sun: [], earth: [] }, START, 24)).toEqual({ status: 'fits', darkMs: 24 * HOUR });
});

test('the 30-day stay is checked to the end of the Moon day, 29.53 days', () => {
  const fit = stayFit({ sun: lane([0, 600]), earth: [] }, START, 30 * 24);
  expect(fit).toEqual({
    status: 'risky',
    darkMs: 391392000, // 108.72 hours: from hour 600 to the end of the Moon day, hour 708.72
    fromMs: START + 600 * HOUR,
    toMs: START + 29.53 * 24 * HOUR,
    fromLanding: false,
    toEnd: true,
  });
});

test('periods that overlap or arrive out of order are read correctly', () => {
  const sun = lane([90, 168], [0, 30]);
  const earth = lane([10, 45], [20, 25]);
  expect(stayFit({ sun, earth }, START, WEEK_H)).toEqual({ status: 'fits', darkMs: 45 * HOUR }); // 45 → 90
});

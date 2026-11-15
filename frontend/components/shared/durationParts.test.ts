import { expect, test } from 'vitest';
import { durationParts } from './durationParts';

test('under a day: hours and minutes, rounded to the minute', () => {
  expect(durationParts(11.71)).toEqual({ days: 0, hours: 11, minutes: 43 });
  expect(durationParts(0.5)).toEqual({ days: 0, hours: 0, minutes: 30 });
  expect(durationParts(19.6)).toEqual({ days: 0, hours: 19, minutes: 36 });
  expect(durationParts(0)).toEqual({ days: 0, hours: 0, minutes: 0 });
});

test('a day or longer: days and hours, rounded to the hour', () => {
  expect(durationParts(24)).toEqual({ days: 1, hours: 0, minutes: 0 });
  expect(durationParts(37.12)).toEqual({ days: 1, hours: 13, minutes: 0 });
  expect(durationParts(276.2)).toEqual({ days: 11, hours: 12, minutes: 0 });
  expect(durationParts(47.6)).toEqual({ days: 2, hours: 0, minutes: 0 });
});

test('just under a day stays in hours, and a negative length reads as nothing', () => {
  expect(durationParts(23.999)).toEqual({ days: 0, hours: 24, minutes: 0 });
  expect(durationParts(-3)).toEqual({ days: 0, hours: 0, minutes: 0 });
});

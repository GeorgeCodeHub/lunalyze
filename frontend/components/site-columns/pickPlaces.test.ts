import { expect, test } from 'vitest';
import type { Place } from '../../scenario';
import { pickPlaces } from './pickPlaces';

const site = (id: string): Place => ({ kind: 'site', id });
const typed: Place = { kind: 'coords', lat: -85.3, lon: 31.4 };
const RANKED = ['im-2', 'point-d', 'point-a'];

test('the setup place is compared with the best option', () => {
  expect(pickPlaces([site('malapert-m1')], RANKED)).toEqual({
    best: site('im-2'),
    bestIsYours: false,
    alternative: site('malapert-m1'),
    alternativeRole: 'yourChoice',
  });
});

test('when the setup place is the best option, the next best is the alternative', () => {
  expect(pickPlaces([site('im-2')], RANKED)).toEqual({
    best: site('im-2'),
    bestIsYours: true,
    alternative: site('point-d'),
    alternativeRole: 'nextBest',
  });
});

test('a place chosen with the dropdown replaces the setup place as the alternative', () => {
  expect(pickPlaces([site('malapert-m1'), site('haworth')], RANKED)).toMatchObject({ alternative: site('haworth'), alternativeRole: 'alternative' });
  expect(pickPlaces([site('im-2'), site('haworth')], RANKED)).toMatchObject({ bestIsYours: true, alternative: site('haworth'), alternativeRole: 'alternative' });
});

test('the best option is never shown twice: choosing it falls back to the setup place, or the next best', () => {
  expect(pickPlaces([site('malapert-m1'), site('im-2')], RANKED)).toMatchObject({ alternative: site('malapert-m1'), alternativeRole: 'yourChoice' });
  expect(pickPlaces([site('im-2'), site('im-2')], RANKED)).toMatchObject({ alternative: site('point-d'), alternativeRole: 'nextBest' });
});

test('typed coordinates stay the alternative: they are never the best option', () => {
  expect(pickPlaces([typed], RANKED)).toEqual({ best: site('im-2'), bestIsYours: false, alternative: typed, alternativeRole: 'yourChoice' });
});

test('before the places are ranked there is no best option, and the setup place still shows', () => {
  expect(pickPlaces([site('malapert-m1')], [])).toEqual({
    best: null,
    bestIsYours: false,
    alternative: site('malapert-m1'),
    alternativeRole: 'yourChoice',
  });
});

test('with one ranked place that is also the setup place, there is nothing to compare it with', () => {
  expect(pickPlaces([site('im-2')], ['im-2'])).toEqual({ best: site('im-2'), bestIsYours: true, alternative: null, alternativeRole: 'nextBest' });
});

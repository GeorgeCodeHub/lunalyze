import { expect, test } from 'vitest';
import type { Place } from '../../scenario';
import { pickPlaces } from './pickPlaces';

const site = (id: string): Place => ({ kind: 'site', id });
const typed: Place = { kind: 'coords', lat: -85.3, lon: 31.4 };
const RANKED = ['im-2', 'point-d', 'point-a'];
const yours = (...ids: string[]) => ids.map((id) => ({ place: site(id), role: 'yourChoice' }));

test.each([
  { picked: ['malapert-m1'], bestIsYours: false, compared: yours('malapert-m1') },
  { picked: ['malapert-m1', 'haworth'], bestIsYours: false, compared: yours('malapert-m1', 'haworth') },
  { picked: ['im-2', 'haworth'], bestIsYours: true, compared: yours('haworth') }, // the best is theirs: shown once
  { picked: ['haworth', 'im-2'], bestIsYours: true, compared: yours('haworth') },
  { picked: ['im-2'], bestIsYours: true, compared: [{ place: site('point-d'), role: 'nextBest' }] }, // nothing else: the next best
  { picked: ['im-2', 'im-2'], bestIsYours: true, compared: [{ place: site('point-d'), role: 'nextBest' }] },
  { picked: ['malapert-m1', 'haworth', 'nobile'], bestIsYours: false, compared: yours('malapert-m1', 'haworth') }, // 2 at most
])('picked $picked: the best option, then $compared.length place(s)', ({ picked, bestIsYours, compared }) => {
  expect(pickPlaces(picked.map(site), RANKED)).toEqual({ best: site('im-2'), bestIsYours, compared });
});

test('typed coordinates are compared: they are never the best option', () => {
  expect(pickPlaces([typed, site('haworth')], RANKED)).toEqual({
    best: site('im-2'),
    bestIsYours: false,
    compared: [
      { place: typed, role: 'yourChoice' },
      { place: site('haworth'), role: 'yourChoice' },
    ],
  });
});

test('before the places are ranked there is no best option, and the picked places still show', () => {
  expect(pickPlaces([site('malapert-m1'), site('haworth')], [])).toEqual({ best: null, bestIsYours: false, compared: yours('malapert-m1', 'haworth') });
});

test('with one ranked place that is also the picked place, there is nothing to compare it with', () => {
  expect(pickPlaces([site('im-2')], ['im-2'])).toEqual({ best: site('im-2'), bestIsYours: true, compared: [] });
});

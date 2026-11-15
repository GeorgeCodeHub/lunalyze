import { expect, test } from 'vitest';
import { liveKeys, shownKey, SIDE_VIEW_START } from './sideView';

const KEYS = ['im-2', 'haworth', 'cabeus-b'];

test('the panel starts in compare, with no place chosen', () => {
  expect(SIDE_VIEW_START).toEqual({ mode: 'compare', chosen: null });
});

test.each([
  { name: 'nothing chosen: the first (the best option)', keys: KEYS, chosen: null, shown: 'im-2' },
  { name: 'a place on screen', keys: KEYS, chosen: 'haworth', shown: 'haworth' },
  { name: 'a place taken out since: back to the first', keys: KEYS, chosen: 'nobile', shown: 'im-2' },
  { name: 'no places at all', keys: [], chosen: 'haworth', shown: null },
])('shownKey: $name', ({ keys, chosen, shown }) => {
  expect(shownKey(keys, chosen)).toBe(shown);
});

test.each([
  { name: 'compare shows every place', mode: 'compare', chosen: 'haworth', keys: KEYS, live: KEYS },
  { name: 'single shows the chosen place only', mode: 'single', chosen: 'haworth', keys: KEYS, live: ['haworth'] },
  { name: 'single with nothing chosen shows the best option', mode: 'single', chosen: null, keys: KEYS, live: ['im-2'] },
  { name: 'single after the chosen place was taken out shows the first', mode: 'single', chosen: 'nobile', keys: KEYS, live: ['im-2'] },
  { name: 'single with no places shows none', mode: 'single', chosen: null, keys: [], live: [] },
] as const)('liveKeys: $name', ({ mode, chosen, keys, live }) => {
  expect(liveKeys({ mode, chosen }, [...keys])).toEqual(live);
});

import { expect, test } from 'vitest';
import { earthStatus, heightRange, type Pair, splitPath, stripAz, stripCentre, sunStatus, turnPath, turnTerrain } from './skyScale';

test('heightRange picks the smallest range that holds every point with a little room', () => {
  expect(heightRange([])).toBe(10);
  expect(heightRange([[[10, -1.5], [20, 6.2]]])).toBe(10);
  expect(heightRange([[[10, 9.2]]])).toBe(10); // 9.2 × 1.08 = 9.94
  expect(heightRange([[[10, 9.6]]])).toBe(20); // 9.6 × 1.08 = 10.37
  expect(heightRange([[[0, 3]], [[0, -16.3]]])).toBe(20);
  expect(heightRange([[[0, 23.5]]])).toBe(45);
  expect(heightRange([[[0, 59.4]], [[0, -87.9]]])).toBe(90);
  expect(heightRange([[[0, 89.5]]])).toBe(90); // nothing is higher than straight up
});

test('stripCentre puts north in the middle when Earth is within 90° of north', () => {
  expect(stripCentre(0)).toBe('north');
  expect(stripCentre(351)).toBe('north');
  expect(stripCentre(89.9)).toBe('north');
  expect(stripCentre(90)).toBe('south');
  expect(stripCentre(160)).toBe('south');
  expect(stripCentre(270)).toBe('south');
  expect(stripCentre(270.1)).toBe('north');
});

test('stripAz leaves a south-centred strip alone and turns a north-centred one half a circle', () => {
  expect(stripAz(351, 'south')).toBe(351);
  expect(stripAz(0, 'north')).toBe(180);
  expect(stripAz(351, 'north')).toBe(171);
  expect(stripAz(180, 'north')).toBe(0);
  expect(turnPath([[350, 1], [10, 2]], 'north')).toEqual([[170, 1], [190, 2]]);
});

test('turnTerrain swaps the two halves of the outline for a north-centred strip', () => {
  const outline: Pair[] = [[0, 1], [90, 2], [180, 3], [270, 4], [360, 1]];
  expect(turnTerrain(outline, 'south')).toBe(outline);
  expect(turnTerrain(outline, 'north')).toEqual([[0, 3], [90, 4], [180, 1], [180, 1], [270, 2], [360, 3]]);
});

test('turnTerrain carries a flat outline out to both edges', () => {
  expect(turnTerrain([[0, 0], [360, 0]], 'north')).toEqual([[0, 0], [180, 0], [180, 0], [360, 0]]);
  expect(turnTerrain([], 'north')).toEqual([]);
});

test('splitPath starts a new line where the direction jumps by more than 180°', () => {
  expect(splitPath([])).toEqual([]);
  expect(splitPath([[10, 0], [20, 1]])).toEqual([[[10, 0], [20, 1]]]);
  expect(splitPath([[350, 0], [358, 1], [4, 2], [12, 3]])).toEqual([
    [[350, 0], [358, 1]],
    [[4, 2], [12, 3]],
  ]);
  expect(splitPath([[0, 0], [180, 1]])).toEqual([[[0, 0], [180, 1]]]); // exactly 180 is not a jump
});

test('the Sun is visible, partly hidden or hidden by how much of its disc shows', () => {
  expect(sunStatus(100)).toBe('visible');
  expect(sunStatus(99.9)).toBe('partly');
  expect(sunStatus(0.1)).toBe('partly');
  expect(sunStatus(0)).toBe('hidden');
});

test('Earth is visible or hidden', () => {
  expect(earthStatus(false)).toBe('visible');
  expect(earthStatus(true)).toBe('hidden');
});

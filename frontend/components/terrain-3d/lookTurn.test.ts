import { expect, test } from 'vitest';
import { angleDelta, compassPoint, dialAngle, FOV_MAX, FOV_MIN, headingOf, LOOK_DIRECTIONS, lookTurn, POLAR_MAX, POLAR_MIN, tiltedPolar, zoomedFov } from './lookTurn';
import { sceneDirection } from './sceneMath';

test('the pad lists up, left, right, down: the order of a cross read top to bottom', () => {
  expect(LOOK_DIRECTIONS).toEqual(['up', 'left', 'right', 'down']);
});

test.each([
  { direction: 'up', azimuth: 0, polar: 0.174533 }, // 10° up
  { direction: 'down', azimuth: 0, polar: -0.174533 }, // 10° down
  { direction: 'left', azimuth: 0.261799, polar: 0 }, // 15° left
  { direction: 'right', azimuth: -0.261799, polar: 0 }, // 15° right
])('$direction turns the view by azimuth $azimuth, polar $polar', ({ direction, azimuth, polar }) => {
  const turn = lookTurn(direction);
  expect(turn.azimuth).toBeCloseTo(azimuth, 6);
  expect(turn.polar).toBeCloseTo(polar, 6);
});

test.each([null, '', 'Up', 'north', 'upleft', 'toString', '__proto__'])('%j is not a pad direction: it turns nothing', (direction) => {
  expect(lookTurn(direction)).toEqual({ azimuth: 0, polar: 0 });
});

test('opposite presses cancel out', () => {
  expect(lookTurn('left').azimuth + lookTurn('right').azimuth).toBe(0);
  expect(lookTurn('up').polar + lookTurn('down').polar).toBe(0);
});

test.each([
  { name: 'a tilt in the middle of the range', polar: 1.5, by: 0.2, result: 1.7 },
  { name: 'a tilt past straight up stops just short of it', polar: 3, by: 0.5, result: POLAR_MAX },
  { name: 'a tilt past straight down stops just short of it', polar: 0.2, by: -0.5, result: POLAR_MIN },
  { name: 'already at the top limit, up again stays there', polar: POLAR_MAX, by: 0.174533, result: POLAR_MAX },
  { name: 'already at the bottom limit, down again stays there', polar: POLAR_MIN, by: -0.174533, result: POLAR_MIN },
  { name: 'no tilt keeps the angle', polar: 1.2, by: 0, result: 1.2 },
  { name: 'an angle that is not a number gives a level view', polar: Number.NaN, by: 0.2, result: Math.PI / 2 },
  { name: 'an endless angle gives a level view', polar: Number.POSITIVE_INFINITY, by: 0, result: Math.PI / 2 },
  { name: 'a tilt that is not a number tilts nothing', polar: 1.2, by: Number.NaN, result: 1.2 },
])('$name', ({ polar, by, result }) => {
  expect(tiltedPolar(polar, by)).toBeCloseTo(result, 9);
});

test.each([
  { name: 'in narrows the view by a quarter', fov: 50, direction: 'in', result: 40 },
  { name: 'out widens it by a quarter', fov: 40, direction: 'out', result: 50 },
  { name: 'in at the closest stays there', fov: FOV_MIN, direction: 'in', result: FOV_MIN },
  { name: 'out at the farthest stays there', fov: FOV_MAX, direction: 'out', result: FOV_MAX },
  { name: 'in past the closest stops at it', fov: 9, direction: 'in', result: FOV_MIN },
  { name: 'out past the farthest stops at it', fov: 70, direction: 'out', result: FOV_MAX },
  { name: 'an arrow press does not zoom', fov: 50, direction: 'left', result: 50 },
  { name: 'nothing pressed does not zoom', fov: 50, direction: null, result: 50 },
  { name: 'an unknown press does not zoom', fov: 50, direction: 'In', result: 50 },
])('zoom: $name', ({ fov, direction, result }) => {
  expect(zoomedFov(fov, direction)).toBeCloseTo(result, 9);
});

test('zoom: a field of view that is not a number stays as it is', () => {
  expect(zoomedFov(Number.NaN, 'in')).toBeNaN();
});

test('zoom presses do not turn the view', () => {
  expect(lookTurn('in')).toEqual({ azimuth: 0, polar: 0 });
  expect(lookTurn('out')).toEqual({ azimuth: 0, polar: 0 });
});

// The heading read back from a direction the scene draws: every bearing at every longitude comes back.
test.each([
  { az: 0, lon: 0 },
  { az: 90, lon: 0 },
  { az: 180, lon: 31.4 },
  { az: 270, lon: -120 },
  { az: 359, lon: 179 },
  { az: 45, lon: -180 },
])('headingOf reads bearing $az back at longitude $lon', ({ az, lon }) => {
  const [x, , z] = sceneDirection({ az, el: 0 }, lon, 1);
  const heading = headingOf(x, z, lon);
  const difference = Math.abs(((heading - az + 540) % 360) - 180); // the short way round, so 359.99 and 0 agree
  expect(difference).toBeLessThan(1e-6);
  expect(heading).toBeGreaterThanOrEqual(0);
  expect(heading).toBeLessThan(360);
});

test.each([
  { heading: 0, point: 'n' },
  { heading: 22, point: 'n' },
  { heading: 23, point: 'ne' },
  { heading: 90, point: 'e' },
  { heading: 180, point: 's' },
  { heading: 248, point: 'w' }, // 247.5° is halfway between south-west and west
  { heading: 337, point: 'nw' },
  { heading: 338, point: 'n' },
  { heading: 359.9, point: 'n' },
  { heading: 360, point: 'n' },
  { heading: -90, point: 'w' }, // any number of degrees, wrapped
  { heading: 720 + 45, point: 'ne' },
  { heading: Number.NaN, point: 'n' }, // not ready yet: north
])('compassPoint($heading) is $point', ({ heading, point }) => {
  expect(compassPoint(heading)).toBe(point);
});

// A dial centred at (50, 50) on screen, y down.
test.each([
  { name: 'straight up', x: 50, y: 10, angle: 0 },
  { name: 'right', x: 90, y: 50, angle: 90 },
  { name: 'straight down', x: 50, y: 90, angle: 180 },
  { name: 'left', x: 10, y: 50, angle: 270 },
  { name: 'up and right', x: 90, y: 10, angle: 45 },
  { name: 'up and left', x: 10, y: 10, angle: 315 },
  { name: 'the centre itself', x: 50, y: 50, angle: 0 },
])('dialAngle: a point $name is at $angle°', ({ x, y, angle }) => {
  expect(dialAngle(50, 50, x, y)).toBeCloseTo(angle, 9);
});

test.each([
  { from: 10, to: 30, delta: 20 },
  { from: 30, to: 10, delta: -20 },
  { from: 350, to: 10, delta: 20 }, // across north, the short way
  { from: 10, to: 350, delta: -20 },
  { from: 0, to: 180, delta: 180 }, // half a turn reads as clockwise
  { from: 180, to: 0, delta: 180 },
  { from: 90, to: 90, delta: 0 },
  { from: -90, to: 720, delta: 90 }, // any number of degrees, wrapped
])('angleDelta from $from to $to is $delta', ({ from, to, delta }) => {
  expect(angleDelta(from, to)).toBeCloseTo(delta, 9);
});

import { expect, test } from 'vitest';
import { toXY } from './toXY';

test('toXY maps azimuth to x and elevation to y', () => {
  expect(toXY(0, 0, 720, 200, 1)).toEqual({ x: 0, y: 100 });
  expect(toXY(180, 0, 720, 200, 1)).toEqual({ x: 360, y: 100 });
  expect(toXY(360, 10, 720, 200, 1)).toEqual({ x: 720, y: 0 }); // +10° is the top edge at stretch 1
  expect(toXY(90, -10, 720, 200, 1)).toEqual({ x: 180, y: 200 }); // -10° is the bottom edge
  expect(toXY(90, 2, 720, 200, 2)).toEqual({ x: 180, y: 60 }); // stretch 2 doubles the vertical scale
});

// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, test } from 'vitest';
import { pointerPercent, watchPointerLight } from './pointerLight';

let stop: () => void;
let button: HTMLButtonElement;

// A button 200 × 40 px with its top-left corner at (100, 50).
const BOX = { left: 100, top: 50, width: 200, height: 40 };

beforeEach(() => {
  button = document.createElement('button');
  button.innerHTML = '<span>Share</span>';
  button.getBoundingClientRect = () => ({ ...BOX, right: 300, bottom: 90, x: 100, y: 50, toJSON: () => ({}) });
  document.body.append(button);
  stop = watchPointerLight();
});

afterEach(() => {
  stop();
  button.remove();
});

const move = (target: Element, clientX: number, clientY: number, pointerType = 'mouse') =>
  target.dispatchEvent(new PointerEvent('pointermove', { clientX, clientY, pointerType, bubbles: true }));
const light = (el: HTMLElement = button) => [el.style.getPropertyValue('--pointer-x'), el.style.getPropertyValue('--pointer-y')];

test.each([
  { offset: 0, size: 200, percent: 0 },
  { offset: 50, size: 200, percent: 25 },
  { offset: 100, size: 200, percent: 50 },
  { offset: 200, size: 200, percent: 100 },
  { offset: 1, size: 3, percent: 33.3 },
  { offset: -10, size: 200, percent: 0 }, // just outside the left edge: held at the edge
  { offset: 250, size: 200, percent: 100 }, // just outside the right edge
])('pointerPercent($offset, $size) is $percent', ({ offset, size, percent }) => {
  expect(pointerPercent(offset, size)).toBe(percent);
});

test.each([
  { name: 'the top-left corner', x: 100, y: 50, expected: ['0%', '0%'] },
  { name: 'the middle', x: 200, y: 70, expected: ['50%', '50%'] },
  { name: 'the bottom-right corner', x: 300, y: 90, expected: ['100%', '100%'] },
  { name: 'a quarter in, near the bottom', x: 150, y: 80, expected: ['25%', '75%'] },
])('the mouse at $name of the button is written on it', ({ x, y, expected }) => {
  move(button, x, y);
  expect(light()).toEqual(expected);
});

test('the mouse over the label inside the button lights the button itself', () => {
  const label = button.querySelector('span') as HTMLSpanElement;
  move(label, 250, 60);
  expect(light()).toEqual(['75%', '25%']);
  expect(light(label)).toEqual(['', '']);
});

test.each(['touch', 'pen'])('a %s leaves the light at rest', (pointerType) => {
  move(button, 200, 70, pointerType);
  expect(light()).toEqual(['', '']);
});

test('the mouse over something that is not a button writes nothing', () => {
  const div = document.createElement('div');
  document.body.append(div);
  move(div, 200, 70);
  expect(light(div)).toEqual(['', '']);
  expect(light()).toEqual(['', '']);
  div.remove();
});

test('a button with no size yet writes nothing', () => {
  button.getBoundingClientRect = () => ({ left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => ({}) });
  move(button, 0, 0);
  expect(light()).toEqual(['', '']);
});

test('the latest move wins, and stopping ends the following', () => {
  move(button, 100, 50);
  move(button, 300, 90);
  expect(light()).toEqual(['100%', '100%']);
  stop();
  move(button, 200, 70);
  expect(light()).toEqual(['100%', '100%']);
});

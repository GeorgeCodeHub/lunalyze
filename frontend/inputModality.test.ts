// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, test } from 'vitest';
import { watchInputModality } from './inputModality';

let stop: () => void;
const modality = () => document.documentElement.dataset.modality;
const press = (key: string) => window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
const click = () => window.dispatchEvent(new Event('pointerdown', { bubbles: true }));

beforeEach(() => {
  stop = watchInputModality();
});

afterEach(() => stop());

test('nothing is recorded before the first Tab or click', () => {
  expect(modality()).toBeUndefined();
});

test('Tab records the keyboard, a click records the pointer, and the latest one wins', () => {
  press('Tab');
  expect(modality()).toBe('keyboard');
  click();
  expect(modality()).toBe('pointer');
  press('Tab');
  expect(modality()).toBe('keyboard');
});

test.each(['a', 'Enter', 'ArrowDown', 'Escape', ' ', ''])('the key "%s" after a click leaves the pointer recorded', (key) => {
  click();
  press(key);
  expect(modality()).toBe('pointer');
});

test('stopping removes the record and the listeners', () => {
  press('Tab');
  stop();
  expect(modality()).toBeUndefined();
  click();
  press('Tab');
  expect(modality()).toBeUndefined();
});

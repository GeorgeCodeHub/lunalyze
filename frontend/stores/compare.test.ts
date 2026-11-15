import { beforeEach, expect, test } from 'vitest';
import { usePlaybackStore } from './compare';

const state = () => {
  const { status, offsetH } = usePlaybackStore.getState();
  return { status, offsetH };
};

beforeEach(() => usePlaybackStore.getState().reset());

test('starts paused at the landing time', () => {
  expect(state()).toEqual({ status: 'paused', offsetH: 0 });
});

test('play then tick moves the playhead by the step; pause keeps it there', () => {
  const { play, tick, pause } = usePlaybackStore.getState();

  play(6);
  expect(state()).toEqual({ status: 'playing', offsetH: 0 });
  tick(708);
  tick(708);
  expect(state()).toEqual({ status: 'playing', offsetH: 12 });
  pause();
  expect(state()).toEqual({ status: 'paused', offsetH: 12 });
});

test('a tick while paused changes nothing', () => {
  usePlaybackStore.getState().seek(30);
  usePlaybackStore.getState().tick(708);
  expect(state()).toEqual({ status: 'paused', offsetH: 30 });
});

test('playback stops at the end of the time span, on the end exactly', () => {
  const { play, seek, tick } = usePlaybackStore.getState();

  seek(700);
  play(6);
  tick(708);
  expect(state()).toEqual({ status: 'playing', offsetH: 706 });
  tick(708);
  expect(state()).toEqual({ status: 'paused', offsetH: 708 });
});

test('seek jumps and pauses, and never goes before the landing time', () => {
  const { play, seek } = usePlaybackStore.getState();

  play(1);
  seek(48);
  expect(state()).toEqual({ status: 'paused', offsetH: 48 });
  seek(-10);
  expect(state()).toEqual({ status: 'paused', offsetH: 0 });
});

test('reset returns to the landing time, paused', () => {
  const { play, tick, reset } = usePlaybackStore.getState();

  play(72);
  tick(8760);
  reset();
  expect(state()).toEqual({ status: 'paused', offsetH: 0 });
});

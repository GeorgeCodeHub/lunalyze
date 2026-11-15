import { create } from 'zustand';

// The playhead of the Compare screen: how many hours after the landing time the screen is showing.
// The horizon strips, the 3D view, the timelines and the map all read it, so it lives in a store.
// A state machine: paused or playing; the named actions are the only transitions.
type PlaybackState =
  | { status: 'paused'; offsetH: number }
  | { status: 'playing'; offsetH: number; stepH: number }; // stepH: hours added on each clock tick

type PlaybackStore = PlaybackState & {
  /** Start moving forward by stepH hours per tick. */
  play: (stepH: number) => void;
  pause: () => void;
  /** Jump to a time (hours after landing, never before it). Moving the playhead by hand pauses playback. */
  seek: (offsetH: number) => void;
  /** One clock tick while playing. Playback stops at endH, the end of the time span shown. */
  tick: (endH: number) => void;
  /** Back to the landing time, paused: a new scenario starts here. */
  reset: () => void;
};

export const usePlaybackStore = create<PlaybackStore>()((set) => ({
  status: 'paused',
  offsetH: 0,
  play: (stepH) => set({ status: 'playing', stepH }),
  pause: () => set({ status: 'paused' }),
  seek: (offsetH) => set({ status: 'paused', offsetH: Math.max(0, offsetH) }),
  tick: (endH) =>
    set((s) => {
      if (s.status !== 'playing') return s;
      const next = s.offsetH + s.stepH;
      return next >= endH ? { status: 'paused', offsetH: endH } : { offsetH: next };
    }),
  reset: () => set({ status: 'paused', offsetH: 0 }),
}));

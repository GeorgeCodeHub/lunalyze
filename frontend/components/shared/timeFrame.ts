import { HOUR, ZOOM } from '../../../backend/lib/realView';
import type { Zoom } from '../../../backend/lib/types';
import type { Scenario } from '../../scenario';

/** The stretch of time the Compare screen shows, and the moment the playhead is on. */
export type TimeFrame = {
  zoom: Zoom;
  startMs: number; // the landing time: every window starts here
  spanH: number; // length of the time span shown, hours
  endH: number; // the last whole hour of the span: where the scrubber and playback stop
  stayH: number; // mission length, hours
  offsetH: number; // the playhead, hours after landing
  nowMs: number; // the playhead as a time
};

/** Playback pace per time span: whole hours per tick, so the playhead stays on the scrubber's 1-hour steps. */
export const PLAYBACK: Record<Zoom, { stepH: number; tickMs: number }> = {
  day: { stepH: 1, tickMs: 500 },
  lunarDay: { stepH: 6, tickMs: 150 },
  year: { stepH: 72, tickMs: 150 },
};

/** playheadH is clamped into the span, so a playhead left over from a longer span still lands inside. */
export const timeFrame = (scenario: Pick<Scenario, 'start' | 'zoom' | 'stay'>, playheadH: number): TimeFrame => {
  const { spanH } = ZOOM[scenario.zoom];
  const endH = Math.floor(spanH);
  const offsetH = Math.min(Math.max(0, playheadH), endH);
  const startMs = scenario.start.getTime();
  return { zoom: scenario.zoom, startMs, spanH, endH, stayH: scenario.stay * 24, offsetH, nowMs: startMs + offsetH * HOUR };
};

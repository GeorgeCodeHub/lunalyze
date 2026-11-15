export type DurationParts = { days: number; hours: number; minutes: number };

/**
 * A length of time in hours, split for reading aloud. A day or longer is rounded to the hour
 * (37.12 → 1 day 13 hours); anything shorter is rounded to the minute (11.71 → 11 hours 43 minutes).
 */
export const durationParts = (lengthH: number): DurationParts => {
  if (lengthH >= 24) {
    const whole = Math.round(lengthH);
    return { days: Math.floor(whole / 24), hours: whole % 24, minutes: 0 };
  }
  const minutes = Math.max(0, Math.round(lengthH * 60));
  return { days: 0, hours: Math.floor(minutes / 60), minutes: minutes % 60 };
};

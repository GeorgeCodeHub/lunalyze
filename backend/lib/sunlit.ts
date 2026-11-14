// Share of hourly samples where the Sun centre is above the terrain mask: the PGDA 69 gate's sample-share rule.
// The app's sunlitPct is lane time in realView.ts.
import { sky } from './lunar';
import { MAST_KM, maskElev } from './realView';

const HOUR = 3600e3;
const MASK_POINTS = 720; // 0.5° azimuth step

/** elevDeg: 720 mask elevations, index = floor(az * 2). Samples start + h hours, h = 0..hours-1; Sun el > mask el counts as sunlit. */
export const sunlitFraction = (elevDeg: number[], lat: number, lon: number, start: Date, hours: number): number => {
  if (elevDeg.length !== MASK_POINTS) throw new Error(`mask must have ${MASK_POINTS} points, got ${elevDeg.length}`);
  if (!Number.isInteger(hours) || hours < 1) throw new Error(`hours must be an integer of at least 1, got ${hours}`);
  let lit = 0;
  for (let h = 0; h < hours; h++) {
    const { sun } = sky(lat, lon, MAST_KM, new Date(start.getTime() + h * HOUR));
    if (sun.el > maskElev(elevDeg, sun.az)) lit++;
  }
  return lit / hours;
};

import type { Stay } from '../../scenario';

/** The copy-key name of each mission length: t(`setup.stay.${STAY_KEY[stay]}`), t(`fit.stay.${STAY_KEY[stay]}`). */
export const STAY_KEY = { 1: 'day', 3: 'threeDays', 7: 'week', 14: 'twoWeeks', 30: 'month' } as const satisfies Record<Stay, string>;

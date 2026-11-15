/**
 * How the side panel shows the places. compare: every place small. single: one place in full, the one
 * chosen with the switch (null: the first, the best option). The live view follows it: in single it
 * shows only that place.
 */
export type SideView = { mode: 'compare' | 'single'; chosen: string | null };

export const SIDE_VIEW_START: SideView = { mode: 'compare', chosen: null };

/** The key of the place shown in single: the chosen one while it is on screen, else the first; null when none. */
export const shownKey = (keys: string[], chosen: string | null) => (chosen !== null && keys.includes(chosen) ? chosen : (keys[0] ?? null));

/** The keys the live view shows: all of them in compare, only the shown place in single. */
export const liveKeys = (view: SideView, keys: string[]) => {
  if (view.mode === 'compare') return keys;
  const key = shownKey(keys, view.chosen);
  return key === null ? [] : [key];
};

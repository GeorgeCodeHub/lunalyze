// The data contract between src/lib (George) and src/components (Christina). See docs/DATA_CONTRACT.md.

// Display text (site name, blurb, group label) lives in src/locales/<lang>/sites.json, keyed by id.
export type Site = {
  id: string;
  lat: number;
  lon: number; // east, -180..180
  kind: 'landed' | 'planned' | 'artemis-region' | 'reference';
  precision: 'exact' | 'proxy';
  terrainModeled: boolean;
  group: 'Apollo' | 'CLPS' | 'Artemis regions' | 'International' | 'Reference points';
  source: string;
};

export type Body = { az: number; el: number; hidden: boolean };
export type Countdown = { kind: 'set' | 'rise'; hours: number | null };
export type Interval = [string, string]; // ISO UTC
export type Zoom = 'day' | 'lunarDay' | 'year';

export type SiteView = {
  site: Site;
  fixture: boolean;
  metrics: { sunElDeg: number; sunlitPct: number; earthPct: number; longestBlackoutH: number; panelOutputPct: number };
  countdown: { sun: Countdown; earth: Countdown };
  sky: {
    terrain: [number, number][];
    sun: Body;
    earth: Body;
    sunPath: [number, number][];
    earthPath: [number, number][];
    athensSunPath: [number, number][];
  };
  lanes: { sun: Interval[]; earth: Interval[]; both: Interval[] };
};

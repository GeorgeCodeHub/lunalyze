# Data contract

JSON shapes shared by the terrain pipeline (Python) and the app (TypeScript). Change them here first.

```ts
type Site = {
  id: string;
  name: string;
  lat: number;
  lon: number; // east, -180..180
  kind: 'landed' | 'planned' | 'artemis-region' | 'reference';
  precision: 'exact' | 'proxy';
  terrainModeled: boolean;
  blurb: string;
  source: string;
};

type HorizonMask = {
  siteId: string;
  mastM: 1 | 2 | 5;
  azStepDeg: 0.5;
  elevDeg: number[];     // 720
  incomplete: boolean[]; // ray left DEM
};

type SiteMetrics = {
  sunlitPct: number;
  earthPct: number;
  longestBlackoutH: number;
  firstOperableDays: number;
  nextSunset: string | null;
  nextEarthset: string | null;
};
```

## Files

| File | Shape | Issue |
|------|-------|-------|
| `public/data/sample/*.json` | sample data for Point A, Malapert M1, Apollo 11 (flat horizon, real Sun/Earth) | G3 |
| `public/data/masks/<siteId>_<mast>m.json` | `HorizonMask`, one per `terrainModeled` site × mast 1/2/5 m | G4 |
| `sites.json` | `Site[]` (names and blurbs from C6) | C6 |

## Sites

Latitude and east longitude are fixed. The `id` and `kind` columns are proposals made at setup: confirm them in G3.
`precision` is `proxy` where the site name says so. `terrainModeled` is `false` only for Apollo 11 and Chang'e 4.

| id | name | lat | lon (E) | kind (proposed) | precision | terrainModeled |
|----|------|-----|---------|-----------------|-----------|----------------|
| `point-a` | Point A | -89.68 | -166.0 | reference | exact | true |
| `point-b` | Point B | -89.44 | -141.8 | reference | exact | true |
| `point-c` | Point C / de Gerlache Rim 2 | -88.71 | -68.7 | artemis-region | proxy | true |
| `point-d` | Point D / Chang'e-7 target | -88.79 | 124.5 | planned | exact | true |
| `malapert-m1` | Malapert M1 / Malapert Massif | -86.04 | 2.7 | artemis-region | proxy | true |
| `im-2` | IM-2 / Mons Mouton | -84.7906 | 29.1958 | landed | exact | true |
| `haworth` | Haworth | -86.90 | -4.00 | artemis-region | exact | true |
| `nobile` | Nobile / Griffin-1 | -85.28 | 53.27 | planned | proxy | true |
| `slater` | Slater | -88.08 | 111.29 | artemis-region | exact | true |
| `cabeus-b` | Cabeus B | -85.33 | -42.13 | artemis-region | proxy | true |
| `im-1` | IM-1 Odysseus | -80.13 | 1.44 | landed | exact | true |
| `apollo-11` | Apollo 11 | 0.6742 | 23.4731 | landed | exact | false |
| `change-4` | Chang'e 4 | -45.4561 | 177.5886 | landed | exact | false |

Artemis regions: show as circles labelled "approximate".
Sites with `terrainModeled: false` have no horizon mask; the app uses a flat horizon and shows the "terrain not modeled" caveat.

# Data contract

What `backend/lib/` (George) gives to `frontend/components/` (Christina), and the files behind it.
The types live in [backend/lib/types.ts](../backend/lib/types.ts). Change them there and here together.

## The one hook components use

```ts
import { useScenario } from '../backend/lib/useScenario';

const { views, loading, error } = useScenario(siteIds, t, zoom, { terrain });
// siteIds: string[]   ids from backend/public/data/sites.json, up to 3
// t: Date             the window starts here
// zoom: 'day' | 'lunarDay' | 'year'
// terrain: boolean    false = flat 0° horizon (the flat-or-terrain switch). Default true.
// views: SiteView[]   one per site, same order as siteIds
// loading: boolean    true until the site list and every asked-for site have loaded
// error: Error | null set when the site list or a site's data failed to load (a missing file
//                     is "no data yet": that site is left out of views, error stays null)
```

- The hook uses TanStack Query, so it must render inside `QueryClientProvider` (`frontend/main.tsx` provides it; tests wrap their own).

- Every number in a `SiteView` is for the window that starts at `t`: 24 h for `day`, 29.53 days for `lunarDay`, 365 days for `year`.
- `sky.sun`, `sky.earth`, `countdown` and `metrics.sunElDeg` / `panelOutputPct` are for the moment `t`.
- Play button: call the hook once with the scenario date (lanes, metrics) and once with the playhead time (`sky`, `countdown`). Files are fetched once and cached.
- A site with no data yet is left out of `views`. Today only `point-a`, `malapert-m1` and `apollo-11` have fixtures.
- The signature is final. G6/G7 put real data behind it; components do not change.

### `fixture: true` means fake terrain

Fixtures use real Sun and Earth positions but an invented horizon. **Never show a fixture's numbers as real.**
If `view.fixture` is `true` in a build that is going out, say so on screen. Fixture samples cover
2028-03-01 to 2028-03-30 and repeat after that, so other dates are not real either.

## Types

```ts
type Site = {
  id: string; lat: number; lon: number; // lon east, -180..180
  kind: 'landed' | 'planned' | 'artemis-region' | 'reference';
  precision: 'exact' | 'proxy';      // proxy: show as "approximate"
  terrainModeled: boolean;            // false: flat horizon, show the "terrain not modeled" caveat
  group: 'Apollo' | 'CLPS' | 'Artemis regions' | 'International' | 'Reference points';
  source: string;
};
// Display text is not in the data. Name, blurb and group label come from the `sites` locale
// namespace, keyed by id: t('point-a.name', { ns: 'sites' }), t('groups.CLPS', { ns: 'sites' }).
type Body = { az: number; el: number; hidden: boolean };       // degrees; hidden = behind the horizon
type Countdown = { kind: 'set' | 'rise'; hours: number | null }; // null = no change within one lunar day
type Interval = [string, string];                              // ISO UTC start, end
type Zoom = 'day' | 'lunarDay' | 'year';
type SiteView = {
  site: Site; fixture: boolean;
  metrics: { sunElDeg: number; sunlitPct: number; earthPct: number; longestBlackoutH: number; panelOutputPct: number };
  countdown: { sun: Countdown; earth: Countdown };
  sky: { terrain: [number, number][]; sun: Body; earth: Body; sunPath: [number, number][];
         earthPath: [number, number][]; athensSunPath: [number, number][] };
  lanes: { sun: Interval[]; earth: Interval[]; both: Interval[] };
};
```

| Field | Meaning |
|---|---|
| `metrics.sunElDeg` | Sun elevation at `t`, degrees |
| `metrics.sunlitPct`, `earthPct` | share of the window with the Sun / Earth above the horizon |
| `metrics.longestBlackoutH` | longest period in the window with no Sun and no Earth, hours. Limit: 50 h |
| `metrics.panelOutputPct` | share of the Sun's disc above the horizon at `t` |
| `countdown.sun` | body is up → `kind: 'set'`, hours until it goes behind the horizon. Body is down → `kind: 'rise'` |
| `sky.terrain` | horizon outline, `[az, el]` pairs from azimuth 0 to 360 |
| `sky.sunPath`, `earthPath` | `[az, el]` from `t` across the window: every 1 h (`day`, `lunarDay`) or 12 h (`year`) |
| `sky.athensSunPath` | Sun at Athens (37.98N, 23.73E), `[az, el]` every hour for 24 h |
| `lanes.both` | periods with Sun and Earth together |

All angles are degrees. Azimuth: 0 = north, 90 = east, 0..360. Paths can jump from 360 to 0: start a new line when azimuth jumps by more than 180.

## Drawing: `toXY`

```ts
import { toXY } from '../backend/lib/toXY';
toXY(az, el, width, height, stretch) // → { x, y } in SVG pixels
// x = az / 360 * width
// y = height / 2 - el * stretch * (height / 20)     stretch 1 shows -10°..+10°
```

## Files in `backend/public/data/`

| File | Contents | Made by |
|---|---|---|
| `sites.json` | `Site[]`, 13 sites (no display text) | by hand |
| `frontend/locales/en/sites.json` | site names, blurbs, group labels | C6 |
| `fixtures/<siteId>.json` | hourly Sun/Earth for one lunar day from 2028-03-01, fake terrain, `fixture: true` | `npm run fixtures` (`backend/scripts/make_fixtures.ts`) |
| `masks/<siteId>.json` | real horizon at mast height 2 m | G4, `backend/scripts/horizon_masks.py` |
| `terrain/<siteId>.bin` + `.json` | terrain crop for the 3D view | G4 |

### `masks/<siteId>.json`

```ts
type HorizonMask = {
  siteId: string;
  mastM: 2;
  azStepDeg: 0.5;
  elevDeg: number[];     // 720 values; index i is azimuth i × 0.5°
  incomplete: boolean[]; // 720 values; true = the ray left the DEM, so the horizon may be higher
};
```

### `terrain/<siteId>.bin` and `terrain/<siteId>.json`

- `.bin`: 500 × 500 signed 16-bit integers, little-endian, row by row. A crop of `ldem_80s_80m` centred on the site. Height in metres = value × 0.5, above the 1737.4 km sphere.
- `.json`: `{ siteId, width: 500, height: 500, pixelM: 80, origin }`. `origin` is the polar-stereographic position of the first pixel in metres. G4 fixes the exact field names when it writes the first file.

### `fixtures/<siteId>.json`

Type `FixtureFile` in [backend/lib/fixtureView.ts](../backend/lib/fixtureView.ts): `terrain` (721 points), `sun` and `earth` (709 hourly `[az, el]`), `athensSunPath`, and `view`, a ready `SiteView` for 2028-03-01, zoom `lunarDay`.
Only `useScenario` reads these files. They go away in G7.

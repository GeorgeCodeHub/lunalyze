# Data contract

What `backend/lib/` (George) gives to `frontend/components/` (Christina), and the files behind it.
The types live in [backend/lib/types.ts](../backend/lib/types.ts). Change them there and here together.

## The one hook components use

```ts
import { useScenario } from '../backend/lib/useScenario';

const { views, loading, error } = useScenario(siteIds, t, zoom, { terrain });
// siteIds: string[]   ids from backend/public/data/sites.json, or `@lat:lon` for typed coordinates, up to 3
// t: Date             the window starts here
// zoom: 'day' | 'lunarDay' | 'year'
// terrain: boolean    false = flat 0° horizon (the flat-or-terrain switch). Default true.
// views: SiteView[]   one per site, same order as siteIds
// loading: boolean    true while any asked-for site is still loading (see below)
// error: Error | null set when the site list, a mask or the computation failed (a missing mask
//                     file is "no data yet": that site is left out of views, error stays null)
```

- The hook uses TanStack Query, so it must render inside `QueryClientProvider` (`frontend/main.tsx` provides it; tests wrap their own).

- Every number in a `SiteView` is for the window that starts at `t`: 24 h for `day`, 29.53 days for `lunarDay`, 365 days for `year`.
- `sky.sun`, `sky.earth`, `countdown` and `metrics.sunElDeg` / `panelOutputPct` are for the moment `t`.
- Play button: call the hook once with the scenario date (lanes, metrics) and once with the playhead time (`sky`, `countdown`). Files are fetched once and cached.
- A site with `terrainModeled: false` (apollo-11, change-4) gets the flat horizon `[[0, 0], [360, 0]]` and stays in `views`.
- Typed coordinates: the id `@lat:lon` (the app's link token, lat north, lon east) gives a `Site` with `kind: 'typed'`,
  `group: 'Typed coordinates'`, `precision: 'exact'`, and `terrainModeled` true when the point is inside the 240 m DEM.
  With terrain on, its horizon is computed in the browser from the DEM tiles (below), with the same sampling as
  `horizon_masks.py` and the 20 m band always on. Off the DEMs it gets the flat horizon. A typed id off the Moon's map
  (`@-91:0`) is left out of `views`. Missing tiles are an `error`. A typed place has no name in `sites.json`.
  The app accepts typed latitudes from −78° to −90° only (`validCoords` in `frontend/scenario.ts`): the live map's area.
- With terrain on, a modeled site with no mask file yet is left out of `views`, and so is an id that is not in `sites.json` (nothing is fetched for it). With terrain off, a modeled site needs no mask file: nothing is fetched for it and it stays in `views`.
- The signature is final; the data behind it is real.
- When `t` changed and zoom and terrain did not, each site that was already shown keeps its view from the last `t` that fully loaded, so nothing blinks; a newly added site appears once it loads, and `loading` stays true until every new view has arrived.
- A view that fails is not retried: `error` is set at once.

### The data is real

Sun and Earth positions come from the astronomy engine, the horizon from `masks/<siteId>.json` (typed coordinates: from `dem/` tiles).

- The observer stands 2 m above the 1737.4 km Moon sphere.
- A body is visible when its centre is above the mask bin `elevDeg[floor(az·2)]` (a step lookup, no interpolation). With terrain off, or no mask, the horizon is 0°.
- `sunElDeg` is the raw Sun elevation, not relative to the horizon.
- `panelOutputPct` is the exact share of the Sun's disc above the horizon at `t`.
- Countdowns and lane edges are accurate to about 1 minute. The scan is hourly, so a set and a rise inside the same hour can be missed.
- `athensSunPath` is 25 hourly points: 24 h from `t`.
- `horizonIncomplete` is true when terrain is on and the loaded mask has at least one `incomplete` bin. Today that is `im-1` only (300.5°–56.5°, 233 of 720 bins). Its mask values there are lower bounds: the real horizon may be higher, so the Sun and Earth numbers are upper bounds. Show a caveat.

## Types

```ts
type Site = {
  id: string; lat: number; lon: number; // lon east, -180..180
  kind: 'landed' | 'planned' | 'artemis-region' | 'reference' | 'typed'; // typed: id `@lat:lon`, not in sites.json
  precision: 'exact' | 'proxy';      // proxy: show as "approximate"
  terrainModeled: boolean;            // false: flat horizon, show the "terrain not modeled" caveat
  group: 'Apollo' | 'CLPS' | 'Artemis regions' | 'International' | 'Reference points' | 'Typed coordinates';
  source: string;
};
// Display text is not in the data. Name, blurb and group label come from the `sites` locale
// namespace, keyed by id: t('point-a.name', { ns: 'sites' }), t('groups.CLPS', { ns: 'sites' }).
type Body = { az: number; el: number; hidden: boolean };       // degrees; hidden = behind the horizon
type Countdown = { kind: 'set' | 'rise'; hours: number | null }; // null = no change within one lunar day
type Interval = [string, string];                              // ISO UTC start, end
type Zoom = 'day' | 'lunarDay' | 'year';
type SiteView = {
  site: Site;
  horizonIncomplete: boolean; // terrain on and the loaded mask has an incomplete bin: horizon values are lower bounds
  metrics: { sunElDeg: number; sunlitPct: number; earthPct: number; longestBlackoutH: number; panelOutputPct: number };
  countdown: { sun: Countdown; earth: Countdown };
  sky: { terrain: [number, number][]; sun: Body; earth: Body; sunPath: [number, number][];
         earthPath: [number, number][]; athensSunPath: [number, number][] };
  lanes: { sun: Interval[]; earth: Interval[]; both: Interval[] };
};
```

| Field | Meaning |
|---|---|
| `metrics.sunElDeg` | raw Sun elevation at `t`, degrees (not relative to the horizon) |
| `metrics.sunlitPct`, `earthPct` | share of the window with the Sun / Earth above the horizon |
| `metrics.longestBlackoutH` | longest period in the window with no Sun and no Earth, hours. Limit: 50 h |
| `metrics.panelOutputPct` | exact share of the Sun's disc above the horizon at `t` |
| `countdown.sun` | body is up → `kind: 'set'`, hours until it goes behind the horizon. Body is down → `kind: 'rise'` |
| `sky.terrain` | horizon outline, `[az, el]` pairs from azimuth 0 to 360 (721 points; flat `[[0, 0], [360, 0]]`) |
| `sky.sunPath`, `earthPath` | `[az, el]` from `t` across the window: every 1 h (`day`, `lunarDay`) or 12 h (`year`) |
| `sky.athensSunPath` | Sun at Athens (37.98N, 23.73E), `[az, el]` every hour for 24 h from `t` (25 points) |
| `lanes.both` | periods with Sun and Earth together |
| `horizonIncomplete` | `true`: the mask has incomplete bins (terrain on); treat terrain-dependent numbers as limits |

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
| `masks/<siteId>.json` | real horizon at mast height 2 m | G4, `backend/scripts/horizon_masks.py` |
| `terrain/<siteId>.bin` + `.json` | terrain crop for the 3D view | G4 |
| `dem/<dem>/<row>-<col>.bin` | LOLA DEM tiles for typed coordinates; **not in git** (about 195 MB) | `backend/scripts/dem_tiles.py` |

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

### `dem/<dem>/<row>-<col>.bin`

- `<dem>` is `ldem_85s_20m`, `ldem_80s_80m` or `ldem_75s_240m`. Each is cut into 512 × 512 tiles; tile (row, col)
  holds DEM pixels [512·row, 512·row + 512) × [512·col, 512·col + 512), zero-padded past the edge.
- Each tile row is stored as differences from the pixel before it (int16, wrapping), then all low bytes, then all
  high bytes, deflated in the zlib format (RFC 1950). Heights in metres = value × 0.5, above the 1737.4 km sphere.
- Make them with `uv run backend/scripts/dem_tiles.py` after `download_dems.py`. `pnpm horizon-parity` checks that
  `backend/lib/horizon.ts` gives every listed site its committed mask and terrain crop back from these tiles.

### `terrain/<siteId>.bin` and `terrain/<siteId>.json`

- `.bin`: 500 × 500 signed 16-bit integers, little-endian, row by row. A crop of `ldem_80s_80m` centred on the site. Height in metres = value × 0.5, above the 1737.4 km sphere.
- `.json`: `{ siteId, width: 500, height: 500, pixelM: 80, origin: { x, y } }`. `origin` is the polar-stereographic position in metres of the centre of the first pixel (row 0, column 0): south pole at (0, 0), +x toward 90°E, +y toward 0° longitude. Pixel (row r, column c) is centred at (x + 80c, y − 80r); latitude = −90° + 2·atan(√(x²+y²) / 3 474 800 m), longitude = atan2(x, y).

### `useTerrain(siteId)` (`backend/lib/useTerrain.ts`)

Call it only for sites with `terrainModeled: true`. It fetches `terrain/<siteId>.json` and `.bin`; for typed coordinates
(`@lat:lon`) it cuts the same 500 × 500 crop from the `dem/` tiles, as `terrain_crop()` in `horizon_masks.py` does. It returns `{ grid: TerrainGrid | null, loading: boolean, error: Error | null }`.

```ts
type TerrainGrid = {
  siteId: string;
  width: number;                    // columns, 500
  height: number;                   // rows, 500
  pixelM: number;                   // 80
  origin: { x: number; y: number }; // polar-stereographic m, centre of pixel (0, 0)
  heightsM: Float32Array;           // width × height, row by row
};
```

- Units: `origin` and `pixelM` in metres; `heightsM` in metres above the 1737.4 km sphere (int16 value × 0.5).
- Frame: south-polar stereographic, +x toward 90°E, +y toward 0° longitude; pixel (row r, column c) is centred at (x + pixelM·c, y − pixelM·r).
- Errors: `error` is set and `grid` is null when either file answers with an HTTP error, the `.json` is not JSON, or the `.bin` is not `width × height × 2` bytes. A failed load is not retried.

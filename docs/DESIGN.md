# Design brief: Lunar Landing Site Navigator

Owner: Christina (design and UI). Data and calculations: George.
Read with [PLAN.md](PLAN.md) (schedule, cut order) and [DATA_CONTRACT.md](DATA_CONTRACT.md) (data shapes).
The [README rules](../README.md#rules-that-must-never-be-broken) outrank this brief.

## The question

**Which landing site offers the best conditions, and when?**

> Find the right place. Choose the right time.

We are building a decision-support tool, not a Moon visualisation. Anything that does not help answer
the question above is cut first when time runs short.

## Who it is for

| User | What they need |
|---|---|
| Mission planners | Compare sites and dates, see the numbers behind the answer |
| Teachers | Explain why sunlight and seeing Earth matter at the south pole |
| The public | Explore the Moon and understand why landing spots matter |

Everyone must be able to read the screen without knowing orbital mechanics. Planners get the detail
through progressive disclosure (explanations and exact numbers one step away), not by making the first
view harder for everyone else.

## Design principles

1. **Plain words over jargon.** "Time in sunlight", not "illumination fraction". See [Words we use](#words-we-use).
2. **Comparison over exploration.** The side-by-side comparison is the main feature.
3. **Honest data.** Test data says so on screen. Every number has a unit, a time range and a source.
   Visuals never invent numbers: every number comes from `src/lib/`.
4. **Progressive disclosure.** The answer first, the reason one step away, the raw numbers after that.
5. **One visual language.** The Sun and Earth look the same everywhere: same marker shape, same label,
   same "hidden" style. Colour is never the only signal: hidden is dashed, visible is solid.

## User journey

1. **Set up:** pick places, a landing date and time, how flexible the date is, and how long the mission stays.
2. **Compare:** see each place side by side for the same dates.
3. **Understand:** see where the Sun and Earth are, and when hills hide them.
4. **Adjust:** change the date, add or swap a place, flip terrain off and on.
5. **Decide:** each place is labelled "Fits your mission" or "Risky", with the reason.

A shared link holds the whole setup in the URL and skips step 1.

## Screen layout

One screen, **Compare**, with two states.

### State 1: setup (nothing picked yet)

A short form in the middle of the screen. Copy:

1. **Where do you want to land?** Up to 3 places from a list, grouped as "Artemis regions", "Landed
   missions" and so on. (Typing a location is P2.)
2. **When do you want to land?** Date and time, labelled "Time is in UTC (world time)".
   Default: 1 March 2028 00:00, the start of the test data.
3. **How flexible is the date?**
   | Choice | Hint | Data window (`zoom`) |
   |---|---|---|
   | That day only | Next 24 hours | `day` |
   | Within a month | One Moon day | `lunarDay` |
   | Any time that year | Find the best weeks | `year` |
4. **How long will the mission stay on the Moon?** "One Moon day lasts about 29.5 Earth days."
   | Choice | Hint |
   |---|---|
   | ½ Moon day | about 15 days |
   | 1 Moon day | about 30 days |
   | 2 Moon days | about 59 days |
   | 3 Moon days | about 89 days |

   If time runs short, ship only ½ and 1 Moon day: they fit inside the data we already load.

Button: **Show on the map**.

### State 2: comparison

| Region (folder) | What it shows |
|---|---|
| Scenario bar (`scenario-bar/`) | The four setup answers, editable in place; flat-or-terrain switch; share link |
| Site columns (`site-columns/`) | One column per place, side by side, each holding the regions below |
| Fit label (in the site column) | "Fits your mission" or "Risky", with a one-line reason |
| Horizon strip (`horizon-strip/`) | Panorama from the landing spot: hills, Sun and Earth. Dashed = hidden by hills |
| Countdown chips (`countdowns/`) | "Sunset in 3 days 14 hours", "Earthrise in 6 hours" |
| Metric cards (`metric-cards/`) | Time in sunlight, time Earth is in view, longest dark period, Sun visible now |
| Timeline lanes (`timeline/`) | Bars for Sun, Earth, and both together, with a play button |
| Site picker (`site-picker/`) | The list, and the south-pole map once it exists (P1) |

### Visibility states

| State | When | How it looks |
|---|---|---|
| Visible | The body is above the hills | Solid marker, label "Visible" |
| Partly hidden | Sun only: part of its disc is behind the hills (`panelOutputPct` between 0 and 100) | Half-filled marker, label "Partly hidden" |
| Hidden | The body is behind the hills or below the horizon | Dashed marker, label "Hidden" |

### Fit labels

| Label | Rule (computed in `src/lib/`) | Reason line, example |
|---|---|---|
| Fits your mission | No period without Sun and Earth longer than 50 hours during the stay | "Dark for at most 20 hours at a time" |
| Risky | At least one such period longer than 50 hours | "No Sun or Earth for 3 days from 12 March" |

Places are labelled, never hidden from the list, so people can see why a place does not work.

### Every state is designed

Loading, error, no place picked, a place with no data yet, test data (banner), terrain not modelled
(caveat), approximate location (`precision: 'proxy'`, "approximate" note).

## Words we use

Copy lives in `src/locales/en/`. Use these words on screen:

| Data field | On screen |
|---|---|
| `metrics.sunlitPct` | Time in sunlight |
| `metrics.earthPct` | Time Earth is in view |
| `metrics.longestBlackoutH` | Longest time with no Sun and no Earth |
| `metrics.panelOutputPct` | How much of the Sun is visible now |
| `metrics.sunElDeg` | How high the Sun is |
| `countdown.sun` / `.earth` | Sunset in…, Sunrise in…, Earthset in…, Earthrise in… |
| `lanes.both` | Sun and Earth together |
| azimuth / elevation | Direction / height above the horizon |
| lunar day | Moon day (about 29.5 Earth days) |

## Priorities

Matches the never-cut list and cut order in [PLAN.md](PLAN.md).

**P0: must have**
- Setup step: places, date and time, flexibility, mission length
- Pick up to 3 places from a list
- Horizon strip: Sun and Earth in the sky, dashed when hidden by hills
- Countdown chips and metric cards
- Timeline lanes with play button
- Fit label per place, with reason
- Compare at least 2 places side by side
- Flat-or-terrain switch
- Test-data banner and NASA data credits

**P1: should have**
- South-pole map for picking places
- Site information (one plain-language line per place)
- Best-time summary: "Best time to land here: 5–9 March"
- Shareable link

**P2: nice to have**
- 3D view of the ground around a place
- Height map layer on the south-pole map
- Typing your own location
- Automatic best-place and best-date suggestions
- Scoring across several factors
- Exportable comparison report

## Requests for George (`src/lib/`)

Each needs both owners to agree, and [DATA_CONTRACT.md](DATA_CONTRACT.md) changes in the same commit.

| # | Request | Needed for | Priority |
|---|---|---|---|
| 1 | Fit check: given a start time and a stay length, return fits / risky and the longest gap with its start time | Fit label | P0 |
| 2 | Stays longer than one Moon day: fit check over the year data | 2 and 3 Moon day choices | P1 |
| 3 | Longest gap without Earth in view (communication gap) | Metric card | P1 |
| 4 | Best start time within the flexible window for a given stay | Best-time summary | P1 |
| 5 | Comparison facts for a fill-in-the-blanks sentence ("Site A gets more sunlight, Site B sees Earth more") | Comparison summary | P2 |
| 6 | Results for places without precomputed hills (flat horizon, flagged) | Typing your own location | P2 |

## Demo scenario

1. Pick Point A and Malapert M1, 1 March 2028, "Within a month", 1 Moon day.
2. Show the side-by-side comparison and the fit labels.
3. Flip terrain off: the hills stop hiding the Sun, and the answer changes. Terrain matters.
4. Move the date and show the recommendation change.

## Data and credits

Sun and Earth positions: astronomy-engine, checked against NASA JPL Horizons to within 0.01°.
Hills: NASA LRO LOLA south-pole height maps (PGDA 69, PGDA 90). Credit both on screen.
Pictures made with AI carry no NASA logos. NASA pictures are credited.

## Open questions

- Where the checklist lives: a comment on GitHub issue #25 (pending GitHub access).
- Whether the fit rule should also require Earth in view for a minimum share of the stay.

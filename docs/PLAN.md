# RGX – Lunar Landing Site Navigator: plan

Team RGX (George + Christina), NASA Space Apps 2026, challenge "Lunar Landing Site Navigator".
Live tracking: [#25 [RGX] Plan, gates, cut order](https://github.com/GeorgeCodeHub/rgx-lunar-navigator/issues/25). Data shapes: [DATA_CONTRACT.md](DATA_CONTRACT.md).

## Product

Browser-only planner for the lunar south pole. Question it answers: **"Which site, and which week?"**

- **Horizon strip:** azimuth on x, elevation ±10° on y, terrain outline, Sun (amber) and Earth (blue) move with a time scrubber. Dashed line = terrain hides the body.
- **Timeline:** one row per site, Sun-visible and Earth-visible bars, overlap highlighted, shared time axis.
- **Cards per site:** sunlit %, Earth-visible %, longest period with no Sun and no Earth (limit 50 h, VIPER survival budget), first period ≥6 days with Sun + Earth after landing.
- **Switches:** flat-or-terrain horizon, mast height 1/2/5 m, Planner/Explorer mode. Shareable scenario URLs.

**Stack:** Vite + React + TypeScript, D3 drawn as React SVG, astronomy-engine (`lunar.js`, already checked against JPL Horizons to 0.006°), CSS variables from Figma variables, Python + numpy memmap + Pillow for terrain, vitest, GitHub Actions, Vercel. Stretch only: CesiumJS + Cesium Moon.

**Hard deadline:** Sun 2026-11-15 23:59 Europe/Athens.

## Milestones (Europe/Athens)

| # | When | Gate |
|---|------|------|
| M1 | Sat 15:30 | Sample data to design |
| M2 | Sat 17:00 | Wireframes + tokens |
| M3 | Sat 19:00 | Horizon-mask gate |
| M4 | Sat 22:00 | Final screens |
| M5 | Sun 12:00 | Deployed URL |
| M6 | Sun 16:00 | Feature freeze |
| M7 | Sun 21:00 | Submitted |

## Cut order if late

1. S1 Cesium
2. Explorer mode
3. Mast slider (ship 2 m only)
4. G9 landing-window finder

**Never cut:** horizon strip, timeline, cards, flat-or-terrain switch.

## Disqualification checklist

Tick these in the tracking issue, not here.

- Video ≤30 s or ≤7 slides
- English subtitles
- All links public, no login
- AI images watermarked, no NASA logos in AI content
- Both members registered at the same Local Event
- NASA data named
- Deadline confirmed with Local Lead

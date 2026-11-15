# RGX – Lunalyze: plan

Team RGX (George + Christina), NASA Space Apps 2026, challenge "Lunar Landing Site Navigator".
Live tracking, issue links and the disqualification checklist: [#25 Plan, gates, cut order](https://github.com/GeorgeCodeHub/lunalyze/issues/25).

## Deadline
**Submit by Sun 2026-11-15 13:30 Europe/Athens. Hard stop 15:00.**

- Open question (tick it in #25): confirm whether 15:00 is the Space Apps cutoff or the local event deadline

## Product
Browser-only planner for the lunar south pole. Question it answers: **"Which site, and which week?"**
One Compare screen: up to 3 sites side by side, a date, and a zoom (Day / Lunar day / Year).

- **Horizon strip:** azimuth on x, elevation ±10° on y, terrain outline, Sun and Earth. Dashed = terrain hides the body.
- **Countdown chips:** "Sunset in 3d 14h", "Earthrise in …".
- **Metric cards** with change badges vs the previous scenario.
- **Timeline lanes** (Sun, Earth, both) with a play button.
- **Flat-or-terrain switch** and a shareable scenario URL. Mast height is fixed at 2 m.

## Locked stack
- Vite + React + TypeScript 6.0 with the React Compiler, vitest, ESLint, React Doctor, GitHub Actions, Vercel
- pnpm only, packages at least 7 days old
- TanStack Query behind `useScenario` for data; Zustand for shared UI state (added with the first store)
- react-i18next, English only (all copy in `frontend/locales/en/`)
- CSS Modules. No Tailwind, no UI library
- Plain SVG in components. No D3
- astronomy-engine, used only inside `backend/lib/`
- Python + numpy for the terrain pipeline in `backend/scripts/`
- Stretch only: `@react-three/fiber` + `@react-three/drei` (G12)

## Ownership
- **George** → `backend/`
- **Christina** → `frontend/`

The source of truth is [CODEOWNERS](../CODEOWNERS).

How we write code: [AGENTS.md](../AGENTS.md). `pnpm check` must pass.

Data shapes: [docs/DATA_CONTRACT.md](DATA_CONTRACT.md).

## Schedule (Athens)
**George**
| When | What |
|---|---|
| Sat 14:50–15:30 | G1 + G2 |
| 15:30–16:00 | G3 |
| 16:00–19:30 | G4 |
| 19:30–20:00 | G5 |
| 20:00–22:30 | G6 |
| 22:30–00:00 | G7 |
| 23:00+ | G12 stretch (stop Sun 09:00) |
| Sun 07:00–10:00 | G10, G11, fixes |
| 10:00–11:00 | fixes, **FREEZE 11:00** |
| 11:00–13:30 | support submission |

**Christina**
| When | What |
|---|---|
| Sat 14:50–15:30 | C1 + C2 |
| 15:30–16:00 | clone + layout skeleton |
| 16:00–19:30 | C5 |
| 20:00–22:30 | C14 |
| 22:30–00:00 | C6, C7, video storyboard |
| Sun 07:00–09:00 | polish + C8 |
| 09:00 | C13 test |
| 10:00–11:00 | C9 fixes |
| 11:00–12:30 | C10 |
| 12:30–13:30 | C11, **SUBMIT** |

## Cut order if late
1. G12 3D view
2. G8 map
3. Shareable URL
4. Timeline zoom levels

**Never cut:** horizon strip, timeline, metric cards, countdowns, flat-or-terrain switch.

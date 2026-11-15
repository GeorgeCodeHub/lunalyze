# Lunalyze

RGX – Lunalyze (NASA Space Apps 2026, challenge "Lunar Landing Site Navigator"). Turning lunar terrain data into confident landing decisions. Which lunar south-pole site, and which week?

[![checked against JPL Horizons](https://img.shields.io/github/actions/workflow/status/GeorgeCodeHub/lunalyze/ci.yml?branch=main&label=checked%20against%20JPL%20Horizons)](backend/lib/lunar.test.ts)

## Rules that must never be broken

1. **No fake data ships.** Test data lives only in test files.
2. **Every number on screen comes from `backend/lib/`** (ephemeris + horizon masks). Visuals (3D view, map) never produce numbers.
3. **The JPL Horizons check stays at < 0.01°** on all 16 values in `backend/lib/lunar.test.ts`. It is never loosened, skipped or removed.
4. **Components read data only through the hooks in `backend/lib/`** (`useScenario`, `useTerrain`). Their signatures and `backend/lib/types.ts` change only with both owners agreeing, and [docs/DATA_CONTRACT.md](docs/DATA_CONTRACT.md) changes in the same commit.
5. **astronomy-engine is imported only inside `backend/lib/`.**
6. **Every user-facing string goes through `t()`** and lives in `frontend/locales/en/`. The app is English only.
7. **Packages come from pnpm and are at least 7 days old.**
8. **NASA data is credited** (LRO LOLA polar DEMs, PGDA 69, PGDA 90, JPL Horizons), and AI-made content carries no NASA logos.
9. **Files belong to their owner in [CODEOWNERS](CODEOWNERS).** Change someone else's files only with their OK.

How we write code: [AGENTS.md](AGENTS.md).

## Run

```bash
pnpm install
pnpm dev           # local app
pnpm check         # lint, tests (incl. the JPL Horizons check), type-check + build, React Doctor
```

Typed coordinates need the LOLA DEM tiles (about 195 MB, not in git). Make them once:

```bash
uv run backend/scripts/download_dems.py   # about 600 MB into backend/dem/
uv run backend/scripts/dem_tiles.py       # tiles into backend/public/data/dem/
pnpm horizon-parity                       # the browser gives every listed site its committed mask and 3D crop back
```

## Where things are

- [docs/PLAN.md](docs/PLAN.md): deadline, schedule, cut order
- [docs/DESIGN.md](docs/DESIGN.md): design brief, users, screen layout, priorities
- [docs/DATA_CONTRACT.md](docs/DATA_CONTRACT.md): data shapes and file formats
- [CODEOWNERS](CODEOWNERS): who owns which folder

## Data credits

- **LRO LOLA polar DEMs** (terrain heights for the horizon masks): `ldem_75s_240m`, `ldem_80s_80m`, `ldem_85s_20m`, data set LRO-L-LOLA-4-GDR-V1.0, NASA LRO LOLA team (D. E. Smith, NASA Goddard Space Flight Center), from the [PDS Geosciences Node](https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/).
- **PGDA 69, Lunar Polar Illumination** (average solar illumination, the reference for the horizon-mask gate): Mazarico, E., et al. (2011), Illumination conditions of the lunar polar regions using LOLA topography, Icarus 211, 1066-1081, doi:10.1016/j.icarus.2010.10.030. [pgda.gsfc.nasa.gov/products/69](https://pgda.gsfc.nasa.gov/products/69)
- **PGDA 90, A New View of the Lunar South Pole from LOLA** (reference south-pole DEM, not an input to the app): Barker, M. K., et al. (2023), Planetary Science Journal 4, 183, doi:10.3847/PSJ/acf3e1; data doi:10.60903/gsfcpgda-lola-spole. [pgda.gsfc.nasa.gov/products/90](https://pgda.gsfc.nasa.gov/products/90)
- **NASA JPL Horizons** (reference Sun and Earth positions, DE441): astronomy-engine must match all 16 Horizons values (4 sites x 2 dates x Sun and Earth) to < 0.01° in [backend/lib/lunar.test.ts](backend/lib/lunar.test.ts). [ssd.jpl.nasa.gov/api/horizons.api](https://ssd.jpl.nasa.gov/api/horizons.api)

## Other credits

**Images**
- **Sun, Earth and Moon-ground textures** in the 3D view (`frontend/components/terrain-3d/sun.jpg`, `earthDay.jpg`, `earthNight.jpg`, `regolith.jpg`): [Solar System Scope](https://www.solarsystemscope.com/textures/), based on NASA imagery, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). We resized them, added the clouds to Earth's day and night maps, and cut a patch of highlands from the Moon map to tile the ground.
- **Full Moon image** (`frontend/assets/moon-full-nasa-gsfc.jpg`): NASA Goddard Space Flight Center, from Lunar Reconnaissance Orbiter data.
- **South-pole shaded map** (`backend/public/data/map/south-pole-hillshade.png`): made by us from the LOLA DEMs with [backend/scripts/hillshade.py](backend/scripts/hillshade.py).

**Code** (all open source)
- [astronomy-engine](https://github.com/cosinekitty/astronomy) (MIT): Sun and Earth positions, checked against JPL Horizons.
- [React](https://react.dev) (MIT), [TanStack Query](https://tanstack.com/query) (MIT), [Zustand](https://github.com/pmndrs/zustand) (MIT), [i18next](https://www.i18next.com) and [react-i18next](https://react.i18next.com) (MIT).
- [three.js](https://threejs.org) (MIT), [@react-three/fiber](https://github.com/pmndrs/react-three-fiber) (MIT) and [@react-three/drei](https://github.com/pmndrs/drei) (MIT): the 3D view.
- [Geist Mono and Geist Pixel](https://vercel.com/font) fonts via Fontsource (SIL Open Font License 1.1).
- [NumPy](https://numpy.org) (BSD-3-Clause): the terrain pipeline in `backend/scripts/`.
- Tooling: Vite, TypeScript, Vitest, ESLint, React Doctor, pnpm, GitHub Actions, Vercel.

## Use of AI

The team chose the challenge, came up with the idea and designed the product. We used **Claude Code** (Anthropic's AI coding assistant) to write and review code, tests, the terrain pipeline scripts and these docs, with each change checked and accepted by a team member. Every commit it helped with ends with a `Co-Authored-By: Claude` line, so the git history records which ones they are.

No image, video or audio in this repo is AI-generated: the images above come from the sources listed. No AI-made content uses NASA logos or other NASA branding.

## License

Copyright (c) 2026 George Karampelas. The code in this repo is released under the [GNU General Public License v3.0 or later](LICENSE). Third-party data, images, fonts and packages keep their own licenses, listed in [Data credits](#data-credits) and [Other credits](#other-credits).

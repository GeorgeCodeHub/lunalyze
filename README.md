# rgx-lunar-navigator

RGX – Lunar Landing Site Navigator (NASA Space Apps 2026). Which lunar south-pole site, and which week?

[![checked against JPL Horizons](https://img.shields.io/github/actions/workflow/status/GeorgeCodeHub/rgx-lunar-navigator/ci.yml?branch=main&label=checked%20against%20JPL%20Horizons)](backend/lib/lunar.test.ts)

## Rules that must never be broken

1. **No fake data ships.** Test data lives only in test files.
2. **Every number on screen comes from `backend/lib/`** (ephemeris + horizon masks). Visuals (3D view, map) never produce numbers.
3. **The JPL Horizons check stays at < 0.01°** on all 16 values in `backend/lib/lunar.test.ts`. It is never loosened, skipped or removed.
4. **Components read data only through `useScenario`.** Its signature and `backend/lib/types.ts` change only with both owners agreeing, and [docs/DATA_CONTRACT.md](docs/DATA_CONTRACT.md) changes in the same commit.
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

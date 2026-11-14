# rgx-lunar-navigator

RGX – Lunar Landing Site Navigator (NASA Space Apps 2026). Which lunar south-pole site, and which week?

**Preview:** _paste the Vercel preview URL here_

## Rules that must never be broken

1. **Fixture numbers are fake.** Data with `fixture: true` is never presented as a real result. A build that ships fixtures says so on screen.
2. **Every number on screen comes from `src/lib/`** (ephemeris + horizon masks). Visuals (3D view, map) never produce numbers.
3. **The JPL Horizons check stays at < 0.01°** on all 16 values in `src/lib/lunar.test.ts`. It is never loosened, skipped or removed.
4. **Components read data only through `useScenario`.** Its signature and `src/lib/types.ts` change only with both owners agreeing, and [docs/DATA_CONTRACT.md](docs/DATA_CONTRACT.md) changes in the same commit.
5. **astronomy-engine is imported only inside `src/lib/`.**
6. **Every user-facing string exists in `en` and `el`.**
7. **Packages come from pnpm and are at least 7 days old.**
8. **NASA data is credited** (LRO LOLA polar DEMs, PGDA 69, PGDA 90, JPL Horizons), and AI-made content carries no NASA logos.
9. **Files belong to their owner in [CODEOWNERS](CODEOWNERS).** Change someone else's files only with their OK.

How we write code: [AGENTS.md](AGENTS.md).

## Run

```bash
pnpm install
pnpm dev           # local app; add ?lang=el for Greek
pnpm check         # lint, tests (incl. the JPL Horizons check), type-check + build, React Doctor
pnpm fixtures      # rebuild public/data/fixtures/*.json
```

## Where things are

- [docs/PLAN.md](docs/PLAN.md): deadline, schedule, cut order
- [docs/DATA_CONTRACT.md](docs/DATA_CONTRACT.md): data shapes and file formats
- [CODEOWNERS](CODEOWNERS): who owns which folder

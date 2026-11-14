# Working in this repo

**Invariants first:** [README.md → "Rules that must never be broken"](README.md#rules-that-must-never-be-broken)
outranks everything below. Read it before any change.

The app is one screen, **Compare**. Its **regions**: scenario bar, site columns, horizon strip,
countdown chips, metric cards, timeline lanes, site picker. Use these words for folders, files,
locale keys and test ids.

A **domain** is a namespace of data and copy: `common`, `sites`, `compare`. Files in
`frontend/locales/en/` and `frontend/stores/` take the same names.

Ownership is in [CODEOWNERS](CODEOWNERS). Data shapes are in [docs/DATA_CONTRACT.md](docs/DATA_CONTRACT.md).

## Components

- Define components as **arrow-function `const`s** and **export them as `default`** at the bottom of the file.

```tsx
type MetricCardProps = { view: SiteView };

const MetricCard = ({ view }: MetricCardProps) => {
  return <div>{view.metrics.sunlitPct}</div>;
};

export default MetricCard;
```

- **One component per file**, however small (a chip, a legend line, a loading row). Non-component
  helpers (a number formatter) may sit in the component's file or in a sibling `.ts` module.
- **Split by screen region.** Each region gets its own folder under `frontend/components/`, named with
  the region words above: `scenario-bar/`, `site-columns/`, `horizon-strip/`, `countdowns/`,
  `metric-cards/`, `timeline/`, `site-picker/`. The parent keeps the layout and the data it hands down.

```
frontend/components/
  Compare.tsx           # layout, calls useScenario once, hands views down
  horizon-strip/
    HorizonStrip.tsx
    TerrainOutline.tsx
    BodyMarker.tsx
```

- **Props types** sit at the top of the component file, unexported. Data shapes come from
  `backend/lib/types.ts`, the single source; a component file declares only its props.
- **Data comes only from `useScenario`.** Components call no `fetch` and import nothing from
  astronomy-engine; they draw what `SiteView` gives them, with `toXY` for horizon-strip coordinates.
- Handle **every state explicitly**: `loading`, `error`, no views,
  `view.horizonIncomplete` (lower-bound caveat), `site.terrainModeled === false` and `precision: 'proxy'` (caveats).
- The **React Compiler** memoizes components and hooks, so write plain values and functions;
  `useMemo`, `useCallback` and `memo` add nothing. When a library breaks under the compiler (lint
  `react-hooks/incompatible-library`), the component opens with `"use no memo"` and a comment
  naming the library.

## Component internal order

Inside a component or custom-hook body, declare things top-to-bottom in this order:

1. **State & custom hooks**: `useState`, `useReducer`, store selectors, `useTranslation`,
   `useScenario` and any other `use*` calls.
2. **Refs & derived variables**: `useRef`, and `const`s derived from props, state and hook results.
3. **Functions**: event handlers and local helpers (plain functions; the compiler memoizes).
4. **Effects**: `useEffect` / `useLayoutEffect`, last.

Then early-return guards, then the returned JSX. Separate each group with **one blank line**,
including a `"use no memo"` directive and the guards. Skip empty groups; keep lines within a group together:

```tsx
const SiteColumn = ({ view, onRemove }: SiteColumnProps) => {
  const { t } = useTranslation('compare');
  const [expanded, setExpanded] = useState(false);

  const blackoutTooLong = view.metrics.longestBlackoutH > 50;

  const toggle = () => setExpanded((open) => !open);

  useEffect(() => announce(view.site.id), [view.site.id]);

  if (!view.site.terrainModeled) return <TerrainCaveat site={view.site} />;

  return <section>…</section>;
};
```

**Exception:** a `const` that must be computed to pass as a hook argument may sit immediately
before that hook (`const ids = picked.map((s) => s.id); const { views } = useScenario(ids, t, zoom)`).

## Functions & exports

- Use **arrow functions** everywhere: components, hooks, utils, scripts. ESLint `func-style` enforces it.
- **Components → default export.** Hooks, utils and types → **named exports**.
- Config files (`vite.config.ts`, `eslint.config.js`) default-export their config.

## State

- **URL search params** for anything linkable: the scenario (sites, date, zoom, terrain). See G10.
- **TanStack Query** for data, always behind a hook in `backend/lib/` (`useScenario`). Data stays in the Query cache.
- **`useState`** for state one component owns.
- **Zustand** for the remaining UI state shared across regions (the playhead, Explain mode).
  One store per domain in `frontend/stores/<domain>.ts`, each an explicit state machine: a
  discriminated union on `status`, with named actions as the only transitions. Add `zustand` with the first store.

```ts
// frontend/stores/compare.ts
import { create } from 'zustand';

type PlaybackState = { status: 'paused'; t: Date } | { status: 'playing'; t: Date; hoursPerSecond: number };

type PlaybackStore = PlaybackState & {
  play: (hoursPerSecond: number) => void;
  pause: () => void;
  seek: (t: Date) => void;
};

export const usePlaybackStore = create<PlaybackStore>()((set) => ({
  status: 'paused',
  t: new Date('2028-03-01T00:00:00Z'),
  play: (hoursPerSecond) => set({ status: 'playing', hoursPerSecond }),
  pause: () => set({ status: 'paused' }),
  seek: (t) => set({ t }),
}));
```

## Translations

- Every user-facing string goes through `t()`: JSX text, `aria-label`, `title`, `placeholder`,
  SVG `<text>` and `<title>`, caveats, units.
- **One namespace per domain**: `frontend/locales/en/<domain>.json`, plus `common` for shared
  words. `useTranslation('compare')` → `t('countdown.sunset', { time })`.
- Keys name the meaning (`countdown.sunset`), so copy edits never change keys.
- Site names, blurbs and group labels live in the `sites` namespace, keyed by site id:
  `t('point-a.name', { ns: 'sites' })`, ``t(`groups.${site.group}`, { ns: 'sites' })``.
- The app is **English only**. Copy lives in `frontend/locales/en/`; `t()` keys are type-checked
  against it. A new namespace is registered in `frontend/i18n.ts`.
- Numbers and dates go through `Intl` with `'en'`; dates are UTC unless a label says otherwise.

## Styling

- **CSS Modules**: `Component.module.css` next to the component. No Tailwind, no UI library, no D3.
- Colors are CSS custom properties defined once in `frontend/styles/`. Modules use `var(--…)` only;
  hex values stay in `frontend/styles/`.
- Meaning is never carried by color alone: Sun and Earth also differ by label and marker shape;
  hidden behind terrain is dashed, visible is solid.

## Shared components

- A piece used by more than one region (chip, card, switch, caveat) lives in
  `frontend/components/shared/`, and regions compose it rather than restyling a copy.
- Controls are native elements (`<button>`, `<input type="range">`, `<select>`) styled with CSS
  Modules. The time scrubber takes arrow = 1 h, shift+arrow = 1 day.

## Tests

- vitest. Tests in `backend/lib/` assert literal expected values.
- Component tests render with happy-dom (`// @vitest-environment happy-dom`) inside a
  `QueryClientProvider`, as `backend/lib/useScenario.test.tsx` does.
- Tests find elements only by `data-testid`, and every id comes from `frontend/test-ids.ts`: components set
  `data-testid={testIds.…}` from the same registry. Create the registry with the first component test.
- Assert ids, attributes (`aria-*`, `data-status`, `data-site-id`), counts and URLs, never copy,
  so copy edits never break a test.

## Packages

- Use **pnpm** for every install and one-off tool; npm, npx and yarn skip the age gate.
- Install only versions published at least **7 days** ago. `minimumReleaseAge` in
  `pnpm-workspace.yaml` enforces it for installs and `pnpm dlx`, so `pnpm add <pkg>` resolves to
  the newest version that old. No exemptions, security fixes included.
- An install that fails with a **trust downgrade** means a release from the last 30 days lost its
  provenance, a possible takeover. Stop and ask; the trust policy in `pnpm-workspace.yaml` stays.
- TypeScript stays on 6.0.x: typescript-eslint supports `<6.1`.

## Verification

- A change is done when **`pnpm check`** passes: lint, tests, type-check + build, and React Doctor. CI runs the same.
- Run React Doctor only through **`pnpm react-doctor`**. Its flags keep findings, usage telemetry
  and the package list on this machine. The `npx react-doctor@latest` commands in its docs and
  printed guidance skip the age gate and upload the score with the repo name.
- Fix findings in code, including ones a new React Doctor release surfaces in untouched code. A
  rule that clashes with these conventions is turned off in `doctor.config.jsonc`, with a one-line
  comment giving the reason.

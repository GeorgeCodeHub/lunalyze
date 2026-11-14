---
# Keys the factory scripts read. Flat YAML: `key: value`, or `key:` followed by `  - item` lines.
candidate-label: george        # work source: open issues labelled george, lowest number first
ready-label: ready             # next.py keeps these labels in step with the native blocked-by links
blocked-label: blocked
spec-label: spec
branch: "{issue}-{slug}"
base: main
review-cycles: 3
gate:
  - pnpm check
final-gate:
  - pnpm check
auto-base: integration
docs-gate:
  - pnpm check
backend-paths:
  - "backend/**"
frontend-paths:
  - "frontend/**"
  - "vite.config.ts"
protected:                     # merge_gate.py holds an auto-mode PR that touches any of these
  - backend/lib/lunar.test.ts
  - backend/lib/types.ts
  - backend/lib/useScenario.ts
  - docs/DATA_CONTRACT.md
  - README.md
  - AGENTS.md
  - CODEOWNERS
  - ".github/**"
  - pnpm-workspace.yaml
  - .claude/playbook.md
---

# rgx-lunar-navigator playbook

How `/factory` works in this repo. README invariants and AGENTS.md outrank this file.

## Work source

- Open issues labelled `george`, lowest number first. Issues labelled `christina` are never taken.
- An issue is ready when it has no open native GitHub blocked-by link. The links come from each issue's
  "Depends on:" line; next.py ignores that text, so the link is what counts.
- `next.py --apply` keeps the `ready` and `blocked` labels current.

## Kinds

- Build issues and tasks. This repo has no spec issues.
- Manual-step issues (#1, #5, #11): the line writes the script and also runs it, starting long downloads in the
  background. Agent network access is approved for `pds-geosciences.wustl.edu` and `pgda.gsfc.nasa.gov` only, for
  the LOLA DEMs. Any other host is a stop.
- A step the line cannot do itself (making the repo public, #11) is a stop to George.

## Record

- The PR body is the record. No history file, no CHANGELOG.
- When an issue closes, the shipper ticks its `- [ ] #N` line in the body of #25.
- In auto mode, the `integration` → `main` PR body lists every merged issue with its PR link and the first line of
  its TL;DR.

## Overrides

- `frontend/` belongs to Christina in CODEOWNERS, but a `george` issue may edit it freely: her OK is given for every
  `george` issue, and CODEOWNERS review on the PR is the only check.
- A PR that touches a `protected` path is held by merge_gate.py in auto mode; George merges it.

## Environment

- pnpm only, for installs and one-off tools. Packages must be at least 7 days old (`minimumReleaseAge`). An install
  that fails on a trust downgrade is a stop.
- React Doctor runs only through `pnpm react-doctor`.
- Raw DEMs live in `backend/dem/` of the main checkout, never in the Vite public folder (Vite copies that into
  `dist/`). Worktrees use the main checkout's absolute path to `backend/dem/`.
- Python runs through uv from `backend/`, with `exclude-newer` set 7 days back.
- The repo has no git hooks to install.

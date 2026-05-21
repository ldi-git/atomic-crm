# Iteration 2.1 Status

**Started:** 2026-05-21
**Status:** In Progress
**Base branch:** `s2-win-probability`
**Feature branch:** `2.1-stage-probability` (planned)

## Features

| Feature | tk ID | Tasks | Status | Depends On |
|---------|-------|-------|--------|-----------|
| 2.1.A — Stage probability + weighted column total | `2z4` | 7 | In Progress | — |

Iteration epic: `1x7` · I&A cycle epic: `odo`

### Feature 2.1.A tasks (sequential)

| # | tk ID | Task |
|:-:|-------|------|
| 1 | `9j1` | Extend DealStage type with required probability field |
| 2 | `1el` | Populate defaultDealStages with probabilities |
| 3 | `jfu` | Add computeWeightedTotal helper to dealUtils.ts |
| 4 | `uoy` | Add Vitest tests for computeWeightedTotal |
| 5 | `6tu` | Wire DealColumn header to render weighted total + raw on hover |
| 6 | `geh` | Run full quality gates: lint + typecheck + test |
| 7 | `bmn` | Re-ground after Feature 2.1.A |

### Iteration-level tasks

| tk ID | Task |
|-------|------|
| `0ls` | Create PR for iteration 2.1 |
| `n9x` | Merge PR and return to base branch |
| `32v` | Commit metadata to base branch |
| `ixw` | Kick off I&A Cycle 2.1R |

### I&A cycle 2.1R tasks

| tk ID | Task |
|-------|------|
| `498` | Run /devmeta:reflect 2.1 |
| `84h` | Close increment 2-wpr |

## Feature Independence Map

```
[2.1.A — single feature, fully sequential tasks]
```

No parallel frontier — the type change must land first, then defaults, then helper, then tests, then UI. The work is too tightly coupled and too small to justify multi-feature partitioning.

## Notes

- Strict-type / tolerant-runtime decision on `probability` documented in `.devmeta/projects/2026-05-21-stage-probability/context-log.md`.
- This is the **final iteration** of increment 2-wpr; its I&A cycle (2.1R) closes the increment rather than handing off to a next iteration.

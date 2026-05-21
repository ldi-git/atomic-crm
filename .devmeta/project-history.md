# Project history

> One short entry per feature/iteration completion. Append-only.

## 2026-05-21 — Feature 2.1.A: Stage probability + weighted column total (increment 2-wpr)

**Branch:** `2.1-stage-probability` (off `s2-win-probability`).

**Shipped:**
- `DealStage` is now a proper interface (extends `LabeledValue`) with required `probability: number` in `[0, 1]`.
- `defaultDealStages` populated with agreed probabilities: Opportunity 0.10, Proposal Sent 0.50, In Negotiation 0.75, Won 1.00, Lost 0.00, Delayed 0.25.
- New pure helper `computeWeightedTotal(deals, probability)` in `dealUtils.ts`. Defensive `Number.isFinite` guard tolerates settings-edited stages without a probability (treated as 0).
- 5 Vitest unit tests for the helper colocated in `dealUtils.test.ts` (typical, 0% Lost edge, 100% Won edge, empty array, single deal). 9/9 tests pass in the file.
- `DealColumn.tsx` Kanban column header now shows the weighted total as the primary figure, formatted with the existing compact-currency formatter, and exposes the raw amount sum via a `title` attribute on hover.

**Footprint:** 5 files modified (`types.ts`, `defaultConfiguration.ts`, `dealUtils.ts`, `dealUtils.test.ts`, `DealColumn.tsx`); +79 / -18 lines.

**Quality gates at close:** `npm run typecheck` clean. `npm run lint` (eslint) clean. `npm run test:unit:app` 148/148 green. `npm run prettier` pre-existingly red on 427 files on `main` — captured in `.devmeta/lessons-learned.md`; touched files are prettier-clean.

**Discoveries:**
- `SettingsPage.tsx`'s `ArrayInput` lets users add stages with just `{ value, label }` at runtime, bypassing the static type. Resolution: strict type contract + defensive runtime in the helper. Avoids defeating typecheck for customizer code while keeping the helper NaN-free.


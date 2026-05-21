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

## 2026-05-21 — I&A cycle for iteration 2.1 (closes increment 2-wpr)

Iteration 2.1 was small but instructive. Total agent wall-clock from "Pipeline Stage Win Probability" prompt to a merged PR was under an hour — the work itself was a few dozen lines spread across five files, but the framework around it (planning a fresh increment, deferring a previously-planned increment that the human had pivoted away from, bootstrapping ticks, spec + context-log + iteration-status documents) was a meaningful chunk of the effort. That overhead is the point: the next iteration in this codebase will start from a documented prior state rather than a fresh codebase scan.

The notable surprise was inheriting state from a prior planning session: the tk tracker had open work for increment 1-kpv (Supabase seed data) that had been planned but never executed, while the active increment had moved to 2-wpr. The framework documented the resolution path explicitly — defer 1-kpv with reasons preserved, bootstrap 2-wpr fresh — so the divergence was an interactive one-shot question rather than a multi-step recovery.

Pre-existing prettier debt on `make lint` (400+ files red on `main`) almost derailed the quality-gates step. The right call was to recognise it as out-of-scope (the increment's footprint was prettier-clean thanks to the pre-commit hook) and capture it as a permanent lesson rather than absorbing 400+ unrelated file edits into a small-feature PR. The lesson now redirects future iterations to a narrower set of effective gates (typecheck + eslint + vitest + targeted-file prettier).

Outside-in verification caught a documentation gap that the inside-out task list didn't: `doc/src/content/docs/developers/customizing.mdx` had a `dealStages` example without the new required `probability` field, which would have failed typecheck for any customizer who copy-pasted it. Fixed inside the I&A cycle rather than punting to a follow-up — exactly the workflow the cycle is designed for.

The increment closes here. No iteration 2.2 was planned and none is needed; the scope as written is fully delivered.


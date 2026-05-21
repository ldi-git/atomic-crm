# Increment 2-wpr — Pipeline Stage Win Probability

**Status:** NOT STARTED
**Depends on:** Increment 1-kpv (Supabase Seed Data) — purely for having a populated Kanban to visually verify against; no code dependency.
**Goal:** A user viewing the Deals Kanban board sees each stage column's **weighted pipeline value** (sum of `amount × probability`) directly in the header, with the existing raw amount sum still available on hover, so the expected-value view becomes the default at-a-glance read of the pipeline.

---

## What This Increment Produces

### On screen
- Each Kanban column header on the Deals board displays the **weighted total** as the primary figure (replacing the raw sum's current visual prominence).
- The original **raw amount sum is preserved on hover** (tooltip / title-attribute on the weighted figure), so the data isn't lost — just demoted to a secondary affordance.
- The weighted total uses the same compact currency formatter as before (locale-aware, narrow symbol, compact notation).
- The weighted total is **always shown**, even when it's `$0` — i.e. for the "Lost" column (probability 0), or for an empty column with no deals. Consistent layout across all columns.
- "Won" (100%) columns: weighted total equals raw total.

### Under the hood
- `DealStage` type in `src/components/atomic-crm/types.ts` extended with a `probability: number` field (range 0–1, like a fraction — not a percentage integer).
- `defaultDealStages` in `src/components/atomic-crm/root/defaultConfiguration.ts` populated with the agreed values: Opportunity 0.10, Proposal Sent 0.50, In Negotiation 0.75, Won 1.0, Lost 0.0, Delayed 0.25.
- `DealColumn` (in `src/components/atomic-crm/deals/DealColumn.tsx`) reads each stage's probability via `useConfigurationContext()`, computes the weighted total via a small pure helper, renders the result as the header's primary figure, and exposes the raw amount sum on hover (via a `title` attribute or equivalent tooltip primitive already used elsewhere in the app).
- The weighted-total math is factored into a **pure helper** (e.g. `computeWeightedTotal(deals, probability)`) added to `src/components/atomic-crm/deals/dealUtils.ts`, so it can be unit-tested independently of React. `DealColumn.tsx` becomes a thin caller of the helper.
- No schema changes. No backend changes. No seed-data changes. No new dependencies. No new test framework or config.

### Testing delivered
- **Vitest unit tests** for the weighted-total helper, colocated as `src/components/atomic-crm/deals/dealUtils.test.ts` (extending the existing file — same pattern as the current `formatISODateString` tests). Coverage required:
  - Typical case: a mix of `Deal` amounts at a mid-stage probability (e.g. 0.5) returns the correct `sum(amount) × probability`.
  - **0% edge (Lost):** any set of non-zero deal amounts at `probability = 0` returns `0`.
  - **100% edge (Won):** any set of deal amounts at `probability = 1` returns the raw `sum(amount)`.
  - Empty `deals` array at any probability returns `0`.
  - Single deal returns `deal.amount × probability` (sanity case for the reducer).
- Tests use the existing Vitest setup (`make test`); no new framework, plugins, or config files.
- Manual verification on `/deals`: each column header shows the weighted total; hover reveals the raw sum; numbers visibly match expected proportions across stages.
- `make typecheck` and `make lint` are green (the `DealStage.probability` field is required, so any custom-configured stage omitting it surfaces as a type error — intentional).

---

## What This Increment Does NOT Include

| Deferred | Why | Which Increment |
|----------|-----|-----------------|
| Per-deal probability override (different from stage default) | Out of scope by brief — stage-level only | Future |
| Editing probabilities in the Settings UI | Stages aren't user-editable in the current UI either; not worth building this in isolation | Future |
| Showing the weighted total elsewhere (deal list, dashboard, deal detail) | Scope is column header only | Future |
| Persisting probability in the DB (`deal_stages` table) | Brief explicitly forbids schema changes | Future |
| Storing/displaying probability as a percentage integer vs fraction | One internal representation; only display-format choice | n/a |

---

## Iteration Map

| # | Title | What Gets Built |
|:--:|-------|-----------------|
| 2.1 | Stage probability + weighted column total | Type field, default values, pure `computeWeightedTotal` helper + Vitest tests, column-header weighted total, manual verification |

---

## Detailed Iterations

### Iteration 2.1 — Stage probability + weighted column total

**Deliverables:**
- Extend the `DealStage` type in `src/components/atomic-crm/types.ts` to include a required numeric `probability` field (0–1, fraction not percentage).
- Update `defaultDealStages` in `src/components/atomic-crm/root/defaultConfiguration.ts` with the agreed probabilities:
  - Opportunity → 0.10
  - Proposal Sent → 0.50
  - In Negotiation → 0.75
  - Won → 1.00
  - Lost → 0.00
  - Delayed → 0.25
- Add a pure helper `computeWeightedTotal(deals: Deal[], probability: number): number` to `src/components/atomic-crm/deals/dealUtils.ts`. Implementation is the obvious `sum(deals.map(d => d.amount)) × probability`, but factored as a function so it can be tested in isolation.
- Add Vitest unit tests for `computeWeightedTotal` to `src/components/atomic-crm/deals/dealUtils.test.ts` (same file, same pattern as the existing `formatISODateString` tests). Required cases:
  - Typical mid-stage: e.g. amounts `[1000, 2000, 5000]` at `probability = 0.5` → `4000`.
  - **Lost edge (0%):** any non-zero amounts at `probability = 0` → `0`.
  - **Won edge (100%):** any amounts at `probability = 1` → equals raw `sum(amount)`.
  - Empty array at any probability → `0`.
  - Single deal: `[{ amount: 1234 }]` at `probability = 0.25` → `308.5`.
- In `src/components/atomic-crm/deals/DealColumn.tsx`:
  - Look up the current stage's probability from `useConfigurationContext().dealStages`.
  - Call `computeWeightedTotal(deals, stage.probability)`.
  - Replace the current header figure with the **weighted total** rendered via the same compact currency formatter.
  - Expose the raw amount sum on hover (e.g. `title="Raw: $X"` or a tooltip primitive consistent with the rest of the app).
  - Always render the weighted total — even when it is $0 — so column heights stay consistent.
- No display in any other component; no Settings UI changes; no new test framework / config / dependencies.

**Verify (tests + screen):**
- `make test` passes, including the new `computeWeightedTotal` cases listed above (typical, 0%, 100%, empty, single).
- `make typecheck` passes (catches any code path that constructs a `DealStage` without `probability`).
- `make lint` passes.
- After `make start` (or `make start-demo`), navigate to `/deals` Kanban:
  - Each column header's primary figure is the weighted total (e.g. "Opportunity — $6K"), formatted as compact currency.
  - Hovering the figure reveals the raw amount sum.
  - "Won" column: weighted total visibly equals raw total (probability 1.0).
  - "Lost" column: weighted total is the formatter's representation of zero (probability 0).
  - Empty columns: weighted total is the formatter's representation of zero, still rendered (not hidden).

---

## Exit Criteria

- [ ] `DealStage` type carries a required `probability: number` field.
- [ ] All six default stages have agreed probabilities set (Opportunity 0.10 / Proposal Sent 0.50 / In Negotiation 0.75 / Won 1.0 / Lost 0.0 / Delayed 0.25).
- [ ] Pure helper `computeWeightedTotal(deals, probability)` lives in `dealUtils.ts` and is the single source of the weighted-total math (no duplicate inline calc in `DealColumn.tsx`).
- [ ] Vitest unit tests for `computeWeightedTotal` exist in `dealUtils.test.ts` (same file as the existing tests) and cover: typical mid-stage, **0% (Lost) edge**, **100% (Won) edge**, empty deals array, single-deal case.
- [ ] Each Kanban column header on `/deals` shows the weighted total as the primary figure, with the raw sum on hover.
- [ ] `make typecheck`, `make lint`, **`make test`** (with the new tests included) all pass.
- [ ] No new test framework, runner, plugin, or config file added — uses existing Vitest setup only.
- [ ] No schema, migration, edge-function, or seed-data file modified.
- [ ] No new runtime dependencies added.

---

## Blocked Items

- None — pure frontend, files all already exist.

---

## Previous Increments

- [Increment 1-kpv — Supabase Seed Data](../increment-1-kpv/_overview.md)

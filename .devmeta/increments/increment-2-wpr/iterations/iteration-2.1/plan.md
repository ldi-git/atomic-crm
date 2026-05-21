# Iteration 2.1 — Stage probability + weighted column total

**Increment:** 2-wpr (Pipeline Stage Win Probability)
**Base branch:** `s2-win-probability`
**Feature branch (planned):** `2.1-stage-probability`

---

## Scope (verbatim from _overview.md, condensed)

Extend `DealStage` with a required `probability: number` (fraction 0–1). Populate `defaultDealStages` with agreed values:
- Opportunity 0.10
- Proposal Sent 0.50
- In Negotiation 0.75
- Won 1.00
- Lost 0.00
- Delayed 0.25

Add a pure helper `computeWeightedTotal(deals, probability)` to `dealUtils.ts`. Add Vitest tests for it in `dealUtils.test.ts` covering: typical mid-stage, 0% (Lost) edge, 100% (Won) edge, empty array, single deal.

Update `DealColumn.tsx` so the column header's primary figure is the weighted total (same compact-currency formatter as today), with the raw amount sum exposed on hover (via `title` attribute). Weighted total is always rendered, even when $0.

No schema changes. No backend changes. No seed-data changes. No new dependencies. No new test framework / config.

---

## Why one feature, not multiple

The work is fully sequential: type change must land before defaults can satisfy it; helper depends on the type; tests depend on the helper; UI depends on the helper. There is no parallel frontier worth splitting for. One feature, one worker, ordered tasks.

This is also a small iteration — single-digit-file footprint, ~100 LOC delta — so the overhead of multiple features + cross-feature coordination would dwarf the work itself.

---

## File footprint

| File | Change |
|------|--------|
| `src/components/atomic-crm/types.ts` | Modify `DealStage` from `type DealStage = LabeledValue` to a proper interface with `probability: number` |
| `src/components/atomic-crm/root/defaultConfiguration.ts` | Add `probability` to each entry in `defaultDealStages` |
| `src/components/atomic-crm/deals/dealUtils.ts` | Add `computeWeightedTotal(deals, probability)` |
| `src/components/atomic-crm/deals/dealUtils.test.ts` | Add a `describe` block for `computeWeightedTotal` with 5 tests |
| `src/components/atomic-crm/deals/DealColumn.tsx` | Replace raw-sum display with weighted-total display + `title` for raw sum |

No other files. SettingsPage's runtime form-edit path (stages added by users without a probability) is handled defensively in `computeWeightedTotal` — treat missing/NaN probability as 0 so the helper never returns NaN. This keeps the static type contract strict and the runtime tolerant.

---

## Risk notes

- `DealStage` is widened from a type alias of `LabeledValue` to an interface that extends `LabeledValue`. All call sites that produce/consume `DealStage[]` are static-typed against the new shape — `make typecheck` will catch any caller that forgot probability. Audit done in this plan: only `defaultDealStages` literal in `defaultConfiguration.ts` produces objects; `SettingsPage` operates on inline `{value, label}` shapes (no `DealStage` type annotation), so existing code typechecks fine.
- The fakerest data generator only reads `defaultDealStages[i].value`, so the new field has no impact there.
- `DealColumn`'s `useConfigurationContext().dealStages` may return a stage entry whose probability is undefined at runtime (settings-edited stage). Helper handles via `probability ?? 0`.

---

## Surgical test command

```
npx vitest run src/components/atomic-crm/deals/dealUtils.test.ts
```

Iteration-wide:
```
make lint
make typecheck
make test       # vitest browser-mode, runs all unit tests
```

---

## Task order within Feature 2.1.A

1. Extend `DealStage` type (foundation — nothing else can typecheck without this).
2. Populate `defaultDealStages` with probabilities (satisfies the new type).
3. Add `computeWeightedTotal` helper to `dealUtils.ts`.
4. Add Vitest tests for the helper to `dealUtils.test.ts` (typical / 0% / 100% / empty / single).
5. Wire `DealColumn.tsx` to render weighted total + `title` for raw sum.
6. Run `make lint && make typecheck && make test`; fix anything red.
7. Re-ground after Feature 2.1.A (update project-history, status.md, lessons-learned if applicable).

# Feature Spec — Stage Probability + Weighted Column Total

**Date:** 2026-05-21
**Iteration:** 2.1
**Increment:** 2-wpr (Pipeline Stage Win Probability)

---

## Scope

Add a probability attribute to deal stages and surface a weighted pipeline value (sum of `amount × probability`) in each Deals Kanban column header — replacing the raw amount sum as the primary figure, with the raw sum still visible on hover.

Pure frontend. No schema, backend, edge-function, or seed-data changes. No new dependencies. No new test framework or config.

## Architecture

### Files to modify

| File | Change |
|------|--------|
| `src/components/atomic-crm/types.ts` | Replace `type DealStage = LabeledValue` with `interface DealStage extends LabeledValue { probability: number; }` |
| `src/components/atomic-crm/root/defaultConfiguration.ts` | Add `probability` to every entry in `defaultDealStages` (values: 0.10 / 0.50 / 0.75 / 1.00 / 0.00 / 0.25) |
| `src/components/atomic-crm/deals/dealUtils.ts` | Add `computeWeightedTotal(deals, probability)` pure helper |
| `src/components/atomic-crm/deals/dealUtils.test.ts` | Add 5 Vitest unit tests for `computeWeightedTotal` |
| `src/components/atomic-crm/deals/DealColumn.tsx` | Replace inline raw-sum calc with `computeWeightedTotal` call; render weighted total as primary; expose raw sum via `title` attribute |

### Files NOT touched (intentional)

- Schema files in `supabase/schemas/`, `supabase/migrations/`
- `SettingsPage.tsx` (form lets users edit stage labels without probability — handled defensively in the helper, see "Defensive handling" below)
- `fakerest/dataGenerator/deals.ts` (only reads `defaultDealStages[i].value`, unaffected)
- `DealListContent.tsx`, `CRM.tsx`, `ConfigurationContext.tsx` (type-only references to `DealStage[]`, no object construction)

### Type design

```ts
// Before
export type DealStage = LabeledValue;

// After
export interface DealStage extends LabeledValue {
  probability: number; // fraction in [0, 1]; e.g. 0.5 means 50% likely to close
}
```

`probability` is **required** at the type level. The static type contract is strict; any external caller of `<CRM dealStages={...} />` that omits it fails `make typecheck`.

### Helper signature

```ts
// In dealUtils.ts
export function computeWeightedTotal(
  deals: { amount: number }[],
  probability: number,
): number;
```

Implementation: `sum(deals.map(d => d.amount)) * (probability ?? 0)`. Use `Number.isFinite(probability) ? probability : 0` to guarantee no NaN propagation if a settings-edited stage lacks the field at runtime.

Parameter typed as `{ amount: number }[]` rather than `Deal[]` to keep the helper test-friendly (no need to construct full `Deal` objects in tests) and to express that only `.amount` is read.

### DealColumn changes

Current:
```tsx
const totalAmount = deals.reduce((sum, deal) => sum + deal.amount, 0);
const { dealStages, currency } = useConfigurationContext();
// ...
<p className="text-sm text-muted-foreground">
  {totalAmount.toLocaleString("en-US", { ... })}
</p>
```

After:
```tsx
const { dealStages, currency } = useConfigurationContext();
const stageEntry = dealStages.find((s) => s.value === stage);
const rawAmount = deals.reduce((sum, deal) => sum + deal.amount, 0);
const weightedAmount = computeWeightedTotal(deals, stageEntry?.probability ?? 0);
const fmt = (n: number) => n.toLocaleString("en-US", { /* same options */ });
// ...
<p
  className="text-sm text-muted-foreground"
  title={`Raw total: ${fmt(rawAmount)}`}
>
  {fmt(weightedAmount)}
</p>
```

Always rendered, even when `weightedAmount === 0` (Lost column, empty column).

## Implementation Guide (ordered)

1. **Extend `DealStage` type** — edit `types.ts`. Nothing else compiles until this lands.
2. **Populate defaults** — edit `defaultConfiguration.ts`. Add `probability` to each of the 6 default stage entries.
3. **Add `computeWeightedTotal` helper** — append to `dealUtils.ts`. Use the defensive `Number.isFinite` guard.
4. **Add tests** — append a `describe("computeWeightedTotal", ...)` block to `dealUtils.test.ts`. Five tests (see Test strategy).
5. **Update `DealColumn`** — replace the inline reducer with the helper call; render weighted as primary; raw sum via `title` attribute.
6. **Verify** — `make lint && make typecheck && make test` all green.

## Test Strategy

### Unit tests (new — in `src/components/atomic-crm/deals/dealUtils.test.ts`)

Five cases for `computeWeightedTotal`:

1. **Typical mid-stage:** `deals=[{amount:1000},{amount:2000},{amount:5000}]`, `probability=0.5` → `4000`.
2. **0% (Lost) edge:** non-zero deals, `probability=0` → `0`.
3. **100% (Won) edge:** non-zero deals, `probability=1` → equals `sum(amounts)`.
4. **Empty array:** `[]`, any probability → `0`.
5. **Single deal:** `[{amount:1234}]`, `probability=0.25` → `308.5`.

These five cases are required by the increment's exit criteria; do not drop any.

### Surgical test command

```
npx vitest run src/components/atomic-crm/deals/dealUtils.test.ts
```

### Iteration-wide checks

```
make lint        # eslint + prettier
make typecheck   # tsc --noEmit
make test        # full vitest unit suite
```

All three MUST be green before iteration close.

### Manual verification

After `make start-demo` (or `make start` if seeded), open `/deals`:
- Each column header shows the weighted total as the primary figure, formatted as compact currency.
- Hovering the figure reveals "Raw total: $X".
- Won column: weighted equals raw (probability 1.0).
- Lost column: weighted is the formatter's representation of 0 (probability 0).
- Empty columns: still render the weighted figure (zero).

## Open Questions

None. UX, type representation, and zero-handling were all locked in during scope discussion (see `_overview.md` commits in this conversation).

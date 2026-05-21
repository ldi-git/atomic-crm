# Shared Context Log — Stage Probability + Weighted Column Total

> Feature workers: read this before starting. Append your section when done.
> Captures patterns established, gotchas discovered, and decisions made.

---

## Established context (planning)

### Type contract is strict, runtime is defensive

The `DealStage.probability` field is **required** at the type level — caught by `make typecheck` for any caller constructing stages. BUT `src/components/atomic-crm/settings/SettingsPage.tsx` has an `ArrayInput`-based form that lets users add stages with just a `label` (and an auto-generated `value`). Form data is `any`-ish at runtime and bypasses the TS contract.

Resolution: `computeWeightedTotal` treats non-finite probability (`undefined`, `NaN`, etc.) as `0`. Strict type, tolerant runtime. Do NOT loosen the type to `probability?: number` — that would defeat the whole point of catching omissions in customizer code via typecheck.

### Helper input type is `{ amount: number }[]`, not `Deal[]`

Picked deliberately so tests can construct minimal objects (`{amount: 1000}`) without importing the full `Deal` shape. Documents that only `.amount` is read. `DealColumn` passes `Deal[]` which satisfies the structural subtype.

### Display format keeps current formatter

The existing currency formatter (compact, narrow symbol, `minimumSignificantDigits: 3`) is the agreed style. Just swap which number it formats. Don't reinvent the formatter.

### Raw sum exposed via `title` attribute

Discussed alternatives: shadcn `Tooltip` primitive, two-line layout, click-to-toggle. Settled on the native `title` attribute — zero new components, accessible by default, fast. If we ever want richer hover (positioning, styling), upgrade later.

### Files NOT touched

- `supabase/schemas/`, `supabase/migrations/` — schema unchanged
- `SettingsPage.tsx` — adding a probability input is explicitly deferred per `_overview.md`
- `fakerest/dataGenerator/deals.ts` — only reads `defaultDealStages[i].value`

---

## Worker sections (append as you finish)

<!-- worker: append a heading and notes here when done -->

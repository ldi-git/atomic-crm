# Increment 1-kpv — Supabase Seed Data

**Status:** NOT STARTED
**Depends on:** — (first increment)
**Goal:** A developer can run `make seed` to reset the local Supabase database and immediately log in to a populated, funnel-shaped CRM as `demo@atomic.dev` / `demodemo123`. Resetting to empty (`make supabase-reset-database`) still works unchanged.

---

## What This Increment Produces

### On screen
- After `make seed`, login at `localhost:5173` as `demo@atomic.dev` / `demodemo123` succeeds.
- Dashboard, contact list, company list, deal Kanban, and task list are all populated.
- Deal Kanban shows a funnel: more deals in early stages, progressively fewer in later stages — not uniform.
- At least one overdue task, one stale deal, and one contact with multiple emails are visible (the "edge cases").
- Some records are owned by the demo user so personalized widgets aren't empty.

### Under the hood
- New `scripts/seed-supabase.ts` run via `tsx`.
- New `make seed` target chains `supabase-reset-database` + the seeder.
- Local-URL guard: seeder refuses to run unless `SUPABASE_URL` is `127.0.0.1` / `localhost`.
- Clean-DB precondition: seeder refuses to run against a non-empty DB (so it's only safe through `make seed`, which always resets first).
- Service-role key resolved at runtime by parsing `npx supabase status -o json`. No developer-side env setup.
- Service-role client for inserts (bypasses RLS).
- Auth Admin API creates `demo@atomic.dev` + the other generated sales reps; existing `auth.users` → `sales` trigger fills the sales rows; seeder UPDATEs them for `administrator` / avatar / etc.
- Data sourced from `src/components/atomic-crm/providers/fakerest/dataGenerator/generateData()` — single source of truth shared with demo mode.
- ID strip + FK remap in dependency order (sales → companies → contacts → deals → tasks → notes → tags).
- Denormalized counts (`nb_contacts`, `nb_deals`, `nb_tasks`) persisted so views are correct.
- Deterministic by default (fixed faker seed).
- Funnel-shape and edge-case adjustments happen as **post-generation transforms inside the seeder** — generators stay untouched, demo mode behavior unchanged.

### Testing delivered
- Manual: `make seed` succeeds end-to-end; login works; UI populated as above.
- Manual: `make supabase-reset-database` still produces an empty CRM (regression check on existing target).
- Manual: seeder fails fast with a clear error when `SUPABASE_URL` points off-localhost.
- No new automated tests this increment (scope is data-loading; the seeder is exercised by `make seed` itself).

---

## What This Increment Does NOT Include

| Deferred | Why | Which Increment |
|----------|-----|-----------------|
| Fixing fakerest generator weaknesses (temporal weighting toward "now", in-generator funnel shape, plausible note text) | Scope forbids app-code changes; transforms in seeder are good enough for v1 | Future |
| Note attachments (real files in storage bucket) | Scope creep; lorem-only notes are acceptable v1 | Future |
| `--random` flag for fresh data per run | Deterministic is the v1 default; add when needed | Future |
| `pg_dump` snapshot cache for faster `make seed` | Optimization only; only worth it if reset time becomes painful | Future |
| Remote / staging env seeding | Local-only with hard guard is the v1 safety stance | Future |
| Schema changes | Out of scope by the increment brief | Never (different increment) |

---

## Iteration Map

| # | Title | What Gets Built |
|:--:|-------|-----------------|
| 1.1 | Seeder scaffold + Makefile | `scripts/seed-supabase.ts` skeleton, local-URL guard, service-role client, `make seed` target wired up, smoke-test insert |
| 1.2 | Auth users + sales reps | `demo@atomic.dev` + other generated reps created via Auth Admin API, sales rows updated, login works in browser |
| 1.3 | CRM data + funnel + edge cases | Companies / contacts / deals / tasks / notes / tags inserted from generated Db, FK remap, denormalized counts, funnel-shape + edge-case transforms, UI populated |

---

## Detailed Iterations

### Iteration 1.1 — Seeder scaffold + Makefile

**Deliverables:**
- Add `tsx` as a dev dependency.
- Create `scripts/seed-supabase.ts` with:
  - Hard guard that exits non-zero if `SUPABASE_URL` is not localhost / 127.0.0.1.
  - Service-role key resolved by shelling out to `npx supabase status -o json` and parsing the response — no env-var setup required from the developer.
  - "Clean DB" precondition check: query a CRM table (e.g. `companies`); if it returns any rows, exit non-zero with a clear "run `make seed` instead" message. The seeder is only meant to run immediately after a reset.
  - A single smoke-test insert (e.g. one row into a low-stakes table) just to prove the round-trip works.
- Add `seed` target to `Makefile`:
  - Depends on `supabase-reset-database`.
  - Runs the seeder via `npx tsx scripts/seed-supabase.ts`.

**Verify on screen:**
- `make supabase-reset-database` still produces empty CRM tables (regression).
- `make seed` exits 0 and the smoke-test row is visible in Supabase Studio.
- Running `SUPABASE_URL=https://something-remote.supabase.co make seed` (or equivalent) exits non-zero with a clear message before touching anything.

### Iteration 1.2 — Auth users + sales reps

**Deliverables:**
- Seeder calls the Supabase Auth Admin API (`createUser`) for `demo@atomic.dev` / `demodemo123`, email confirmed.
- Seeder iterates `db.sales` from `generateData()` and creates an auth user per generated rep — all with the same `demodemo123` password (local-only data, simple to document).
- After trigger fires, seeder UPDATEs the corresponding `sales` rows with `administrator`, `avatar`, etc.
- One of the generated sales reps is reassigned to the `demo@atomic.dev` auth user so the demo user owns records.

**Verify on screen:**
- Login at `localhost:5173` as `demo@atomic.dev` / `demodemo123` succeeds and lands on the dashboard.
- Settings → team shows the demo sales reps.

### Iteration 1.3 — CRM data, funnel-shaped, with edge cases

**Deliverables:**
- Seeder walks the rest of `generateData()`'s `Db`: companies, contacts, deals, tasks, contact_notes, deal_notes, tags.
- ID strip + FK remap in dependency order (record old→new id maps, rewrite FKs before inserts).
- Persist denormalized counts (`nb_contacts`, `nb_deals`, `nb_tasks`).
- Post-generation transforms in the seeder:
  - **Funnel shape:** reassign deal stages to a funnel distribution (e.g. ~40% / 25% / 15% / 10% / 7% / 3% across stages) rather than uniform.
  - **Owned-by-demo-user:** reassign a slice of companies / contacts / deals / tasks to the demo user's sales_id.
  - **Edge cases (a few, deliberate):** at least one task with `due_date < now()` and `done_date IS NULL` (overdue); at least one deal with `updated_at` 90+ days ago in a mid-funnel stage (stale); at least one contact with two entries in `email_jsonb`.
- Fixed faker seed at the top of the seeder so output is reproducible.

**Verify on screen:**
- Logged in as `demo@atomic.dev`:
  - Dashboard shows populated widgets (recent activity, deal stats, tasks).
  - Contact list shows ~500 contacts, virtualized.
  - Company list shows ~55 companies with sizes / sectors.
  - Deal Kanban shows a visible funnel — early stages clearly fuller than late.
  - Tasks list shows at least one overdue item.
  - At least one contact has multiple email addresses in its detail view.
- `make supabase-reset-database` followed by manual login attempt fails (no user exists) — confirms empty path still empty.
- Running `npx tsx scripts/seed-supabase.ts` directly against an already-populated DB exits non-zero with a clear "DB not clean" message (precondition check works).
- Two consecutive `make seed` runs both succeed and produce identical data (reset clears the DB, fixed faker seed makes inserts deterministic).

---

## Exit Criteria

- [ ] `make seed` completes successfully and leaves the local DB populated with a funnel-shaped pipeline.
- [ ] Login as `demo@atomic.dev` / `demodemo123` works in the browser.
- [ ] `make supabase-reset-database` still produces an empty CRM (no regression).
- [ ] Seeder refuses to run against non-localhost `SUPABASE_URL`.
- [ ] Project is left in the seed-data state (i.e. the last operation before closing the increment is `make seed`).
- [ ] No changes to `src/` (except possibly `package.json` / `package-lock.json` for `tsx`) and no schema/migration changes.
- [ ] Tests pass: `make test` (unit) and `make typecheck` are green.
- [ ] Living docs updated: `docs/thoughts/supabase-seeddata.md` gets a closing note pointing at the implementation; `AGENTS.md` (or `CLAUDE.md`) gets a short blurb about `make seed` near the existing "Running with Test Data" section.

---

## Blocked Items

- None. The service-role key comes from `npx supabase status` output (or stored in a local-only file); no external credentials needed.

---

## Previous Increments

- None — this is the first increment in the DevMeta tracker for this repo.

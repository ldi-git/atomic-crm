# Supabase seed data — notes

Working notes on adding a "reset + populate" flow for the real Supabase backend. Not a spec. Decisions still open at the bottom.

## Problem

`make start` runs against real Supabase. `npx supabase db reset --local` re-applies migrations and runs `supabase/seed.sql` — but that file only seeds `favicons_excluded_domains`. Tables `contacts`, `companies`, `deals`, `tasks`, etc. come out empty. Demo mode (`npm run dev:demo`) has rich data because the fakerest generators run in-browser at page load, but that path doesn't touch the database.

We want one command that gives us a populated Supabase database from scratch.

## The make target

`make seed` — chains reset + populate. `make reset` stays as a schema-only reset for the case where you want an empty DB.

Two steps:

1. `npx supabase db reset --local` — drops, re-applies migrations, runs `seed.sql`.
2. `scripts/seed-supabase.ts` run via `tsx` — pushes demo rows into Supabase via `supabase-js` with the service-role key.

Local-only with a hard guard: the seeder refuses to run unless `SUPABASE_URL` resolves to `127.0.0.1` / `localhost`. No `--allow-remote` flag; if we ever need to seed a real staging env, that's a deliberate edit, not a CLI argument.

## How the data is produced

Reuse the existing fakerest generators in `src/components/atomic-crm/providers/fakerest/dataGenerator/`. The seeder imports `generateData()`, gets the same in-memory `Db` object demo mode uses, walks it, inserts via `supabase-js`.

Why this and not the alternatives:

- **Pure SQL in `seed.sql`** — 500 hand-written contact INSERTs is unreadable, and you'd generate the file from a script anyway. Collapses into "the seeder, but writing to disk instead of the DB."
- **`pg_dump` snapshot** — fast to load, but freezes data, creates PR diff noise, and has to be regenerated on every schema change. Reasonable as a *cache* of the seeder output later if reset time gets painful. Not a starting point.
- **Reuse fakerest generators** ← chosen. Single source of truth, schema drift surfaces as REST errors, no new content to write.

## Where it lives

- Generators: stay in `src/components/atomic-crm/providers/fakerest/dataGenerator/` (already exist).
- Seeder script: `scripts/seed-supabase.ts`, run via `tsx`. Lives alongside the other scripts in `scripts/`.
- `seed.sql`: unchanged. It's for table data that ships with the schema (the favicons excludes list), not demo content.
- Makefile: add the `make seed` target, wire it to call `supabase db reset --local` then the seeder.

## How it stays in sync with the schema

Convention, not enforcement — same story demo mode already lives with.

- Generators produce values typed as `Contact`, `Company`, etc. from `src/components/atomic-crm/types.ts`. Add a non-optional field, the generator stops type-checking.
- Inserts go through PostgREST, so a new NOT NULL column or changed type fails the seeder loudly on the next `make seed`.
- What's *not* caught: "added an optional field to the type but forgot to populate it in the generator." That field ends up NULL across all seeded rows. Live with it; not worth tooling.

Adding a Supabase seeder doesn't worsen sync — it just adds one more place to remember when extending the schema. The fakerest generators already needed that discipline.

## Wrinkles we'll hit (not blockers, just real)

- **`sales` ↔ `auth.users` trigger** (`supabase/schemas/04_triggers.sql`). Demo sales reps are real auth users — seeder calls the Supabase Auth Admin API (`createUser`) with documented passwords. Trigger fills the `sales` row; seeder then UPDATEs for `administrator`, avatar, etc. You can log in as Jane Doe / John Smith / the rest with known credentials.
- **IDs**. Fakerest uses sequential ints (0, 1, 2…). Supabase tables use BIGSERIAL. Either insert with explicit IDs and `setval()` afterward, or strip IDs and remap FKs in dependency order. Stripping is cleaner long-term.
- **Avatars / logos**. Keeping the external Marmelab URLs (`marmelab.com/posters/avatar-N.jpeg`, `marmelab.com/react-admin-crm/logos/N.png`). Zero code. If their CDN dies later, fall back to local generation via the existing avatar helpers.
- **Note attachments**. Skipping for v1. Real attachments would mean uploading to the local storage bucket.
- **Denormalized counts** (`nb_contacts`, `nb_deals`, `nb_tasks`). Generators compute these. Need to persist them so views like `contacts_summary` don't need to recompute.
- **RLS**. Service-role key in the seeder. Obvious.

## What good demo data looks like (the bar we're aiming for)

Not a formal goal, but worth writing down so the seeder doesn't drift into "renders without errors" territory:

- Every UI state visible somewhere — deal in every stage, overdue tasks, contacts with and without avatars, companies with one contact and twenty.
- Realistic distributions, not uniform — most companies small, a few huge; most deals modest, a few big.
- Temporal weight toward "now" — recent weeks overrepresented, long tail backwards. Fakerest is uniform-random today; worth fixing.
- The logged-in user owns some records — otherwise personalized widgets look broken on first login.
- Unhappy paths present — overdue tasks, stale deals, stuck-in-stage records. A CRM exists to surface these.
- Determinism by default — same seed, same data. Add `--random` if needed. Fakerest is fresh-random per page load today.
- Plausible note text — lorem is uncanny. "Followed up on pricing, will circle back next week" is fine.

The first four of those are weaknesses in the current fakerest generators. Worth fixing *in the generators* so demo mode benefits too.

## Decisions

1. **Auth users** — real auth users via the Admin API with known passwords. You can log in as the demo sales reps.
2. **Volume** — fakerest defaults: 55 companies / 500 contacts / 50 deals / 400 tasks. Exercises virtualization; reset will probably take 10–30s.
3. **Determinism** — fixed faker seed by default. Same `make seed` always produces the same rows. `--random` flag can come later if needed.
4. **Avatars / logos** — keep the external Marmelab URLs the generators already reference.
5. **Make target** — `make seed` chains reset + populate. `make reset` stays as schema-only.
6. **Runtime** — TypeScript via `tsx`. Direct import of the typed generators.
7. **Notes** — include contact and deal notes (generators already produce them). Attachments still skipped.
8. **Remote safety** — local-only with a hard guard on `SUPABASE_URL`. No CLI override.

## Ruled out

- Hand-written or generated `INSERT` blocks in `seed.sql` for CRM data — collapses into "the seeder, written to disk."
- `pg_dump` snapshot as the primary mechanism — fine as a later optimization, not a starting point.
- Touching `auth.users` directly to bypass the sales trigger — brittle to GoTrue internals, not worth the speed.
- Uploading real attachment files in v1 — scope creep.
- Pointing the seeder at remote Supabase by default — too easy to wipe production.

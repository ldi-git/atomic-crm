# Iteration 1.1 Status

**Started:** 2026-05-21
**Status:** In Progress
**Base branch:** course-main

## Features

| Feature | ID | Tasks | Status | Depends On |
|---------|----|-------|--------|-----------|
| 1.1.A: Bootstrap seeder | qm6 | 6 | Not started | — |

## Feature Independence Map

```
[1.1.A: Bootstrap seeder]   ← single feature, sequential tasks
```

Iteration 1.1 is small enough that splitting would be artificial. One feature, six tasks (deps → research → script → Makefile → verify → re-ground), then four iteration-level wrap-up tasks (PR / merge / metadata commit / kick off 1.1R).

## Notes

- Task `cah` adds `tsx` + `@supabase/supabase-js` as direct devDependencies. supabase-js is currently only transitive via `ra-supabase-core@3.5.2` (resolved to `2.90.1`).
- Task `8aj` is a research task to confirm the exact field names in `npx supabase status -o json` — don't guess them in the script.
- Smoke-test insert lands in `tags` (`name='__seed_smoke_test__'`). Easy to verify; doesn't conflict with iteration 1.3.
- Clean-DB precondition checks the `companies` count — `tags` itself starts empty after reset and would also work, but `companies` is the source of truth for "CRM data present?" used throughout the future seeder.
- Verify task `mhx` covers two negative paths (non-localhost guard, clean-DB precondition) — must fail loudly without touching the DB.

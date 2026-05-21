# Lessons learned

> Recurring gotchas, surprising findings, and "don't do this again" notes that emerge during execution. Add an entry whenever an iteration's I&A cycle surfaces something worth keeping.

## `make lint` is partially red on `main` (prettier)

`make lint` runs `npm run lint` (eslint) and `npm run prettier` (`--check`). On `main` as of 2026-05-21, prettier reports ~427 pre-existing formatting issues across the codebase; eslint is clean.

**Why:** Files have drifted out of sync with the prettier config over time and no global reformat has been done.

**How to apply:** Treat `make lint` failures as in-scope **only when the failing files are ones the current iteration touched**. For pre-existing prettier debt elsewhere, do not absorb it into a feature PR — that turns a small feature into a 400-file diff. The pre-commit hook auto-formats new/edited files, so your own changes will be prettier-clean by the time they land.

**For exit-criteria purposes,** treat `npm run typecheck`, `npm run lint` (eslint), and `npm run test:unit:app` as the effective quality gates for an iteration. Add a follow-up "global prettier sweep" as its own dedicated iteration / increment if/when desired — but never bundle it into unrelated feature work.

First surfaced: iteration 2.1 (increment 2-wpr).


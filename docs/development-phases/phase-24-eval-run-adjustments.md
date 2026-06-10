# Phase 24 — Eval Run UX Adjustments and Run Trash Can

## Purpose

Most evals only ever have one run, so the tool should stop talking about "runs" until a second one exists (from `docs/working-notes/eval-run-adjustments.md`, 2026-06-10). Folded in: a trash-can mechanism for run deletion (delete → recoverable for 30 days → auto-purge), since the admin run delete was the one permanently destructive action without a safety net.

## What this phase delivers

**Single-run collapse:**
- Opening an eval with exactly one (not-yet-completed) run goes straight to that run's page instead of a detail page listing one row. A single COMPLETED run still renders the eval detail — that's the score matrix view.
- The run page leads with the **eval title** (heading, browser title, breadcrumbs) when it is the eval's only run; "Run N" framing returns automatically once a second run exists.
- `/eval/reports` lists **evaluations as primary** with their completed runs beneath (`listReportsGroupedByEval`), instead of a flat run table.

**Run trash can:**
- `EvalRun.deletedAt` (additive). Trashed runs vanish from every tool surface — evals list/counts, dashboard, run pages, reports, review queues, share links — centralized mostly through the `getRunByPublicId` chokepoint plus relation filters (`LIVE_RUNS` in evals.service).
- Admin `/admin/eval`: "Move to trash" (reversible) replaces the permanent delete; a Trash panel lists trashed runs with **Restore** and **Delete now**; everything audit-logged (`eval.run_trashed` / `restored` / `deleted`).
- **Empty evals are removed** (the note's third bullet): trashing an eval's last live run archives the eval (hidden from the tool); restoring the run un-archives it; hard-purging the last run of an archived eval deletes the eval row.
- Worker sweep (`purgeExpiredTrashedRuns`, every 6 hours + at startup) hard-purges runs trashed more than **30 days** ago via the existing cascade.
- Open tasks are cancelled when their run is trashed; run numbers count trashed runs so a restored run never collides.

## Out of scope

- Trash-can semantics for orgs and help articles (still tracked in deferred-work; orgs already soft-delete, they just lack a trash view/restore/purge).
- Restoring cancelled tasks on run restore (reviewers can simply be re-assigned).

## Phase closeout

### Completion checklist

- [x] All acceptance criteria pass.
- [x] Schema applied additively; `db:generate` run.
- [x] Routes documented in `docs/reference/usage.md`.
- [x] Roadmap updated; working note archived.
- [x] No unplanned files were added directly under `docs/`.

### Closeout notes

- Three eval-wizard tests asserted the old "Run 1" heading and were updated to the new intended behavior (eval title after first launch).
- New QA test covers the full surface: single-run redirect + heading, "Run N" returning with a second run, grouped reports, trash → 404 in the tool → restore → 200, last-run trash archiving the eval (and restore un-archiving it), and permanent purge. One test-side race (navigating before a form POST landed) and one wrong selector were fixed during stabilization; service logic was verified directly against the live DB.
- Verification: additive SQL via `prisma db execute`; `db:generate`; `pm2 restart rumbo-web rumbo-worker` (sweep starts clean); `npm run qa` 39/39.

Next: the launch externals in the phase-09 checklist remain the only pre-launch work.

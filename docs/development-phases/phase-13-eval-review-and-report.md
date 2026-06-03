# Phase 13 — Eval Review Workflow and Report

## Purpose

Deliver the collaborative half of the Eval workflow: assign reviewers to a run, let them score responses against the run's criteria and leave comments (with autosave), submit their reviews, complete the run, and produce an on-screen comparative **report** with an editable summary/recommendation and an optional secure share link.

After this phase the full core loop is complete: author → launch → collect → **review → report**.

## Current state

- Phase 12 delivered eval authoring, run launch with immutable snapshots, response collection (manual + live API), and run status/lifecycle.
- Runs can reach `READY_FOR_REVIEWS`/`IN_REVIEW`; `EvalReviewAssignment`, `EvalRating`, `EvalReviewComment`, and `EvalReport` tables exist from Phase 11.
- The standalone Model Eval implements review autosave endpoints and a report matrix (`review.controller.js`, `review.service.js`, `report.service.js`, `reports.controller.js`).
- Frontend convention is server-rendered Twig + vanilla JS; SLU autosaves workbench options via small fetch calls.

## Product decisions

- Reviewers are organization members assigned **per run** (`EvalReviewAssignment`), independent of their per-tool role. A manager (Eval `MANAGER` grant) assigns them; assignees must have at least Eval `MEMBER` access.
- The review screen autosaves ratings and comments via **vanilla-JS fetch** to JSON endpoints; no React island.
- Scores are recorded per `(response, criterionSnapshot, reviewer)`; comments per `(response, reviewer)`.
- `hideModelNames` / `hidePeerReviews` run options are honored in the review and report views.
- The report is **on-screen** with an editable summary and recommendation, plus an optional **secure share link** (`EvalReport.secureShareToken`). **No PDF/PNG/PPTX export** in this phase.

## What this phase delivers

### Reviewer assignment

- Managers assign/unassign reviewers to a run (`EvalReviewAssignment`), with the run transitioning to `IN_REVIEW` once reviews are open. Port `eval-runs.controller.js` assignment logic.
- Validate assignees have Eval access (`resolveToolRole(user, orgId, 'eval')` non-null); managers cannot assign users without access.

### Review screen (Twig + vanilla JS autosave)

- `pages/eval/.../review`: presents each response (respecting `hideModelNames`) with a rating control per criterion and a comment field. Port the layout from the standalone review page.
- Autosave endpoints returning JSON (port `review.controller.js`):
  - `POST .../review/ratings` — upsert a single `EvalRating` (`score` for response×criterionSnapshot×reviewer).
  - `POST .../review/comments` — upsert an `EvalReviewComment`.
  - small vanilla-JS module debounces and posts on change, with save-state feedback.
- `POST .../review/submit` — finalize the reviewer's `EvalReviewAssignment` (`completedAt`); validate completeness per the original's rules.

### Run completion

- Manager can close the review period (`close`) → run `COMPLETED`, capturing `completedByUserId`/`completedAt`.
- Closing generates/refreshes the `EvalReport` aggregate.

### Report

- `pages/eval/.../report`: comparative **matrix** of models × criteria with aggregated scores across reviewers, plus per-response comments (respecting `hidePeerReviews`). Port `report.service.js` aggregation.
- Editable `summaryText` and `recommendationText` on `EvalReport` (manager only).
- A list of completed reports for the org (`pages/eval/reports`).
- **Secure share link:** toggle `secureShareEnabled` and generate `secureShareToken`; a tokenized read-only report route accessible without org membership. Validate token, no mutation, respects hide options.

## Out of scope

- Report exports to PDF/PNG/PPTX (deferred).
- Tasks inbox and notifications/reminders (Phase 14).
- Reviewer analytics beyond the aggregated matrix.
- Inline annotations on response text.

## Acceptance criteria

- A manager can assign and unassign reviewers to a run; only users with Eval access can be assigned.
- A reviewer sees their assigned run, scores each response against each criterion, and leaves comments, with changes autosaving (visible save state) and surviving reload.
- `hideModelNames` and `hidePeerReviews` are honored in review and report views.
- A reviewer can submit their review; the assignment is marked complete.
- A manager can close the review period; the run becomes `COMPLETED` and a report is generated.
- The report shows a correct models × criteria matrix with aggregated scores and comments.
- A manager can edit the report summary and recommendation.
- A manager can enable a secure share link that renders the report read-only without authentication, honoring hide options; disabling it revokes access.
- SLU, access gating, and existing flows still pass QA.

## Implementation guidance

- Reuse the SLU autosave-via-fetch pattern; keep the JS minimal and progressive (form still meaningful without JS where practical).
- Keep aggregation in a service (`report.service.js` port) and unit-test the matrix math, especially with partial reviews and hidden columns.
- Enforce authorization server-side on every autosave endpoint (reviewer may only write their own ratings/comments for runs they are assigned to).
- Treat the secure share route as untrusted/public: token-only lookup, read-only, no org context leakage.
- Keep every query tenant-scoped by `organizationId` except the tokenized share route, which is scoped by the token's report.
- Add Playwright coverage for: assignment, review autosave + reload persistence, submit, run completion, report matrix correctness, and secure-share read-only access.

## Suggested implementation slices

1. Reviewer assignment + open-for-review transition.
2. Review screen + ratings/comments autosave endpoints + vanilla-JS module.
3. Review submit + completeness validation.
4. Run close → completion → report generation.
5. Report matrix view + summary/recommendation editing.
6. Secure share link + tokenized read-only route.
7. QA/Playwright.

## Phase closeout

Use `.agent/phase-review.agent.md` for closeout.

### Completion checklist

- [x] All acceptance criteria pass.
- [x] Relevant commands/checks were run.
- [x] Manual QA notes are recorded.
- [x] New commands are documented in `docs/reference/usage.md`, if commands exist.
- [x] New architectural decisions are recorded in `docs/active-planning/decision-log.md`. (Review screen stays vanilla JS — no new decision beyond existing frontend standards.)
- [x] Roadmap items are checked off, added, or moved.
- [x] Deferred work is listed explicitly in `docs/active-planning/deferred-work.md`. (No new deferrals.)
- [x] Working notes created during this phase were promoted, linked, archived, or deleted. (None.)
- [x] No unplanned files were added directly under `docs/`.
- [x] The next phase still makes sense or has been revised.

### Closeout notes

- Frontend decision (confirmed with the user): the review screen stays **server-rendered Twig + vanilla JS**, not a React island — the interaction (save-on-change ratings/comments) mirrors the existing autosave pattern and doesn't warrant a second framework surface. The review UX matches model-eval's: **tabs to flip between responses**, scoring one at a time, rather than a large grid.
- Reviewer assignment: managers assign/unassign org members who hold an eval grant (`listAssignableReviewers`); run lifecycle extended to `READY_FOR_REVIEWS → IN_REVIEW → COMPLETED` (with reopen), gated so opening requires ≥1 reviewer and completing requires the run to be in review.
- Review screen (`review.js`, loaded by `main.js`, no-op without `#eval-review`): tabbed responses, 1–5 score selectors and a comment per response, autosaving over fetch to JSON endpoints (`upsertRating` on a compound unique; comment via find-then-upsert). Submit confirms then finalizes the assignment. `hideModelNames` renders neutral "Response A/B/C" labels. Reviewers reach their work from a "Your reviews" list on the Eval overview.
- Completion + report: closing review sets `COMPLETED` and ensures an `EvalReport`. The report aggregates all reviewers' ratings into a models×criteria **heatmap** (`getReportData`), with editable summary/recommendation and a **secure share link** — a tokenized, public, read-only route mounted *outside* `requireToolAccess` (`evalShareRouter` at `/eval/share/:token`) that always hides model names.
- Verification: `npm run build`; `npm run qa` (23/23). Full HTTP end-to-end with two accounts: manager assigned a member reviewer and opened the run; the reviewer scored 2 responses × 2 criteria (autosave `{ok:true}`) plus a comment and submitted; manager closed review → report rendered the heatmap; saved summary/recommendation; enabled the share link and fetched it **unauthenticated** — matrix shown with model names hidden ("Response A/B"). Test data cleaned up afterward.

### Valid outcomes

- Proceed to Phase 14 (tasks and notifications).
- Stay in this phase and finish missing work.
- Move specific blocked work to a named later phase.
- Revise the roadmap because product understanding changed.

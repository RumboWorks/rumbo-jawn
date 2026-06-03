# Phase 14 — Eval Tasks and Notifications

## Purpose

Add the engagement layer that keeps an Eval moving: a per-user **tasks inbox** (assigned reviews, manual-response collection) and **in-app + email notifications** (assignment, reminders, completion, manual-response-needed). This is what turns a collaborative tool from "works if everyone remembers" into "tells people what they need to do."

This completes the Eval MVP scope agreed for the migration.

## Current state

- Phases 11–13 delivered the Eval tool foundation, authoring/runs/responses, and the review/report workflow.
- `EvalTask` and `EvalNotification` tables exist from Phase 11.
- Phase 08b provides platform SMTP email infrastructure (`EMAIL_TRANSPORT`, env-driven, with `log` mode for safe development) used for invites and password recovery.
- The standalone Model Eval modeled tasks/notifications but did not fully implement delivery (its job queue was never built); reminders were planned, not shipped.

## Product decisions

- A **task** is a concrete unit of work assigned to a user for a run: `REVIEW_RESPONSES` (you have a review to complete) and `COLLECT_MANUAL_RESPONSE` (you need to paste a model's output). Tasks have `OPEN`/`COMPLETED`/`CANCELLED`/`OVERDUE` status.
- **Notifications** are delivered **in-app** and optionally by **email**, reusing the Phase 08b SMTP infra. Types: review assigned, review reminder, eval completed, manual-response needed.
- Reminder sends are operationally simple for the MVP (e.g. a manager-triggered "send reminders" action and/or a lightweight scheduled sweep); heavy scheduling infrastructure is out of scope.
- Email sends fail safely with operator-visible errors, consistent with Phase 08b.

## What this phase delivers

### Tasks

- Task creation is wired into existing transitions:
  - assigning a reviewer (Phase 13) creates a `REVIEW_RESPONSES` task,
  - a model snapshot needing manual collection (Phase 12) creates a `COLLECT_MANUAL_RESPONSE` task.
- Tasks are completed automatically when the underlying work is done (review submitted / manual response saved) or cancelled when the run is closed/cancelled.
- A **tasks inbox** (`pages/eval/tasks`) lists the signed-in user's open Eval tasks across the org with deep links to the relevant review or manual-response screen. Port `tasks.controller.js` / `tasks.repository.js`.

### Notifications

- `EvalNotification` records are created on: review assigned, review reminder, eval completed, manual-response needed.
- **In-app:** an indicator/list surface (in the Eval tool, and/or a small badge) showing unread notifications with `readAt` marking. Keep it simple and Eval-scoped.
- **Email:** for the same events, send via the Phase 08b SMTP service with clear templates; respect `channel` (email vs in-app) and avoid duplicate spam (e.g. reminders are rate-limited per assignment).
- **Reminders:** a manager action on the run status page to send review reminders to assignees with incomplete reviews; optionally a lightweight scheduled sweep that marks overdue tasks and sends reminders before `reviewClosesAt`.

## Out of scope

- Report exports (deferred).
- A full cross-tool platform notification center (this phase is Eval-scoped; a shared notifications system can be generalized later).
- Rich scheduling/digest infrastructure beyond simple reminders and an optional sweep.
- SMS or third-party push channels.

## Acceptance criteria

- Assigning a reviewer creates a `REVIEW_RESPONSES` task and a "review assigned" notification (in-app, and email when enabled).
- A model needing manual collection creates a `COLLECT_MANUAL_RESPONSE` task and a "manual-response needed" notification.
- Completing the underlying work marks the corresponding task `COMPLETED`; closing/cancelling a run cancels its open tasks.
- The tasks inbox shows the signed-in user's open Eval tasks with working deep links.
- Completing a run sends an "eval completed" notification to the relevant users.
- A manager can send review reminders to assignees with incomplete reviews; reminders are rate-limited and do not duplicate.
- Email sends use the Phase 08b SMTP infra, honor `EMAIL_TRANSPORT=log` in development, and fail safely with visible errors.
- In-app notifications can be marked read.
- SLU, access gating, and existing flows still pass QA.

## Implementation guidance

- Reuse the Phase 08b email service; do not introduce a second email path.
- Generate tasks/notifications from the same services that own the transitions (assignment, manual-collection setup, run completion), not from view routes.
- Keep the in-app surface minimal and Eval-scoped; note in deferred-work that a shared cross-tool notification center may generalize this later.
- For the optional scheduled sweep, prefer a small worker/cron-style job consistent with platform conventions; keep it idempotent.
- Rate-limit reminders per `EvalReviewAssignment` to avoid spam.
- Add Playwright/integration coverage for: task creation/completion on assignment and submit, tasks inbox links, reminder send (log transport), and completion notification.

## Suggested implementation slices

1. Task creation/completion/cancellation wired into existing transitions.
2. Tasks inbox page.
3. In-app notification surface + mark-read.
4. Email notifications via Phase 08b SMTP (assigned, manual-needed, completed).
5. Manager-triggered reminders (+ optional overdue sweep).
6. QA/Playwright.

## Phase closeout

Use `.agent/phase-review.agent.md` for closeout.

### Completion checklist

- [ ] All acceptance criteria pass.
- [ ] Relevant commands/checks were run.
- [ ] Manual QA notes are recorded.
- [ ] New commands are documented in `docs/reference/usage.md`, if commands exist.
- [ ] New architectural decisions are recorded in `docs/active-planning/decision-log.md`.
- [ ] Roadmap items are checked off, added, or moved.
- [ ] Deferred work is listed explicitly in `docs/active-planning/deferred-work.md`.
- [ ] Working notes created during this phase were promoted, linked, archived, or deleted.
- [ ] No unplanned files were added directly under `docs/`.
- [ ] The Eval migration is complete or remaining work is explicitly phased.

### Valid outcomes

- Eval MVP migration complete; proceed to launch hardening / next tool.
- Stay in this phase and finish missing work.
- Move deferred items (exports, cross-tool notifications) into named later phases.
- Revise the roadmap because product understanding changed.

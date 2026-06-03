# Phase 12 — Eval Authoring, Runs, and Response Collection

## Purpose

Deliver the core authoring half of the Eval workflow: create evaluations, launch runs that capture immutable snapshots of the prompt/criteria/models, and collect AI responses for review — both **manually** (copy/paste) and via **live API calls** to providers (through the shared job/worker/AI infrastructure).

After this phase a manager can go from "I want to evaluate these models on this prompt against these criteria" to "the responses are collected and ready for reviewers."

## Current state

- Phase 11 delivered the Eval tool scaffold, the full Eval-domain schema (including `EvalRun`, snapshots, `EvalResponse`), the permission mapping, and the settings surfaces (model catalog, criteria).
- Platform shared `@rumbo/jobs` (`createJob`, `claimNextJob`, `completeJob`, `failJob`), `apps/worker` handler registry, `@rumbo/ai` (provider wrapper with `AiCall` cost logging), and `@rumbo/billing` (usage events + AI spend cap) are available and used by SLU.
- The standalone Model Eval implements the eval/run/snapshot/response logic but never implemented its job queue; live API collection was synchronous/ad-hoc.

## Product decisions

- A **run** captures **immutable snapshots** at launch: `EvalPromptSnapshot`, `EvalCriterionSnapshot` (from selected `EvalCriterion`), `EvalModelSnapshot` (from selected `EvalOrgModel`). Editing criteria/models later never changes a launched run.
- Responses can be collected two ways:
  - **Manual:** a user pastes the model output (e.g. when using a tool that has no API, or an API that isn't configured).
  - **Live API:** the platform calls the provider via `@rumbo/ai` inside a background job, records cost in `AiCall`, and is gated by the org's `aiSpendCapUsd`.
- Live API collection is **asynchronous** via `@rumbo/jobs` + `apps/worker`, consistent with SLU's analysis job pattern.
- Usage is recorded as a `UsageEvent` (`tool: 'eval'`, `usageKey: EVAL_RESPONSE_COLLECTION`) so org limits apply.

## What this phase delivers

### Eval authoring (CRUD)

- Managers create/edit/archive `Eval` records (title, description) — `pages/eval/evals` list, detail, new/edit forms. Port `evals.controller.js` / `evals.repository.js` / `evals.service.js`.
- Eval detail shows run history.

### Run creation wizard

- A run-creation flow (port `eval-wizard.service.js` + `eval-runs.controller.js`) where the manager:
  - sets/edits the prompt text for this run,
  - selects which criteria apply,
  - selects which org models to evaluate (each with its access method),
  - sets options (e.g. `hideModelNames`, `hidePeerReviews`, `reviewClosesAt`).
- On **launch**, create the immutable snapshots and transition the run from `DRAFT` to `COLLECTING_RESPONSES`; create one `EvalResponse` slot per model snapshot.

### Response collection

- **Manual collection** (`pages/eval/.../manual-response/:responseId`): a form to paste/edit response text; sets `responseSource = MANUAL`, `submittedByUserId`, `submittedAt`.
- **Live API collection:** for model snapshots whose access method is platform/org API, enqueue `createJob('eval.collectResponse', { responseId, ... }, { userId, orgId })`. A new worker handler `collectResponse` (exported from `@rumbo/eval/worker`):
  - resolves the model + prompt snapshot,
  - calls the provider via `@rumbo/ai` (cost logged to `AiCall`, model chosen via `AiModelConfig` / org key),
  - writes the response text to the `EvalResponse`, sets `responseSource = PLATFORM_API`/`ORGANIZATION_API`,
  - records a `UsageEvent` and respects the org `aiSpendCapUsd` (skip/fail cleanly when over cap).
  - Register `'eval.collectResponse': collectResponse` in `apps/worker/src/index.js` and add `@rumbo/eval` to the worker package.
- Large response text may be stored inline (`@db.LongText`) as in the original; artifacts via `@rumbo/storage` only if needed.

### Run status and lifecycle

- Run status page (port `eval-runs.controller.js` status view): progress, which responses are collected vs missing, which are pending API jobs.
- Transition to `READY_FOR_REVIEWS` when responses are collected; allow `close`/`reopen` of the run.
- Usage budget surfaced to managers (reuse the `getUsageBudgetStatus` pattern from SLU).

## Out of scope

- Reviewer assignment, rating/commenting, and the report (Phase 13).
- Tasks and notifications (Phase 14).
- Report exports (deferred).
- Retry UX beyond the standard job `maxAttempts`.

## Acceptance criteria

- A manager can create, edit, and archive evals, and view a run history per eval.
- Launching a run creates immutable prompt/criteria/model snapshots; later edits to source criteria/models do not change the launched run.
- One response slot exists per model snapshot after launch.
- A manager can collect a response **manually** and see it stored against the correct model snapshot.
- A manager can trigger **live API** collection; a worker job calls the provider via `@rumbo/ai`, stores the response, logs an `AiCall`, records a `UsageEvent`, and respects the org AI spend cap.
- The run status page accurately reflects collected vs missing responses and pending jobs.
- A run can be closed and reopened.
- Over-cap or failed API collection fails safely with an operator-visible error and does not corrupt run state.
- SLU, access gating, and existing flows still pass QA.

## Implementation guidance

- Mirror SLU's job pattern: `routes.js` enqueues with `createJob`; the AI-touching handler lives behind the `@rumbo/eval/worker` export so the web router stays free of AI deps.
- Keep snapshot creation in a single transactional service so a partially-launched run cannot exist.
- Reuse `@rumbo/ai` for all provider calls; never call providers directly from Eval. Use `AiModelConfig` (`tool: 'eval'`) for model selection and org API keys for org-API access methods.
- Record `UsageEvent` and check budget consistently with `packages/billing`.
- Keep every query tenant-scoped by `organizationId`.
- Add Playwright coverage for: eval CRUD, run launch + snapshot immutability, manual collection, and a mocked live-API collection job.

## Suggested implementation slices

1. Eval CRUD + detail/run-history.
2. Run wizard + transactional snapshot creation on launch.
3. Manual response collection.
4. `eval.collectResponse` worker handler + live API collection enqueue + usage/cost/cap.
5. Run status page + close/reopen.
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
- [ ] The next phase still makes sense or has been revised.

### Valid outcomes

- Proceed to Phase 13 (review and report).
- Stay in this phase and finish missing work.
- Move specific blocked work to a named later phase.
- Revise the roadmap because product understanding changed.

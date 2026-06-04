# Eval Authoring UX Pass — Recommendations & Run-Wizard Design

> Working note. Captures the UX review of the Eval authoring flow and the design for the
> single-page run-creation wizard. Promote durable decisions into the tool docs once the wizard
> lands; archive this note afterward.

## Context

The Eval tool's settings surfaces (criteria, models) were converted to the platform's
list-first / inline-edit convention in commit `260d7a4`, documented in
`docs/project-charter/coding-standards.md` → **Interaction patterns**. The *authoring* flow —
creating an evaluation and configuring/launching its first run — was explicitly left as a tracked
refinement (comment at `tools/eval/src/routes.js` near the `POST /evals` redirect: "Authoring UX,
incl. the multi-step wizard, is a tracked refinement.").

Today that flow is a disjoint two-hop: a bare **New evaluation** form (`eval-new.twig`) that
redirects into a single dense **New run** form (`run-new.twig`) stacking prompt + every model +
every criterion + options on one screen. It works, but it is form-first, high-friction, gives no
sense of progress, and buries the "you need a model/criterion first" failure mode.

## Decisions (locked with the user)

- **Architecture:** single-page **stepped form** — all steps in one `<form>`, JS reveals one step
  at a time and drives a progress indicator, **one final POST** that reuses the existing
  `createEval()` / `launchRun()` services. No per-step server round-trips, **no `req.session`
  wizard state** (deliberately avoids the session-store race behind the flaky-flash bug in
  `dae3ba5`). Progressive enhancement: with JS off, all steps render stacked and submit once.
- **Eval creation folds into the wizard as step 1** (About). New-evaluation entry → full wizard;
  new-run-on-existing-eval → same wizard with step 1 skipped.
- **No leave-and-resume** persistence in this pass.

## 1. Screen inventory & UX verdict

Views under `apps/platform-web/views/pages/eval/`.

| Screen | File | Verdict |
|---|---|---|
| Dashboard | `index.twig` | OK. Out of scope. |
| Tasks | `tasks.twig` | OK. Out of scope. |
| Evaluations list | `evals.twig` + `_eval-row.twig` | ✅ List-first + inline-edit. Reference-correct. |
| **New evaluation** | `eval-new.twig` | ❌ Replace — becomes step 1 of the wizard. |
| Evaluation detail | `eval-detail.twig` | ⚠️ Runs as read-only `<table>` (fine). "New run" action + empty-state link must re-point at the wizard. |
| **New run** | `run-new.twig` | ❌ Replace with wizard — the core deferred item. |
| Run status | `run-status.twig` | ⚠️ Lifecycle dashboard, not authoring. Out of scope. |
| Manual response | `response-manual.twig` | OK (legit full page). Out of scope. |
| Review | `review.twig` | ✅ Immediate-save island. Out of scope. |
| Report / share | `report.twig`, `report-share.twig` | OK. Out of scope. |
| Criteria settings | `settings-criteria.twig` + `_criterion-row.twig` | ✅ Reference-correct. |
| Models settings | `settings-models.twig` + `_model-row.twig`, `models-new.twig` | ✅ Reference-correct. |

Cross-cutting nit: hand-rolled `<p><a>&larr; Back to …</a></p>` back-links across `run-new`,
`eval-detail`, `run-status` instead of a shared partial. P2.

## 2. Prioritized fixes (authoring scope)

**P0** — Replace the `eval-new` → `run-new` two-hop with a single-page stepped run wizard folding
eval creation in as step 1 (§3). Reuses `createEval()` / `launchRun()`; no new business logic.

**P1**
- Re-point every run-creation entry at the wizard: `eval-detail.twig` "New run" action and
  empty-state, plus the post-create redirect in `routes.js`.
- Move the missing-models/criteria guard *into* the wizard as an inline empty-state on the relevant
  step (link to Settings), replacing the top-of-page danger alert in `run-new.twig`.
- Validate **before** `createEval()` in the combined new-eval submit so a rejected submit can't
  leave an orphan evaluation.

**P2** — Review-step per-section Edit jump links; stepper a11y (`aria-current`, fieldset/legend,
focus on reveal); shared back-link partial.

## 3. Run-creation wizard — design

### Steps

| # | Step | Fields | Required to advance |
|---|---|---|---|
| 1 | About *(new-eval only)* | Title, Description | Title non-empty |
| 2 | Prompt | `promptText` | non-empty |
| 3 | Models | `modelIds[]` (empty-state → Settings) | ≥1 checked |
| 4 | Criteria | `criterionIds[]` (empty-state → Settings) | ≥1 checked |
| 5 | Review & launch | summary + Options (`hideModelNames`, `hidePeerReviews`, `reviewClosesAt`) + Edit links | Launch submits |

### Single-page mechanics

One `<form>` holds all steps. A generic, data-attribute controller (`wizard.js`, mirroring
`inline-edit.js`) handles reveal + progress:

- Contract: `[data-wizard]` wrapper, `[data-wizard-step="…"]` sections, `[data-wizard-nav]` stepper,
  `[data-wizard-next]` / `[data-wizard-back]` (`type="button"`), single `[type="submit"]` Launch.
- **Next** runs `checkValidity()` over the current step's fields; if valid, reveals the next step,
  advances the stepper (`aria-current`, done/active/pending), focuses the first field. Invalid →
  native messages, stay put.
- **Progressive enhancement:** controller adds `is-enhanced`; CSS hides non-first steps and shows
  stepper/Next/Back **only** when `is-enhanced`. JS-off → all steps stacked, lone Launch submits,
  server validates. No session state either way.

Shared `rj-wizard*` classes in `partials/_wizard.scss` (a wizard is a platform primitive).

### Routes & handlers (`tools/eval/src/routes.js`)

- `GET /evals/new` — render `wizard.twig`, `mode: 'new-eval'` (About visible), load `criteria` +
  `models`.
- `GET /evals/:publicId/runs/new` — render `wizard.twig`, `mode: 'new-run'` (About hidden), `eval`
  known. Replaces the `run-new` render.
- `POST /evals` — content-aware: if `promptText` present (wizard submit), validate → `createEval()`
  → `launchRun()` → `onRunLaunched()` for manual responses → redirect to `/eval/runs/:publicId`.
  Else keep today's create-then-redirect. Validate before `createEval()`.
- `POST /evals/:publicId/runs` — unchanged; the new-run wizard reuses it as-is.

No service/repository changes.

### Files

- New: `views/pages/eval/wizard.twig`, `src/assets/js/wizard.js`,
  `src/assets/scss/partials/_wizard.scss`.
- Changed: `tools/eval/src/routes.js`, `views/pages/eval/eval-detail.twig`, `main.js` (+ import),
  `main.scss` (+ `@use 'partials/wizard'`).
- Removed after the wizard lands: `eval-new.twig`, `run-new.twig`.

## 4. Verification

- Build the platform-web bundle (no `prisma db push --force-reset`; schema unchanged, dev DB has
  real data).
- JS-on new eval: step through, Next gating, Back preserves entries, Launch creates eval + run →
  lands on run-status with "Run N launched"; manual model yields a collection task.
- JS-on new run on existing eval: starts at Prompt; launches a second run.
- Empty-state: zero models / zero criteria → inline "add in Settings", Launch unreachable, no orphan
  eval on rejected submit.
- JS-off: all steps stacked, single submit, server-side validation flashes correctly.

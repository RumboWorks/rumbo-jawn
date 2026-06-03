# Phase 11 — Eval Tool Foundation

## Purpose

Stand up **Eval** (formerly "Model Eval") as the second Rumbo tool: package scaffold, route mounting, navigation entry, the Eval-domain database schema reconciled to platform conventions, the tool's permission mapping onto per-tool roles, and the organization-level settings surface (model catalog and evaluation criteria).

Eval lets an organization systematically evaluate AI model/tool outputs: managers define evaluations (prompts, models, criteria), responses are collected, assigned reviewers score them, and managers read a comparative report. This phase delivers the foundation those later phases build on. It is the **first consumer of the Phase 10 per-tool access model**.

## Current state

- Phase 10 added the tool registry (`eval` registered, `orgOpen: false`), `ToolGrant`, `resolveToolRole`, `requireToolAccess`, access-driven nav, and platform-admin grant UI.
- `tools/model-eval/` is an empty stub package (`@rumbo/model-eval`).
- The standalone Model Eval app lives read-only at `model-eval-dev/` (Express + Twig + Prisma, Int IDs, its own duplicate identity/org/partner tables and a 40+ permission matrix).
- Platform shared packages exist: `@rumbo/auth`, `@rumbo/db`, `@rumbo/jobs`, `@rumbo/ai`, `@rumbo/billing`, `@rumbo/storage`.
- Phase 08b provides org member management and SMTP email; Phase 07b provides org entitlement tool toggles.

## Product decisions

- Naming emphasizes "eval": URL prefix `/eval`, tool key `eval`, package `@rumbo/eval`, views in `apps/platform-web/views/pages/eval/`, CSS prefix `eval-`, display name **"Eval"**.
- The empty `tools/model-eval` stub is renamed to `tools/eval` / `@rumbo/eval`.
- **Reuse the platform's shared identity, org, partner, jobs, AI, billing, storage, and admin** infrastructure. Drop Model Eval's duplicate `User`/`Organization`/`Membership`/`Invite`/`PasswordReset`/`Session`/`Partner*` tables, its own auth/passport/permissions, its email service, its ad-hoc AI calls, and its `AnalyticsEvent`/`AuditLog`.
- Eval-domain tables are added to the single platform Prisma schema, re-cast to platform conventions: **String `cuid` IDs**, **`Eval`-prefixed** table names (mirroring `SluFeedback`), **UPPERCASE enums**.
- Eval permissions map onto Phase 10 tool roles: org-tool **MANAGER** authors/manages/reports; org-tool **MEMBER** reviews assigned work and views completed reports. No standalone permission matrix.
- Frontend is server-rendered **Twig + vanilla JS**, consistent with Model Eval's origin and the platform.

## What this phase delivers

### Package scaffold and mounting

- Rename `tools/model-eval` → `tools/eval`; package `@rumbo/eval` with `src/index.js` exporting `evalRouter` (router-only, no AI deps), mirroring `tools/sounds-like-us`.
- Add `@rumbo/eval` as a dependency of `apps/platform-web`; mount `router.use('/eval', requireToolAccess('eval'), evalRouter)` in `apps/platform-web/src/routes/index.js`.
- Views under `apps/platform-web/views/pages/eval/`; an `eval-` prefixed SCSS partial; every render passes `tool: 'eval'`.
- The Eval nav entry already comes from the Phase 10 registry; this phase makes the destination real.

### Eval-domain schema (added to `packages/db/prisma/schema.prisma`)

Reconcile the standalone schema (`model-eval-dev/app/web/prisma/schema.prisma`) to platform conventions. Add (this phase introduces the catalog/criteria/eval container; runs and downstream tables can be added here or in Phase 12 as convenient, but define the full set so relations are coherent):

- **Model catalog:** `EvalProvider`, `EvalProviderModel`, `EvalOrgModel` (with `accessMethod`: platform API / org API / manual; `EvalOrgModel.organizationId` → platform `Organization`).
- **Criteria:** `EvalCriterion` (org-scoped, reusable, `displayOrder`, `archivedAt`).
- **Eval container:** `Eval` (org-scoped, `publicId`, title/description, `createdByUserId` → platform `User`).
- Define (used heavily in Phase 12–14, declared now for relational integrity): `EvalRun`, `EvalPromptSnapshot`, `EvalCriterionSnapshot`, `EvalModelSnapshot`, `EvalResponse`, `EvalReviewAssignment`, `EvalRating`, `EvalReviewComment`, `EvalReport`, `EvalTask`, `EvalNotification`.
- Conventions: String `cuid` PKs; `userId`/`organizationId` FKs reference platform `User.id`/`Organization.id`; UPPERCASE enums (`EvalRunStatus`, `EvalAccessMethod`, `EvalResponseSource`, `EvalTaskType`, `EvalTaskStatus`, `EvalNotificationType`, `EvalNotificationChannel`). **No `Export`/`ExportFormat`** (PDF deferred); keep `EvalReport.secureShareToken`.
- Apply via `db:generate` + `prisma db push --force-reset --accept-data-loss` + reseed.

### Permission mapping

- Add a small Eval permission helper (in `tools/eval` or extending `@rumbo/auth`) that maps `req.toolRole` (`manager`/`member`) to Eval capabilities:
  - manager: create/edit evals, manage models & criteria, launch/close runs, assign reviewers, edit reports.
  - member: complete assigned reviews, view completed reports.
- Route guards use `requireToolAccess('eval', 'manager')` for management routes and `requireToolAccess('eval')` for member-level routes.

### Settings surface (organization-scoped)

- **Model catalog management** (`pages/eval/settings/models`): list/add/edit/remove `EvalOrgModel` rows, choosing provider + provider model + access method (platform API, org API key, manual). Port logic from `model-eval-dev/.../repositories/models.repository.js` and `settings.controller.js`.
- **Criteria management** (`pages/eval/settings/criteria`): CRUD reusable `EvalCriterion` with ordering and archive. Port from `criteria.repository.js`.
- **Team:** reuse Phase 08b organization member management; Eval-specific reviewer assignment is per-run (Phase 13), not here. Per-tool grants are managed by platform admin (Phase 10).

### Tool landing / dashboard shell

- `pages/eval/index` landing/dashboard showing the org's evals at a glance (counts, recent runs) with entry points to settings and (in later phases) eval authoring. Port the shape of `dashboard.controller.js`.

## Out of scope

- Eval authoring wizard, run launch, snapshots, and response collection (Phase 12).
- Review workflow and reports (Phase 13).
- Tasks and notifications (Phase 14).
- Report exports (PDF/PNG/PPTX) — deferred entirely.
- Partner-account management UI.
- Org-manager self-serve per-tool grant UI (Phase 10 deferred item).

## Acceptance criteria

- `@rumbo/eval` exists (renamed from the stub), exports `evalRouter`, and is mounted at `/eval` behind `requireToolAccess('eval')`.
- A user with an Eval `MANAGER` grant can reach `/eval` and its settings; a user with no Eval grant gets denied (Phase 10 behavior); SLU is unaffected.
- The Eval-domain tables exist in the platform schema with String `cuid` IDs, `Eval`-prefixed names, UPPERCASE enums, and FKs to platform `User`/`Organization`; the dev DB applies and reseeds cleanly.
- A manager can create, edit, archive, and order **criteria**.
- A manager can add, edit, and remove **models** in the catalog, including platform-API, org-API, and manual access methods.
- The Eval landing page renders org-scoped data and is reachable from platform navigation.
- `eval` appears in product-tier `features` and an `eval` `AiModelConfig` row exists (foundation for Phase 12 live API collection).
- `@rumbo/eval` does not import `@rumbo/sounds-like-us` and vice-versa.
- Existing SLU, auth, admin, entitlement, and Phase 10 access flows still pass QA.

## Implementation guidance

- Mirror `tools/sounds-like-us` structure exactly (router-only `index.js`, `routes.js`, service files, `config/`).
- Port standalone repositories/services as the starting point, but rewrite data access against the platform Prisma client and String IDs; keep tenant scoping (`organizationId` in every query) from the original.
- Resolve the acting organization the same way SLU does (`primaryOrgIdForUser`) until/unless an explicit org switcher is introduced.
- Add `eval` to `features` in `DEFAULT_PRODUCT_TIERS` and add an `eval` row to `DEFAULT_AI_MODEL_CONFIG` in `packages/billing/src/index.js` (replace the placeholder `model_eval` key).
- Define the full Eval table set now so Phase 12–14 only add behavior, not migrations-on-migrations; the dev DB reset makes this cheap.
- Keep settings UI dense and operational, consistent with current admin/account conventions.
- Add Playwright coverage for criteria CRUD, model CRUD, and Eval access gating.

## Suggested implementation slices

1. Rename stub → `tools/eval`, scaffold router/index, mount behind `requireToolAccess('eval')`, landing shell.
2. Add full Eval-domain schema; apply + reseed; add `eval` to tiers/AI config.
3. Eval permission helper + route guards.
4. Criteria CRUD settings.
5. Model catalog CRUD settings.
6. Landing/dashboard data + QA/Playwright.

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

- Proceed to Phase 12 (Eval authoring, runs, responses).
- Stay in this phase and finish missing work.
- Move specific blocked work to a named later phase.
- Revise the roadmap because product understanding changed.

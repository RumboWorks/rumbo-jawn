# Eval

(Formerly "Model Eval". Naming emphasizes "eval"; tool key `eval`, URL `/eval`, package `@rumbo/eval`.)

## Status

Second Rumbo tool. Migration from the standalone implementation (`/var/www/model-eval-dev`, mirrored read-only at `model-eval-dev/`) into the platform is planned in `docs/development-phases/phase-10`–`phase-14`.

## What it does

Eval lets an organization systematically evaluate AI model/tool outputs. A manager defines an evaluation (a prompt, the models/tools to test, and criteria), responses are collected (manual paste or live API), assigned reviewers score responses against the criteria and leave comments, and managers read a comparative report.

Core loop: author eval → launch run (immutable prompt/criteria/model snapshots) → collect responses → assign reviewers → rate/comment → on-screen report matrix.

The Eval UI includes a task-first dashboard, grouped evaluation listings with segmented setup/response/review/done progress for open work and date/run/model/reviewer/top-score summaries for completed work, launch-time reviewer selection, completed-run score views, formatted/original response reading, a split review workspace, an organization reports list, score/rank report modes, and report drilldowns.

## Platform integration

Eval reuses shared platform services and does not duplicate them:

- centralized auth, users, organizations, memberships (drops the standalone duplicates),
- per-user, per-tool access via the Phase 10 `ToolGrant` model (`eval` is `orgOpen: false`, so access requires an explicit grant),
- shared jobs + worker (live API response collection),
- shared AI provider wrapper and AI call cost logging,
- shared billing/usage limits (`tool: 'eval'`, usage key `EVAL_RESPONSE_COLLECTION`) and AI spend cap,
- shared storage/artifact manifests,
- centralized admin and audit logging,
- shared design-system conventions (server-rendered Twig + vanilla JS, `eval-` CSS prefix).

Eval-domain tables live in the single platform Prisma schema, `Eval`-prefixed, with String `cuid` IDs and UPPERCASE enums, referencing platform `User`/`Organization`.

## MVP scope

In scope: the core loop plus live API response collection, notifications & email, and a tasks inbox.

Deferred: report exports (PDF/PNG/PPTX) — on-screen report + secure share link only; partner-account management UI; custom roles beyond MANAGER/MEMBER; analytics events.

## Boundaries

- Eval must not import Sounds Like Us internals, and vice-versa.
- Eval must use shared platform services for identity, jobs, AI, billing, storage, and admin.

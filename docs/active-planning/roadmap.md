# Rumbo Roadmap

This roadmap is provisional. It should be reviewed and revised after each phase closeout.

Legend:

- ✅ complete
- 🔶 in progress / partial
- ❌ not started

## Phase 00 — Project Foundation 🔶

- [ ] Create monorepo skeleton.
- [ ] Create npm workspace baseline.
- [ ] Create ESM-only Node baseline.
- [ ] Create placeholder Express app.
- [ ] Create placeholder worker process.
- [ ] Add PM2 ecosystem file.
- [ ] Add Apache proxy notes.
- [ ] Add Vite/SCSS placeholder.
- [ ] Add Prisma/MySQL placeholder.
- [ ] Add docs and agent guidance files.
- [ ] Confirm no product feature work has started.
- [ ] Complete Phase 00 closeout.

## Phase 01 — Platform Shell ❌

- [ ] Build basic platform layout and navigation.
- [ ] Add Twig layout system.
- [ ] Add shared SCSS design-system foundation.
- [ ] Add route/module conventions for tools.
- [ ] Add placeholder Sounds Like Us route.
- [ ] Add placeholder Model Eval route.
- [ ] Add basic health/status page.

## Phase 02 — Auth and Organizations ❌

- [ ] Add centralized users/orgs/memberships schema.
- [ ] Add session/auth foundation.
- [ ] Add Google auth.
- [ ] Add LinkedIn auth if practical in this phase.
- [ ] Add email/password or magic-link path if practical.
- [ ] Add approved-domain auto-approval concept.
- [ ] Add minimal account/org screens.

## Phase 03 — Shared Jobs, Storage, and AI Foundation ❌

- [ ] Add shared DB-backed jobs table.
- [ ] Add worker process loop.
- [ ] Add job progress/status pattern.
- [ ] Add local filesystem storage adapter.
- [ ] Add artifact manifest pattern.
- [ ] Add shared AI provider wrapper.
- [ ] Add AI call logging and cost/token metadata.
- [ ] Add basic model/provider config by call type.
- [ ] Add Python bridge placeholder.

## Phase 04 — Sounds Like Us First Run ❌

- [ ] Add registered-user URL submission flow.
- [ ] Add public URL crawl/fetch path with initial page limits.
- [ ] Add source text normalization.
- [ ] Add first guidance-generation AI call.
- [ ] Add job progress UI.
- [ ] Add first result page.
- [ ] Add privacy/AI disclosure text appropriate for testing.

## Phase 05 — Sounds Like Us Guidance Workbench ❌

- [ ] Add configurable guidance output sections.
- [ ] Add copy/download output options.
- [ ] Add simple guidance modifiers.
- [ ] Add optional critique/rewrite guidance modes.
- [ ] Add internal JSON output format for guidance data.
- [ ] Add output translator stub.

## Phase 06 — Central Admin and Observability ❌

- [ ] Add `/admin` shell.
- [ ] Add admin users/orgs view.
- [ ] Add job list/detail view.
- [ ] Add AI call/cost view.
- [ ] Add run/artifact metadata view.
- [ ] Add error/failure visibility.
- [ ] Add DB-backed tool config editing for safe settings.

## Phase 07 — Billing, Limits, and Product Controls ❌

- [ ] Add subscriptions schema readiness.
- [ ] Add usage limits by org/account.
- [ ] Add daily spend caps.
- [ ] Add Stripe integration if MVP timing supports it.
- [ ] Add paid/free feature boundaries.
- [ ] Add admin override controls.

## Phase 08 — Embeddable Widgets ❌

- [ ] Identify first strong widget use case.
- [ ] Add public widget rendering approach.
- [ ] Add signed/public-safe widget data model if needed.
- [ ] Add embed code generation.
- [ ] Add style isolation strategy.
- [ ] Add docs for widget usage.

## Phase 09 — Finish-Line Discipline / Launch Hardening ❌

- [ ] Run final privacy/AI disclosure review.
- [ ] Review empty/error states.
- [ ] Review broken links and redirects.
- [ ] Review admin visibility.
- [ ] Review billing/usage sanity.
- [ ] Review backup/export/restore notes.
- [ ] Run deploy rehearsal.
- [ ] Write rollback notes.
- [ ] Complete final manual QA checklist.
- [ ] Confirm deferred work is either non-blocking or assigned to a post-launch phase.

## Deferred / later candidates

Track details in `docs/active-planning/deferred-work.md`.

- [ ] Separate services/hosts for admin/tools/workers if scale requires.
- [ ] S3-compatible object storage.
- [ ] Redis/SQS or other queue service.
- [ ] Python worker/service.
- [ ] Postgres/cloud database migration.
- [ ] Richer public widget system.

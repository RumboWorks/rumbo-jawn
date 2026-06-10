# Roadmap

Use `.agent/roadmap.agent.md` when maintaining this file.

Do not mark work complete unless it can be verified in the repository.

## Phase map

### Platform foundation

- [x] Phase 00 — Project foundation
- [x] Phase 01 — Platform shell
- [x] Phase 02 — Shared auth and organizations
- [x] Phase 03 — Shared jobs, AI provider layer, storage, and artifacts

### First tool: Sounds Like Us

- [x] Phase 04 — Sounds Like Us first run
- [x] Phase 05 — Sounds Like Us guidance workbench
- [x] Phase 06a — Identity, organizations, and access foundation
- [x] Phase 06b — Central admin and observability
- [x] Phase 07 — Billing, limits, and product controls
- [x] Phase 07b — Admin UI for entitlements and product controls
- [ ] Phase 08 — Embeddable widgets (deferred; see `deferred-work.md`)
- [x] Phase 08b — User account management

### Multi-tool platform + second tool: Eval

The platform's destination is 5–25 tools with per-user, per-tool access tiers (no-access / member / manager), platform-admin universal. Eval (formerly Model Eval) is migrated from its standalone implementation as the first real consumer of per-tool access.

- [x] Phase 10 — Multi-tool access foundation (`ToolGrant`, `resolveToolRole`, `requireToolAccess`, tool registry, access-driven nav, platform-admin grant UI)
- [x] Phase 11 — Eval tool foundation (scaffold, Eval-domain schema, permission mapping, model catalog + criteria settings)
- [x] Phase 12 — Eval authoring, runs, and response collection (snapshots, manual + live API)
- [x] Phase 13 — Eval review workflow and report (assignment, autosave ratings/comments, report matrix, secure share)
- [x] Phase 14 — Eval tasks and notifications (tasks inbox, in-app + email, reminders)
- [x] Phase 15 — Shared Rumbo design system and full UI migration

Eval deferrals: report exports (PDF/PNG/PPTX), org-manager self-serve per-tool grants, custom roles, Google/org-key live collection, draft runs.

### Finish line (planned 2026-06-10)

Completion phases covering docs accuracy, UI consistency, admin/partner completeness, self-service signup + Stripe billing, the help system, and launch gaps. Phase 09 runs last as the final pre-launch gate.

- [x] Phase 15b — Land the admin-panel body-wrapper UI standardization pass
- [x] Phase 16 — Documentation reconciliation
- [x] Phase 17 — Structural and UI consistency (SLU app shell + sidebar, account inline-edit, shared segmented control, error pages)
- [x] Phase 18 — Admin completeness (org create/delete, partner account CRUD, act-as-org, targeted tool-data panels)
- [ ] Phase 19 — Partner self-service area (`/partner`: org list, create/edit/archive, partner members)
- [ ] Phase 20 — Email verification and public signup (pricing page, 4 tiers, terms acceptance, rate limiting)
- [ ] Phase 21 — Stripe billing (Checkout + Customer Portal, webhooks, entitlement sync, org suspend, admin cancel)
- [ ] Phase 22 — Context-sensitive help and Help & FAQ (help drawer, `/help` pages, admin-managed `HelpArticle` content)
- [ ] Phase 23 — Missing-pieces sweep (legal pages, account deletion, healthz/monitoring, backups, CSRF, usage visibility, public polish)
- [ ] Phase 09 — Finish-line discipline and launch hardening (final gate; runs after phase 23)

## Next up

Phase 19 — partner self-service area.

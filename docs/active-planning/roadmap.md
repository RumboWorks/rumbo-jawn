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
- [ ] Phase 08 — Embeddable widgets (deferred)
- [x] Phase 08b — User account management
- [ ] Phase 09 — Finish-line discipline and launch hardening

### Multi-tool platform + second tool: Eval

The platform's destination is 5–25 tools with per-user, per-tool access tiers (no-access / member / manager), platform-admin universal. Eval (formerly Model Eval) is migrated from its standalone implementation as the first real consumer of per-tool access.

- [x] Phase 10 — Multi-tool access foundation (`ToolGrant`, `resolveToolRole`, `requireToolAccess`, tool registry, access-driven nav, platform-admin grant UI)
- [ ] Phase 11 — Eval tool foundation (scaffold, Eval-domain schema, permission mapping, model catalog + criteria settings)
- [ ] Phase 12 — Eval authoring, runs, and response collection (snapshots, manual + live API)
- [ ] Phase 13 — Eval review workflow and report (assignment, autosave ratings/comments, report matrix, secure share)
- [ ] Phase 14 — Eval tasks and notifications (tasks inbox, in-app + email, reminders)

Eval deferrals: report exports (PDF/PNG/PPTX), partner-account UI, org-manager self-serve per-tool grants, custom roles.

## Next up

1. Phase 11 — Eval tool foundation (scaffold + schema + settings).
2. Then Phases 12–14 to complete the Eval migration.
3. Phase 09 finish-line discipline and launch hardening remains open and can interleave.

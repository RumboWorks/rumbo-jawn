# Phase 15 — Shared Rumbo Design System and Full UI Migration

## Purpose

Adopt the standalone Align Desk UI language as Rumbo's shared visual system, rebranded for Rumbo, while preserving the platform/tool architecture. Restore implemented Eval UI parity and migrate all current Rumbo surfaces onto the shared system.

## Product decisions

- `@rumbo/design-system` is the implementation source of truth for shared frontend primitives.
- Rumbo ships light, dark, paper, and pink themes plus comfortable and compact density. Paper is the default when a browser has no saved theme preference.
- Authenticated content uses the standalone Eval `1200px` fixed-width layout by default; individual pages may opt into a fluid layout.
- Authenticated users may choose horizontal or vertical contextual navigation. The choice is account-synced and sitewide; horizontal is the default.
- Active organization context is session-backed and validated against direct membership, partner access, or platform-admin status.
- Implemented standalone Eval UI behavior is in scope. Aspirational standalone UX notes and report exports remain out of scope.

## What this phase delivers

- Shared themes, density, dual-orientation app shell, menus, navigation, and reusable component patterns.
- Account-synced navigation orientation and validated active-organization switching.
- Eval dashboard, authoring, status, review, report, and reports-list UI parity.
- Migration of Sounds Like Us, auth, account, admin, home, and error surfaces.
- Expanded tests and visual QA.

## Acceptance criteria

- Users can switch horizontal/vertical navigation and the preference survives a new login session.
- Users can switch among organizations they can validly access; tool gates use the active organization.
- All current Rumbo surfaces use the shared themes and component system.
- Eval exposes the implemented standalone interaction patterns without weakening Rumbo authorization or tenant scoping.
- `npm run db:generate`, `npm run build`, and `npm run qa` pass.

## Out of scope

- Report export artifacts.
- Favorites, new partner-management workflows, or aspirational standalone UX features.
- A React rewrite.

## Phase closeout

Use `.agent/phase-review.agent.md`.

### Completion checklist

- [x] All acceptance criteria pass.
- [x] Relevant commands/checks were run.
- [x] Manual QA is covered by the Playwright browser suite and representative screenshots.
- [x] Architectural decisions are recorded in the decision log.
- [x] Roadmap and deferred-work status are reconciled.
- [x] No unplanned files were added directly under `docs/`.

### Closeout notes

- Added account-synced `User.navOrientation` with horizontal default behavior, an authenticated JSON preference endpoint, and a single contextual-navigation markup contract that renders horizontally or vertically.
- Added structured `User.firstName` / `User.lastName` collection while retaining `User.name` as the full display-name compatibility field. First-name greetings now drive the Eval desk and account headings.
- Added validated session-backed active organization context and organization switching. Tool access, tool navigation, Eval, and Sounds Like Us use the active organization instead of assuming the first membership.
- Promoted `@rumbo/design-system` from a placeholder to the shared browser preference contract. Added Rumbo-branded Align Desk-derived light, dark, paper, and pink themes plus comfortable/compact density, with Paper as the no-preference default.
- Restored the standalone Eval `1200px` content width as the authenticated shell default and added a fluid-content override class for exceptional pages.
- Migrated the shared authenticated and public shells so current platform, admin, account, auth, Sounds Like Us, and Eval surfaces inherit the new system.
- Restored implemented Eval interaction patterns: grouped task-first evaluation views, reviewer selection during launch, reports index, completed-run score views, trend data, split review layout, sanitized formatted/original response views, score/rank report modes, and drilldowns.
- Added `markdown-it` + `sanitize-html` for safe response rendering. Stored response text remains unchanged.
- Database application: `npm run db:push` remains blocked by the pre-existing `EvalTask_evalRunId_fkey` index drift. The additive `User.navOrientation` column was applied directly with `prisma db execute`, leaving unrelated constraints untouched.
- Verification: `npm run db:generate`; `npm run build`; `npm run qa` (28/28 passing). `npm install` reported the repository's existing Node 18 engine warnings and audit findings.

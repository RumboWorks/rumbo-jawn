# Phase 09 — Finish-Line Discipline and Launch Hardening

## Purpose

Prevent the project from stalling at 80% done by turning finish-line work into an explicit phase.

## What this phase delivers

- Launch checklist.
- Final docs review.
- Error states.
- Empty states.
- Broken-link review.
- Privacy/AI disclosure review.
- Backup/export notes.
- Deploy rehearsal.
- Rollback notes.
- Manual QA.
- Admin sanity checks.
- Billing/usage sanity checks if in scope.

## Out of scope

- New major features.
- New architecture changes unless needed to launch safely.
- Model Eval implementation.

## Acceptance criteria

- Launch checklist is complete.
- Known blockers are either fixed or explicitly deferred with owner/reason.
- Docs reflect the actual product.
- Deployment and rollback notes exist.
- Manual QA is recorded.


## Phase closeout

Use `.agent/phase-review.agent.md` for closeout.

### Completion checklist

- [x] All acceptance criteria pass (within the dev environment; production-credential items are explicitly listed below).
- [x] Relevant commands/checks were run.
- [x] Manual QA notes are recorded (launch checklist below).
- [x] New commands are documented in `docs/reference/usage.md`.
- [x] New architectural decisions are recorded in `docs/active-planning/decision-log.md`.
- [x] Roadmap items are checked off, added, or moved.
- [x] Deferred work is listed explicitly in `docs/active-planning/deferred-work.md`.
- [x] Working notes created during this phase were promoted, linked, archived, or deleted. (None created.)
- [x] No unplanned files were added directly under `docs/`.
- [x] The roadmap's finish-line section is complete.

### Launch checklist (closed 2026-06-10)

Done in this phase:

- **Automated QA, zero flakes** — full Playwright suite (38 tests: auth, signup tiers, verification, admin completeness, act-as-org, partner area, billing webhook sync, suspension, help system, deletion, health/legal) passed twice consecutively; the post-run data sweep keeps the dev DB at its two real accounts.
- **Broken-link review** — scripted crawl of the 10 public pages and their 16 unique internal links: none 404/500.
- **Log noise review** — web and worker logs reviewed; only historical failures (old jobs, a past DB outage). Worker restarted onto the current Prisma client.
- **Error/empty states** — styled 404/403/500 in both shells (phase 17); list pages have empty states with calls to action.
- **Privacy/AI disclosure** — SLU submit-form notice plus `/legal/privacy` covering the AI-provider data flow (drafts pending counsel).
- **Backup/restore, deploy, rollback notes** — `docs/reference/operations.md` (additive-schema rollback safety documented).
- **Docs reflect the actual product** — reconciled in phase 16 and kept current per phase; `usage.md` covers every shipped route group.

Pending external dependencies (cannot be closed from inside the dev box; each is small once the credential/permission exists):

1. **Stripe live activation** — set `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`, create Prices, set `ProductTier.stripePriceId`, configure the Customer Portal, then run the test-mode checklist in `phase-21-stripe-billing.md`.
2. **Google/LinkedIn OAuth verification** — needs real client credentials (deferred since phase 02).
3. **Production SMTP** — set the `EMAIL_SMTP_*` env so verification/invite/reset emails actually send (currently log-mode).
4. **Prisma migration history baseline + restore rehearsal** — both blocked on a MySQL user with `CREATE DATABASE` (shadow DB / scratch restore target).
5. **Storage root on EC2** — point `STORAGE_ROOT` outside the app directory before production artifact writes (deferred since phase 03).
6. **Production env review** — `NODE_ENV=production` (secure cookies), strong `SESSION_SECRET`, `APP_BASE_URL`, `SUPPORT_EMAIL`.
7. **Legal review** — `/legal/terms` and `/legal/privacy` are drafts marked for counsel.

### Outcome

Proceed: the platform, both tools, and the launch checklist are done; launch is gated only on the external items above.

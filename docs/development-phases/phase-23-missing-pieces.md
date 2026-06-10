# Phase 23 — Missing-Pieces Sweep

## Purpose

Close the gaps a commercial SaaS needs that didn't belong to any feature phase: legal pages, account deletion, health monitoring, backups, session security, user-visible usage, and public polish. Part of the finish-line plan (decision log 2026-06-10).

## What this phase delivers

- **Legal & support pages:** `/legal/terms`, `/legal/privacy` (clearly marked as drafts for counsel review — they cover the AI-provider data flow, Stripe billing, and the anonymizing deletion model), `/support` (points to /help, the "?" drawer, and `SUPPORT_EMAIL`). Footer links on the public shell. The signup terms checkbox now points at real pages.
- **Self-service account deletion (GDPR-style):** "Delete account" on `/account` with typed-email confirmation. Anonymizes in place (email → `deleted-<id>@deleted.invalid`, names/avatar/password/verification cleared, status DEACTIVATED) so jobs/audit history keep valid references; kills the user's sessions; soft-deletes sole-member workspaces; **blocked while a sole-member org has an active subscription** (cancel via /billing first — avoids orphaned Stripe charges). Audit-logged (`user.self_deleted`). Hard purge remains deferred.
- **Health endpoint:** `GET /healthz` (no auth/session) — DB ping + uptime; 503 when the database is down. For external uptime monitoring.
- **Operations runbook:** new `docs/reference/operations.md` — PM2 management, monitoring signals, nightly mysqldump + storage rsync backup recipe, restore procedure (full rehearsal pending a privileged MySQL user; tracked for phase 09), and the known operational gotchas.
- **Session security:** session cookie now explicitly `SameSite=Lax` (CSRF baseline — see the decision log entry; token-based CSRF deferred with rationale). `httpOnly` + prod `secure` + `trust proxy` were already in place.
- **Usage visibility:** `/account` shows the active org's SLU-analysis and Eval-collection usage against budgets, with over-budget badges and a pointer to /billing.
- **Public polish:** `robots.txt` (public pages allowed; app surfaces disallowed), meta description + OpenGraph tags on the public shell.

## Out of scope (already in deferred-work)

Hard-delete purge, cookie banner, custom dunning, seat limits, token CSRF (new entry this phase).

## Phase closeout

### Completion checklist

- [x] All acceptance criteria pass.
- [x] New routes/env documented (`usage.md` untouched-routes note below, `.env.example` gains `SUPPORT_EMAIL`).
- [x] New decisions recorded in the decision log (SameSite CSRF baseline).
- [x] Deferred work updated (token CSRF entry).
- [x] Roadmap items are checked off.
- [x] The next phase (09 launch hardening) still makes sense.

### Closeout notes

- Legal/support page copy drafted by a lower-cost sub-agent from a content spec and reviewed; both legal pages carry an explicit "review by counsel before launch" lead.
- QA additions: healthz/legal/support/robots responses; account usage card; the full deletion flow (wrong-email rejection, anonymization asserted in the DB, login impossible afterwards). The teardown now also sweeps QA-anonymized `@deleted.invalid` residue. Suite: 38/38 passing.
- Verification: build; `pm2 restart rumbo-web`; `npm run qa` 38/38.

Next phase recommendation: Proceed to Phase 09 — Finish-Line Discipline and Launch Hardening (the final gate).

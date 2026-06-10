# Phase 20 — Email Verification and Public Signup

## Purpose

Self-service account creation for all four tiers with verified email ownership, terms acceptance, and abuse protection — the foundation the Stripe billing phase builds on. Part of the finish-line plan (decision log 2026-06-10).

## What this phase delivers

- **Schema (additive, applied with the migrate-diff/extract/execute flow):** `User.emailVerifiedAt`, `User.termsAcceptedAt`, new `EmailVerificationToken` (hashed single-use tokens mirroring `PasswordResetToken`). Existing users backfilled as verified (`emailVerifiedAt = createdAt`).
- **Verification flow:** `packages/auth/src/verification-service.js` (send, resend with 2-minute cooldown, consume); `requireVerified` middleware parks signed-in unverified users at `/auth/verify-pending` (resend button) while passing anonymous traffic; gates `/slu`, `/eval`, `/admin`, `/partner`, `/account`. OAuth accounts start verified (provider-asserted email).
- **Pricing + tiered signup:** public `/pricing` (4 plans, copy hardcoded until Stripe drives it from `ProductTier`); `/signup?tier=…` with tier-specific fields; `packages/auth/src/signup-service.js` provisions per tier — free/solo → personal workspace, team → named org with MANAGER membership, partner → `PartnerAccount` + manager membership + first client org. Paid intent recorded as `entitlement.overrides.intendedTier`. Invited signups join the inviting org regardless of tier. `/register` redirects to `/signup?tier=free`.
- **Rate limiting:** `express-rate-limit` on signup/login/password-forgot/verify-resend (15-minute windows, per client IP). Loopback exempt (QA + local checks); `trust proxy` set so Apache-forwarded IPs are real.
- **QA teardown (long-standing gap closed):** `tests/global-teardown.mjs` sweeps `@example.org` users and the orgs/partner accounts/jobs/Eval data that belong only to them after every run. First run removed 756 stale QA users and 494 orgs; steady-state runs stay at 2 real users.

## Bug found and fixed along the way

- **SLU's "URL retained after signup" had silently broken.** Passport 0.6 regenerates the session on `req.login`, wiping the pre-auth `pendingAnalysisUrl`/`returnTo` stash; the old QA test only asserted the landing URL, masking it. Fixed with `keepSessionInfo: true` on the signup login (session ID still rotates) and the test now asserts the actual prefill.

## Out of scope

- Stripe checkout for the paid tiers (phase 21 — signup records intent; everyone starts on free entitlements).
- `/legal/terms` and `/legal/privacy` pages linked from the signup checkbox (phase 23).
- Email-change re-verification.

## Phase closeout

### Completion checklist

- [x] All acceptance criteria pass.
- [x] Schema applied additively; `db:generate` run; real data preserved.
- [x] New routes are documented in `docs/reference/usage.md`.
- [x] Roadmap items are checked off.
- [x] The next phase still makes sense.

### Closeout notes

- QA: new tests cover the pricing page, team signup provisioning (org + MANAGER + intendedTier), the unverified gate, a real token verification resuming the stashed URL, and partner signup landing in `/partner` with the first client org. Suite: 33/33 passing.
- Verification emails exercise the log-transport path in dev (`[email:…]`).
- Verification: additive SQL via `prisma migrate diff` (inspected to exclude the pre-existing FK drift) + `prisma db execute`; `db:generate`; build; `pm2 restart rumbo-web`; `npm run qa` 33/33.

Next phase recommendation: Proceed to Phase 21 — Stripe Billing.

# Phase Retrospectives

Use this file for phase closeout summaries.

Each phase retrospective should include:

- phase,
- date,
- completed work,
- incomplete work,
- changes from original plan,
- deferred items,
- docs updated,
- checks/tests run,
- decision-log updates,
- whether the next phase should proceed or be revised.

## Phase 00 — Project Foundation

Date: 2026-05-30

Outcome: Proceed to next phase

Completed:
- Full documentation hierarchy matching `docs/README.md`
- `AGENTS.md` with reading order, doc hygiene, `.agent/` descriptions, and platform/tool boundaries
- All `.agent/*.agent.md` specialist files (phase-review, roadmap, decision-log, usage, architecture, frontend, database, testing)
- `CLAUDE.md` provider adapter
- All phase files (`phase-00` through `phase-09`)
- All active-planning docs (decision log, roadmap, deferred work, implementation notes, retrospectives)
- All project-charter docs (architecture, coding-standards, data-model, deployment, product-vision, testing, ai-guidance)
- `docs/tools/` separating Rumbo platform, Sounds Like Us, and Model Eval
- 9 decision log entries (phases, modular monolith, platform/tool separation, doc split, provider-neutral guidance, visual direction, Passport.js, twig npm, AI providers)
- Monorepo directory structure: `apps/platform-web`, `apps/worker`, `tools/sounds-like-us`, `tools/model-eval`, `packages/*` (9 packages), `python/analysis`
- Root `package.json` with npm workspace declarations
- PM2 `ecosystem.config.cjs` defining `rumbo-web` and `rumbo-worker` processes
- `.env.example` with all expected environment variables
- Placeholder Express app (`rumbo-web`) listening on port 4000
- Twig view engine wired via `app.engine` / `app.set('view engine', 'twig')`
- SCSS/Vite build pipeline: `vite build` compiles `main.scss` → `public/dist/main.css`
- Base Twig layout and placeholder page templates
- `packages/db/prisma/schema.prisma` with MySQL datasource and generator block
- Placeholder `src/index.js` stubs in every package and tool

Incomplete: Nothing — all Phase 00 acceptance criteria met.

Changed from original plan:
- `sass` pinned to `1.83.0` (not `^1.83.0`) because `^1.83.0` resolved to 1.100.0 which requires Node 20.19.0; the server runs Node 18.19.1.
- Vite config needed `publicDir: false` and `css.preprocessorOptions.scss.api: 'modern'` to suppress a publicDir/outDir conflict warning and the Sass legacy JS API deprecation warning.

Deferred:
- `prisma generate` — not run yet; Prisma requires at least one model before generating a client. Prisma models begin in Phase 02.

Resolved after initial closeout (2026-05-30):
- Apache vhost created by user: `rumbo.dev9.rpkn.qa` → `http://localhost:4000/`.
- MySQL `rumbo_dev` database and `rumbo_dev` user created by user. `DATABASE_URL` set in `.env`. Connection verified.

Docs updated:
- `docs/active-planning/phase-retrospectives.md` (this entry)
- `docs/active-planning/roadmap.md` (Phase 00 marked complete)
- `docs/reference/usage.md` (commands documented)

Checks/tests run:
- `npm install` — clean, no errors
- `npm run build --workspace=rumbo-web` — Vite build produces `public/dist/main.css` and `public/dist/main.js`, no warnings
- `node apps/platform-web/src/index.js` — app starts, port 4000 confirmed
- `curl http://localhost:4000/` — Twig home template renders correctly (HTTP 200)
- `curl http://localhost:4000/dist/main.css` — compiled CSS served correctly (HTTP 200)
- `curl http://localhost:4000/slu` — placeholder tool route renders correctly (HTTP 200)

Next phase recommendation: Proceed to Phase 01 — Platform Shell. Review and revise Phase 01 doc before assignment.

---

## Phase 01 — Platform Shell

Date: 2026-05-30

Outcome: Proceed to next phase

Completed:
- SCSS design-system foundation split into organized partials: `_tokens.scss`, `_reset.scss`, `_typography.scss`, `_layout.scss`, `_buttons.scss`, `_forms.scss`, `_cards.scss`, `_alerts.scss`, `_tables.scss`
- Full CSS custom property token system: color, typography scale, spacing scale, border radius, shadows, layout dimensions, transitions
- Base layout primitives: public shell (header/main/footer), logged-in app shell (header/sidebar/content), container, page header
- Form styles: inputs, selects, textareas, labels, hints, error states, checkboxes, fieldsets
- Button variants: primary, secondary, ghost, danger; sizes: sm, base, lg
- Card component with header, body, footer variants
- Alert/notice components: info, success, warning, danger
- Table styles with wrap, header, row hover, empty state
- Lucide icon integration via `createIcons`; specific icons imported (tree-shaken, not whole set)
- `views/layouts/app.twig` — logged-in app shell with sidebar
- `/admin` route and placeholder view using app layout with sidebar nav
- `/account` route and placeholder view using app layout with sidebar nav
- Routes split into `routes/index.js`, `routes/admin.js`, `routes/account.js`
- `views/layouts/base.twig` updated with header nav links

Incomplete: Nothing — all Phase 01 acceptance criteria met.

Changed from original plan:
- Lucide: initially imported all icons (`icons` object, 664KB JS); changed to explicit named imports for icons used in templates (5.8KB). Pattern established: add explicit imports to `main.js` as new icons appear in Twig templates.
- Visual direction stays within Phase 01 scope — neutral placeholder tokens only, no final brand decisions.

Deferred:
- Final brand palette and visual identity — recorded in `docs/active-planning/deferred-work.md`
- React islands pattern — not needed yet; deferred to Phase 05 (guidance workbench)
- Mobile sidebar (hamburger menu / drawer) — desktop sidebar shows at ≥1024px; mobile nav is minimal for now

Docs updated:
- `docs/active-planning/phase-retrospectives.md` (this entry)
- `docs/active-planning/roadmap.md` (Phase 01 marked complete)

Checks/tests run:
- `npm run build --workspace=rumbo-web` — clean build, no warnings; 13.7KB CSS, 5.8KB JS
- `node apps/platform-web/src/index.js` — app starts on port 4000
- `curl http://localhost:4000/` → 200
- `curl http://localhost:4000/slu` → 200
- `curl http://localhost:4000/admin` → 200
- `curl http://localhost:4000/account` → 200

Next phase recommendation: Proceed to Phase 02 — Shared Auth and Organizations. Review Phase 02 doc before assignment.

---

## Phase 02 — Shared Auth and Organizations

Date: 2026-05-31

Outcome: Proceed to next phase

Completed:
- Prisma schema: `User`, `Organization`, `Membership`, `OAuthAccount`, `ApprovedDomain`, `Session` models
- All 6 tables created in MySQL via `prisma db push`; Prisma client generated
- `packages/auth` package: Passport.js config, local strategy, Google strategy, LinkedIn strategy, session middleware (DB-backed via `@quixo3/prisma-session-store`), `requireAuth`/`requireAdmin` middleware, user-service (findOrCreate, org auto-provisioning, approved-domain lookup)
- Email/password registration and login working end-to-end
- New user auto-org creation: personal org created, user set as OWNER
- Approved-domain auto-join foundation wired in `ensureOrgMembership`
- Auth routes: `GET /login`, `GET /register`, `POST /auth/local`, `POST /register`, `GET /auth/google`, `GET /auth/google/callback`, `GET /auth/linkedin`, `GET /auth/linkedin/callback`, `GET /auth/logout`
- Login and register Twig views with OAuth button placeholders and email/password forms
- `currentUser` exposed to all Twig templates via `res.locals`
- Layouts show signed-in user name and Sign out link when authenticated
- Auth SCSS partial (`_auth.scss`) for login/register box layout
- `requireAuth` and `requireAdmin` middleware in `packages/auth`

Incomplete: Nothing — all Phase 02 acceptance criteria met for the implemented launch path (email/password). Google OAuth wired but untested pending credentials. LinkedIn deferred (see below).

Changed from original plan:
- `prisma migrate dev` not used — `prisma db push` used instead. `rumbo_dev` DB user lacks CREATE DATABASE permission required for Prisma's shadow database. Recorded in decision log.
- Lucide has no brand icons; `chrome` and `linkedin` icon names don't exist. OAuth buttons use `log-in` icon instead.

Deferred:
- Google OAuth verification — routes and strategy are wired; untested until `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env`.
- LinkedIn OAuth — wired but deferred entirely until credentials are available and the strategy proves stable. Gated on env vars.
- `prisma migrate dev` migration history — set up proper migration flow before Phase 03 schema changes (grant CREATE DATABASE permission or configure `SHADOW_DATABASE_URL`).
- Magic-link auth — noted as future direction; not implemented in Phase 02.
- Admin role on User model — `requireAdmin` checks `user.isAdmin` which doesn't exist on the schema yet; stubbed for Phase 06.
- Mobile sidebar nav — hamburger/drawer deferred from Phase 01, still open.

Docs updated:
- `docs/active-planning/phase-retrospectives.md` (this entry)
- `docs/active-planning/roadmap.md` (Phase 02 marked complete)
- `docs/active-planning/decision-log.md` (prisma db push, LinkedIn deferral)
- `docs/active-planning/deferred-work.md` (Google/LinkedIn OAuth, migration history)

Checks/tests run:
- `npm run build --workspace=rumbo-web` — clean, 14.6KB CSS, 6.7KB JS
- `POST /register` with name/email/password → 302 to `/`, user+org+membership rows created in DB ✓
- `GET /auth/logout` → session destroyed, redirect to `/` ✓
- `POST /auth/local` with correct credentials → 302 to `/`, `currentUser` in template ✓
- DB verified: User, Organization (personal org), Membership (OWNER) all created correctly ✓

Next phase recommendation: Proceed to Phase 03 — Shared Jobs, AI Provider Layer, Storage, and Artifacts. Review Phase 03 doc before assignment. Resolve Prisma migration permissions first.

---

## Phase 03 — Shared Jobs, AI Provider Layer, Storage, and Artifacts

Date: 2026-05-31

Outcome: Proceed to next phase

Completed:
- Prisma schema additions: `Job` (with status/payload/result/retry), `AiCall` (cost/token logging), `ArtifactManifest` (storage pointer); all tables created via `db push --force-reset` (full schema repush after FK constraint collision from incremental push)
- `packages/jobs`: `createJob`, `claimNextJob` (atomic transaction-based claim), `completeJob`, `failJob` (with retry logic), `getJob`, `listJobs`
- `packages/ai`: provider wrapper dispatching to OpenAI, Anthropic, DeepSeek; call-type config map; cost estimation and `AiCall` DB logging per call; DeepSeek reuses OpenAI client with different base URL
- `packages/storage`: `writeArtifact` (write + `ArtifactManifest` row), `readArtifact`, `readArtifactJson`, `deleteArtifact`, `artifactPath` helper; `STORAGE_ROOT` env var override for S3 seam
- `packages/python-bridge`: `callPython` (spawn + JSON stdin/stdout boundary), `pingPython` (availability check)
- `apps/worker`: polling loop with `claimNextJob` → handler dispatch → `completeJob`/`failJob`; `registerHandler` for tool packages to wire in; `WORKER_POLL_MS` env var
- `scripts/test-phase03.js`: smoke test verifying all six components end-to-end

Incomplete: Nothing — all Phase 03 acceptance criteria met.

Changed from original plan:
- `prisma db push` with incremental schema change failed (errno 121 FK collision on MariaDB). Used `--force-reset` to rebuild full schema cleanly. Data was dropped (only test data existed).
- Storage root defaults to `./storage` relative to `cwd()` of the process. Add `STORAGE_ROOT` to `.env` to point at a persistent path on the EC2 host.

Deferred:
- Real AI call testing — providers wired; actual calls deferred until API keys are set in `.env`
- Cost estimate rates are hardcoded; move to DB-backed config table in a later phase
- S3 storage backend — seam is in place (`storageRoot()` and `writeArtifact` abstraction); swap in Phase 09 or when needed
- Worker handler registration pattern is stub-only; first real handler (`slu.analysis`) wires in Phase 04

Docs updated:
- `docs/active-planning/phase-retrospectives.md` (this entry)
- `docs/active-planning/roadmap.md` (Phase 03 marked complete)
- `docs/active-planning/deferred-work.md` (storage root, AI call testing)

Checks/tests run:
- `node scripts/test-phase03.js` — all 6 checks pass: createJob ✓, claimNextJob ✓, writeArtifact ✓, readArtifactJson ✓, completeJob (artifacts=1) ✓, pingPython ✓
- `node apps/worker/src/index.js` — worker starts and polls without errors ✓
- `npm run build --workspace=rumbo-web` — clean build ✓

Next phase recommendation: Proceed to Phase 04 — Sounds Like Us First Run.

---

## Phase 04 — Sounds Like Us First Run

Date: 2026-05-31

Outcome: Proceed to next phase

Completed:
- `packages/crawler`: HTTP fetch + cheerio HTML parser; auto-discovers same-origin links; configurable page cap (default 8); text extraction strips nav/footer/scripts; `truncatePagesForPrompt` token budget helper
- `tools/sounds-like-us`: analysis service (crawl → AI prompt → structured JSON guidance); routes (URL input, job create, status polling, result display, history); worker handler registered as `slu.analysis`
- `packages/ai` split from `@rumbo/sounds-like-us` main export to avoid pulling `openai`/`undici` into the web process (Node 18 `File` global not available); separate `/analysis` sub-path export used by worker only
- SLU Twig views: URL input form with privacy disclosure; job progress page with step indicators and JS polling; result page with all guidance sections (org summary, voice/tone, vocabulary, phrases, avoids, writing guidance, reusable system prompt); history table
- `_slu.scss`: tool-specific styles under `slu-` prefix; spinning loader animation; two-column result grid; copy prompt block
- Auth `returnTo` bug fixed: Passport 0.6+ regenerates the session on `req.login()`, destroying session data set before login. Fixed by capturing `returnTo` in `res.locals` before any Passport middleware runs (`captureReturnTo` middleware applied to all login/register/OAuth success handlers).
- `POST /register` now respects `returnTo` — users who hit `/slu`, enter a URL, and get redirected to register return to `/slu` after registration
- 18/18 Playwright QA tests pass including 3 new SLU-specific tests

Incomplete: Nothing — all Phase 04 acceptance criteria met.

Changed from original plan:
- `@rumbo/sounds-like-us` package split into two exports (`.` = router only, `./analysis` = AI handler) to prevent `openai`/`@anthropic-ai/sdk`/`undici` loading in the web process on Node 18.
- Auth `returnTo` session loss was a pre-existing bug exposed by the SLU redirect flow; fixed as part of this phase.

Deferred:
- End-to-end AI call test (requires live API keys confirmed working with Anthropic; queued for manual verification)
- Guidance workbench (Phase 05)
- PDF input (paid feature, out of scope for initial MVP)
- Crawler `robots.txt` respect (should be added before public launch)

Docs updated:
- `docs/active-planning/phase-retrospectives.md` (this entry)
- `docs/active-planning/roadmap.md` (Phase 04 marked complete)
- `tests/qa.spec.js` (3 SLU tests added)

Checks/tests run:
- `npm run build --workspace=rumbo-web` — clean, 27KB CSS, 12KB JS
- `npx playwright test` — 18/18 pass including SLU form render, auth redirect, and resume-after-auth flow
- Manual: SLU page at `/slu` renders correctly (screenshot confirmed)
- PM2 stable: rumbo-web and rumbo-worker online, no crash loops after fix

Additional resolved after initial closeout (2026-05-31):
- Node upgraded to 22.22.3 via nvm. The worker crashed on startup because cheerio@1.2.0 depends on undici@^7, which requires the `File` Web API as a global (Node 20+). Upgrading to Node 22 resolved this cleanly and allows use of official OpenAI and Anthropic SDKs. PM2 daemon restarted under nvm Node 22.
- End-to-end AI analysis confirmed working: job runs, crawls pages, calls Anthropic, stores artifact, status transitions to DONE.
- 403 sites (e.g. ccrjustice.org) correctly exhaust retries and fail the job — expected behavior.

Next phase recommendation: Proceed to Phase 05 — Sounds Like Us Guidance Workbench.

---

## Phase 05 — Sounds Like Us Guidance Workbench

Date: 2026-06-01

Outcome: Proceed to next phase

Completed:
- React island (`guidance-workbench.jsx`) mounted inside Twig page shell (`workbench.twig`); React built as a separate Vite entry point (`guidance-workbench.js`) loaded only on the workbench page
- Color-coded provenance system: each control section has a colored title dot, and its contributed output text is marked with a source-colored left border inside one assembled guidance document. Five source colors: voice (pine green), task (ember orange), reading (slate blue), pack (ochre gold), generic (stone). Works in both Rumboworks and Black & White themes.
- "Our Voice" — read-only first panel showing the org's AI-detected voice profile (summary + tone attribute tags). No input options; colored title matches voice output blocks.
- Guidance task control: Writing something new / Rewriting existing text / Critiquing existing text
- Adaptive length/detail control: changes label and options based on selected task (Target length / Rewrite length / Critique depth)
- Reading level segmented control: Easy Read / Plain Language / General Adult / Specialist/Expert
- Best-practice pack radio group: None + 5 platform defaults (Fundraising, Email newsletters, Job descriptions, Social media, Press releases)
- Guidance blocks toggle list: org-specific blocks (voice-tone, vocabulary, what-to-avoid from AI) + reading level + generic (AI-cliche avoidance, plain language, inclusive language) + best-practice pack toggle
- All option changes assemble output client-side from pre-generated content — no new AI calls
- Output panel: single assembled guidance document for legacy Learning Policy Institute run, with source-colored left rails for text provenance and task-first display ordering
- Phase 05 follow-up: output now has Preview and Full Guidance display modes; copy and download actions always use Full Guidance regardless of visible mode
- Phase 05 follow-up: Preview omits the detailed "Words and phrases to use" and "What to avoid" blocks; Full Guidance still includes selected blocks
- Phase 05 follow-up: Preview suppresses report-style section headings and renders paragraphs/lists in a continuous document flow
- Phase 05 follow-up: assembly/source headings are excluded from Preview, Full Guidance, copied text, and `.txt`/`.md` downloads; output begins with a natural task-oriented sentence
- Phase 05 follow-up: output actions moved into a sticky right-side panel on desktop and stack above the guidance text on smaller screens
- Copy full guidance button (clipboard API with textarea fallback)
- .txt and .md download via server-side routes, using current selected options with saved-options fallback
- Debounced auto-save of workbench options (PATCH /slu/jobs/:jobId/workbench/options → stored as artifact)
- Optional 1–5 star feedback with category and comment, submitted to new SluFeedback DB table
- New `SluFeedback` MySQL table (created via raw SQL; prisma client regenerated)
- Guidance artifact v1 format: `sounds-like-us.guidance.v1` with `organization`, `voiceProfile`, `guidanceBlocks[]` — new runs get richer AI output
- Phase 05 follow-up: guidance artifacts now include `voiceTone.previewSummary` and `voiceTone.fullGuidance`; Preview uses the concise voice/tone summary while Full Guidance, copy, and downloads use the full voice/tone block
- Phase 05 follow-up: guidance artifacts now require `organization.shortName` from the AI response; old intermediate artifacts without the current schema are treated as incomplete and should be regenerated
- Phase 05 follow-up: legacy Phase 04 flat guidance transform was removed; active MVP runs now use the current artifact schema only
- Updated analysis-service.js: new AI prompt returns `voice_profile` (toneAttributes, writingPatterns, vocabulary, phrases, avoid) and `guidance_blocks[]` (voice-tone, vocabulary, what-to-avoid) as structured JSON
- `/slu/jobs/:jobId/result` now redirects to `/workbench`; job progress page redirects to workbench on completion
- Phase 05 follow-up: guidance and prompt product copy moved into JSON config under `tools/sounds-like-us/src/config/`, with validated loaders and no hidden fallback copy for missing/broken config
- Phase 05 follow-up: guidance config blocks and best-practice packs use explicit `previewText` and `fullText`; Preview no longer summarizes Full Guidance text deterministically
- Platform config wrappers: `guidance-blocks.config.js` and `best-practice-packs.config.js` now expose validated JSON guidance content for existing imports
- Pure `guidance-assembly.service.js` (no AI, no DB) shared by server (download routes) and client (React island)
- 18/18 Playwright tests pass; 3 additional manual workbench tests (Twig shell, React mount with controls/output, color-coded source classes) all pass

Incomplete: Nothing — all Phase 05 acceptance criteria met.

Changed from original plan:
- `@vitejs/plugin-react@4` (not latest v6) required because project uses Vite 5.x; v6 requires Vite 8+
- PM2 must be restarted from an nvm-sourced shell after any `npm install` that adds packages; system Node 18 causes undici `File is not defined` crash. Pattern confirmed: always restart PM2 with `export NVM_DIR=... && nvm use 22 && pm2 kill && pm2 start ecosystem.config.cjs`
- `SluFeedback` table created via raw SQL rather than `prisma db push` — the FK collision bug on MariaDB incremental push persists; raw SQL is the established workaround (see Phase 03 retrospective)
- Guidance blocks toggle in controls panel includes "best-practice pack" toggle that only appears when a pack is selected; this is cleaner than always showing it
- `TASK_LENGTH_BLOCKS` block for the task+length combination is always included (not separately toggled) since it is the primary driver of the assembled output; user controls it via the task and length selectors

Deferred:
- PDF export (deferred to Phase 08 or later; logged in deferred-work.md)
- Manager/power-user configuration UI for Guidance Blocks and Best-Practice Packs
- Explicit AI regeneration/refinement action (must be cost-logged and spend-capped when added)
- Additional Playwright tests for option-change/assembly behavior added to permanent qa.spec.js (manual tests confirmed passing; permanent tests deferred for Phase 06 QA round)

Docs updated:
- `docs/active-planning/phase-retrospectives.md` (this entry)
- `docs/active-planning/roadmap.md` (Phase 05 marked complete)
- `docs/active-planning/deferred-work.md` (PDF export, manager config, AI regeneration)

Checks/tests run:
- `npm run build --workspace=rumbo-web` — clean build; 38.57KB CSS, 11.85KB main.js, 210.69KB guidance-workbench.js after Phase 05 follow-up output-action changes
- `npm run qa` / `npx playwright test` — 18/18 pass, no regressions
- Manual workbench tests: Twig shell, React mount, color-coded bordered output text — all pass
- PM2 stable: rumbo-web and rumbo-worker online under nvm Node 22

Next phase recommendation: Proceed to Phase 06 — Central Admin and Observability. Review Phase 06 doc before assignment.

---

## Phase 06a — Identity, Organizations, and Access Foundation

Date: 2026-06-01

Outcome:
- Proceed to Phase 06b — Central Admin and Observability

Completed:
- Split original Phase 06 into Phase 06a identity/access foundation and Phase 06b central admin/observability
- Added shared platform access model inspired by the Model Eval prototype while keeping Rumbo's cuid/string IDs
- Added `User.isPlatformAdmin`
- Added organization `publicId`, `organizationType`, nullable creator reference, and soft-delete timestamp
- Migrated membership semantics from `OWNER`/`ADMIN`/`MEMBER` to `MANAGER`/`MEMBER`
- Backfilled existing memberships from `OWNER` to `MANAGER`
- Backfilled one existing user without a membership into a solo organization
- Added partner account, partner membership, partner organization access, and organization invite tables
- Updated signup/org provisioning so solo users receive a solo organization and manager membership
- Added shared role/permission helpers and organization access resolution
- Gated `/admin` with `User.isPlatformAdmin`
- Added a support command to grant platform admin access to an existing user

Incomplete: Nothing required for Phase 06a acceptance criteria.

Changed from original plan:
- Phase 06 was split because the admin UI should be built on the correct identity/org/partner model.
- Prisma `db push` partially applied schema changes and then hit the known MariaDB duplicate-key issue. Raw SQL was used to safely pre-migrate enum values and backfill `Organization.publicId`; Prisma client generation and schema validation then passed.

Deferred:
- Full admin dashboards and observability UI move to Phase 06b.
- Partner self-service UI, invite acceptance flow, role-management UI, and admin impersonation remain out of scope.
- Model Eval implementation remains planned sibling-tool work, not part of Phase 06a.

Docs updated:
- `docs/development-phases/phase-06a-identity-org-access-foundation.md`
- `docs/development-phases/phase-06b-central-admin-observability.md`
- `docs/project-charter/architecture.md`
- `docs/project-charter/data-model.md`
- `docs/active-planning/decision-log.md`
- `docs/active-planning/implementation-notes.md`
- `docs/active-planning/roadmap.md`
- `docs/reference/usage.md`

Checks/tests run:
- Focused DB role migration check
- Focused new-user solo org provisioning check
- Focused org manager / partner manager role-resolution check
- `npx prisma format --schema packages/db/prisma/schema.prisma`
- `npx prisma validate --schema packages/db/prisma/schema.prisma`
- `npx prisma generate --schema packages/db/prisma/schema.prisma`
- `npm run build --workspace=rumbo-web`
- `npm run qa` — 18/18 passed
- PM2 restarted under nvm Node 22

Next phase recommendation: Proceed to Phase 06b — Central Admin and Observability.

---

## Phase 06b — Central Admin and Observability

Date: 2026-06-01

Outcome:
- Proceed to Phase 07 — Billing, Limits, and Product Controls

Completed:
- Replaced the `/admin` placeholder with a platform admin dashboard gated by `User.isPlatformAdmin`
- Added central visibility for users, organizations, jobs, failures, AI calls, AI cost metadata, artifacts, and Sounds Like Us runs
- Added shared admin data service that reads platform tables instead of creating tool-specific admin architecture
- Added admin pages for dashboard, users, organizations, jobs, Sounds Like Us runs, AI calls, failures, and job detail
- Added raw job debug JSON endpoint at `/admin/jobs/:jobId/debug`
- Added admin SCSS for metric tiles, dense tables, filters, detail panels, and JSON blocks
- Added favicon links to the app layout so authenticated/admin pages use the same favicon as public pages
- Expanded Playwright QA to verify non-admin access is blocked and platform admins can render every new admin route
- Reset the disposable `rumbo_dev` database with Prisma `db push --force-reset`, restoring clean Prisma/schema sync after the earlier MariaDB drift

Incomplete:
- Nothing required for Phase 06b acceptance criteria.

Changed from original plan:
- True job re-run/retry controls were not added. The phase delivered raw JSON debug aids, but retry controls need explicit idempotency and cost rules before they are safe.
- The development database was reset because current Rumbo data is disposable and the user approved deleting it.

Deferred:
- Admin job re-run and retry controls are deferred to a later worker/admin reliability phase or Phase 09 launch hardening.

Docs updated:
- `docs/reference/usage.md`
- `docs/active-planning/roadmap.md`
- `docs/active-planning/deferred-work.md`
- `docs/active-planning/implementation-notes.md`
- `docs/active-planning/phase-retrospectives.md`

Checks/tests run:
- `npx prisma validate --schema packages/db/prisma/schema.prisma`
- `npx prisma db push --schema packages/db/prisma/schema.prisma --force-reset --accept-data-loss`
- `npm run build --workspace=rumbo-web`
- `npm run pm2:restart`
- HTTP smoke checks for `/` and `/admin`
- `npm run qa` — 19/19 passed, including admin dashboard and admin route rendering

Next phase recommendation: Proceed to Phase 07 — Billing, Limits, and Product Controls.

---

## Phase 07 — Org Entitlements, Usage Limits, and Billing Readiness

Date: 2026-06-01

Outcome:
- Phase 07 implementation complete pending user approval
- Proceed to Phase 07b only after Phase 07 is approved and committed

Completed:
- Revised Phase 07 around org-centered entitlements, usage limits, and billing readiness
- Created Phase 07b admin UI editing phase before implementation, per user request
- Added shared `@rumbo/billing` package
- Added product tiers: Free, Solo, Team, Partner
- Added organization entitlements with Stripe-ready fields, spend caps, and optional billing-responsible owner/manager fields
- Added usage events queryable by organization, tool, usage key, and period
- Added feature flag, AI model config, and admin audit log schema
- Added default seed script and org-tier support script
- Added signup entitlement provisioning for new solo and approved-domain organizations
- Added soft Sounds Like Us usage budget: 10 runs per 7 days
- Added "Over budget" indicator on Sounds Like Us without blocking job creation
- Added AI spend-cap enforcement before provider calls
- Added DB-backed AI model config lookup with existing defaults as fallback
- Extended admin org visibility with tier, SLU budget, spend, and billing-responsible context

Incomplete:
- Admin UI editing for tiers, billing responsibility, limits, spend caps, feature flags, and model config is intentionally moved to Phase 07b.

Changed from original plan:
- Usage limits are soft warnings for Phase 07 rather than hard blocks.
- Admin/config tuning uses support scripts and DB-backed defaults in Phase 07; UI editing is split into Phase 07b.
- The development database was reset because current Rumbo data is disposable.

Deferred:
- Phase 07b — Admin UI for Entitlements and Product Controls.

Docs updated:
- `docs/development-phases/phase-07-billing-limits-product-controls.md`
- `docs/development-phases/phase-07b-admin-ui-for-entitlements-and-product-controls.md`
- `docs/project-charter/architecture.md`
- `docs/project-charter/data-model.md`
- `docs/active-planning/decision-log.md`
- `docs/active-planning/deferred-work.md`
- `docs/active-planning/roadmap.md`
- `docs/reference/usage.md`

Checks/tests run:
- Focused billing service check: new user entitlement, 10-run budget overage, DB-backed model config
- `npx prisma format --schema packages/db/prisma/schema.prisma`
- `npx prisma validate --schema packages/db/prisma/schema.prisma`
- `npx prisma db push --schema packages/db/prisma/schema.prisma --force-reset --accept-data-loss`
- `npm run seed-defaults --workspace=@rumbo/billing`
- `npm run build --workspace=rumbo-web`
- `npm run pm2:restart`
- `npm run qa` — 20/20 passed

Next phase recommendation: Ask the user to approve Phase 07, commit it, then proceed to Phase 07b.

---

## Phase 07b — Admin UI for Entitlements and Product Controls

Date: 2026-06-02

Outcome:
- Proceed to Phase 08 — Embeddable Widgets

Completed:
- Added admin organization detail/edit page
- Added tier editing for Free, Solo, Team, and Partner
- Added billing-responsible manager assignment
- Added SLU usage budget editing
- Added AI spend-cap editing
- Added product controls page
- Added AI model/provider config editing
- Added feature flag editing
- Added audit log page and reusable audit table
- Added audited mutation helpers in `@rumbo/billing`
- Added Playwright coverage for tier edit, budget edit, feature flag edit, and audit-log visibility

Incomplete:
- Nothing required for Phase 07b acceptance criteria.

Changed from original plan:
- The first edit UI focuses on compact operational forms rather than rich inline editing.
- Feature flag config JSON editing is not exposed yet; flags can be enabled/disabled and scoped.

Deferred:
- Stripe checkout, webhooks, customer portal, invoices, and partner self-service remain out of scope.
- Richer product-control editing polish can happen in launch hardening if needed.

Docs updated:
- `docs/development-phases/phase-07b-admin-ui-for-entitlements-and-product-controls.md`
- `docs/active-planning/phase-retrospectives.md`
- `docs/active-planning/roadmap.md`
- `docs/reference/usage.md`

Checks/tests run:
- `node --check apps/platform-web/src/routes/admin.js`
- `node --check packages/billing/src/index.js`
- `npm run build --workspace=rumbo-web`
- `npm run pm2:restart`
- `npm run qa` — 20/20 passed

Next phase recommendation: Proceed to Phase 08 — Embeddable Widgets.

---

## Phase 08 — Embeddable Widgets

Date: 2026-06-02

Outcome: Deferred (conditional phase; no strong widget use case yet)

Completed: Nothing built by design — this phase only proceeds if a strong public widget use case appears.

Deferred:
- Widget use-case selection remains tracked in `deferred-work.md` ("Embeddable widget use-case selection").

Next phase recommendation: Proceed to Phase 08b — User Account Management.

---

## Phase 08b — User Account Management

Date: 2026-06-02

Outcome: Proceed to next phase

Completed:
- Real `/account` page: profile editing (name/email), signed-in password change, access overview.
- Password recovery by email with single-use hashed expiring tokens.
- SMTP-backed email infrastructure (`packages/auth/src/email-service.js`) with `EMAIL_TRANSPORT=log` for safe dev.
- Organization invites (create, email, accept) and manager-visible member management.
- `UserStatus` (ACTIVE/SUSPENDED/DEACTIVATED) with login/session enforcement.
- Platform-admin user detail pages: profile/status editing and membership management; platform-admin grants stay CLI-only.
- New solo memberships created as `MEMBER` so personal workspaces hide org-management UI until promotion.

Deferred:
- Partner-account management screens, account deletion/anonymization, OAuth link/unlink (all in `deferred-work.md`).

Checks/tests run: `db:generate`, schema push + reseed, `npm run build`, `npm run qa`, log-mode invite smoke check.

Next phase recommendation: Proceed to Phase 10 — Multi-Tool Access Foundation (Phase 09 repositioned as the final pre-launch gate).

---

## Phase 10 — Multi-Tool Access Foundation

Date: 2026-06-03

Outcome: Proceed to next phase

Completed:
- Tool registry in `@rumbo/config` (`tools.js`): canonical tool keys/paths/nav order; `slu` (`orgOpen: true`), `eval` (`orgOpen: false`).
- `ToolGrant` table (per-user, per-org, per-tool role) reusing `MemberRole`.
- `resolveToolRole` / `listAccessibleTools` / `requireToolAccess` in `@rumbo/auth` with documented precedence (platform admin → org entitlement gate → partner manager → grant → orgOpen membership).
- SLU wired through `requireToolAccess('slu', { allowAnonymous: true })` non-breakingly.
- Access-driven navigation (home launcher + header tool switcher) with a 30s non-blocking cache.
- Platform-admin per-tool grant management on the user-detail page, audit-logged.

Changed from original plan:
- Schema applied additively (extracted DDL via `prisma migrate diff`) instead of `db push --force-reset`, because the dev DB has pre-existing FK drift and real data. This became the standing migration approach.

Deferred: org-manager self-serve grants, per-tool tiers, dense nav UX (all in `deferred-work.md`).

Checks/tests run: `db:generate`, build, `npm run qa`, direct resolver verification across all precedence branches.

Next phase recommendation: Proceed to Phase 11 — Eval Tool Foundation.

---

## Phase 11 — Eval Tool Foundation

Date: 2026-06-03

Outcome: Proceed to next phase

Completed:
- `tools/model-eval` stub renamed to `tools/eval` (`@rumbo/eval`), mounted at `/eval` behind `requireToolAccess('eval')` with manager-gated settings.
- Full Eval-domain schema: 16 `Eval*` tables, 8 enums, scalar FKs to platform User/Organization (no back-relations), applied additively.
- `eval` wired into billing (tier features, `eval.response_collection` usage key, default AiModelConfig).
- Manager settings: criteria CRUD and model catalog CRUD with seeded provider catalog (OpenAI, Anthropic, Google, Manual, Other).
- Eval landing/dashboard shell and `eval-` SCSS partial.

Checks/tests run: `db:generate`, DDL applied + verified, seeds, build, `npm run qa`, HTTP role-matrix verification (manager/member/no-grant).

Next phase recommendation: Proceed to Phase 12 — Eval Authoring, Runs, Responses.

---

## Phase 12 — Eval Authoring, Runs, and Response Collection

Date: 2026-06-03

Outcome: Proceed to next phase

Completed:
- Eval CRUD (list-first + inline edit), detail page with run history; all db access in `evals.service.js`.
- Run launch creates immutable prompt/criteria/model snapshots + one response slot per model in a single transaction (`COLLECTING_RESPONSES`).
- Manual response paste page; live API collection via `eval.collectResponse` worker handler through `@rumbo/ai` (cost → `AiCall`, spend cap enforced, `UsageEvent` recorded).
- Run status page with progress, per-response actions, and lifecycle transitions.

Changed from original plan:
- Run creation shipped as a single page; the multi-step wizard was deliberately deferred to the authoring UX pass (delivered with Phase 15).

Deferred: Google/org-key live collection, editable draft runs (in `deferred-work.md`).

Checks/tests run: build, `npm run qa`, full live end-to-end with real API keys (worker collected a real response; cost/usage logged).

Next phase recommendation: Proceed to Phase 13 — Eval Review and Report.

---

## Phase 13 — Eval Review Workflow and Report

Date: 2026-06-03

Outcome: Proceed to next phase

Completed:
- Reviewer assignment (managers assign org members holding eval grants); lifecycle `READY_FOR_REVIEWS → IN_REVIEW → COMPLETED` with reopen.
- Tabbed review screen (Twig + vanilla JS): 1–5 scores + comments autosaving over fetch; `hideModelNames` renders neutral labels.
- Completion ensures an `EvalReport`; models×criteria heatmap, editable summary/recommendation.
- Secure share link: tokenized public read-only route (`evalShareRouter`) mounted outside `requireToolAccess`, always hides model names.

Changed from original plan: review screen confirmed as vanilla JS (no React island).

Checks/tests run: build, `npm run qa` (23/23), two-account HTTP end-to-end including unauthenticated share fetch.

Next phase recommendation: Proceed to Phase 14 — Eval Tasks and Notifications.

---

## Phase 14 — Eval Tasks and Notifications

Date: 2026-06-03

Outcome: Eval migration complete; proceed

Completed:
- `EvalTask` created from owning transitions (review assignment, manual-response slots), auto-completed/cancelled with the work; tasks inbox at `/eval/tasks`.
- `EvalNotification` + `notify.service.js`: in-app notifications panel (unread badge, mark-all-read) plus best-effort email via the shared sender.
- Manager reminders (`POST /runs/:publicId/remind`), rate-limited per reviewer per hour.

Deferred: cross-tool notification center (in `deferred-work.md`).

Checks/tests run: build, `npm run qa` (23/23), full two-account HTTP end-to-end of the task/notification lifecycle.

Next phase recommendation: Proceed to Phase 15 — Shared Design System and Full UI Migration.

---

## Phase 15 — Shared Rumbo Design System and Full UI Migration

Date: 2026-06-04 (follow-up polish through 2026-06-09)

Outcome: Proceed to finish-line phases

Completed:
- Align Desk UI language adopted as Rumbo's shared design system via `@rumbo/design-system`: light/dark/paper/pink themes (paper default), comfortable/compact density.
- Account-synced navigation orientation (horizontal/vertical) and validated session-backed active-organization switching.
- All surfaces migrated to the shared shell: platform, admin, account, auth, SLU, Eval; authenticated 1200px default width.
- Restored Eval interaction parity: task-first views, reviewer selection during launch, reports index, score/rank modes, trend chart, drilldowns.
- Eval run-creation wizard (the deferred authoring UX pass) with reviewer selection step.
- `markdown-it` + `sanitize-html` for safe response rendering.
- Structured `firstName`/`lastName` on User.

Changed from original plan: `User.navOrientation` applied with direct `prisma db execute` due to the pre-existing FK drift blocking `db push`.

Docs updated at the time: decision log (Align Desk adoption), deferred-work (authoring UX marked complete). Retrospective entries for 08–15 were backfilled during Phase 16 documentation reconciliation.

Checks/tests run: `db:generate`, build, `npm run qa` (28/28).

Next phase recommendation: Proceed to the finish-line phases (16–23) then Phase 09 launch hardening — see roadmap.

---

## Phases 15b–23 — Finish-line phases

Date: 2026-06-10 (all executed in one planned sequence; one commit each)

Outcome: All complete; proceed to Phase 09 as the final gate.

Each phase's `docs/development-phases/phase-NN-*.md` carries full closeout notes; this entry is the index:

- **15b** — Landed the in-flight admin-panel body-wrapper UI pass (14 files; finished two half-converted eval report panels).
- **16** — Documentation reconciliation: charter docs reflect the code as-built; retrospectives backfilled for 08–15; roadmap gained the finish-line section; finish-line decisions recorded.
- **17** — Structural/UI consistency: SLU joined the app shell with a sidebar; account pages adopted inline-edit; the segmented control became shared `rj-segmented` (removing Eval's dependency on `slu-` classes); styled error pages; dead views removed.
- **18** — Admin completeness: org create/soft-delete, full partner-account CRUD (first partner UI anywhere), audited act-as-org with banner, Eval-run cascade delete and job-artifact purge panels. Found and fixed: act-as-org never worked (Prisma drops empty OR objects); `ensureOrgEntitlement` create race; a collation-dependent flaky sort test.
- **19** — Partner self-service at `/partner`: client-org create/edit/archive, co-manager management, nav entry.
- **20** — Email verification (token model, verify-pending gate) + public `/pricing` and tiered `/signup` for all four tiers; rate limiting; the QA `@example.org` teardown (first run swept 756 stale users). Found and fixed: Passport session regeneration had silently broken SLU's URL-resume; now `keepSessionInfo`.
- **21** — Stripe billing: hosted Checkout + Customer Portal, raw-body webhook with idempotent entitlement sync (tier follows price; deletion downgrades to free), `/billing` page, org suspension, admin cancel. Live-key activation checklist recorded for Phase 09.
- **22** — Help system: `HelpArticle` model, shared `@rumbo/markdown`, on-request context-sensitive help drawer, `/help` pages, admin markdown editor with live preview, 15 seeded articles.
- **23** — Missing pieces: draft legal pages + `/support`, anonymizing self-service account deletion, `/healthz`, operations runbook (backups/restore/deploy/rollback), SameSite=Lax CSRF baseline (decision logged), account usage card, robots.txt + OG tags.

Checks/tests run: full Playwright suite after every phase; finished at 38/38 with the post-run data sweep keeping the dev DB at its two real accounts.

Next phase recommendation: Phase 09 — launch hardening as the final gate.

---

## Template

```md
## Phase XX — Name

Date:

Outcome:
- Proceed to next phase
- Stay in phase
- Split remaining work
- Move blocked work to later phase
- Revise roadmap

Completed:

Incomplete:

Changed from original plan:

Deferred:

Docs updated:

Checks/tests run:

Next phase recommendation:
```

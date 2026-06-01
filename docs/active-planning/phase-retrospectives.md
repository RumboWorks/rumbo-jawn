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
- Color-coded provenance system: each control section has a colored title dot, and the output blocks it contributes are highlighted in the same color. Five source colors: voice (pine green), task (ember orange), reading (slate blue), pack (ochre gold), generic (stone). Works in both Rumboworks and Black & White themes.
- "Our Voice" — read-only first panel showing the org's AI-detected voice profile (summary + tone attribute tags). No input options; colored title matches voice output blocks.
- Guidance task control: Writing something new / Rewriting existing text / Critiquing existing text
- Adaptive length/detail control: changes label and options based on selected task (Target length / Rewrite length / Critique depth)
- Reading level segmented control: Easy Read / Plain Language / General Adult / Specialist/Expert
- Best-practice pack radio group: None + 5 platform defaults (Fundraising, Email newsletters, Job descriptions, Social media, Press releases)
- Guidance blocks toggle list: org-specific blocks (voice-tone, vocabulary, what-to-avoid from AI) + reading level + generic (AI-cliche avoidance, plain language, inclusive language) + best-practice pack toggle
- All option changes assemble output client-side from pre-generated content — no new AI calls
- Output panel: 6-section default output for legacy Learning Policy Institute run; each section has color-coded heading matching its source control
- Copy guidance button (clipboard API with textarea fallback)
- .txt and .md download via server-side routes, using current saved options
- Debounced auto-save of workbench options (PATCH /slu/jobs/:jobId/workbench/options → stored as artifact)
- Optional 1–5 star feedback with category and comment, submitted to new SluFeedback DB table
- New `SluFeedback` MySQL table (created via raw SQL; prisma client regenerated)
- Guidance artifact v1 format: `sounds-like-us.guidance.v1` with `organization`, `voiceProfile`, `guidanceBlocks[]` — new runs get richer AI output
- Backward-compat transform: existing Phase 04 flat guidance artifacts are transformed to v1 format on the fly (no re-analysis required)
- Updated analysis-service.js: new AI prompt returns `voice_profile` (toneAttributes, writingPatterns, vocabulary, phrases, avoid) and `guidance_blocks[]` (voice-tone, vocabulary, what-to-avoid) as structured JSON
- `/slu/jobs/:jobId/result` now redirects to `/workbench`; job progress page redirects to workbench on completion
- Platform config files: `guidance-blocks.config.js` (reading level + task/length + generic block content) and `best-practice-packs.config.js` (5 packs with full guidance text)
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
- `npm run build --workspace=rumbo-web` — clean build; 37.9KB CSS, 11.8KB main.js, 209.6KB guidance-workbench.js
- `npx playwright test` — 18/18 pass, no regressions
- Manual workbench tests: Twig shell, React mount, color-coded source blocks — all pass
- PM2 stable: rumbo-web and rumbo-worker online under nvm Node 22

Next phase recommendation: Proceed to Phase 06 — Central Admin and Observability. Review Phase 06 doc before assignment.

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

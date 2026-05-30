# Phase 00 — Project Foundation

## Purpose

Create the repo foundation, documentation, conventions, and minimal scaffolding needed before building product features.

This phase should give coding agents clear rails and prevent architecture drift before Sounds Like Us or Model Eval implementation begins.

## What this phase delivers

- Monorepo skeleton.
- npm workspace baseline.
- ESM-only Node baseline.
- Placeholder Express app.
- Placeholder worker process.
- PM2 ecosystem file.
- Apache proxy notes.
- Vite/SCSS placeholder.
- Prisma/MySQL placeholder.
- Documentation and agent guidance files.
- Phase closeout mechanism.

## Out of scope

Do not build product features in this phase.

Specifically out of scope:

- Real auth implementation.
- Real Google/LinkedIn OAuth.
- Real billing.
- Real AI provider calls.
- Real crawling.
- Real Sounds Like Us flow.
- Real Model Eval flow.
- Real admin screens beyond placeholders.
- Production deployment.

## Target structure

Create or prepare this structure:

```text
apps/
  platform-web/
  worker/
tools/
  sounds-like-us/
  model-eval/
packages/
  auth/
  config/
  db/
  design-system/
  ai/
  crawler/
  jobs/
  storage/
  python-bridge/
python/
  analysis/
docs/
  development-phases/
.agent/
```

## Technical requirements

### Node/npm

- Use npm workspaces.
- Use ESM only.
- No CommonJS.
- Use npm scripts as task entry points.
- Add Vite only if useful for the placeholder frontend build.
- Do not use Gulp.

### Express

- Create a minimal Express app in `apps/platform-web`.
- Add a health/status route.
- Add placeholder route areas for `/admin`, `/tools/sounds-like-us`, and `/tools/model-eval` if practical.
- Do not implement product logic.

### Worker

- Create a placeholder worker process in `apps/worker`.
- It may log startup/shutdown only.
- Do not implement real queue processing yet.

### PM2

- Add a PM2 ecosystem file with at least:
  - `rumbo-web`
  - `rumbo-worker`

### Twig/views

- If Twig is added in this phase, keep it minimal.
- Create a clear placeholder layout only.
- Do not build real UI beyond placeholder pages.

### SCSS/design system

- Add placeholder SCSS structure.
- Establish naming convention:
  - `rj-` for shared design-system/platform classes.
  - `slu-` for Sounds Like Us classes.
  - `meval-` for Model Eval classes.
- Add Lucide only if useful in placeholder UI; otherwise document as selected icon direction.

### Prisma/MySQL

- Add Prisma dependency/config if practical.
- Create an initial placeholder schema if needed.
- Do not overbuild the data model.
- Document that MySQL is the current DB target while using existing EC2 servers.

### Python

- Create placeholder Python structure.
- Add a minimal Python bridge placeholder only if useful.
- No real analysis logic.

## Files likely touched/created

- `package.json`
- `package-lock.json`
- `apps/platform-web/package.json`
- `apps/platform-web/src/server.js`
- `apps/worker/package.json`
- `apps/worker/src/worker.js`
- `packages/*/package.json` placeholders as needed
- `prisma/schema.prisma`
- `ecosystem.config.cjs` or equivalent PM2 file
- `vite.config.js` or package-specific Vite config if used
- `docs/*`
- `.agent/*`

Note: PM2 config may need `.cjs` if the repo is ESM and PM2 expects CommonJS config. This is allowed as a tooling config exception if documented.

## Tasks

### 1. Initialize monorepo

- [ ] Create root `package.json` with npm workspaces.
- [ ] Set root package type to ESM where appropriate.
- [ ] Add baseline scripts.
- [ ] Create workspace folders.

Expected scripts, adjusted as implementation requires:

```json
{
  "scripts": {
    "dev": "npm --workspace apps/platform-web run dev",
    "dev:worker": "npm --workspace apps/worker run dev",
    "build": "npm run build --workspaces --if-present",
    "check": "npm run check --workspaces --if-present",
    "start": "npm --workspace apps/platform-web run start",
    "start:worker": "npm --workspace apps/worker run start"
  }
}
```

### 2. Create placeholder web app

- [ ] Add Express.
- [ ] Create `/health` route.
- [ ] Create placeholder home/app route.
- [ ] Create placeholder `/admin` route.
- [ ] Create placeholder `/tools/sounds-like-us` route.
- [ ] Create placeholder `/tools/model-eval` route.

### 3. Create placeholder worker

- [ ] Add worker entry point.
- [ ] Confirm it starts with npm script.
- [ ] Do not implement real jobs yet.

### 4. Add build/style placeholder

- [ ] Add SCSS folder structure.
- [ ] Add minimal base stylesheet.
- [ ] Add build command if tooling is present.
- [ ] Document CSS output path.

### 5. Add Prisma placeholder

- [ ] Add Prisma package/config if practical.
- [ ] Create placeholder schema.
- [ ] Do not add full auth/org schema yet unless needed for tooling.
- [ ] Document DB target.

### 6. Add deployment placeholders

- [ ] Add PM2 ecosystem file.
- [ ] Add Apache proxy notes in `docs/project-charter/deployment.md`.
- [ ] Add `.env.example` with placeholders only.

### 7. Add planning/guidance docs

- [ ] Add/update `AGENTS.md`.
- [ ] Add/update `docs/project-charter/product-vision.md`.
- [ ] Add/update `docs/project-charter/architecture.md`.
- [ ] Add/update `docs/active-planning/decision-log.md`.
- [ ] Add/update `docs/active-planning/roadmap.md`.
- [ ] Add/update `docs/active-planning/deferred-work.md`.
- [ ] Add/update `docs/active-planning/phase-retrospectives.md`.
- [ ] Add/update `docs/reference/usage.md`.
- [ ] Add/update `.agent/*` specialist files.

## Acceptance criteria

- [ ] `npm install` works.
- [ ] `npm run dev` starts the placeholder Express app.
- [ ] `npm run dev:worker` starts the placeholder worker.
- [ ] `npm run build` succeeds or is documented as intentionally minimal.
- [ ] `npm run check` succeeds.
- [ ] `/health` returns a success response.
- [ ] Placeholder tool/admin routes exist if included in Phase 00 implementation.
- [ ] PM2 ecosystem file exists and names `rumbo-web` and `rumbo-worker`.
- [ ] `.env.example` exists and does not contain real secrets.
- [ ] Docs reflect the current decisions.
- [ ] `docs/reference/usage.md` only documents commands that actually exist.
- [ ] No product feature work has started.

## Manual QA checklist

- [ ] Start web app locally or on dev server.
- [ ] Visit `/health`.
- [ ] Visit placeholder root route.
- [ ] Visit placeholder `/admin` if implemented.
- [ ] Visit placeholder `/tools/sounds-like-us` if implemented.
- [ ] Visit placeholder `/tools/model-eval` if implemented.
- [ ] Start worker and confirm it does not crash.
- [ ] Review generated CSS if SCSS build is implemented.

## Documentation updates required before closeout

- [ ] `docs/reference/usage.md` lists verified npm commands.
- [ ] `docs/active-planning/roadmap.md` marks completed Phase 00 items.
- [ ] `docs/active-planning/decision-log.md` includes any new decisions made during implementation.
- [ ] `docs/active-planning/deferred-work.md` lists postponed items.
- [ ] `docs/active-planning/phase-retrospectives.md` includes Phase 00 closeout.

## Risks / watch-outs

- Do not overbuild auth, jobs, AI, or data schema in Phase 00.
- Do not introduce CommonJS in app code.
- Do not let Vite/SCSS setup become a rabbit hole.
- Do not turn placeholder tool routes into product features.
- If a tooling config must be CommonJS, document why.
- Keep future phases provisional.

## Phase closeout

### Completion checklist

- [ ] All acceptance criteria pass.
- [ ] New commands are documented in `docs/reference/usage.md`.
- [ ] New architectural decisions are recorded in `docs/active-planning/decision-log.md`.
- [ ] Roadmap items are checked off or moved.
- [ ] Deferred work is listed explicitly.
- [ ] No known blocker is hidden inside comments, TODOs, or chat history.
- [ ] Manual QA notes are recorded.

### Retrospective questions

1. What was completed exactly?
2. What changed from the original plan?
3. What did we discover that affects later phases?
4. What is blocked?
5. What moved to a later phase?
6. What should be removed because it is no longer needed?
7. Are we allowed to start Phase 01?

### Valid outcomes

- Proceed to Phase 01.
- Stay in Phase 00 and finish missing work.
- Split remaining work into a new phase.
- Move specific blocked work to a named later phase.
- Revise the roadmap because the product understanding changed.

## Documentation hygiene checklist

- [ ] No unplanned files were added directly under `docs/`.
- [ ] Any working notes are in `docs/working-notes/`.
- [ ] Useful working-note content was promoted to source-of-truth docs.
- [ ] Superseded notes/plans were moved to `docs/archive/`.
- [ ] `docs/README.md` still points agents to the correct required reading.

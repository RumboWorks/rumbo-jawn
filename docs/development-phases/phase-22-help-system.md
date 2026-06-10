# Phase 22 — Context-Sensitive Help and Help & FAQ

## Purpose

On-screen help that opens only when asked for, plus per-tool Help & FAQ pages with content platform admins can edit without a deploy. Part of the finish-line plan (decision log 2026-06-10).

## What this phase delivers

- **Schema (additive):** `HelpArticle` — tool scope (registry key or null = platform), slug, markdown body, `contextKeys` (JSON array wiring articles to pages), navOrder, publish flag.
- **Shared markdown:** new `packages/markdown` (`@rumbo/markdown`: `renderMarkdown`, `formatResponseText`) — moved from `tools/eval/src/markdown.js`, which now re-exports it; platform-web uses it for help rendering. markdown-it + sanitize-html deps moved out of the eval package.
- **Help drawer (on request only):** "?" button in `partials/page-header.twig` opens a right-side native-`<dialog>` drawer (`partials/help-drawer.twig`, `assets/js/help.js`, `_help.scss`). It fetches `GET /help/api/context?key=…`; resolution is exact context-key match (searched across ALL published articles — keys are explicit wiring) → the key's tool articles → platform articles. Pages declare `{% set helpContextKey = '…' %}`; wired into SLU history and the seven main Eval screens, with the body's `data-tool` as fallback everywhere else.
- **Help & FAQ pages:** `/help` and `/help/:toolKey` (accordion of published articles, tool pill nav). "Help & FAQ" sidebar links in SLU, Eval, and account sidebars.
- **Admin authoring:** `/admin/help` list (tool filter, publish toggle, delete) + dedicated editor (`/admin/help/new`, `/admin/help/:id`) with side-by-side markdown textarea and live preview (debounced `POST /admin/help/preview`). Long markdown bodies justified the dedicated page over the inline-edit row convention (decision recorded 2026-06-10). All mutations audit-logged.
- **Seed content:** `npm run seed-help --workspace=@rumbo/db` upserts 15 published articles (5 platform: getting started, accounts/verification, orgs/members, plans/billing, partner accounts; 4 SLU; 6 Eval), drafted to match the actual shipped flows.

## Design note found during QA

Context-key matching originally searched only the key's derived tool scope, so an explicit key on an article from another scope could never match. Fixed: explicit keys match across all published articles; scoping applies only to the fallbacks.

## Out of scope

- Article search, categories, or versioning.
- Editing help from inside the drawer.

## Phase closeout

### Completion checklist

- [x] All acceptance criteria pass.
- [x] Schema applied additively; `db:generate` run.
- [x] New routes/commands documented in `docs/reference/usage.md`.
- [x] Roadmap items are checked off.
- [x] The next phase still makes sense.

### Closeout notes

- The page templates and the seed content (including the article copy) were drafted by lower-cost sub-agents from specs and reviewed; one factual correction (email-change re-verification doesn't exist) and two JS-syntax fixes (markdown backticks inside template literals) were made during review.
- QA: end-to-end test covers admin create→publish→render on `/help/slu`, the context API (exact match + tool fallback), the drawer opening from the page header and loading context articles, unpublish hiding, and delete. Suite: 36/36 passing.
- Verification: additive SQL via `prisma db execute`; `db:generate`; seed run (15 created); build; `pm2 restart rumbo-web`; `npm run qa` 36/36.

Next phase recommendation: Proceed to Phase 23 — Missing-Pieces Sweep.

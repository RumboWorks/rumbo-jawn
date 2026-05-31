# RumboWorks Design System

> **Better AI starts with better human guidance.**

This is the brand and design system for **RumboWorks** — a modular platform and product
family for AI-assisted tools that help nonprofit and mission-driven teams analyze, evaluate,
improve, and operationalize their communications. It gives design and coding agents everything
needed to produce well-branded RumboWorks interfaces, marketing, slides, and prototypes.

---

## 1. Company & product context

**RumboWorks** (always one word) is the umbrella **platform / product family**. *Rumbo* is the
Spanish word for *course*, *direction*, or *bearing* — the brand idea is keeping AI on the right
course, with humans holding the wheel. The connection is felt, not shouted: a compass/bearing
motif and directional language, never literal nautical décor.

| Layer | Name | Status | What it is |
|---|---|---|---|
| Platform | **RumboWorks** | In foundation | Shared auth, orgs, billing, jobs, AI-provider wrapper, cost logging, storage, admin, design system. A **modular monolith** with seams for later distribution. |
| Tool 1 | **Sounds Like Us** | First MVP | Generates **reusable writing guidance** from an org's public web pages (and later PDFs) so staff or AI tools can write in the org's voice. Output is *guidance*, treated as a durable asset — not a throwaway prompt. |
| Tool 2 | **Model Eval** | Planned sibling | Structured evaluation of AI model outputs against rubrics/criteria/reviewers. Out of scope for MVP, but shapes shared architecture. |

**Audience:** nonprofit organizations, associations, schools, foundations, public agencies,
mission-driven communications teams, and the consultants who help them adopt AI responsibly.
Mostly **nontechnical**. The UI must be traditional and self-evident — nobody should have to
guess how nav, settings, or controls work — while still feeling distinctly, warmly branded.

**Product principles (from the charter):**
- Make AI guidance practical and usable by nontechnical teams.
- Treat guidance as an asset, not throwaway prompt text.
- Help orgs understand and control how AI tools interact with their voice and public content.
- Keep privacy, data minimization, and disclosure **visible**.
- Build shared platform capabilities once, reuse across tools.
- Dogfood high-quality AI/agent guidance — the brand publicly claims this expertise.

### Source material

This system was built from the planning/architecture repository (no prior visual direction
existed — the brand here is original work):

- **Planning repo:** https://github.com/RumboWorks/rumbo-jawn
  - `docs/project-charter/product-vision.md`, `architecture.md`, `data-model.md`, `ai-guidance.md`
  - `docs/tools/sounds-like-us.md`, `docs/tools/model-eval.md`
  - `docs/development-phases/` (platform shell, auth/orgs, jobs/AI/storage, Sounds Like Us first-run & workbench, central admin, billing, widgets)

Explore that repository for deeper product and architecture context. Relevant technical
constraints that shaped this system: server-rendered **Twig** pages + **vanilla JS** with
**React islands** for dynamic screens (e.g. the guidance workbench), **SCSS** (no Tailwind /
Bootstrap), **Lucide** icons, and class prefixes `rj-` (platform/shared), `slu-` (Sounds Like Us),
`meval-` (Model Eval).

---

## 2. Content fundamentals (voice & copy)

RumboWorks sounds like a **calm, capable guide** — an expert who respects you and refuses to
talk down. Warm and plainspoken, never hypey, never jargon-y.

- **Person & address:** Speak to the reader as **"you"**; the product/company is **"we."**
  ("We only read public pages." / "You're in control of how AI uses your voice.")
- **Tone:** Reassuring and direct. Confidence without bravado. Mission-aware, never preachy.
- **Casing:** Sentence case for almost everything — headings, buttons, menu items.
  Reserve Title Case for proper product names: **RumboWorks**, **Sounds Like Us**, **Model Eval**.
  ALL-CAPS only for tiny eyebrow/section labels (tracked out), never for sentences.
- **Say "guidance," not "prompt."** Guidance is the asset; "prompt" sounds disposable.
- **Verbs over nouns; short over long.** "Generate guidance," "Add source," "Open workbench."
- **Privacy is spoken plainly and early**, never buried. "Content from the public URLs you submit
  may be sent to AI providers." Disclosure is a feature, surfaced in info alerts.
- **Numbers are honest and specific** — token counts, costs ($0.042), page counts, confidence
  scores (0.86). These build trust; never invent vanity stats.
- **No emoji** in product UI or marketing. Warmth comes from words, type, and color — not emoji.
  (Lucide icons carry iconographic meaning instead.)
- **Em dashes and the occasional italic** add an editorial, human cadence — used sparingly.

**Voice examples**
- Hero: *"Better AI starts with better human guidance."*
- Sub: *"Turn your public pages into reusable writing guidance, so your team — and your AI tools — sound like you."*
- Empty state: *"No guidance yet. Add a public URL to get started."*
- Button: *Generate guidance* · *Add source* · *Open workbench* · *Download guidance*
- Disclosure: *"We only read public pages. Don't submit URLs with confidential, donor, or member information."*

---

## 3. Visual foundations

The look is a **warm editorial "field guide"**: warm paper, deep pine ink, and an ember/clay
accent — grounded, trustworthy, and human, deliberately avoiding the cold blue/purple of generic
AI tools. Structured and legible first; brand warmth in the details.

### Color
- **Pine** (`--rj-pine-600 #1F5B43`) — the primary brand color. Identity & structure: nav, headings,
  links, brand chrome, the bearing-mark ring. Deep, calm, growing.
- **Ember / Clay** (`--rj-ember-500 #C2562F`) — the accent and **primary action** color. Human warmth,
  CTAs, highlights, the compass needle's forward bearing. Used sparingly, where people act.
- **Ochre / Sand** (`--rj-ochre-500 #D9A441`) — secondary highlight; marks, attention, eyebrows on dark.
- **Stone** warm-neutral scale (`paper #FAF7F1` → `ink #1E2A24`) — every surface is warm; never cool gray.
- **Semantic:** success (pine-leaning green), warning (ochre), danger (rust `#B23A28`), info (slate-teal).
- Rule of thumb: **mostly paper + pine + ink**, ember used as a spark (~5–10% of a screen), ochre rarer still.

### Type
- **Bricolage Grotesque** — the **brand wordmark** typeface (logo lockups only). A contemporary
  grotesque with subtle irregularity — distinctive and ownable, not off-the-shelf.
- **Lora** (serif, `--rj-font-serif`) — primary display & headings; the warm, calligraphic human *voice*.
- **Bitter** (slab serif, `--rj-font-slab`) — alternate headline voice & editorial accents; sturdy and
  grounded. Lora and Bitter are both first-class — pair them, or standardize on one later.
- **Hanken Grotesk** (humanist sans) — all UI, body, labels, tables. Friendly + highly legible.
- **IBM Plex Mono** — data, costs, tokens, URLs, IDs, code. Always `tabular-nums` for numbers.
- Scale is a 16px-based modular set (48 / 36 / 28 / 22 / 18 / 16 / 14 / 13 / 12). 12px is the floor.
- Headings are serif + tight tracking; body is sans at 1.55 line-height; eyebrows are 12px uppercase
  sans, tracked `0.08em`, in pine.
- All fonts are **open-source Google Fonts** (see `colors_and_type.css` for the exact `<link>`).

### Backgrounds & motifs
- Default canvas is **warm paper** (`#FAF7F1`); cards are white. No photographic hero backgrounds by default.
- Brand "hero" surfaces use **deep pine** (`pine-800`) panels with faint concentric **bearing rings**
  (thin low-opacity circles) as the signature texture — subtle, never busy.
- **No gradients** as decoration (especially no blue/purple). Flat warm fields only. A single
  near-flat paper tone shift (paper → stone-50) is the most we use.
- Imagery, when present, should read **warm** (golden/clay cast), documentary and human — real people
  and real workplaces, never glossy stock-AI abstraction. Use placeholders + ask the user for real assets.

### Shape, depth & borders
- **Radii:** buttons/inputs 8px, cards 12px, panels 16px, badges pill. Soft, not bubbly.
- **Organic shapes (opt-in):** a parallel hand-drawn set — `--rj-radius-organic-*` tokens,
  `.rj-btn--organic` (uneven, drawn corners that shift on hover) and `.rj-badge--organic`
  (a highlighter-swish marker stroke). Use sparingly for warmth and editorial character; the
  crisp "standard" set stays the default for dense, traditional UI. Both share one class API.
- **Borders:** 1px warm hairlines (`stone-200`); slightly stronger `stone-300` on interactive fields.
- **Shadows:** soft and **warm-tinted** — `rgba(30,42,36,·)`, never neutral black. Five steps
  (xs→xl). Cards use `sm`; menus `md`; modals `xl`. Elevation stays inside the paper world.
- Cards = white fill + hairline border + `shadow-sm` + 12px radius. No colored left-border-accent cards.

### Motion & states
- **Easing:** gentle and confident — `cubic-bezier(0.2,0.6,0.2,1)`; durations 120/200/320ms.
- **Animation:** quiet. Fades and short slides; **no bounce, no spring, no parallax theatrics.**
- **Hover:** buttons darken one step (ember-500→600, pine-600→700); secondary/ghost get a stone tint;
  table rows tint **pine-50**.
- **Press:** a 1px downward nudge (`translateY(1px)`) — never a shrink/scale.
- **Focus:** visible **ember focus ring** (`0 0 0 3px rgba(194,86,47,.32)`) on all interactive elements.
  Accessibility is non-negotiable for this audience.
- **Transparency/blur:** used rarely — only for modal scrims (warm ink at ~45%). No frosted-glass everywhere.

### Layout
- Comfortable density with a 4px spacing rhythm. App uses a fixed left sidebar + top bar; content
  in a centered max-width column. Marketing is a single centered column, generous vertical spacing.
- Tables are first-class (jobs, runs, costs): uppercase hairline headers, tabular numerals, pine row-hover.

See live specimens for every token in the **Design System** tab (cards in `preview/`).

---

## 4. Iconography

- **Lucide** is the official icon library (an architecture decision in the planning repo). Clean,
  consistent **1.5–2px stroke, rounded** line icons — calm and legible, matching the warm-but-precise tone.
- Load from CDN: `<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>`
  then `lucide.createIcons()`. Use icons via `<i data-lucide="compass"></i>`. Size 16–20px in UI.
- Icons are **monochrome**, inheriting text color (pine, ink, or ember for action). Never multicolor.
- Recurring icons: `compass` / `navigation` (brand & wayfinding), `sparkles` (generate),
  `file-text` (sources/guidance), `shield` (privacy/disclosure), `clock` / `loader` (jobs),
  `check-circle-2`, `alert-triangle`, `x-circle` (status), `arrow-up-right` (upgrade/links).
- **No emoji.** **No multicolor or 3D icon sets.** Unicode glyphs are not used as icons.
- The **bearing mark** (`assets/rumboworks-mark.svg`) is the one bespoke brand glyph — a compass
  needle (ember north, pine south) on a course ring. It is a *logo*, not a UI icon; don't redraw it.
  `assets/rumboworks-mark-light.svg` is the version for dark backgrounds.

---

## 5. Index / manifest

**Foundations (root)**
- `colors_and_type.css` — design tokens: color scales, semantic roles, type families & scale,
  spacing, radii, elevation, motion. Plus `.rj-*` type helper classes. **Start here.**
- `components.css` — shared `rj-` components: buttons, inputs, badges, cards, tables, alerts,
  logo lockup, dividers, kbd. Depends on `colors_and_type.css`.
- `assets/` — `rumboworks-mark.svg`, `rumboworks-mark-light.svg` (the bearing mark, light & dark).

**Design System cards** — `preview/*.html` (one concept each; rendered in the Design System tab).

**UI kits** — high-fidelity, interactive recreations of real product surfaces:
- `ui_kits/marketing/` — the public RumboWorks brochure site (hero, how-it-works, tools, footer).
- `ui_kits/app/` — the RumboWorks platform app: sign-in, Sounds Like Us first-run, job progress,
  the guidance workbench (React island), and central admin observability.

Each UI kit has its own `README.md`, an `index.html` you can click through, and small JSX components.

**Skill**
- `SKILL.md` — makes this folder usable as an Agent Skill (e.g. in Claude Code).

---

*No prior visual brand existed — colors, type pairing, the bearing mark, and all components here are
original to this system. Fonts are open-source Google Fonts substitutions chosen to fit the brief
(warm, professional, legible); swap in licensed brand fonts later by editing `colors_and_type.css`.*

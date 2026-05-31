---
name: rumboworks-design
description: Use this skill to generate well-branded interfaces and assets for RumboWorks (and its tools, Sounds Like Us and Model Eval), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

RumboWorks is a warm, editorial, professional brand for human-guided AI tools serving
nonprofit and mission-driven teams. The system is built around: a warm paper + deep pine +
ember/clay palette, a dual-serif voice (Lora + Bitter) with Hanken Grotesk for UI and Bricolage
Grotesque for the wordmark, Lucide icons, soft warm-tinted elevation, and an optional "organic"
(hand-drawn) component variant alongside the crisp standard one.

Key files:
- `colors_and_type.css` — all design tokens (colors, type, spacing, radii, elevation, motion).
- `components.css` — shared `rj-` components (buttons, inputs, badges, cards, tables, alerts, logo).
- `assets/` — the compass-star brand mark (light & dark).
- `preview/*.html` — design-system specimen cards (the source of truth for tokens in use).
- `ui_kits/marketing/` and `ui_kits/app/` — high-fidelity, interactive React recreations of the
  public site and the platform app (sign-in → Sounds Like Us flow → guidance workbench → admin).

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create
static HTML files for the user to view. Load the two CSS files and the Google Fonts `<link>` from
`colors_and_type.css`, then use the `rj-` classes and CSS vars. Reuse the JSX components in
`ui_kits/` for app-like surfaces. If working on production code, copy assets and read the rules here
to become an expert in designing with this brand.

Always write **RumboWorks** as one word; name tools in full (**Sounds Like Us**, **Model Eval**).
Voice: warm, plainspoken, "you"/"we", sentence case, no emoji, privacy spoken plainly. Say
"guidance," never "prompt." Use ember sparingly as the human-action accent; keep everything on
warm paper, never cool gray.

If the user invokes this skill without any other guidance, ask them what they want to build or
design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_
production code, depending on the need.

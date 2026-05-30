# Phase 01 — Platform Shell

## Purpose

Create the basic platform web shell: routing, Twig page layout wiring, SCSS pipeline, minimal neutral design foundation, and placeholders for tool modules.

This phase is platform foundation work, not Sounds Like Us product behavior.

## What this phase delivers

- Express web shell.
- Twig layout wiring.
- Base page layout.
- SCSS compilation pipeline.
- Minimal neutral design-system foundation.
- Basic route organization.
- Placeholder tool route/module pattern.
- Placeholder admin/account areas if useful.

## Visual direction

Use functional scaffolding with a minimal neutral design foundation.

Do not create a full visual brand system yet.

Phase 01 should include:

- base CSS variables/tokens,
- basic page shell,
- basic typography scale,
- basic spacing scale,
- basic form/button/card/alert/table styles,
- basic admin/app layout primitives,
- basic responsive behavior,
- Lucide icon integration if easy,
- placeholder visual tokens that can be replaced later.

Use a clean, neutral, readable look:

- white/off-white background,
- dark text,
- restrained borders,
- comfortable spacing,
- simple buttons,
- no heavy visual branding yet.

Avoid:

- final brand palette decisions,
- marketing page design,
- tool-specific visual identity,
- complex component library work,
- CSS framework adoption,
- Tailwind/Bootstrap,
- detailed dashboard polish,
- React-specific styling decisions beyond compatibility.

## Out of scope

- Sounds Like Us analysis flow.
- Auth implementation.
- Final visual identity.
- WordPress brochure site.
- Model Eval features.
- Embeddable widgets.

## Acceptance criteria

- Platform web shell runs.
- Twig templates render.
- SCSS builds.
- Shared base CSS exists.
- No Bootstrap/Tailwind is introduced.
- Tool route placeholders do not implement feature behavior.
- Phase 01 does not make final visual design decisions.


## Phase closeout

Use `.agent/phase-review.agent.md` for closeout.

### Completion checklist

- [ ] All acceptance criteria pass.
- [ ] Relevant commands/checks were run.
- [ ] Manual QA notes are recorded.
- [ ] New commands are documented in `docs/reference/usage.md`, if commands exist.
- [ ] New architectural decisions are recorded in `docs/active-planning/decision-log.md`.
- [ ] Roadmap items are checked off, added, or moved.
- [ ] Deferred work is listed explicitly in `docs/active-planning/deferred-work.md`.
- [ ] Working notes created during this phase were promoted, linked, archived, or deleted.
- [ ] No unplanned files were added directly under `docs/`.
- [ ] The next phase still makes sense or has been revised.

### Valid outcomes

- Proceed to next phase.
- Stay in this phase and finish missing work.
- Split remaining work into a new phase.
- Move specific blocked work to a named later phase.
- Revise the roadmap because product understanding changed.

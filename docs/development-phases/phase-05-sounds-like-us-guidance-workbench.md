# Phase 05 — Sounds Like Us Guidance Workbench

## Status

Next active phase.

Phase 04 is complete. Before implementation, do a brief Phase 05 kickoff review using the actual Phase 04 result shape, artifacts, routes, services, and data model.

This is a single-document handoff version. Do not use a separate `phase-05-workbench.md` for implementation unless this document is explicitly split later.

## Purpose

Build the dynamic Sounds Like Us guidance workbench: the screen where a user reviews generated organization guidance, adjusts options, assembles reusable guidance output, copies/downloads that output, and optionally leaves feedback.

This phase turns the first generated result from Phase 04 into a practical guidance-building interface.

The core product idea is that users are not just receiving a one-off prompt. They are receiving reusable writing guidance they can take into their own AI tool, team workflow, or documentation.

## Platform vs tool scope

This is a Sounds Like Us tool phase.

Use shared Rumbo platform services for:

- auth,
- organization context,
- permissions,
- jobs,
- AI calls,
- cost logging,
- artifact storage,
- usage limits,
- admin visibility,
- shared design-system styles.

Do not add Model Eval features.

Do not create Sounds Like Us-specific versions of shared platform services.

## Relationship to earlier phases

This phase assumes:

- Phase 00 created the repo/docs/scaffolding foundation.
- Phase 01 created the platform shell, Twig layout, SCSS pipeline, and neutral design-system foundation.
- Phase 02 created shared auth/org foundations.
- Phase 03 created shared jobs, AI provider wrapper, storage, artifacts, and cost logging.
- Phase 04 created the first end-to-end Sounds Like Us run from public URL to generated result.

Phase 05 should build on the actual Phase 04 result shape.

If Phase 04 output is too thin or too unstructured to support this workbench, make the smallest needed structured-output adjustment rather than hardcoding fragile UI behavior. Document durable findings in `docs/active-planning/implementation-notes.md`.

## Required kickoff review

Before editing implementation files, the agent must inspect the Phase 04 implementation and answer:

1. Where is a completed Sounds Like Us run stored?
2. Where is the generated analysis/guidance artifact stored?
3. Is the guidance artifact structured, or mostly one text blob?
4. What route currently displays a completed result?
5. What auth/org access checks already exist?
6. What service assembles or retrieves the Phase 04 output?
7. What shared storage/artifact helpers exist?
8. What data is safe and reasonable to send to the browser?
9. What can be assembled client-side without another AI call?
10. What must remain server-side?

Record durable findings in `docs/active-planning/implementation-notes.md` if they affect later phases.

## What this phase delivers

A signed-in user can open a completed Sounds Like Us run and use a workbench screen to:

1. Review the generated organization voice/guidance profile.
2. Choose what task the guidance should support.
3. Adjust included Guidance Blocks and option values.
4. Add one optional default best-practice pack.
5. Copy the assembled guidance output.
6. Download the assembled guidance as plain text or Markdown.
7. Optionally rate the result and submit feedback.
8. Return later and see the same run/result.

## Product model

### Key distinction

The workbench is not primarily a rewrite tool.

The MVP workbench is primarily a **guidance assembly tool**.

It lets the user create guidance they can copy into another AI system or team workflow.

Future phases may add direct rewriting, critique, side-by-side comparison, and editable paid prompt pieces. Do not build those unless explicitly pulled into this phase.

### Preferred language

Prefer:

- "guidance"
- "writing guidance"
- "organization guidance"
- "Guidance Blocks"
- "output"
- "instructions"

Avoid overusing:

- "prompt"

The user may still need a "copy prompt" style output, but product language should frame this as reusable guidance.

## Future manager-configurable guidance system

The workbench is moving toward a guidance-assembly-factory model.

Day-to-day staff users should eventually see a friendly point-and-click interface. Managers or power users should eventually be able to configure what those staff users see.

Phase 05 should not build the full manager configuration UX, but it must avoid hard-wiring the workbench in a way that blocks that future direction.

### Concepts

Use these terms:

- **Guidance Block** — a reusable named piece of instructional text.
- **Guidance Block Set** — a named collection of Guidance Blocks and default choices.
- **Option Set** — a group of related controls, such as reading level, target length, rewrite length, critique depth, or best-practice packs.
- **Option** — a selectable value within an Option Set.
- **Best-Practice Pack** — a reusable topic/channel/workflow-specific group of Guidance Blocks.

### Future manager capabilities

Future manager/power-user configuration should support:

- turning whole Option Sets on or off,
- choosing which options are available to staff users,
- editing the Guidance Blocks behind each option,
- creating named Guidance Block Sets,
- creating custom Best-Practice Packs,
- deciding whether a set is private or shared with the organization.

### Phase 05 implementation rule

For Phase 05, use platform default configuration only.

Do not build the manager configuration UI yet.

However, render the workbench from a configuration object or seed data rather than hardcoding all controls directly into the frontend.

Default platform Guidance Blocks may be defined in code or seed data for this phase. Future phases may expose them through admin/manager UI.

Initial default Best-Practice Packs may include:

- Fundraising / donor appeals
- Email newsletters
- Job descriptions / performance reviews
- Social media posts
- Press releases

These must be treated as default configurable packs, not permanent hardcoded categories.

The future system should allow organization-specific packs such as:

- events,
- volunteer outreach,
- advocacy alerts,
- board communications,
- member updates,
- program announcements.

Simple option changes should assemble output from the selected Guidance Blocks and should not trigger a new AI call by themselves.

## User flow

### Entry point

The user arrives from a completed Phase 04 run.

Preferred route if it fits the current app:

```text
/tools/sounds-like-us/runs/:runId/workbench
```

The exact route should follow the Phase 04 route conventions.

### Main flow

1. User opens completed run.
2. Page loads run metadata and structured guidance output.
3. User sees a default assembled guidance output.
4. User changes workbench options.
5. Output preview updates immediately.
6. User copies or downloads the output.
7. User may leave optional feedback.
8. User may return to the run later.

### Empty/error states

Include clear messages for:

- run not found,
- user does not have access,
- run still processing,
- run failed,
- run completed but generated output is missing or malformed,
- no usable source material was found,
- output cannot be assembled from available data.

Do not expose raw stack traces or provider error payloads to normal users.

## Recommended UI layout

The workbench should be understandable before it is beautiful.

Use the Phase 01 neutral design-system foundation. Do not invent final visual branding.

Recommended layout:

```text
+--------------------------------------------------------------+
| Sounds Like Us                                               |
| Organization / Run title / Status                            |
+--------------------------------------------------------------+

+----------------------+---------------------------------------+
| Controls             | Output Preview                        |
|                      |                                       |
| Guidance Task        | [assembled guidance text]             |
| Reading Level        |                                       |
| Length/Detail        |                                       |
| Best-Practice Pack   |                                       |
| Guidance Blocks      |                                       |
| Format/download      |                                       |
| Feedback             |                                       |
+----------------------+---------------------------------------+
```

On small screens, controls should stack above the preview.

## Technical UI approach

Implement the workbench as a React island mounted inside a Twig page shell.

Reason: even if the initial implementation is relatively simple, this screen will become more dynamic over time.

Rules:

- Keep shared layout/nav in Twig.
- Mount React only for the workbench.
- Use shared SCSS/design-system tokens.
- Avoid creating a separate React-only design system.
- Do not move simple app pages to React just because this screen uses React.
- Do not use Bootstrap or Tailwind.

## Core workbench model

These controls alter the assembled guidance output.

The final output should be assembled from reusable **Guidance Blocks**. A Guidance Block is a named piece of instructional text that can be included, excluded, reordered, or modified depending on the user’s selected options.

Use “Guidance Blocks” in the user-facing interface.

Use `guidanceBlocks` / `guidance_blocks` internally.

Guidance Blocks should not be hardcoded only in frontend logic. They need to be represented in a way that supports future editing, reuse, and paid-user customization.

For Phase 05, default Guidance Blocks may be defined in code or seed data. Do not build the admin/manager editing UI yet.

The workbench should assemble output from:

1. the generated organization guidance profile,
2. the selected `guidanceTask`,
3. the selected adaptive length/detail option,
4. the selected `readingLevel`,
5. the selected `bestPracticePack`,
6. the included/excluded Guidance Blocks,
7. any selected output format.

Simple option changes should not trigger new AI calls when the existing structured guidance and Guidance Blocks contain enough information to assemble the output.

Any future AI-backed regeneration/refinement must be explicit, logged through the shared AI provider layer, and subject to usage limits.

## Initial Guidance Blocks

The MVP should provide these initial default Guidance Blocks.

These are the starting set. Keep them easy to adjust later in code or seed data without side effects.

- Voice and tone
- Words and phrases to use
- What to avoid
- Reading level guidance
- AI-cliche avoidance
- Plain-language guidance
- Inclusive-language guidance
- Best-practice pack guidance
- Write-new guidance
- Rewrite-existing guidance
- Critique-existing guidance
- Target length guidance
- Rewrite length guidance
- Critique depth guidance

Do not confuse Guidance Blocks with user controls. Controls select options. Guidance Blocks are text units assembled into the output.

## Primary control: guidance task

The workbench should include a primary control labeled:

**Create guidance for…**

This control determines the task the assembled guidance is meant to support.

### Internal name

Use the internal name:

```js
guidanceTask
```

Use this name consistently in JavaScript, JSON payloads, services, tests, and documentation.

Use database/API naming:

```text
guidance_task
```

Do not call this value `useCase`, `taskMode`, `mode`, `outputType`, or `intent`. Those terms are ambiguous and will conflict with other workbench concepts.

### User-facing options

The initial options are:

1. **Writing something new**
2. **Rewriting existing text**
3. **Critiquing existing text**

### Internal values

Use these exact internal values:

```js
const GUIDANCE_TASKS = {
  WRITE_NEW: "write_new",
  REWRITE_EXISTING: "rewrite_existing",
  CRITIQUE_EXISTING: "critique_existing",
};
```

### Meaning

#### `write_new`

User-facing label:

**Writing something new**

Meaning:

The assembled guidance should instruct an AI tool or human writer to create new text from scratch using the organization’s voice, tone, preferences, and selected options.

This does not mean Rumbo is writing the text directly.

#### `rewrite_existing`

User-facing label:

**Rewriting existing text**

Meaning:

The assembled guidance should instruct an AI tool or human editor to revise existing text so it better matches the organization’s voice, tone, preferences, and selected options.

This does not mean Rumbo is performing the rewrite directly in Phase 05.

#### `critique_existing`

User-facing label:

**Critiquing existing text**

Meaning:

The assembled guidance should instruct an AI tool or human reviewer to critique existing text against the organization’s voice, tone, preferences, and selected options.

This does not mean Rumbo is performing the critique directly in Phase 05.

### Behavior

Changing `guidanceTask` should update:

- visible dependent controls,
- included/default Guidance Blocks where appropriate,
- assembled output preview,
- copy/download output.

Changing `guidanceTask` should not trigger a new AI call by itself.

## Adaptive length/detail control

The workbench should show one length/detail control whose label and options depend on the selected `guidanceTask`.

Do not show all three controls at once.

Use internal name:

```js
lengthDetail
```

Use database/API naming:

```text
length_detail
```

### If `guidanceTask` is `write_new`

Show a control labeled:

**Target length**

Options:

1. **Short post** — social post or short blurb.
2. **Brief piece** — short email, announcement, or intro copy.
3. **Standard article** — newsletter article, web page section, or blog-style piece.
4. **Full-length piece** — longer article, appeal, or detailed page.

Suggested internal values:

```js
const WRITE_LENGTH_OPTIONS = {
  SHORT_POST: "short_post",
  BRIEF_PIECE: "brief_piece",
  STANDARD_ARTICLE: "standard_article",
  FULL_LENGTH_PIECE: "full_length_piece",
};
```

### If `guidanceTask` is `rewrite_existing`

Show a control labeled:

**Rewrite length**

Options:

1. **Shorter** — compress the original while preserving the key message.
2. **About the same** — preserve roughly the same length and level of detail.
3. **Longer** — expand with more context, transitions, or explanation.

Suggested internal values:

```js
const REWRITE_LENGTH_OPTIONS = {
  SHORTER: "shorter",
  ABOUT_SAME: "about_same",
  LONGER: "longer",
};
```

### If `guidanceTask` is `critique_existing`

Show a control labeled:

**Critique depth**

Options:

1. **Quick take** — a short overall reaction.
2. **Summary critique** — main strengths, weaknesses, and highest-priority improvements.
3. **Detailed critique** — specific issues and recommendations organized by category.
4. **Point-by-point review** — detailed notes organized by issue, section, or passage.

Suggested internal values:

```js
const CRITIQUE_DEPTH_OPTIONS = {
  QUICK_TAKE: "quick_take",
  SUMMARY_CRITIQUE: "summary_critique",
  DETAILED_CRITIQUE: "detailed_critique",
  POINT_BY_POINT: "point_by_point",
};
```

The selected value should alter the assembled guidance output. It should not trigger a new AI call by itself.

## Reading level control

Use a four-setting segmented control or slider.

Use internal name:

```js
readingLevel
```

Use database/API naming:

```text
reading_level
```

Options:

1. **Easy Read** — grade 2–3  
   Use very short sentences, familiar words, concrete examples, and minimal jargon.

2. **Plain Language** — grade 4–5  
   Use short sentences, common words, clear headings, and explain necessary terms.

3. **General Adult** — grade 6–8  
   Use clear public-facing language suitable for most adult readers. This is the default.

4. **Specialist / Expert** — grade 8–10+  
   Allow more specialized vocabulary, denser explanation, and field-specific terms when useful.

Treat grade levels as approximate targets, not exact guarantees.

Suggested internal values:

```js
const READING_LEVELS = {
  EASY_READ: "easy_read",
  PLAIN_LANGUAGE: "plain_language",
  GENERAL_ADULT: "general_adult",
  SPECIALIST_EXPERT: "specialist_expert",
};
```

## Best-practice pack control

Label:

**Add best-practice guidance for…**

Use internal name:

```js
bestPracticePack
```

Use database/API naming:

```text
best_practice_pack
```

Control type for Phase 05: radio group.

Only one Best-Practice Pack may be selected in Phase 05.

Radio buttons are preferred over a dropdown because they make the available choices visible.

Initial options:

- **None** — default
- **Fundraising / donor appeals**
- **Email newsletters**
- **Job descriptions / performance reviews**
- **Social media posts**
- **Press releases**

Suggested internal values:

```js
const BEST_PRACTICE_PACKS = {
  NONE: "none",
  FUNDRAISING_APPEALS: "fundraising_appeals",
  EMAIL_NEWSLETTERS: "email_newsletters",
  JOB_DESCRIPTIONS_PERFORMANCE_REVIEWS: "job_descriptions_performance_reviews",
  SOCIAL_MEDIA_POSTS: "social_media_posts",
  PRESS_RELEASES: "press_releases",
};
```

These are platform default Best-Practice Packs, not permanent hardcoded categories.

## Output format

Initial supported output formats:

- Copy to clipboard
- Plain text download
- Markdown download

Use internal name:

```js
outputFormat
```

Use database/API naming:

```text
output_format
```

Suggested internal values:

```js
const OUTPUT_FORMATS = {
  PREVIEW: "preview",
  TEXT: "text",
  MARKDOWN: "markdown",
};
```

PDF output is deferred. Add or keep an item in `docs/active-planning/deferred-work.md`.

## Internal structured guidance object

Phase 05 should avoid treating the generated guidance as one opaque text blob.

If Phase 04 does not already produce a structured internal object, add or revise a structure similar to this:

```json
{
  "version": "sounds-like-us.guidance.v1",
  "runId": "string",
  "organization": {
    "name": "string",
    "detectedType": "nonprofit | school | foundation | public_agency | association | unknown",
    "summary": "string"
  },
  "sourceBasis": {
    "urls": [],
    "documents": [],
    "pageCount": 0,
    "notes": []
  },
  "voiceProfile": {
    "summary": "string",
    "toneAttributes": [],
    "writingPatterns": [],
    "vocabulary": [],
    "phrases": [],
    "avoid": [],
    "audienceNotes": []
  },
  "guidanceBlocks": [
    {
      "id": "voice-tone",
      "label": "Voice and tone",
      "defaultIncluded": true,
      "content": "string",
      "sourceRefs": []
    }
  ],
  "optionSets": [
    {
      "id": "reading_level",
      "label": "Reading level",
      "enabled": true,
      "controlType": "segmented",
      "options": []
    }
  ],
  "bestPracticePacks": [
    {
      "id": "fundraising_appeals",
      "label": "Fundraising / donor appeals",
      "enabled": true,
      "guidanceBlockIds": []
    }
  ],
  "defaultSelections": {
    "guidanceTask": "write_new",
    "lengthDetail": "standard_article",
    "readingLevel": "general_adult",
    "bestPracticePack": "none",
    "outputFormat": "preview"
  },
  "generatedAt": "ISO timestamp",
  "modelInfo": {
    "provider": "string",
    "model": "string"
  }
}
```

This structure is a starting point, not a hard contract. Adjust it to match Phase 04 implementation, but keep this principle:

> Store enough structured information to assemble multiple useful outputs without going back to the AI provider every time the user toggles an option.

Avoid field names such as `useCases`, `taskModes`, or `styleControls` for the core control model because those names now conflict with the specific workbench terminology.

## Output assembly rules

### Client-side vs server-side

Use client-side assembly for simple include/exclude, ordering, and text-template changes when all needed source data is already present.

Use server-side assembly if:

- access control must be rechecked,
- a downloadable file must be generated,
- saved output variants are persisted,
- the operation requires another AI call,
- the structured object is too large or sensitive to send fully to the browser.

### Avoid unnecessary AI calls

In this round of development, all option changes should update the assembled text immediately without going back to the AI API.

Toggling Guidance Blocks, changing `guidanceTask`, changing `lengthDetail`, changing `readingLevel`, changing `bestPracticePack`, and copying/downloading should not trigger a new AI call.

A new AI call may be allowed in a future phase only if:

- the user explicitly clicks a regenerate/refine action,
- the action is clearly labeled,
- usage/cost logging goes through the shared platform AI wrapper,
- usage limits and spend caps are enforced,
- the result is stored as a new variant or revision.

Do not show a regenerate button in Phase 05 unless explicitly added to scope.

## Persistence

Persist enough state so users can return to a completed run.

Minimum:

- run id,
- selected `guidanceTask`,
- selected `lengthDetail`,
- selected `readingLevel`,
- selected `bestPracticePack`,
- included/excluded Guidance Blocks,
- selected `outputFormat`,
- generated/cached assembled output if useful,
- feedback/rating if submitted.

Do not store unnecessary transient UI state.

If the user copies/downloads output, record metadata event if analytics/event tracking exists, but do not overbuild analytics in this phase.

## Feedback

Add optional feedback if practical.

Recommended MVP feedback:

- 1–5 rating,
- optional text comment,
- optional category:
  - sounds right,
  - sounds wrong,
  - too generic,
  - too long,
  - missing important context,
  - other.

Feedback should be connected to:

- user,
- organization,
- run,
- output format,
- selected options,
- timestamp.

Do not require feedback to use the result.

## Permissions and access

A user may only view runs belonging to an organization they can access.

Do not expose run artifacts from another organization.

Use shared platform auth/org/membership checks.

Do not implement one-off Sounds Like Us permission logic if shared platform permission helpers exist.

## Admin visibility

If Phase 06 has not happened yet, do not build a full admin screen.

However, the Phase 05 implementation should store data in a way that Phase 06 admin can later inspect:

- run metadata,
- selected output options,
- feedback,
- output variant metadata,
- relevant errors.

## Download behavior

### Plain text

Generate a `.txt` file containing the assembled output.

### Markdown

Generate a `.md` file containing the assembled output with headings.

### PDF

Defer. Ensure the deferred-work log includes PDF export.

## Copy behavior

Provide a clear copy action.

After copy:

- show success message,
- do not navigate away,
- optionally log a metadata event if the event system exists.

Do not require clipboard access for the page to be usable. If copy fails, let the user select text manually.

## UX details

### Preview

The preview should update quickly and predictably when controls change.

The preview should have:

- readable line length,
- headings,
- enough whitespace,
- clear empty states,
- visible copy/download actions.

### Controls

Controls should be grouped and labeled clearly.

Avoid a wall of 50 checkboxes in the first implementation. Start with meaningful groups and defaults.

### Defaults

The first view should show a useful default output without requiring configuration.

Recommended defaults:

```js
const DEFAULT_WORKBENCH_SELECTIONS = {
  guidanceTask: "write_new",
  lengthDetail: "standard_article",
  readingLevel: "general_adult",
  bestPracticePack: "none",
  outputFormat: "preview"
};
```

Defaults can be revised after user testing.

## Suggested file locations

Adjust to actual repo structure from earlier phases, but the implementation should likely touch files similar to:

```text
tools/sounds-like-us/
  routes/
    workbench.routes.js
  services/
    guidance-assembly.service.js
    feedback.service.js
  views/
    workbench.twig
  assets/
    js/
      guidance-workbench.jsx
    scss/
      sounds-like-us.scss

packages/
  ai/
  jobs/
  storage/
  db/
  design-system/
```

Do not force this structure if Phase 00–04 produced a better convention. Follow the existing convention and document any deviation.

## Suggested service boundaries

### `guidance-assembly` service

Responsible for:

- taking structured guidance object,
- selected `guidanceTask`,
- selected `lengthDetail`,
- selected `readingLevel`,
- selected `bestPracticePack`,
- included/excluded Guidance Blocks,
- selected output format,
- producing assembled text/Markdown.

It should not call AI by default.

### `feedback` service

Responsible for:

- validating feedback input,
- saving rating/comment/category,
- associating feedback with user/org/run/options.

### `output/export` helper

Responsible for:

- plain text response,
- Markdown response,
- future PDF export.

## Data model expectations

Use existing shared and tool-specific data model conventions.

If new tool-specific tables are needed, likely candidates include:

- `sounds_like_us_output_variants`
- `sounds_like_us_feedback`
- `sounds_like_us_run_options`

Do not add tables unless needed.

If output options can safely be stored as JSON metadata attached to the run, that may be sufficient for MVP.

Document the choice in `docs/project-charter/data-model.md` or `docs/active-planning/implementation-notes.md` if it affects later phases.

## Out of scope

Do not implement the following unless explicitly pulled into this phase:

- Model Eval features.
- Full manager/power-user configuration UI.
- Full paid prompt-piece editing.
- Multi-profile paid organization management.
- Direct in-app rewriting of pasted user text.
- Direct in-app critique of pasted user text.
- Side-by-side original/rewrite comparison.
- Full analytics dashboard.
- Embeddable widgets.
- Final visual brand design.
- PDF export.
- Complex custom guidance library UX.
- Team collaboration/comments on guidance.

## Acceptance criteria

### User-facing

- A user can open a completed Sounds Like Us run.
- The workbench shows a useful default assembled guidance output.
- The workbench is implemented as a React island mounted inside a Twig page shell.
- The user can change `guidanceTask`.
- The correct adaptive length/detail control appears for the selected `guidanceTask`.
- The user can change `lengthDetail`.
- The user can change `readingLevel`.
- The user can select one `bestPracticePack`.
- The user can include/exclude available Guidance Blocks if block toggles are included in the UI.
- The preview updates predictably and immediately.
- The user can copy output.
- The user can download plain text output.
- The user can download Markdown output.
- The user can submit optional feedback if feedback is included.
- The page works on desktop and mobile widths.

### Technical

- Workbench uses shared auth/org access checks.
- Workbench does not duplicate shared platform services.
- Workbench is rendered from configuration/seed data rather than hardcoded frontend-only conditionals.
- Output assembly avoids unnecessary AI calls.
- Option changes do not call the AI API.
- Any future AI call must use the shared AI provider wrapper and cost logging.
- Output options are persisted or recoverable.
- Feedback is associated with the correct user/org/run.
- Errors and missing data states are handled.
- Implementation follows existing Phase 00–04 file conventions.
- No Model Eval functionality is added.

### Documentation

- Update `docs/tools/sounds-like-us.md` with any final workbench behavior.
- Update `docs/active-planning/implementation-notes.md` with relevant implementation discoveries.
- Update `docs/active-planning/deferred-work.md` for any deferred export, editing, regeneration, manager configuration, or paid features.
- Update `docs/reference/usage.md` only if new commands/scripts exist.
- Add decision-log entries only for durable decisions, not minor implementation notes.

## Manual QA checklist

- [ ] Open workbench for a completed run.
- [ ] Confirm unauthorized users cannot access another org's run.
- [ ] Confirm run-not-found state works.
- [ ] Confirm still-processing state works.
- [ ] Confirm failed-run state works.
- [ ] Confirm malformed/missing guidance state works.
- [ ] Confirm default output is useful without changes.
- [ ] Change `guidanceTask` and confirm dependent controls update.
- [ ] Confirm only one length/detail control appears at a time.
- [ ] Change `lengthDetail` and confirm preview updates.
- [ ] Change `readingLevel` and confirm preview updates.
- [ ] Change `bestPracticePack` and confirm preview updates.
- [ ] Toggle Guidance Blocks if block toggles are included.
- [ ] Copy output successfully.
- [ ] Test copy failure fallback if feasible.
- [ ] Download plain text.
- [ ] Download Markdown.
- [ ] Submit feedback if included.
- [ ] Refresh page and confirm saved/recoverable state.
- [ ] Test responsive layout.
- [ ] Confirm no Model Eval functionality was added.
- [ ] Confirm no unnecessary AI calls happen during option changes.
- [ ] Confirm any actual AI calls are logged with cost/token metadata.

## Risks / watch-outs

### Risk: turning the workbench into a full rewrite app

The workbench should assemble reusable guidance first.

Direct rewrite/critique can come later.

### Risk: too many controls

Start with a useful default and a small number of meaningful controls.

Avoid building a confusing cockpit.

### Risk: opaque output blob

If the Phase 04 output is one big text blob, the workbench will be fragile.

Prefer structured guidance data.

### Risk: hidden AI cost

Simple UI changes should not trigger AI calls.

Any AI-backed regeneration must be explicit and logged.

### Risk: tool-specific platform duplication

Do not create Sounds Like Us-specific auth, job, AI call, storage, or admin mechanisms.

### Risk: final visual design creep

Use the shared neutral design foundation. Do not solve full branding in this phase.

### Risk: hardcoding manager-configurable concepts

Phase 05 does not need the manager configuration UI, but the workbench should be config-driven enough to avoid a wholesale rewrite later.

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

### Retrospective questions

1. What was completed exactly?
2. What changed from the original plan?
3. Did the internal guidance object support the workbench well?
4. Which controls were useful and which should be removed or deferred?
5. Did any option require AI calls unexpectedly?
6. What should move to paid-user editing or later manager-configuration phases?
7. What should Phase 06 admin be able to inspect?
8. What should be deferred to Phase 08 widgets or Phase 09 launch hardening?
9. Are we allowed to start the next phase?

### Valid outcomes

- Proceed to next phase.
- Stay in this phase and finish missing work.
- Split remaining work into a new phase.
- Move specific blocked work to a named later phase.
- Revise the roadmap because product understanding changed.

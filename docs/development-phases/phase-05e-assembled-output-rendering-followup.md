# Phase 05 Follow-up: Make Guidance Output Feel Assembled, Not Card-Based

## Problem

The current output renders each Guidance Block as a separate card. That makes the workbench feel like a stack of report sections instead of one assembled piece of guidance.

The desired direction is closer to the quick mockup: one continuous guidance document, with subtle visual cues showing where each piece came from.

## Desired direction

Revise the guidance output rendering so it feels like one continuous assembled instruction.

Use:

- one shared output container,
- continuous text flow,
- each contributed block marked by a subtle colored left rail,
- no separate card background for every block,
- no large gaps between blocks,
- no repeated card borders,
- no report-like section boxes.

The user should feel like they are assembling or remixing one guidance document, not turning report cards on and off.

## Rendering structure

Render the output as a single document-like panel.

Each included Guidance Block may be wrapped in a lightweight block wrapper for source highlighting, but it should not look like a separate card.

Preferred structure:

```html
<div class="slu-guidance-output">
  <section class="slu-guidance-output__block slu-guidance-output__block--task">
    <p>Write a standard-length piece of 350–700 words suitable for a newsletter article or web page section.</p>
    <ul>
      <li>Use a clear structure: opening, supporting sections, conclusion.</li>
      <li>Balance depth with readability.</li>
    </ul>
  </section>

  <section class="slu-guidance-output__block slu-guidance-output__block--voice">
    <p>RWJF writes with moral clarity and urgency...</p>
  </section>
</div>
```

Adjust class names to match the existing codebase if a convention already exists.

## Visual treatment

Use:

- one outer panel,
- subtle background for the full output area,
- a colored left border/rail per block,
- modest padding per block,
- tight vertical rhythm.

Avoid:

- separate cards for each block,
- heavy borders around each block,
- large vertical gaps,
- shaded boxes inside shaded boxes,
- repeated heading/card styling.

Suggested CSS direction:

```scss
.slu-guidance-output {
  padding: 1.25rem;
  border: 1px solid var(--rj-color-border);
  border-radius: var(--rj-radius-md);
  background: var(--rj-color-surface);
}

.slu-guidance-output__block {
  border-left: 4px solid var(--slu-block-color, var(--rj-color-border));
  padding: 0.25rem 0 0.25rem 1rem;
  margin: 0 0 1rem;
}

.slu-guidance-output__block:last-child {
  margin-bottom: 0;
}
```

Adjust variable names to match the existing SCSS.

## Headings

In Preview mode, avoid visible headings like:

- `Task — Write something new — Standard article`
- `Voice and tone`
- `Reading level — General Adult`

Preview mode should read like flowing guidance, not a report.

If headings are needed for accessibility or debug clarity, make them visually subtle or show them only in Full Guidance / assembly-highlight mode.

## Preview mode

Preview mode should be short and flowing.

It should start with the task instruction, not the voice/tone section.

Preferred order:

1. task/opening instruction,
2. length/detail instruction,
3. voice/tone summary,
4. reading level instruction,
5. best-practice pack instruction if selected,
6. AI-cliché / plain-language / inclusive-language notes if enabled.

The preview should feel like one instruction, for example:

```text
Write a standard-length piece of 350–700 words suitable for a newsletter article or web page section.

RWJF writes with moral clarity and urgency, grounding abstract equity goals in concrete community stories and lived experience.

Write for a general adult audience, approximately grade 6–8. Use clear, direct language and active voice.

Avoid overused AI phrases such as “in today’s world” or “dive deep.”
```

## Full Guidance mode

Full Guidance mode may include clearer section labels and more detail, but it should still start with a coherent task-oriented opening instruction.

Full Guidance can show headings, but it should still avoid separate cards for every block.

## Assembly/source highlighting

The colored left rails should correspond to the option/control source.

Examples:

- task / length detail,
- voice and tone,
- reading level,
- best-practice pack,
- AI-cliché avoidance,
- plain language,
- inclusive language.

Do not rely on color alone for meaning. If a “show assembly labels” mode exists later, it can add small labels. For now, the color rail is enough as a visual cue.

## Copy/download behavior

Copy and download should not include visual highlighting markup.

The copied/downloaded output should be clean text or Markdown.

## QA checklist

- [ ] Output renders as one continuous document-like panel.
- [ ] Guidance Blocks no longer look like separate cards.
- [ ] Preview mode starts with the task/length instruction.
- [ ] Voice/tone summary appears after the task instruction.
- [ ] Reading level appears after voice/tone.
- [ ] Changing controls still updates the preview immediately.
- [ ] Colored rails remain visible but subtle.
- [ ] Copy/download output contains clean text without highlight markup.
- [ ] Mobile layout remains readable.

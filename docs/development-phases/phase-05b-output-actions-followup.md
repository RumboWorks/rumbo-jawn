# Phase 05 Follow-up: Output Actions and Full Guidance Export

## Problem

The Sounds Like Us workbench should have two guidance view modes:

- `preview`
- `full_guidance`

Preview mode is useful for showing the user a short, responsive version of what is being assembled. However, Preview is not suitable for copy/download/share/export because it is intentionally abbreviated and may be misleading if used as the final guidance text.

## Required behavior change

All copy/download/export actions must use the **Full Guidance** text, regardless of the currently selected `guidanceViewMode`.

Do not copy, download, share, or export the Preview text.

Preview is for on-screen understanding only.

## Button labeling

Update button labels so this is clear.

Use labels like:

- **Copy full guidance**
- **Download .txt**
- **Download .md**

Avoid labels like:

- Copy preview
- Copy current view
- Export preview

If there is helper text near the buttons, use something like:

> Copy and download always use the full guidance, not the abbreviated preview.

## Internal behavior

Keep `guidanceViewMode` for display only.

Do not use `guidanceViewMode` to decide what text is copied or downloaded.

Instead, output actions should explicitly use the full assembled guidance.

Recommended logic:

```js
const previewText = assembleGuidancePreview(selections, guidanceData);
const fullGuidanceText = assembleFullGuidance(selections, guidanceData);

// display
const visibleText =
  guidanceViewMode === "preview" ? previewText : fullGuidanceText;

// output actions
copyFullGuidance(fullGuidanceText);
downloadText(fullGuidanceText);
downloadMarkdown(fullGuidanceText);
```

Adjust function names to match the existing codebase.

## Move output actions to fixed/floating right-side region

Move the output action component into a fixed or sticky region on the right side of the page so the actions are always available while the user scrolls the guidance.

The action area should include, at minimum:

- Preview / Full Guidance segmented view switch
- Copy full guidance
- Download .txt
- Download .md

The view switch controls what is shown in the guidance preview area.

The copy/download buttons always use Full Guidance.

## Layout guidance

On desktop/wide layouts:

- Keep the main workbench controls on the left.
- Keep the guidance preview/full-guidance text in the center/main content area.
- Place the output action component in a right-side sticky/floating region.
- The action component should remain visible as the user scrolls.

On smaller screens:

- Do not create a cramped three-column layout.
- The action component may stack above the guidance text or become sticky near the top/bottom if that works better.
- Preserve usability over strict visual matching.

## Styling expectations

Use existing shared SCSS/design-system conventions.

Do not introduce Bootstrap, Tailwind, or a new UI framework.

The floating/sticky action component should feel integrated with the current workbench design.

Suggested visual treatment:

- small card/panel,
- subtle border,
- readable spacing,
- clear button hierarchy,
- no heavy visual effects.

## Accessibility

- The Preview / Full Guidance switch must be keyboard accessible.
- Buttons must have clear accessible names.
- Sticky/floating behavior must not cover content.
- On mobile, controls must remain reachable without blocking the guidance text.

## QA checklist

- [ ] Preview mode displays abbreviated guidance.
- [ ] Full Guidance mode displays the complete guidance.
- [ ] Copy button copies Full Guidance while Preview mode is active.
- [ ] Copy button copies Full Guidance while Full Guidance mode is active.
- [ ] `.txt` download uses Full Guidance while Preview mode is active.
- [ ] `.txt` download uses Full Guidance while Full Guidance mode is active.
- [ ] `.md` download uses Full Guidance while Preview mode is active.
- [ ] `.md` download uses Full Guidance while Full Guidance mode is active.
- [ ] Output action panel remains available while scrolling on desktop.
- [ ] Mobile/small-screen layout remains usable.
- [ ] No visual highlight markup appears in copied/downloaded text.
- [ ] No AI API calls are triggered by switching view mode or using output actions.

## Out of scope

Do not add new output options yet beyond moving the action component and changing copy/download behavior.

Additional output controls will be specified separately.

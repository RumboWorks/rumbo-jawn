# Phase 05 Follow-up: Use AI-Generated Preview Summary from Initial Analysis

## Goal

Preview mode should use a short, polished voice/tone summary generated during the initial Sounds Like Us analysis call.

Do not generate or polish Preview mode with a separate AI call from the workbench.

## Required change

Update the initial analysis prompt/output contract so the AI returns both:

- `voiceTone.previewSummary`
- `voiceTone.fullGuidance`

The workbench should use:

- `voiceTone.previewSummary` in Preview mode
- `voiceTone.fullGuidance` in Full Guidance mode and copy/download output

## Prompt requirement

The analysis prompt should explicitly ask for:

### `voiceTone.previewSummary`

A concise 1–3 sentence summary of the organization’s voice and tone, written for Preview mode.

It should:

- be polished and readable,
- avoid bullets,
- avoid headings,
- avoid simply truncating the full guidance,
- use the organization’s name or short name when natural,
- be suitable for embedding inside a short assembled preview.

### `voiceTone.fullGuidance`

A longer, more detailed voice/tone guidance block for Full Guidance mode and copy/download output.

It may include more specificity, examples, patterns, and detail.

## No extra AI calls

Do not call the AI API from the workbench just to create or improve Preview mode.

Do not call the AI API when the user switches between Preview and Full Guidance.

Do not call the AI API when the user changes workbench options.

Preview and Full Guidance should be assembled deterministically from the stored analysis artifact and default guidance package.

## Clean-build rule

This project does not need backward compatibility for older development artifacts.

If an existing run artifact does not include `voiceTone.previewSummary` and `voiceTone.fullGuidance`, treat it as invalid/incomplete and regenerate the analysis.

Do not add fallback chains for abandoned intermediate response shapes.

## QA checklist

- [ ] Initial analysis output includes `voiceTone.previewSummary`.
- [ ] Initial analysis output includes `voiceTone.fullGuidance`.
- [ ] Preview mode uses `voiceTone.previewSummary`.
- [ ] Full Guidance mode uses `voiceTone.fullGuidance`.
- [ ] Preview mode does not call the AI API.
- [ ] Switching Preview / Full Guidance does not call the AI API.
- [ ] Changing workbench options does not call the AI API.
- [ ] Old artifacts without the required fields are treated as invalid/incomplete, not patched with compatibility fallbacks.

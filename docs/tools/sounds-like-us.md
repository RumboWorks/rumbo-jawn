# Sounds Like Us

## Status

First MVP tool.

## Purpose

Sounds Like Us helps organizations generate reusable writing guidance from public source material so their teams can write, critique, or guide AI tools in a way that better matches the organization's voice.

## MVP source inputs

Initial MVP should focus on public URLs.

PDF upload may be a paid or later feature.

Auto-discovery should start lightweight and modular because similar focused crawl routines may be reused by other tools.

## MVP output direction

The core output is reusable guidance, not merely a one-off prompt.

The tool may generate:

- organization summary,
- voice/tone profile,
- vocabulary and phrase guidance,
- what to avoid,
- reusable writing guidance,
- optional rewrite/critique instructions,
- downloadable outputs.

The app should prefer the term "guidance" over "prompt" where possible.

## MVP user flow direction

Initial flow:

1. user enters public URL and selects lightweight options,
2. user registers/signs in before API-cost work begins,
3. platform runs crawl/analyze job,
4. user sees progress,
5. user receives guidance output,
6. user can adjust output options in a dynamic guidance workbench.

## Guidance workbench

The guidance workbench is likely the first highly dynamic screen.

It may use React inside a Twig page shell if vanilla JavaScript becomes awkward.

The workbench should allow users to change output options and produce variants without unnecessary repeat AI calls when internal structured output already contains enough information.

The preview should read as one assembled guidance document. Source controls may be shown through source-colored left borders, but the output should not be split into separate standalone cards for each Guidance Block.

The workbench supports a short Preview view and a Full Guidance view. Copy and download actions always use Full Guidance, regardless of the currently visible view.

Preview omits detailed "Words and phrases to use" and "What to avoid" blocks; Full Guidance includes them when selected.

For voice and tone, the analysis artifact stores both `voiceTone.previewSummary` and `voiceTone.fullGuidance`. Preview uses the concise summary; Full Guidance, copy, and downloads use the full guidance.

## Privacy posture

Users should not submit URLs containing confidential, donor, member, client, or otherwise sensitive information.

The app should disclose that content from submitted public URLs may be sent to AI providers.

## Out of scope for initial tool phases unless explicitly added

- Model Eval features,
- custom multi-profile paid org management beyond planned MVP scope,
- fully polished visual branding,
- complex embeddable widgets unless Phase 08 or a revised phase adds them,
- broad crawler platform beyond what Sounds Like Us needs first.

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

The preview should read as one assembled guidance document, starting with the task instruction and flowing into voice/tone, reading level, pack, and enabled generic notes. Source controls may be shown through source-colored left rails, but the output should not be split into separate standalone cards for each Guidance Block.

The workbench supports a short Preview view and a Full Guidance view. Copy and download actions always use Full Guidance, regardless of the currently visible view.

Preview includes concise versions of selected guidance blocks, including "Words and phrases to use" and "What to avoid"; Full Guidance expands those sections when selected.

For voice and tone, the analysis artifact stores both `voiceTone.previewSummary` and `voiceTone.fullGuidance`. Preview uses the concise summary; Full Guidance, copy, and downloads use the full guidance. The normalized organization object also stores `organization.shortName`, supplied by the initial AI analysis, so guidance templates can refer naturally to the organization without string-derived abbreviations.

Guidance output must not include assembly/source headings such as "Task," "Voice and tone," "Reading level," "Best-practice pack," or "AI-cliche avoidance." Those labels may appear as workbench UI source indicators, but Preview, Full Guidance, copied text, `.txt` downloads, and `.md` downloads should read as coherent instructions beginning with a task-oriented sentence.

### Guidance and prompt configuration

Reusable guidance product copy lives in JSON under `tools/sounds-like-us/src/config/guidance/`.

- `default-guidance-package.json` contains task-opening templates, reading-level guidance, task/length guidance, and generic reusable guidance blocks. Output-facing blocks use explicit `previewText` and `fullText` fields.
- `best-practice-packs.json` contains the default best-practice pack options and their `previewText` / `fullText` guidance.

AI prompt copy lives in JSON under `tools/sounds-like-us/src/config/prompts/`.

- `analysis-prompts.json` contains the system prompt and user prompt template for the website analysis call.

The loader in `tools/sounds-like-us/src/config/config-loader.js` validates the required JSON shape on first use. Missing required strings, missing arrays, malformed JSON, duplicate IDs, unsupported guidance tokens, or missing required prompt tokens should fail clearly instead of falling back to hidden service-code copy.

Template strings use `{{tokenName}}` replacement. Guidance templates currently support `{{organizationName}}`, `{{organizationShortName}}`, `{{detectedOrganizationType}}`, `{{voiceTonePreviewSummary}}`, and `{{voiceToneFullGuidance}}`. The analysis prompt template currently requires `{{url}}`, `{{pageCount}}`, and `{{pagesSummary}}`.

## Privacy posture

Users should not submit URLs containing confidential, donor, member, client, or otherwise sensitive information.

The app should disclose that content from submitted public URLs may be sent to AI providers.

## Out of scope for initial tool phases unless explicitly added

- Eval features (Eval is its own tool; see `eval.md`),
- custom multi-profile paid org management beyond planned MVP scope,
- fully polished visual branding,
- complex embeddable widgets unless Phase 08 or a revised phase adds them,
- broad crawler platform beyond what Sounds Like Us needs first.

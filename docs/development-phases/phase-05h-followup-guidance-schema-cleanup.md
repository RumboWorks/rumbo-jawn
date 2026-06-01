# Phase Follow-up: Guidance JSON Schema Cleanup

## Goal

Clean up the Sounds Like Us guidance/config schema before polishing the default text.

The current JSON config move is the right direction, but the schema still preserves some earlier implementation problems:

- legacy compatibility content is still present,
- default blocks mostly use one `content` field instead of separate Preview and Full Guidance text,
- the AI analysis output does not yet request an organization short name,
- some default text still uses generic org wording instead of tokens,
- validation needs to enforce the new config shape.

This task is schema cleanup only. Do not spend time polishing the final wording yet.

## Files likely involved

Adjust paths if the current repo structure differs.

```text
tools/sounds-like-us/src/config/guidance/default-guidance-package.json
tools/sounds-like-us/src/config/guidance/best-practice-packs.json
tools/sounds-like-us/src/config/prompts/analysis-prompts.json
tools/sounds-like-us/src/analysis-service.js
tools/sounds-like-us/src/*guidance*assembly*.js
tools/sounds-like-us/src/*config*loader*.js
tools/sounds-like-us/src/*token*.js
```

## Required cleanup

### 1. Remove legacy transform support

Remove legacy transform content from the guidance package.

Delete any config section like:

```text
legacyTransform
```

Also remove legacy compatibility logic from code if it is still present.

This project is still in active MVP development. There is no backward compatibility requirement for abandoned intermediate artifact formats.

If older analysis artifacts do not match the current schema, they may be treated as invalid/incomplete and regenerated.

Do not add fallback chains for old response shapes.

### 2. Add organization short name to the analysis output contract

Update `analysis-prompts.json` so the AI is explicitly asked to return an organization short name.

Add a field like:

```json
"org_short_name": "natural short name for repeated use, or the same as org_name if no natural short name exists"
```

The short name must come from the initial analysis AI response.

The workbench should not try to invent `organizationShortName` with string manipulation.

Examples:

```text
org_name: Bill & Melinda Gates Foundation
org_short_name: Gates Foundation
```

```text
org_name: Robert Wood Johnson Foundation
org_short_name: RWJF
```

If there is no obvious short name, the AI should return the full organization name as `org_short_name`.

### 3. Normalize the stored artifact to include short name

Update the normalized guidance artifact so it stores:

```json
{
  "organization": {
    "name": "Bill & Melinda Gates Foundation",
    "shortName": "Gates Foundation",
    "detectedType": "foundation",
    "summary": "..."
  }
}
```

Keep `detectedType` as the normalized version of `org_type`.

Ensure token context can read:

```text
{{organizationName}}
{{organizationShortName}}
{{detectedOrganizationType}}
```

from this normalized artifact.

### 4. Split guidance block text into Preview and Full Guidance text

Default guidance blocks should not use one generic `content` field when the block may appear in both Preview and Full Guidance.

Replace block text fields with:

```json
"previewText": "Short prose version for Preview mode.",
"fullText": "Longer detailed version for Full Guidance mode and copy/download."
```

Preview text should be:

- prose, not bullets,
- short,
- suitable for 2–4 paragraph Preview mode,
- not a truncated copy of Full Guidance,
- designed to flow with the other preview pieces.

Full text may include:

- more detail,
- bullets,
- structure,
- examples,
- longer explanation.

Apply this to:

- reading level blocks,
- task/length/detail blocks,
- generic blocks,
- best-practice packs,
- any default Guidance Block that can appear in output.

### 5. Update generated scan-derived block handling

The scan-generated voice/tone block should use:

```text
voiceTone.previewSummary
voiceTone.fullGuidance
```

Map these into the same conceptual model:

```json
{
  "id": "voice-tone",
  "label": "Voice and tone",
  "source": "voice",
  "previewText": "{{voiceTonePreviewSummary}}",
  "fullText": "{{voiceToneFullGuidance}}"
}
```

If the implementation stores scan-generated blocks differently from config defaults, that is acceptable, but the assembly service should still treat them as providing Preview-mode text and Full Guidance-mode text.

### 6. Tokenize organization references

Remove generic wording from guidance config where an organization token should be used.

Avoid:

```text
this organization
the organization
the organization's vocabulary
About [Org]
```

Prefer tokens:

```text
{{organizationName}}
{{organizationShortName}}
{{organizationShortName}}'s voice
{{organizationShortName}}'s vocabulary
About {{organizationName}}
```

Use `{{organizationName}}` when the full formal name is better.

Use `{{organizationShortName}}` when the sentence would otherwise feel repetitive or clunky.

### 7. Validate the new schema

Add or update validation so the app fails clearly if the guidance package is malformed.

Validation should check at least:

- package `version` exists,
- required top-level sections exist,
- every selectable block has an `id`,
- every selectable block has a `label`,
- every block used in Preview mode has `previewText`,
- every block used in Full Guidance / copy/download has `fullText`,
- every Best-Practice Pack except `none` has `previewText` and `fullText`,
- option IDs referenced by defaults exist,
- duplicate IDs are rejected,
- unsupported or unknown required tokens are surfaced visibly.

Do not silently substitute hardcoded fallback copy.

If required config is missing, throw a clear developer/admin-facing error.

### 8. Update assembly behavior to use explicit text fields

Update the assembly logic so:

- Preview mode assembles `previewText`.
- Full Guidance mode assembles `fullText`.
- Copy/download uses Full Guidance text, not Preview text.
- No deterministic code tries to convert bullets into prose.
- No AI API call is made when assembling Preview or Full Guidance.

Do not use old `content` fields unless you are in the middle of the migration and the same commit fully removes them before completion.

### 9. Keep prompt/config text separate from UI i18n

Do not implement a full i18n/message-catalog system in this task.

This task is only about moving and validating:

- guidance product content,
- AI prompt content,
- tokenized guidance templates.

Do not move all UI labels/buttons/errors into JSON as part of this task.

## Expected final shape examples

### Reading-level block

```json
{
  "id": "reading-level-general-adult",
  "label": "General Adult",
  "source": "reading",
  "heading": "Reading level — General Adult (grade 6–8)",
  "previewText": "Write for a general adult audience, around grades 6–8, using clear, direct language and active voice.",
  "fullText": "Write for a general adult audience (approximately grade 6–8).\n- Use clear, direct language appropriate for most adult readers.\n- Prefer active voice and specific language over abstract generalities.\n- Treat grade level as a target for clarity, not a rigid constraint."
}
```

### Rewrite task block

```json
{
  "source": "task",
  "heading": "Rewrite existing text — About the same length",
  "previewText": "You are rewriting existing text for {{organizationName}}. Revise it so it sounds more like {{organizationShortName}} while preserving roughly the same length and original meaning.",
  "fullText": "You are rewriting existing text for {{organizationName}}.\n\nRevise the provided text so it sounds more like {{organizationShortName}}'s public communications while preserving roughly the same length and original meaning. Focus on word choice, sentence rhythm, framing, and overall tone."
}
```

### Best-Practice Pack

```json
{
  "id": "press_releases",
  "label": "Press releases",
  "source": "pack",
  "heading": "Press release guidance",
  "previewText": "Because this is press-release guidance, lead with the news, make the public value clear quickly, and keep quotes human rather than corporate.",
  "fullText": "Press release guidance:\n- Dateline and lead: answer who, what, when, where, and why in the first paragraph.\n- A journalist should be able to stop after the lead.\n- Include one strong quote from leadership and, when appropriate, one from a community member or partner.\n- Boilerplate: use a standardized About {{organizationName}} paragraph at the bottom."
}
```

## Documentation updates

Update relevant docs to explain:

- default guidance content lives in JSON config,
- AI prompt text lives in JSON config,
- Preview and Full Guidance use separate text fields,
- scan-generated voice/tone uses `voiceTone.previewSummary` and `voiceTone.fullGuidance`,
- old artifacts from earlier MVP development may be discarded/regenerated,
- no hardcoded fallback copy should be added for missing guidance config.

## QA checklist

- [ ] `legacyTransform` is removed from config.
- [ ] Legacy compatibility code is removed or no longer used.
- [ ] `analysis-prompts.json` requests `org_short_name`.
- [ ] Normalized artifacts include `organization.shortName`.
- [ ] Token context includes `organizationShortName`.
- [ ] Reading level blocks use `previewText` and `fullText`.
- [ ] Task/length/detail blocks use `previewText` and `fullText`.
- [ ] Generic blocks use `previewText` and `fullText`.
- [ ] Best-Practice Packs use `previewText` and `fullText`.
- [ ] Preview mode uses `previewText`.
- [ ] Full Guidance mode uses `fullText`.
- [ ] Copy/download uses Full Guidance text.
- [ ] No code attempts to turn bullets into prose.
- [ ] No workbench option change calls the AI API.
- [ ] Missing required guidance config fails clearly.
- [ ] Generic “this organization” wording is removed from default guidance text where an org token is available.
- [ ] `About [Org]` style placeholders are replaced with `{{organizationName}}` or another supported token.
- [ ] Existing development artifacts that do not match the current schema are treated as invalid/incomplete rather than patched with compatibility fallbacks.

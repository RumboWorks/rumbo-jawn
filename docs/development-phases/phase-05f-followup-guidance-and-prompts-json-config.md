# Phase Follow-up: Move Guidance Text and AI Prompt Text into JSON Configuration

## Goal

Stop hardcoding product text in service code where it is likely to drift and be forgotten.

For now, do not implement a general i18n/message-catalog system.

Instead, move these two categories of text into structured JSON files:

1. Default guidance text used by the Sounds Like Us workbench.
2. Prompt text/templates sent to AI APIs.

Do not move every UI label, button, or error string into JSON in this task. Keep scope limited.

## What should move into JSON

### 1. Guidance content

Move default reusable guidance content into JSON, including:

- Guidance Blocks
- default Best-Practice Packs
- default template text used to assemble Preview or Full Guidance output
- tokenized block text such as `{{organizationName}}`, `{{organizationShortName}}`, `{{voiceTonePreviewSummary}}`, and `{{voiceToneFullGuidance}}`

This content is product/config content, not service logic.

### 2. AI prompt content

Move prompt text used for AI analysis/generation into JSON, including:

- system prompts
- instruction prompts
- structured-output instructions
- field descriptions
- request templates
- prompt fragments used to assemble the final AI call

The goal is to make prompt wording editable without changing service logic.

## What should stay in code

Keep these in code:

- logic
- token replacement/rendering
- schema validation
- file loading
- assembly rules
- API calling
- state handling
- error handling
- option-selection logic

Also keep ordinary UI labels/messages in code for now unless they are already easy to centralize.

Full UI i18n is out of scope.

## No hardcoded fallback copy

Do not hide missing or broken config behind hardcoded fallback text in service code.

If guidance JSON or prompt JSON is missing, invalid, or malformed:

- fail clearly
- surface a useful developer/admin-facing error
- stop the affected feature from running

Do not silently substitute backup copy buried in the code.

If the defaults are broken, the correct response is to fix the JSON package, not to rely on hidden fallbacks.

## Suggested file structure

Use a structure similar to this:

```text
tools/sounds-like-us/src/config/
  guidance/
    default-guidance-package.json
    best-practice-packs.json
  prompts/
    analysis-prompts.json
    guidance-prompts.json
```

If the current project structure suggests a better location, follow that structure consistently.

## Guidance JSON expectations

The guidance package should contain structured content, not one giant blob.

Expected categories may include:

- `guidanceBlocks`
- `bestPracticePacks`
- option labels/descriptions where needed for guidance assembly
- template text for preview/full assembly
- default selections if appropriate

Example direction:

```json
{
  "guidanceBlocks": [
    {
      "id": "voice_tone",
      "label": "Voice and tone",
      "text": "{{voiceToneFullGuidance}}"
    }
  ],
  "bestPracticePacks": [
    {
      "id": "fundraising_appeals",
      "label": "Fundraising / donor appeals",
      "text": "Emphasize a clear need, donor agency, and a specific next step."
    }
  ]
}
```

The exact final shape can vary, but it must be deliberate, validated, and documented.

## Prompt JSON expectations

Prompt JSON should store prompt templates in a structured way.

Expected categories may include:

- analysis system prompt
- analysis instruction prompt
- output-schema instructions
- specific guidance-generation prompt fragments if applicable

Example direction:

```json
{
  "analysis": {
    "system": "You analyze public organization content and produce structured writing-guidance output.",
    "instructions": [
      "Read the provided public content.",
      "Identify organization name, short name, and organization type.",
      "Return structured JSON only."
    ]
  }
}
```

The exact final structure can vary, but it must be deliberate, validated, and documented.

## Loading and validation

Add loaders/validators for these JSON files.

Requirements:

- load JSON from known config paths
- validate required structure at startup or first use
- surface clear errors when invalid
- avoid silent failure
- keep logic separate from content

If a schema helper is useful, add one.

## Token support

Guidance JSON should support the existing token system.

Examples:

- `{{organizationName}}`
- `{{organizationShortName}}`
- `{{guidanceTaskLabel}}`
- `{{readingLevelLabel}}`
- `{{voiceTonePreviewSummary}}`
- `{{voiceToneFullGuidance}}`

Prompt JSON may also support tokens if needed, but only where useful and deliberate.

## No backward compatibility work

This project is still in active MVP development.

Do not add compatibility layers for older prompt/config shapes if the new structure replaces them.

If an old structure is no longer used, remove it and cleanly update the code.

## Documentation

Document:

- where guidance JSON lives
- where prompt JSON lives
- what each file is responsible for
- how tokens are supported in guidance text
- what validation rules exist

## QA checklist

- [ ] Guidance text is no longer scattered across service code.
- [ ] AI prompt text is no longer scattered across service code.
- [ ] The app loads default guidance content from JSON.
- [ ] The app loads AI prompt content from JSON.
- [ ] Missing/invalid JSON produces a clear error.
- [ ] No hidden hardcoded fallback copy is used for guidance content.
- [ ] No hidden hardcoded fallback copy is used for AI prompt content.
- [ ] Guidance token replacement still works.
- [ ] AI prompt assembly still works.
- [ ] The workbench behavior is unchanged except for content source cleanup.

## Scope reminder

Do not implement full i18n in this task.

This task is specifically about moving:

- guidance product content
- AI prompt content

out of code and into structured configuration files.

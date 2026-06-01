### Voice/tone preview summary

The workbench needs both a short voice/tone preview and a longer full voice/tone guidance block.

Do not simply truncate the full to get the preview.

Do not make a separate AI call from the workbench just to create the preview summary.

Revise the analysis output shape so the initial scan/analysis call returns both:

- `voiceTone.previewSummary`
- `voiceTone.fullGuidance`

`voiceTone.previewSummary` should be concise: usually 1–3 sentences. It is used in Preview mode so the assembled guidance feels responsive and readable.

`voiceTone.fullGuidance` should be longer and more detailed. It is used in Full Guidance mode and in copy/download output.

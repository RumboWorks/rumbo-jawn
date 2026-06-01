# Implementation Notes

Implementation notes capture useful discoveries that are not full decisions.

They are active but curated. Do not use this file for random scratch notes.

Use `docs/working-notes/` for exploratory notes. Promote durable findings here only when they affect future implementation.

## 2026-05-30 — Twig shells plus React islands

Highly dynamic screens may use React mounted inside a Twig page shell. This preserves page-source traceability while allowing dynamic UI where needed.

## 2026-05-30 — Design rails before visual branding

Phase 01 should establish SCSS compilation, tokens, and basic reusable styles without trying to finalize the full visual brand.

## 2026-06-01 — Guidance JSON parsing

Anthropic guidance responses can be JSON-like but invalid, especially when a list item is emitted as a quoted phrase followed by an unquoted parenthetical note. The Sounds Like Us analysis parser now extracts fenced or embedded JSON objects, repairs that narrow parenthetical-list-item pattern, and writes raw parse-failure artifacts under `storage/slu/guidance-errors/` for diagnosis.

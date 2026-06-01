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

## 2026-06-01 — MariaDB Prisma db push partial-apply behavior

During Phase 06a, `prisma db push` partially applied identity/access schema changes and then failed with MariaDB errno 121 ("Duplicate key on write or update") while trying to recreate an existing foreign key. The established workaround remains: inspect applied columns/tables, complete necessary data backfills or raw SQL adjustments, then run `prisma generate` and `prisma validate`. Avoid assuming a failed `db push` means no changes were applied.

During Phase 06b, the current `rumbo_dev` data was confirmed disposable and `npx prisma db push --schema packages/db/prisma/schema.prisma --force-reset --accept-data-loss` successfully reset the dev database back into Prisma sync. Use this only for disposable development data, not for meaningful customer or production data.

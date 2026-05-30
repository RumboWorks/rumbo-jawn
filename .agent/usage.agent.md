---
name: usage
description: "Use when maintaining docs/reference/usage.md; adding new commands to the usage document; reviewing the usage doc for stale entries; creating a usage man-page from scratch."
argument-hint: "no arguments | create | update | add <command-name>"
---

# Usage Agent

## Purpose

Maintain `docs/reference/usage.md`.

## Constraints

- Do not document anything that is not built yet or has been removed.
- Do not remove documented commands without confirming they no longer exist.
- Check `package.json`, scripts, source code, and docs before making claims.
- Preserve a man-page-style format if one exists.
- Every command entry should link to relevant source files or docs where practical.

## Process

1. Read `AGENTS.md`.
2. Read `docs/README.md`.
3. Read `docs/reference/usage.md`.
4. Inspect `package.json`, scripts, and relevant source.
5. Update usage docs only for verified behavior.

## Output

Summarize additions, removals, and verification steps.

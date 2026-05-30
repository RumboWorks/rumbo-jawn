---
name: testing
description: "Use when adding or reviewing tests, checks, QA plans, and phase acceptance criteria."
argument-hint: "review | update"
user-invocable: true
---

You are a specialist at Rumbo testing and QA.

## Purpose

Protect phase completion, prevent regressions, and reduce cross-tool side effects.

## Requirements

- Each phase must have acceptance criteria.
- Each phase must have a manual QA checklist.
- Shared package changes should trigger relevant cross-tool smoke checks.
- `npm run check` should remain meaningful.
- Finish-line work must be explicit, not a vague polish phase.

## Review checklist

- Are acceptance criteria testable?
- Are docs updates included in done-done?
- Are deferred items captured?
- Does a shared change require checks outside the current tool?
- Are error/empty states covered where relevant?

---
name: phase-review
description: "Use when closing or reviewing a development phase."
---

# Phase Review Agent

## Purpose

Check the assigned phase against the actual repository state and decide whether the phase is done, incomplete, split, or revised.

## Constraints

- Do not mark a phase complete unless acceptance criteria are verifiably met.
- Do not let incomplete work disappear.
- Do not skip documentation hygiene.

## Process

1. Read `AGENTS.md`, `docs/README.md`, and the phase file.
2. Review changed files and commands run.
3. Check acceptance criteria and manual QA.
4. Identify deferred work.
5. Update or recommend updates to roadmap, deferred work, decision log, and retrospectives.

## Output

Provide a phase closeout summary with outcome, completed work, incomplete work, docs updated, deferred items, and recommendation for next phase.

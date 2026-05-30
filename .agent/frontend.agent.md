---
name: frontend
description: "Use when building or reviewing Rumbo Twig, SCSS, vanilla JS, React, or embeddable widget frontend work."
argument-hint: "review | build"
user-invocable: true
---

You are a specialist at Rumbo frontend conventions.

## Rules

- Server-rendered Twig page shells by default.
- Vanilla JS for simple interactivity.
- React only for highly dynamic screens.
- Keep page source traceable.
- Use SCSS.
- No Bootstrap.
- No Tailwind-style framework.
- Use Lucide icons unless decision log changes this.
- Use `rj-` classes for shared platform/design-system styles.
- Use tool-specific prefixes for tool-specific styles.
- Avoid generic global class names.

## Embeddable widgets

Embeddable widgets are medium-priority. Do not make choices that prevent public widget rendering later. Do not use web components by default, but consider them when a widget must run outside Rumbo app pages.

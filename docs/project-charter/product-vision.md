# Product Vision

## Product family

Rumbo is a modular platform and product family for AI-assisted tools that help nonprofit and mission-driven teams analyze, evaluate, improve, and operationalize communications and related workflows.

The platform should support multiple tools over time without each tool reinventing users, organizations, authentication, billing, jobs, AI provider handling, admin visibility, storage, or design-system conventions.

## First MVP tool

The first MVP tool is Sounds Like Us.

Sounds Like Us helps an organization generate reusable writing guidance from public source material such as website pages and, later, PDFs. The guidance can help staff or AI tools write in a voice that better matches the organization.

## Planned sibling tool

Model Eval is a planned sibling tool.

It is out of scope for the initial MVP implementation, but its future needs should inform shared platform architecture. The platform should avoid one-off decisions that make sense only for Sounds Like Us and would block future tools like Model Eval.

## Audience

Primary audience:

- nonprofit organizations,
- associations,
- schools,
- foundations,
- public agencies,
- mission-driven communications teams,
- consultants helping those groups use AI responsibly.

## Product principles

- Make AI guidance practical and usable by nontechnical teams.
- Avoid treating prompts as throwaway text; treat guidance as an asset.
- Help organizations understand and control how AI tools interact with their voice, standards, and public content.
- Keep privacy, data minimization, and disclosure visible.
- Build shared platform capabilities once, then reuse them across tools.
- Dogfood high-quality AI/agent guidance because the product family publicly claims expertise in AI and agent guidance.

## MVP posture

The first MVP should validate the platform/tool pattern and launch Sounds Like Us without overbuilding the full product family.

Rumbo should start as a modular monolith, not a distributed system, but should preserve seams for later distribution.

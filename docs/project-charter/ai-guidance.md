# AI and Agent Guidance

## Principle

The project publicly claims expertise in AI and agent guidance, so the repository should dogfood high-quality guidance.

Guidance should be:

- explicit,
- version-controlled,
- scoped,
- easy for agents to follow,
- not scattered across random notes.

## Guidance hierarchy

Use:

- `AGENTS.md` for global repo guidance,
- `docs/README.md` for documentation navigation,
- phase files for execution scope,
- `.agent/*.agent.md` for specialist playbooks,
- provider-specific bridge files only as adapters.

Do not duplicate the full project doctrine in provider-specific files.

## AI provider usage

All AI provider calls should go through a shared wrapper.

Track cost/tokens.

Support configurable models per call type.

Avoid hardcoding provider assumptions in tool-specific code.

## Privacy and disclosure

Public tools should explain when user-provided public URLs or content may be sent to AI providers.

For pre-release testing, broader storage may be acceptable if users understand the tool is in testing.

For public launch, store as little user-provided content as practical while preserving operational needs.

Logs should remain metadata-first. QA-mode storage can be separate from logs.

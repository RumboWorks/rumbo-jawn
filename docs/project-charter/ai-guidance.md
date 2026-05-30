# AI and Agent Guidance Standards

Rumbo publicly claims expertise in AI and agent guidance. Internal guidance should model the quality the product claims to provide.

## Guidance principles

- Make instructions explicit and scoped.
- State constraints and non-goals.
- Require verification before marking work complete.
- Keep guidance close to the repo and current code.
- Prefer small specialist guidance files over one giant prompt.
- Update guidance when process changes.

## Agent file pattern

Each `.agent/*.agent.md` file should include:

- when to use it
- allowed arguments/modes if applicable
- constraints
- approach
- expected output
- verification requirements

## Required specialist agents

- `.agent/phase-review.agent.md`
- `.agent/roadmap.agent.md`
- `.agent/usage.agent.md`
- `.agent/decision-log.agent.md`
- `.agent/architecture.agent.md`
- `.agent/frontend.agent.md`
- `.agent/database.agent.md`
- `.agent/testing.agent.md`

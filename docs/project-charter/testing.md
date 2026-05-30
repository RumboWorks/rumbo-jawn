# Testing and QA

## Testing philosophy

Tests should protect shared platform contracts and reduce cross-tool side effects.

## Phase expectations

Each phase should define:

- automated checks required
- manual QA checklist
- cross-tool smoke checks if shared packages changed
- docs that must be updated

## MVP baseline

Phase 00 should establish at least a minimal `npm run check` command even if it initially runs lightweight syntax/config checks.

## Cross-tool side effect guard

When a shared package changes, check affected tool placeholders or tests before closing the phase.

## Finish-line discipline

The launch-hardening phase must include:

- broken links
- error states
- empty states
- admin visibility
- privacy/AI disclosure
- usage limits
- deploy rehearsal
- rollback notes

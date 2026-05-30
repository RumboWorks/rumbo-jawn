# Testing

## Testing posture

Every phase should include concrete acceptance criteria and a manual QA checklist.

Tests should focus on behavior that matters to the current phase.

Do not add elaborate testing infrastructure before the app structure exists, but do create a path for tests early.

## Phase expectations

A phase is not complete until:

- its acceptance criteria pass,
- relevant checks/tests have been run,
- manual QA notes are recorded where needed,
- docs are updated,
- deferred work is captured.

## Browser testing

Playwright/browser testing is likely useful once the platform shell, auth flows, and Sounds Like Us user flows exist.

It does not need to be fully built in Phase 00 unless a phase file explicitly adds it.

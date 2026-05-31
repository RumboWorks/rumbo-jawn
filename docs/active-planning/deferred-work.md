# Deferred Work

Use this file to prevent postponed work from disappearing.

Each deferred item should include:

- title,
- originally identified in,
- deferred to,
- reason,
- blocker, if any,
- why it must not be forgotten.

## Deferred item: Final visual design direction

Originally identified: Phase 01  
Deferred to: later design/UI phase  
Reason: Phase 01 should establish SCSS/Twig/design-system structure without locking final brand visuals.  
Blocking: Real screens and product workflows should exist first.  
Must not forget because: Early styling choices should eventually become a coherent public-facing visual system.

## Deferred item: Model Eval implementation

Originally identified: Platform planning  
Deferred to: after initial Sounds Like Us MVP scope unless roadmap changes  
Reason: Model Eval is a sibling tool, not part of first MVP implementation.  
Blocking: Shared platform foundation and first-tool MVP validation.  
Must not forget because: Model Eval is an important architectural constraint for shared auth, jobs, AI calls, storage, reporting, and admin.

## Deferred item: Google OAuth verification

Originally identified: Phase 02
Deferred to: when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in .env
Reason: Routes and strategy are fully wired; testing requires real credentials.
Blocking: Nothing — email/password auth is the working launch path.
Must not forget because: Google is the primary intended OAuth launch path.

## Deferred item: LinkedIn OAuth verification

Originally identified: Phase 02
Deferred to: after Google OAuth is confirmed; verify LinkedIn credentials when available
Reason: Strategy wired but untested. Decision log notes to defer and record if unstable.
Blocking: Nothing.
Must not forget because: LinkedIn is listed as a launch auth option.

## Deferred item: Prisma migration history setup

Originally identified: Phase 02
Deferred to: before Phase 03 schema changes
Reason: prisma migrate dev requires CREATE DATABASE permission for shadow DB. rumbo_dev user lacks this. db push used instead.
Blocking: Need to grant permissions or configure SHADOW_DATABASE_URL before Phase 03 schema additions.
Must not forget because: Without migration history, schema changes are harder to track and reverse safely.

## Deferred item: Embeddable widget use-case selection

Originally identified: Platform planning  
Deferred to: Phase 08 or earlier if a strong use case appears  
Reason: Widgets are valuable for brand spread, but the first public widget should be tied to a real product output.  
Blocking: Need Sounds Like Us or another tool output worth embedding.  
Must not forget because: Embeddable widgets are a medium-priority platform capability, not a back-burner idea.

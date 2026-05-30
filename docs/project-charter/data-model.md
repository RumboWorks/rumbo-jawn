# Data Model

This document records the intended shared data model. Phase 00 should create a placeholder only; later phases will fill in the actual Prisma schema.

## Shared platform entities

Expected shared tables/models:

- User
- Organization
- Membership
- Subscription
- Job
- AiCall
- Artifact / File / ArtifactManifest as needed
- ToolConfig / AppConfig as needed

## Tool-specific entities

Tool-specific tables should reference shared platform entities rather than recreating user/org/job concepts.

Examples:

- SoundsLikeUsRun
- SoundsLikeUsProfile
- SoundsLikeUsGuidanceOutput
- ModelEvalProject
- ModelEvalRun
- ModelEvalArtifact
- ModelEvalScore

## Core rules

- Every account belongs to at least one organization.
- Tool data belongs to an organization and, where appropriate, to the user who initiated it.
- Long-running work is represented by shared jobs.
- AI calls are logged in a shared table for cost, token, and provider tracking.
- Raw artifacts can live as JSON files with metadata in DB.

## Current database choice

Use MySQL while using existing general-purpose EC2 servers. Use Prisma to preserve migration flexibility. Reconsider Postgres when building Rumbo-specific infrastructure.

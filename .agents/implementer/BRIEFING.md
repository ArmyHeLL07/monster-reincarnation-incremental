# BRIEFING — 2026-06-28T06:05:08Z

## Mission
Implement the A-to-Z T1-T10 evolution trees, expanded races, and combat/skill modifications from docs/studio_game_design_document.md in the active workspace.

## 🔒 My Identity
- Archetype: implementer
- Roles: implementer, qa, specialist
- Working directory: C:\Users\ali\monster-reincarnation-incremental\.agents\implementer
- Original parent: 4ce95c3d-9bd5-42ff-bcfe-d63e0f69ae36
- Milestone: Implement T1-T10 evolutions and race systems

## 🔒 Key Constraints
- CODE_ONLY network mode. No external HTTP/network calls.
- Follow minimal changes principle.
- Verify everything via run tests.

## Current Parent
- Conversation ID: 4ce95c3d-9bd5-42ff-bcfe-d63e0f69ae36
- Updated: 2026-06-28T06:05:08Z

## Task Summary
- **What to build**:
  - Align race identifiers ('fiend' -> 'demon', 'beastman' -> 'beastkin') and remove extra races.
  - Implement linear T1-T10 evolutions for the 8 GDD races with exact stats, requirements, and skills.
  - Add missing signature and normal skills in data/skills.json.
  - Modify packages/shared/src/types.ts and packages/client/src/game/state.ts to support new properties/interfaces.
  - Implement combat engine mechanics: Demon Blood Pact & Demonic Obliteration, Golem Unmovable Core, Beastkin Primal Rage, Spider Sovereign Minions & Sovereign Cocoon, Wyrmling True Fire, Slime Absorption & Replication, Stun ticking, Resist reduction.
  - Localize names in data/i18n/en.json.
  - Run and pass all tests.
- **Success criteria**:
  - All tests passing.
  - Typings, JSON configuration, and combat logic fully aligned with GDD.
- **Interface contracts**: packages/shared/src/types.ts
- **Code layout**: packages/

## Key Decisions Made
- Working directory set to active workspace.

## Artifact Index
- C:\Users\ali\monster-reincarnation-incremental\.agents\implementer\ORIGINAL_REQUEST.md — Keeps the copy of the original instruction.
- C:\Users\ali\monster-reincarnation-incremental\.agents\implementer\progress.md — Tracking agent progress.

# Execution Plan: Gothic RPG Overhaul & Race Expansion

This plan outlines the steps to overhaul the UI/UX style of the game to a Gothic RPG theme and implement the full A-to-Z T1-T10 evolution trees for all 8 races (including the Demon and Beastkin races).

## Phase 1: Planning and Codebase Audit (Current)
- **Objective**: Check current compilation status, audit the codebase to see what UI/UX templates and race/evolution details are already implemented, and find any compilation blockers.
- **Tasks**:
  - Spawn 3 parallel Explorer subagents to audit:
    - compilation status and error output of `npm run typecheck` and `npm run build`.
    - current implementations of A-to-Z race trees in `data/races.json` and `data/evolutions.json`.
    - current UI components, layouts, and styles in `packages/client/src/ui.ts` to see what is missing for "Gothic Abyss".
- **Verification**: Handoff/audit reports from Explorer agents.

## Phase 2: Gothic RPG UI/UX Redesign ("Gothic Abyss")
- **Objective**: Implement visual styles according to GDD.
- **Tasks**:
  - Implement bone parchment theme, gold borders, proper styling, micro-animations, and screen shake on critical hits, vignette pulses, and correct layout rendering.
  - Spawn Worker to implement visual styles.
  - Spawn Reviewer to check layout correctness, responsiveness, and typography.
- **Verification**: Reviewer reports confirming style implementation.

## Phase 3: A-to-Z Evolution Trees & Expanded Races
- **Objective**: Complete T1-T10 evolution trees, expanded races, custom skill lineages, signature mechanics, and fusions.
- **Tasks**:
  - Implement full Trees (Spider, Slime, Skeleton, Wyrmling, Golem, Human, Demon, Beastkin) up to T10.
  - Ensure Demon uses HP for skills (Blood Pact) and Beastkin uses Primal Rage.
  - Spawn Worker to implement data structures and game engine integration.
- **Verification**: Reviewer and Challenger verify that all evolution trees are correct and reachable.

## Phase 4: Verification, Compilation & Fixes
- **Objective**: Make sure the application compiles without errors and passes all tests.
- **Tasks**:
  - Run `npm run typecheck` and `npm run build` and resolve any TypeScript errors.
  - Spawn Challenger to run stress tests and verify that no runtime loops crash.
  - Spawn Forensic Auditor to verify integrity and correctness.
- **Verification**: Clean typecheck, successful build, passing tests, and CLEAN audit verdict.

## Phase 5: Git Commit, Push & Victory Claim
- **Objective**: Commit changes, push to GitHub `main` branch, and report victory.
- **Tasks**:
  - Commit all modifications and push to remote `main`.
  - Report success and output "VICTORY CLAIMED".

# Original User Request

## Initial Request — 2026-06-28T02:36:01+03:00

Create a comprehensive Game Design Document (GDD) and UI/UX Specification for overhauling the Monster Reincarnation Incremental game, acting as a professional game studio team. The design must focus on a **Classic Gothic/RPG theme** (parchment backgrounds, gold borders, gothic typography) and detail the expansion of all races, skills, and evolution trees from A to Z.

Working directory: C:\Users\ali\monster-reincarnation-incremental\docs
Integrity mode: development

## Requirements

### R1. Gothic RPG UI/UX Blueprint
- Define visual style guides (colors, fonts, borders, parchment container specs, gold-bordered panel layouts).
- Design responsive UI structures for the main combat tab, stats tab, and evolution trees, incorporating gothic elements.
- Detail custom micro-animations (e.g. hover glows, gold border pulses, paper rustling transit effects).

### R2. A-to-Z Race & Evolution Specification
- Define structural templates for adding new monster and humanoid races.
- Outline complete Tier 1 to Tier 10 evolution trees for:
  - Spider (Arachnid)
  - Slime
  - Skeleton (Undead)
  - Wyrmling (Dragonkin)
  - Golem
  - Human
  - At least 2 new proposed races (e.g. Demon, Beastkin).
- Specify custom skill lineages and signature mechanics for each branch.

### R3. Technical Skeletons
- Provide TypeScript interface definitions representing the new races, custom UI themes, and expanded skill structures to guide developers during future coding phases.

## Acceptance Criteria

### Studio Specs & Deliverables
- [ ] A complete, highly-detailed `studio_game_design_document.md` is generated in `C:\Users\ali\monster-reincarnation-incremental\docs/`.
- [ ] Gothic UI style guide specs and border layout designs are included.
- [ ] Evolutionary path maps for all 6 base races plus 2 new races are laid out from A to Z.
- [ ] TypeScript interface skeletons for the new systems are defined.
- [ ] A brief summary of the design is appended to the walkthrough document in the brain directory.

## Follow-up — 2026-06-28T00:06:10Z

A professional game developer multi-agent coding team will inspect the codebase, identify architectural and player-experience deficiencies, and implement 4 major feature enhancements to make the game experience complete and polished.

Working directory: C:\Users\ali\monster-reincarnation-incremental
Integrity mode: development

## Requirements

### R1. Code Audit & Bug Fixes
- Audit the main game loops (combat, active modifiers, state saves, rebirth, and skills) to find and fix any logical flaws or bugs.
- Optimize the core loop to support fluid gameplay.

### R2. Smart Auto-Combat Macros
- Add an auto-combat settings panel allowing players to toggle:
  - Auto-Cast active skills whenever their cooldown expires.
  - Auto-Use healing potions (from inventory/larder or simple heals) when health drops below 35%.

### R3. Dynamic Combat Visual Feedback
- Implement floating damage text overlay on the enemy/player frames showing damage dealt (green for heals, red/orange for critical strikes, yellow for poison, white for physical).
- Trigger a subtle screen shake animation (vibration effects) on critical hits.

### R4. Detailed Combat Analytics Dashboard
- Add a sub-panel in the Stats tab tracking the last 10 combat encounters:
  - Average damage per second (DPS) of the player.
  - Average EP gained per second.
  - Satiety and resource regen efficiency index.

### R5. Auto-Equip Best Gear & Quality Scores
- Enhance the inventory comparison UI: display a clear "+X% Power Score" on each item in the backpack compared to currently equipped items.
- Add an "Equip Best" button in the Inventory panel that automatically equips the highest power score items available for the current humanoid form.

## Acceptance Criteria

### Compilation & Build
- [ ] Running `npm run typecheck` succeeds with zero errors.
- [ ] Running `npm run build` bundles the client files successfully.

### Runtime Verification
- [ ] Extended test coverage verifying the auto-combat macro trigger thresholds and gear score comparisons is implemented in the test suites.
- [ ] All automated tests run and pass successfully.

## Follow-up — 2026-06-28T08:52:52+03:00

A professional game studio developer and designer team will overhaul the Monster Reincarnation Incremental web game by implementing the Gothic RPG UI/UX style guide and the expanded T1-T10 evolution trees/skills, as specified in the Game Design Document (`docs/studio_game_design_document.md`).

Working directory: C:\Users\ali\monster-reincarnation-incremental
Integrity mode: development

## Requirements

### R1. Gothic RPG UI/UX Redesign ("Gothic Abyss")
- Implement a premium dark parchment theme with charcoal background gradients, gold borders, and Google Fonts typography (Cinzel for headers, Outfit for body) across all tabs (Combat, Stats, Skills, Inventory).
- Add hover glows, border pulses, and smooth transitions to improve the modern feel.

### R2. A-to-Z Evolution Trees & Expanded Races
- Implement the T1-T10 evolution paths and custom skill lineages for the spider, slime, skeleton, wyrmling, golem, human, and the two new races (Demon and Beastkin) as defined in the GDD.
- Integrate the signature mechanics and fusions for all branches.

### R3. Automated Compilation, Verification & Git Push
- Ensure the project builds successfully (`npm run typecheck` and `npm run build` must pass with zero errors).
- Commit all code changes and push directly to the remote GitHub `main` branch.

## Acceptance Criteria

### Technical & Compilation
- [ ] Running `npm run typecheck` succeeds with zero errors.
- [ ] Running `npm run build` bundles the client files successfully.

### Git State
- [ ] All modifications are committed and successfully pushed to the remote GitHub repository.


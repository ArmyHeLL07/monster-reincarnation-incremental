# Project: Gothic RPG Overhaul & T1-T10 Race Expansion

## Architecture
- **Client**: Web UI built using Vite. Main entry points are `packages/client/src/main.ts` and `packages/client/src/ui.ts`. Game state and game loops are located in `packages/client/src/game/`.
- **Shared**: Common TypeScript definitions and fusion logic (`packages/shared/src/`).
- **Server**: Cloudflare worker backend (`packages/server/src/index.ts`).

## Code Layout
- `packages/client/src/ui.ts` - Main user interface rendering, tabs, buttons, dynamic feedback, layouts.
- `packages/client/src/game/evolution.ts` - Evolution mechanics, checks, and tree rendering logic.
- `data/races.json` - Data file containing all playable races.
- `data/evolutions.json` - Data file detailing the A-to-Z T1-T10 evolution trees for all races.
- `data/skills.json` - Data file defining all skills, stats, ranks, and cooldowns.
- `data/i18n/` - Localization folders containing English (`en.json`), Turkish (`tr.json`), and Russian (`ru.json`).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Planning & Codebase Exploration | Compile check, codebase audit, review current implementations of UI/UX styling and race trees | None | IN_PROGRESS |
| 2 | Gothic RPG UI/UX Redesign ("Gothic Abyss") | Implement theme style guides: Abyss Dark, Bone Parchment, antique gold borders, Google Fonts, glows, vignette pulse | M1 | PLANNED |
| 3 | A-to-Z Evolution Trees & Expanded Races | Implement T1-T10 evolution trees, expanded races (Demon, Beastkin), signature mechanics and fusions | M1 | PLANNED |
| 4 | Verification & Quality Assurance | Fix compilation issues, ensure npm run typecheck and npm run build both pass, verify runtime behavior | M2, M3 | PLANNED |
| 5 | Git Commit and Push | Push final verified changes directly to the remote GitHub main branch | M4 | PLANNED |

## Interface Contracts
- **GothicUiTheme**: primaryBg, panelBg, borderColor, glowColor, fontDisplay, fontBody, borderStyle.
- **ExtendedRace**: signatureMechanic, signatureSkillId.
- **ExtendedEvolutionForm**: branchId, skillPrerequisites, formMutations.
- **ExtendedSkill**: category, hpCostPct, bloodWellCost, cooldownTicks.

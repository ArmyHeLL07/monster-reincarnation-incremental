# Handoff Report: Race & Evolution Mechanics Investigation

This report details the comparison between the current data/code implementation of the race and evolution systems at `C:\Users\ali\monster-reincarnation-incremental` and the specifications outlined in Section 2 ("A-to-Z Race & Evolution Specification") of `docs/studio_game_design_document.md`.

---

## 1. Observation

### A. Race Definitions
- In `data/races.json`, there are 11 races defined. Among the 8 races specified in the GDD, two are defined under different IDs, and three additional races exist:
  - **Spider** is defined as `id: "spider"` (line 3).
  - **Human** is defined as `id: "human"` (line 83).
  - **Slime** is defined as `id: "slime"` (line 124).
  - **Skeleton** is defined as `id: "skeleton"` (line 164).
  - **Wyrmling** is defined as `id: "wyrmling"` (line 205).
  - **Golem** is defined as `id: "golem"` (line 244).
  - **Beastkin** is defined as `id: "beastman"` (line 284), with the localization key `race.beastman.name` translating to `"Beastman"` in `data/i18n/en.json` (line 8).
  - **Demon** is defined as `id: "fiend"` (line 404), with the localization key `race.fiend.name` translating to `"Fiend"` in `data/i18n/en.json` (line 11).
  - Three extra races are present in `data/races.json`: `vampire` ("Vampire", line 324), `lycan` ("Lycan", line 364), and `celestial` ("Celestial", line 450).

### B. Evolution Paths and Skills (T1-T10)
- In `data/evolutions.json`, the races are structured as branching binary trees containing 33 to 52 forms each rather than the linear T1-T10 progression specified in the GDD.
  - Form counts in JSON: `human: 48`, `slime: 36`, `spider: 52`, `skeleton: 33`, `wyrmling: 33`, `golem: 33`, `beastman: 48`, `fiend (demon): 33` (plus extra races with 33 forms each).
  - Almost all GDD-specified forms (e.g., `Lost Villager` for Human, `Clay Pebble` for Golem, `Feral Pup` for Beastkin, `Slimelet` for Slime) are **missing** from `data/evolutions.json`.
- Most GDD-specified signature skills are **missing** from `data/skills.json` and `data/i18n/en.json`:
  - `sovereign_cocoon` (Spider T10) is missing.
  - `blood_silk_nest` (Spider T9) is missing.
  - `golden_touch` (Slime T8) is missing.
  - `void_ingestion` (Slime T9) is missing.
  - `raise_dead` (Skeleton T10) is missing.
  - `draconic_sovereignty` (Wyrmling T9) is missing.
  - `unmovable_core` (Golem T10) is missing.
  - `guardian_angel` (Human T9) is missing.
  - `blood_well` (Demon T5) is missing.
  - `demonic_obliteration` (Demon T10) is missing.
  - `primal_shred` (Beastkin T10) is missing.
  - `primal_rage` / `bleeding_carnage` are missing.

### C. Signature Mechanics & Fusions
- In `packages/client/src/game/signature.ts`, lines 5-13 define signature gauges (`SIG_MAX`):
  ```typescript
  export const SIG_MAX: Record<string, number> = {
    spider: 100,   // web gauge: fills at rest, discharges at combat start as a trap
    wyrmling: 10,  // heat stacks: build on each attack, burst at max into bonus fire damage
    skeleton: 20,  // bone stacks: +1 per kill, each gives +1 flat armor, decay slowly
    golem: 5,      // stone layers (float 0–5): build at rest, ALL layers absorb the next hit then reset
    slime: 0,      // uses sigAbsorb: absorbs the element of the last killed enemy (temp resistance)
    human: 0,      // no gauge — humanoid equipment access is their signature advantage
    beastman: 10,  // fury stacks: +2 per kill, decay at rest; each stack = +5% damage
  };
  ```
  - The ID `fiend` (Demon) is **completely missing** from signature configuration and implementation.
  - Golem's `Unmovable Core` (CC immunity, 15% armor to damage) is not implemented. Stuns/controls are handled in `packages/client/src/game/combat.ts` at line 1480 without Golem exemption:
    ```typescript
    function isControlled(state: GameState): boolean {
      return state.statusEffects.some((s) => s.control && s.ticksLeft > 0);
    }
    ```
    Furthermore, armor is only calculated to reduce damage at line 1369 and is not converted to physical damage.
  - Beastkin's `Primal Rage` (boost under 35% HP) is not implemented.
  - Spider's `Sovereign Minions & Silk Cocoon` is not implemented (uses a web trap gauge instead).
  - Slime's `Absorption & Replication` is not implemented (uses 30% element resistance instead).
  - Demon's `Blood Pact` (HP cost instead of MP) is not implemented. Although `packages/shared/src/types.ts` defines `hpCost` (line 200) and `data/skills.json` includes `"hpCost": 0.15` for the `soul_pact` skill (line 5475), the combat system in `packages/client/src/game/combat.ts` does not check or subtract `hpCost` (lines 1127-1135 only check and deduct `mp`):
    ```typescript
    const mpBase = def.mpCost ?? 0;
    ...
    if (effectiveMp > state.mp) return false;
    state.mp = Math.max(0, state.mp - effectiveMp);
    ```
- In `data/fusion_rules.json`, there are no references to the new GDD-specified skills or fusions.

---

## 2. Logic Chain

1. **Premise**: The GDD specifications define a concrete set of 8 races, linear T1-T10 evolution stages, unique tier skills, and signature combat mechanics.
2. **Analysis of Races**: Observing that the IDs in `races.json` are `fiend` and `beastman` instead of `demon` and `beastkin`, and that three extra races exist, shows a naming mismatch and scope creep.
3. **Analysis of Evolution Paths**: Observing that `evolutions.json` contains branching binary trees (33-52 forms per race) and that none of the GDD linear form names are defined in the JSON files leads to the deduction that the current data is based on an older branching architecture, completely out of sync with the GDD.
4. **Analysis of Skills & Fusions**: Checking `skills.json` and `fusion_rules.json` reveals that almost all GDD signature skills and fusions are entirely missing.
5. **Analysis of Code Integration**: Looking at `signature.ts` and `combat.ts` shows that:
   - Older placeholder mechanics (heat/bone stacks, stone absorption layers) are hardcoded.
   - The combat loop has no logic to handle CC immunity for Golems, armor-to-damage conversions, or low-health rage triggers for Beastkin.
   - Although `hpCost` is defined in schema and data, `combat.ts` completely lacks implementation to deduct HP instead of MP when casting.
6. **Conclusion**: Therefore, there is a major gap between the GDD specifications and the current implementation across data structures, assets, and the client combat code.

---

## 3. Caveats

- We assumed that `beastman` and `fiend` are the existing versions of `beastkin` and `demon`.
- We assumed that the linear T1-T10 paths in GDD section 2.2 represent the new intended progression, implying that the 33-52 form branching trees currently in `evolutions.json` are legacy data that needs to be replaced.
- We did not audit non-English translation files (e.g., `ru.json` or `tr.json`), but since English is missing the keys, other languages are almost certainly missing them too.

---

## 4. Conclusion

There is a complete divergence between GDD Section 2 and the actual data/code implementation. To resolve this, the following concrete steps must be taken:

### Step 1: Align Race Identifiers
- Rename `fiend` to `demon` and `beastman` to `beastkin` in `races.json`, `evolutions.json`, and all client TS files (e.g., `signature.ts`, `race.ts`).
- Update `data/i18n/en.json` to map `race.demon.name: "Demon"` and `race.beastkin.name: "Beastkin"`.
- Decide whether to retain or remove the extra races (`vampire`, `lycan`, `celestial`).

### Step 2: Implement Linear T1-T10 Evolutions in Data
- Re-author `data/evolutions.json` to define the 10 forms for each of the 8 races as a linear sequence (`evolvesTo` pointing to the next tier form).
- Update `data/skills.json` to define the GDD skills (e.g., `venom_spit`, `sovereign_cocoon`, `unmovable_core`, etc.) with correct tags and parameters.
- Add English localization keys for all new forms and skills in `data/i18n/en.json`.

### Step 3: Implement Combat Engine Mechanics
- **Demon Blood Pact**: Update `packages/client/src/game/combat.ts` inside the casting block (around line 1134) to check if a skill has `hpCost` and deduct HP instead of MP.
- **Golem Unmovable Core**: Update `isControlled()` in `combat.ts` to return `false` if `state.raceId === 'golem'`. Update stat calculations in `state.ts` to add 15% of total armor to physical damage.
- **Beastkin Primal Rage**: Add a check in `state.ts` to apply `+40% AGI` and `+25% Dodge` when HP is below 35% of max HP.
- **Spider Sovereign Minions**: Modify minion-limit calculations and damage multipliers in `combat.ts` when playing as `arachnid_sovereign`.
- **Wyrmling True Fire**: Implement a resistance bypass in the damage calculation of `combat.ts` for fire damage dealt by Wyrmlings.

### Step 4: Update Signature Gauge Logic
- Update `packages/client/src/game/signature.ts` to match the GDD specifications for each race rather than using the placeholder stack/layer gauges.

---

## 5. Verification Method

To verify the findings and any future implementation fixes:
1. **Inspect Data Files**: Verify IDs in `data/races.json`, `data/evolutions.json`, `data/skills.json`, and `data/i18n/en.json`.
2. **Run Audit Scripts**:
   Execute the audit scripts created in this agent's folder to print out missing/mismatched data:
   - `node .agents/teamwork_preview_explorer_data/analyze_safe.cjs`
   - `node .agents/teamwork_preview_explorer_data/analyze_details.cjs`
   - `node .agents/teamwork_preview_explorer_data/search_code.cjs`
3. **Execute Project Tests**:
   Ensure existing unit tests remain green:
   - `powershell -ExecutionPolicy Bypass -Command "npx tsx scripts/run_tests.ts"`
   - `powershell -ExecutionPolicy Bypass -Command "npx tsx scripts/run_new_tests.ts"`

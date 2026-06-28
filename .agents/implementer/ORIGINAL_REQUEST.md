## 2026-06-28T06:02:33Z
Your task is to implement the A-to-Z T1-T10 evolution trees and expanded races (Demon, Beastkin, and expanded base races) as specified in docs/studio_game_design_document.md.

Specifically:
1. Align Race Identifiers:
   - Rename 'fiend' to 'demon' and 'beastman' to 'beastkin' in data/races.json, data/evolutions.json, and all client TS files (e.g. packages/client/src/game/signature.ts, packages/client/src/game/race.ts, packages/client/src/ui.ts).
   - Remove extra races ('vampire', 'lycan', 'celestial') from data/races.json and data/evolutions.json to stick strictly to the 8 GDD races.
2. Implement Linear T1-T10 Evolution trees:
   - In data/evolutions.json, structure each of the 8 races (Spider, Slime, Skeleton, Wyrmling, Golem, Human, Demon, Beastkin) as a linear chain of 10 forms (T1 -> T2 -> T3 -> ... -> T10). The `evolvesTo` field of each form should point strictly to the next form in the tree, with T10 having an empty `evolvesTo` array.
   - Define exact GDD-specified stats, tierReqs, levelReqs, and skills for each form.
   - Ensure the starting forms (T1) have levelReq: 1.
3. Update data/skills.json to include all missing GDD signature and normal skills:
   - `sovereign_cocoon` (Spider T10), `blood_silk_nest` (Spider T9).
   - `golden_touch` (Slime T8), `void_ingestion` (Slime T9), `absorption_replication` (Slime T10).
   - `raise_dead` (Skeleton T10).
   - `draconic_sovereignty` (Wyrmling T9), `apocalypse_breath` (Wyrmling T8).
   - `unmovable_core` (Golem T10).
   - `guardian_angel` (Human T9).
   - `blood_well` (Demon T5), `demonic_obliteration` (Demon T10).
   - `primal_shred` (Beastkin T10).
4. Update packages/client/src/game/state.ts and packages/shared/src/types.ts:
   - Add `replicatedRace?: string;` and `enemyStunTicks?: number;` to the GameState interface.
   - Define GDD TS interfaces (GothicUiTheme, ExtendedRace, ExtendedEvolutionForm, ExtendedSkill) at the end of packages/shared/src/types.ts.
5. Implement Combat Engine specific mechanics:
   - **Demon Blood Pact**: In packages/client/src/game/combat.ts inside the skill casting block, check if `state.raceId === 'demon'`. If so, check and subtract the MP cost from `state.hp` instead of `state.mp`. Also, if a skill has `hpCost` (a fraction of current HP, e.g. 0.15/0.20), calculate and deduct the HP cost (e.g. `state.hp = Math.max(1, state.hp - costHp)`), preventing suicide.
   - **Demon Demonic Obliteration**: If `id === 'demonic_obliteration'` is cast, calculate the damage as 4x the consumed HP amount plus INT scaling (e.g. `raw = consumedHp * 4 + effStat(state, 'INT') * 1.5`).
   - **Golem Unmovable Core**: In packages/client/src/game/combat.ts, update `isControlled(state)` to return `false` if `state.skills.some((s) => s.id === 'unmovable_core')` (making Golems immune to CC). In `castSkill`, if the Golem has `unmovable_core`, add 15% of the player's total armor (`Math.round(b.armor * 0.15)`) to the flat damage (`raw`).
   - **Beastkin Primal Rage**: In packages/client/src/game/state.ts inside `effStat`, if `k === 'AGI'`, `state.raceId === 'beastkin'`, and the player is below 35% HP, boost AGI by +40% (e.g. `val = Math.round(val * 1.4)`). In `aggregateBonuses` in packages/client/src/game/effects.ts, if `state.raceId === 'beastkin'` and the player is below 35% HP, add `0.25` to `b.dodgeBonus`.
   - **Spider Sovereign Minions**: In `packages/client/src/game/combat.ts`, verify that `arachnid_sovereign` doubles minion limit and applies 1.5x damage/absorption to spiderling minions (already partially in code, make sure it functions). Also, if `id === 'sovereign_cocoon'` is cast, set `state.enemyStunTicks = 3`.
   - **Wyrmling True Fire**: In `packages/client/src/game/combat.ts` inside `elementMultiplier`, if `state.raceId === 'wyrmling'`, `atk === 'fire'`, and the multiplier is `< 1` (disadvantage), reduce the disadvantage by 50% (e.g. `mult = 1 - (1 - mult) * 0.5`).
   - **Slime Absorption & Replication**: In `packages/client/src/game/combat.ts` inside `onKill`, if the player is a slime and has the `absorption_replication` skill, replicate the defeated enemy's race: if `enemy.race` is valid, set `state.replicatedRace = enemy.race` and reset `state.sig = 0`. In `packages/client/src/game/signature.ts`, update signature ticking/kill/lunge logic: check if the player is a slime and `state.replicatedRace` is set, and if so, execute signature behavior for `state.replicatedRace` instead!
   - In `packages/client/src/game/combat.ts` inside `enemyAttack`, if `state.enemyStunTicks` is > 0, decrement it by 1, log that the enemy is cocooned, and return (skipping the attack).
   - In `packages/client/src/game/combat.ts` inside `resistReduction`, if the player has `absorption_replication` and `type` is 'poison' or 'acid', return `1.0` (100% immune).
6. Localize the new form names and skill names in data/i18n/en.json.
7. Run the tests via `npx tsx scripts/run_tests.ts` and `npx tsx scripts/run_new_tests.ts` to verify functionality. Fix any bugs or typescript errors.

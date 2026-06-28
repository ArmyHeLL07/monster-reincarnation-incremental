# Handoff Report - Codebase Audit & Feature Proposals

## 1. Observation

During a read-only investigation of the codebase under `packages/client/src/game/` and the project structure, the following project details, bugs, and performance bottlenecks were observed:

### Project Structure & Compilation Scripts
*   **Compilation / Typecheck Command**: `npm run typecheck`
    *   Command line: `tsc -p packages/shared && tsc -p packages/client && tsc -p packages/server`
    *   Executed successfully via `cmd /c npm run typecheck` (PowerShell script restrictions bypassed).
*   **Build Command**: `npm run build`
    *   Command line: `npm run build -w @mri/client` (Vite build for client).
*   **Tests**:
    1.  `scripts/run_tests.ts` (run via `npx tsx scripts/run_tests.ts` - passes successfully).
    2.  `scripts/run_new_tests.ts` (run via `npx tsx scripts/run_new_tests.ts` - passes successfully).

---

### Observed Bug 1: State Save Loss in Nested Objects (Shallow Merge)
*   **File**: `packages/client/src/game/save.ts` (lines 20–30)
*   **Source Code**:
    ```ts
    function migrate(raw: Record<string, unknown>): GameState {
      const base = newGame();
      // Shallow merge: raw fields override base, missing fields fall back to base defaults.
      const merged = { ...base, ...raw, saveVersion: CURRENT_SAVE_VERSION } as GameState;
      // ...
    ```
*   **Observation**: The merge uses a shallow spread `{ ...base, ...raw }`. If the game state's nested objects (like `stats`, `minions`, `skills`, `inventory`, `equipment`, `allocated`) have properties added in a newer version, the loaded save's older nested object completely overwrites `base`'s nested object, causing the new fields to be missing (`undefined` or leading to `NaN` errors).

---

### Observed Bug 2: Double Experience Scaling
*   **File**: `packages/client/src/game/combat.ts` (lines 1165–1166 and 1723–1724)
*   **Source Code (castSkill)**:
    ```ts
    const gain = Math.max(1, Math.round((enemy.ep + 1 + Math.floor(slot.level * 0.3)) * b.xpMult));
    addSkillExp(state, content, slot, gain, log, b.xpMult, isOffline);
    ```
*   **Source Code (onKill)**:
    ```ts
    const gain = Math.max(1, Math.round((enemy.ep + 1 + Math.floor(slot.level * 0.15)) * b.xpMult * 0.5));
    addSkillExp(state, content, slot, gain, log, b.xpMult, isOffline);
    ```
*   **Source Code (addSkillExp definition)**:
    ```ts
    function addSkillExp(state: GameState, content: Content, slot: SkillSlot, amount: number, log: Log, xpMult: number, isOffline = false): void {
      const def = content.skills.get(slot.id);
      if (!def) return;
      const rankMult = RANK_XP_MULT[def.rank ?? 'E'] ?? 1.0;
      slot.exp += slot.id === 'larder'
        ? amount
        : Math.max(1, Math.round(amount * xpMult / rankMult));
      skillLevelUp(slot, state, content, log, isOffline);
    }
    ```
*   **Observation**: In both skill casting and kill resolution, the experience reward is multiplied by `b.xpMult` once to compute `gain`, and then passed into `addSkillExp`, which multiplies the incoming `amount` by `xpMult` (which is `b.xpMult`) again. This results in quadratic scaling of skill experience bonuses.

---

### Observed Bug 3: Offline Skill Evolution Stalling
*   **File**: `packages/client/src/game/combat.ts` (lines 2033–2037)
*   **Source Code**:
    ```ts
    function skillLevelUp(slot: SkillSlot, state: GameState, content: Content, log: Log, isOffline: boolean): void {
      // ...
      while (slot.level < def.lvMax && slot.exp >= xpFn()) {
        slot.exp -= xpFn();
        slot.level += 1;
        log({ key: 'log.skill_up', params: { skill: def.locKeyName, lvLabel: LV_LABEL, lv: slot.level } });
      }
      if (isOffline) {
        if (slot.level >= def.lvMax) slot.exp = Math.min(slot.exp, xpFn());
        return;
      }
      if (slot.level >= def.lvMax && def.evolvesTo.length > 0) {
        const nextId = def.evolvesTo[0];
        // ... (performs evolution)
    ```
*   **Observation**: When `isOffline` is true, a skill that reaches max level cannot evolve. Additionally, its experience is capped to `xpFn()`. Consequently, any subsequent offline ticks waste potential skill experience, and the skill remains unevolved until the first online cast.

---

### Observed Bug 4: Auto-Equip Accessory Overwrite / Swapping Loop
*   **File**: `packages/client/src/game/loot.ts` (lines 229–234)
*   **Source Code**:
    ```ts
    export function slotForItem(it: LootItem, equipment: GameState['equipment']): EquipSlot {
      if (it.type !== 'accessory') return it.type;
      if (!equipment.acc1) return 'acc1';
      if (!equipment.acc2) return 'acc2';
      return 'acc1'; // both full → replace acc1
    }
    ```
*   **Observation**: When both accessory slots (`acc1` and `acc2`) are full, `slotForItem` always returns `'acc1'`. If the player has a new accessory with a score higher than `acc1` and `acc2`, `autoEquipBest` will equip it into `acc1`, displacing the old `acc1` to the bag. In the next iteration for `acc2`, the displaced accessory might have a higher score than `acc2` and get equipped, replacing the *new* accessory in `acc1` due to the hardcoded `'acc1'` fallback. This results in sub-optimal gear remaining equipped and the best gear returning to the bag.

---

### Observed Performance Issue: Synchronous Offline Progress Loop
*   **File**: `packages/client/src/main.ts` (lines 728–734)
*   **Source Code**:
    ```ts
    function applyOffline(state: GameState, content: Content, log: (e: LogEvent) => void): void {
      const elapsedSec = Math.floor((Date.now() - state.lastSeen) / 1000);
      if (elapsedSec < 5 || state.action === 'idle') return;
      const ticks = Math.min(elapsedSec, OFFLINE_TICK_CAP);
      const beforeEp = state.ep;
      const silent: (e: LogEvent) => void = () => {};
      for (let i = 0; i < ticks; i++) tick(state, content, silent, true);
    ```
*   **Observation**: If a player is offline for 8 hours, `applyOffline` runs a synchronous loop for up to 28,800 full game updates (`tick`). Each tick performs complex calculations (achievement metrics, quest progress, combat checks, stats, etc.). Doing this synchronously blocks the main UI thread, causing the browser tab to freeze for several seconds on load.

---

## 2. Logic Chain

1.  **Observation**: `save.ts` uses `{ ...base, ...raw }` to restore state.
    *   **Logic**: Because Javascript spreads only perform a shallow copy, nested properties that exist in `raw` will completely override those in `base`. If a newer release of the game adds a field inside `minions` (like `someNewField`) to `newGame()`, the save's outdated `raw.minions` object will block it, leading to runtime failures.
    *   **Conclusion**: A deep merge utility is needed in `save.ts` to ensure backward compatibility.

2.  **Observation**: `castSkill` applies `b.xpMult` to experience gains, then `addSkillExp` applies it again.
    *   **Logic**: A player with a +100% XP bonus (`xpMult = 2.0`) will have their base skill experience multiplied by `2.0` in the caller, and then multiplied by `2.0` again in `addSkillExp`, achieving a `4.0x` scaling.
    *   **Conclusion**: The multiplier should only be applied once. We should pass the raw base experience to `addSkillExp` and let it apply the multiplier, or remove the multiplier step from `addSkillExp`.

3.  **Observation**: `skillLevelUp` early-returns on `isOffline` and caps `slot.exp` before evolving.
    *   **Logic**: In an idle incremental game, players expect offline progression to allow skill evolution. Halting evolution means skills get stuck at their first tier's max level, wasting hours of offline XP.
    *   **Conclusion**: Evolution logic should run normally during offline ticks, with the log statements silenced if `isOffline` is true.

4.  **Observation**: `slotForItem` always falls back to `'acc1'` when both accessory slots are occupied.
    *   **Logic**: In `autoEquipBest`, the code iterates through `EQUIP_SLOTS` in sequence. If `acc1` has score 50 and `acc2` has score 40, and the bag has score 60 and 45 accessories:
        *   Evaluating `acc1` (50): 60 is better. It equips 60 into `acc1`, moving 50 to the bag.
        *   Evaluating `acc2` (40): 50 is better. It tries to equip 50. Since both slots are full, `slotForItem` returns `'acc1'`. It equips 50 into `acc1`, moving the superior 60 back to the bag.
        *   End state: `acc1` = 50, `acc2` = 40 (superior 60 is unused).
    *   **Conclusion**: `slotForItem` should evaluate which slot has the lower score when choosing which accessory to replace, or the caller should explicitly specify the target slot.

5.  **Observation**: `applyOffline` processes up to 28,800 ticks in a single synchronous block.
    *   **Logic**: Simulating 28,800 iterations of nested functions (checking 40+ achievements and 3 active quests on every tick) on a single thread blocks the event loop.
    *   **Conclusion**: Offline progression should either be processed in small asynchronous batches (e.g., 500 ticks per frame) or use an aggregated offline mathematical formula rather than executing the raw combat loop for every second.

---

## 3. Caveats

*   Only the client-side game loops (`packages/client/src/game/*`) were audited. The Cloudflare Workers backend was not audited.
*   We did not modify the files because this is a read-only investigation.
*   Assumed that critical hits do not exist in the base combat formulas since no references to `crit`, `critical`, or random multipliers were found in `combat.ts`.

---

## 4. Conclusion

We propose the following concrete design and implementation plans to address the bugs and fulfill the feature requirements:

### R2: Smart Auto-Combat Macros
#### Goal
Auto-cast active skills on cooldown and auto-consume healing potions when the player's health drops below 35% HP.

#### Design Proposal
1.  **Active Skills Auto-Cast**:
    *   Add a new state field: `state.macroEnabledSkills: Record<string, boolean>` to store which skills the player wants to auto-cast.
    *   Create a Macro Config UI overlay in the Combat tab, letting players toggle each equipped skill on/off for auto-cast.
    *   Update `combatRound` in `combat.ts`:
        ```ts
        if (!locked && state.combatMode === 'auto') {
          for (const id of state.equipped) {
            if (!state.enemy) break;
            if (state.macroEnabledSkills[id] === false) continue; // skipped by player macro setting
            if (castSkill(state, content, id, log, b, isOffline) && state.enemy.hp <= 0) {
              onKill(state, content, log, b, isOffline);
              break;
            }
          }
        }
        ```
2.  **Healing Potions**:
    *   Introduce healing potions as a stackable consumable. Add a `potions: number` field to `GameState`.
    *   Provide a toggle in the Macro UI: `state.autoPotionEnabled: boolean`.
    *   In `combatRound` (within `combat.ts`), check health thresholds at the beginning of each tick:
        ```ts
        if (state.autoPotionEnabled && state.hp / state.maxHp < 0.35 && state.potions > 0) {
          state.potions -= 1;
          const healAmount = Math.round(state.maxHp * 0.30); // heals 30% Max HP
          state.hp = Math.min(state.maxHp, state.hp + healAmount);
          log({ key: 'log.use_potion', params: { heal: healAmount, remaining: state.potions } });
        }
        ```

---

### R3: Dynamic Combat Visual Feedback
#### Goal
Display floating damage/heal texts colored by damage type (green for heals, red/orange for crit, yellow for poison, white for physical), and trigger a screen shake effect when a critical hit lands.

#### Design Proposal
1.  **Critical Hits Math**:
    *   Introduce a critical hit mechanic into `castSkill`:
        ```ts
        const Luck = effStat(state, 'LUCK');
        const critChance = Math.min(0.5, Luck * 0.005 + 0.05); // max 50% crit rate
        const isCrit = Math.random() < critChance;
        if (isCrit) {
          dmg = Math.round(dmg * 1.5); // 1.5x crit damage
        }
        ```
2.  **UI Overlay**:
    *   Add an absolute-positioned container `#combat-feedback-overlay` inside the enemy panel in `ui.ts`.
    *   Define a CSS class `.floating-text` with a keyframe animation that translates the element upwards (`transform: translateY(-50px)`) and fades it out (`opacity: 0`) over 800ms.
    *   Provide styles for colors:
        *   `.float-physical`: white
        *   `.float-poison`: yellow
        *   `.float-crit`: red/orange (with larger font-size/scale)
        *   `.float-heal`: green
3.  **Triggering Effects**:
    *   Expose a UI-bound event or buffer to record visual events: `state.visualFeedbackEvents: { text: string, type: 'physical'|'poison'|'crit'|'heal', id: number }[]`.
    *   When rendering the combat tab, map this array to DOM elements. Remove them from the state after they spawn, or handle it via a global DOM hook `triggerFloatingText(text, type)` in `ui.ts`.
    *   **Screen Shake**: If `isCrit` is true, add a `.crit-shake` class to the `.enemy-panel` element. In CSS, define:
        ```css
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .crit-shake {
          animation: shake 0.2s ease-in-out;
        }
        ```
        Remove the class after the animation finishes.

---

### R4: Detailed Combat Analytics Dashboard
#### Goal
Track the last 10 combat encounters and display average DPS, average EP/s, and a satiety and resource regeneration efficiency index.

#### Design Proposal
1.  **State Model**:
    *   Add `state.combatAnalytics: CombatEncounter[]` to `GameState`.
    *   Data structure:
        ```ts
        interface CombatEncounter {
          enemyId: string;
          ticks: number;
          damageDealt: number;
          epGained: number;
          satietyGained: number;
          mpConsumed: number;
          spConsumed: number;
          mpRegained: number;
          spRegained: number;
        }
        ```
2.  **Tracking Logic**:
    *   On `spawnEnemy`, create `state.currentEncounter = { ... }`.
    *   During each combat tick, accumulate damage dealt, EP, satiety, and resources consumed/regenerated.
    *   On `onKill` or `onDeath`, push `state.currentEncounter` into `state.combatAnalytics` and truncate the array to the last 10 items.
3.  **Analytics Calculations**:
    *   **Average DPS**: `damageDealt / ticks` (or scaled by tick duration).
    *   **Average EP/s**: `epGained / ticks` (or scaled by tick duration).
    *   **Satiety & Resource Efficiency Index**:
        *   `Satiety Index = satietyGained / (ticks * HungerRate)`. An index of `1.0` means satiety matches starvation rate.
        *   `Resource Efficiency Index = (mpRegained + spRegained) / Math.max(1, mpConsumed + spConsumed)`. A value `>= 1.0` means net-neutral or net-positive resource management in combat.
4.  **UI Tab**:
    *   Create a "Combat Analytics" sub-panel in the UI displaying these stats in a clean table.

---

### R5: Auto-Equip Best Gear & Quality Scores
#### Goal
Show relative power score percentage changes in the comparison UI, and implement a reliable "Equip Best" button.

#### Design Proposal
1.  **Quality Score & Comparison Display**:
    *   Update `renderItemDetail` in `packages/client/src/ui.ts` to compute:
        ```ts
        const scoreIt = itemScore(it);
        const scoreTarget = target ? itemScore(target) : 0;
        const diffPct = scoreTarget > 0 ? Math.round(((scoreIt - scoreTarget) / scoreTarget) * 100) : 100;
        ```
    *   Display `+X% Power Score` (or `-X% Power Score`) in green/red beside the item details in the comparison section.
2.  **Fixing the Accessory Bug**:
    *   Modify `slotForItem` in `packages/client/src/game/loot.ts` to compare scores if both slots are full:
        ```ts
        export function slotForItem(it: LootItem, equipment: GameState['equipment']): EquipSlot {
          if (it.type !== 'accessory') return it.type;
          if (!equipment.acc1) return 'acc1';
          if (!equipment.acc2) return 'acc2';
          // Replace the accessory with the lower power score
          return itemScore(equipment.acc1) < itemScore(equipment.acc2) ? 'acc1' : 'acc2';
        }
        ```
3.  **"Equip Best" Button**:
    *   Add an `"Equip Best"` button in the inventory tab toolbar. It will trigger `onAutoEquip`, which runs the updated `autoEquipBest` logic.

---

## 5. Verification Method

### Compilation & Type Check Verification
Ensure the project compiles with no warnings or errors by running:
```bash
cmd /c npm run typecheck
```

### Test Scripts Verification
Execute the test suites to ensure existing functionality remains intact:
```bash
cmd /c npx tsx scripts/run_tests.ts
cmd /c npx tsx scripts/run_new_tests.ts
```

### Invalidation Conditions
The design is invalidated if:
*   A type mismatch occurs when modifying `GameState` in `packages/shared/src/types.ts`.
*   Saves become corrupted on load due to schema changes. (Ensure any new fields added to `GameState` are safely backfilled inside `migrate` in `packages/client/src/main.ts` or during a deep merge in `packages/client/src/game/save.ts`).

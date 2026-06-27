import { newGame } from '../packages/client/src/game/state';
import { spinWeb, collectWeb, tickWeb, applyRoomHazardTick } from '../packages/client/src/game/combat';
import { evolve } from '../packages/client/src/game/evolution';
import { rebirth } from '../packages/client/src/game/rebirth';
import { chooseRebirthPerk } from '../packages/client/src/game/teachings';
import type { GameState } from '../packages/client/src/game/state';
import { currentRoomHazard } from '../packages/client/src/game/hazards';

console.log("Starting quality upgrade features tests...");

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error("Assertion FAILED:", message);
    process.exit(1);
  } else {
    console.log("Assertion PASSED:", message);
  }
}

// Mock Content
const dummyContent: any = {
  difficulties: {
    get: () => ({ startLayer: 1 })
  },
  dungeon: {
    layers: [
      { id: 1, tierReq: 0, boss: 'boss1', enemyPool: ['pest'] },
      { id: 3, tierReq: 0, boss: 'boss3', enemyPool: ['pest'] }
    ]
  },
  races: {
    get: () => ({
      head: { eyes: [] },
      startStats: { STR: 5, VIT: 5, AGI: 5, INT: 5, WIS: 5, LUCK: 5 }
    })
  },
  forms: {
    get: (id: string) => {
      if (id === 'hatchling_spider') {
        return { id: 'hatchling_spider', levelReq: 1, evolvesTo: ['spider_t3'] };
      }
      if (id === 'spider_t3') {
        return { id: 'spider_t3', levelReq: 1, evolvesTo: ['arachnid_sovereign'] };
      }
      if (id === 'arachnid_sovereign') {
        return { id: 'arachnid_sovereign', levelReq: 1, evolvesTo: [] };
      }
      return null;
    },
    values: () => []
  },
  skills: {
    get: () => null
  }
};

const dummyLog = () => {};

// 1. Test Idle Web Hunting
{
  console.log("\n--- Testing Idle Web Hunting ---");
  const state = newGame();
  state.raceId = 'spider';
  state.formId = 'spider_t3';
  state.tier = 3;
  state.roomCleared = true;
  state.sp = 50;
  state.sig = 30;
  state.skills = [{ id: 'larder', level: 1, exp: 0 }];

  // Spin web succeeds
  const spun = spinWeb(state, dummyLog);
  assert(spun === true, "Spin web succeeds");
  assert(state.webRoom !== null, "webRoom is set");
  assert(state.webRoom.layer === state.pos.layer, "webRoom layer matches position");
  assert(state.webTicks === 500, "Web durability initialized to 500");
  assert(state.sp === 30, "SP deducted (50 -> 30)");
  assert(state.sig === 20, "Spider web gauge deducted (30 -> 20)");

  // Accumulate EP and food via tickWeb
  const b = { lootMult: 1, idleMult: 1 } as any;
  tickWeb(state, b, dummyLog, false);
  assert(state.webTicks === 499, "Web durability ticks down");
  assert(state.webAccEp > 0, "EP accumulated");

  // Collect reward
  const initialEp = state.ep;
  state.webAccFood = [{ enemyId: 'cave_pest', satiety: 15, decay: 0 }];
  collectWeb(state, dummyLog);
  assert(state.ep > initialEp, "EP added to state");
  assert(state.inventory.length === 1, "Food caught added to inventory");
  assert(state.webAccEp === 0, "Accumulator EP reset");
  assert(state.webAccFood.length === 0, "Accumulator food reset");
}

// 2. Test Evolution Mutations
{
  console.log("\n--- Testing Evolution Mutations ---");
  const state = newGame();
  state.level = 10;
  state.tier = 2;
  state.stats = { STR: 5, VIT: 5, AGI: 5, INT: 5, WIS: 5, LUCK: 5 };

  // Make Math.random force mutation roll and choose venomous
  const oldRandom = Math.random;
  Math.random = () => {
    // 1st call inside evolve() for mutation check (< 0.15) -> 0.05 (triggers mutation)
    // 2nd call inside evolve() for pool check (< 0.6) -> 0.1 (triggers positive pool)
    // 3rd call inside evolve() for item index -> 0 (first positive item: venomous)
    // 4th call inside evolve() for ambush check (< ambushChance) -> 0.99 (no ambush)
    return 0.05;
  };

  evolve(state, dummyContent, 'spider_t3', dummyLog);
  Math.random = oldRandom;

  assert(state.mutations.length === 1, "Mutation rolled and added to state");
  assert(state.mutations[0] === 'mut_venomous', "mut_venomous mutation added");
}

// 3. Test Room Hazards
{
  console.log("\n--- Testing Room Hazards ---");
  const state = newGame();
  
  // Find a room that deterministically has toxic_mist (or any HP-draining hazard)
  let hazard = null;
  for (let r = 2; r <= 100; r++) {
    state.pos = { layer: 10, floor: 1, room: r }; // Deeper layers have higher chance
    const hz = currentRoomHazard(state);
    if (hz && hz.hpDrainPct) {
      hazard = hz;
      break;
    }
  }
  assert(hazard !== null, "Deterministic room hash yields hazard");

  state.hp = 100;
  state.maxHp = 100;
  applyRoomHazardTick(state, dummyLog);
  const expectedHp = 100 - Math.round(100 * hazard!.hpDrainPct!);
  assert(state.hp === expectedHp, `Hazard (${hazard!.id}) drains HP correctly (expected: ${expectedHp}, got: ${state.hp})`);
}

// 4. Test Rebirth Teachings
{
  console.log("\n--- Testing Rebirth Teachings ---");
  const state = newGame();
  state.gatekeeperCleared = true;
  
  rebirth(state, dummyContent, dummyLog);
  assert(state.pendingRebirthPerk === true, "rebirth sets pendingRebirthPerk to true");
  assert(state.rebirthPerkChoices.length === 3, "rebirth rolls 3 perk choices");

  const chosenId = state.rebirthPerkChoices[0];
  chooseRebirthPerk(state, chosenId);
  assert(state.pendingRebirthPerk === false, "choosing perk clears pending state");
  assert(state.rebirthPerks.includes(chosenId), "chosen perk ID is stored in rebirthPerks");
}

console.log("\nAll quality upgrade features tests passed successfully!");

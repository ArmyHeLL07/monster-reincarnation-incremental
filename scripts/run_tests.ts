import { newGame } from '../packages/client/src/game/state';
import { spawnMinion } from '../packages/client/src/game/combat';
import { rebirth } from '../packages/client/src/game/rebirth';
import type { GameState } from '../packages/client/src/game/state';

console.log("Starting Spiderling Minion (Queen) Tests...");

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error("Assertion FAILED:", message);
    process.exit(1);
  } else {
    console.log("Assertion PASSED:", message);
  }
}

// Setup state helper
function setupState(): GameState {
  const state = newGame();
  state.minions = {
    dps: 0,
    tank: 0,
    utility: 0,
    tankHp: 0,
    tankMaxHp: 0
  };
  state.sp = 100;
  state.mp = 100;
  state.hunger = 0;
  return state;
}

// 1. Spawning a minion deducts correct resources
{
  console.log("\n--- Testing Minion Spawning Resource Deduction ---");
  const state = setupState();
  state.sp = 50;
  state.mp = 50;
  state.hunger = 10;
  
  const success = spawnMinion(state, 'dps');
  assert(success === true, "Successfully spawned minion");
  assert(state.minions.dps === 1, "dps minion count incremented");
  assert(state.sp === 40, "SP deducted by 10 (50 -> 40)");
  assert(state.mp === 45, "MP deducted by 5 (50 -> 45)");
  assert(state.hunger === 25, "Hunger increased by 15 (10 -> 25)");
}

// 2. Minion count cannot exceed limit
{
  console.log("\n--- Testing Minion Spawn Limits ---");
  const state = setupState();
  // WIS = 15, level = 5 -> floor(15/10) + floor(5/5) = 1 + 1 = 2 limit
  state.stats.WIS = 15;
  state.level = 5;
  
  assert(spawnMinion(state, 'dps') === true, "Spawn 1/2 dps minion success");
  assert(spawnMinion(state, 'tank') === true, "Spawn 2/2 tank minion success");
  assert(spawnMinion(state, 'utility') === false, "Spawn 3/2 utility minion fails (at limit)");
  assert(state.minions.dps === 1, "dps remains 1");
  assert(state.minions.tank === 1, "tank remains 1");
  assert(state.minions.utility === 0, "utility remains 0");
  
  // Test arachnid sovereign multiplier (limit = 2 * 2 = 4)
  state.formId = 'arachnid_sovereign';
  assert(spawnMinion(state, 'utility') === true, "Spawn 3/4 utility minion success (sovereign limit 4)");
  assert(spawnMinion(state, 'dps') === true, "Spawn 4/4 dps minion success (sovereign limit 4)");
  assert(spawnMinion(state, 'dps') === false, "Spawn 5/4 dps minion fails (at sovereign limit)");
  assert(state.minions.dps === 2, "dps count is 2");
  assert(state.minions.tank === 1, "tank count is 1");
  assert(state.minions.utility === 1, "utility count is 1");
}

// 3. Active minions reset to 0 on Rebirth
{
  console.log("\n--- Testing Rebirth Reset ---");
  const state = setupState();
  state.minions.dps = 2;
  state.minions.tank = 1;
  state.minions.utility = 1;
  state.minions.tankHp = 20;
  state.minions.tankMaxHp = 20;
  
  state.gatekeeperCleared = true; // Required to trigger rebirth
  
  const dummyContent: any = {
    difficulties: {
      get: () => ({ startLayer: 1 })
    },
    dungeon: {
      layers: [{ id: 1, tierReq: 0 }]
    },
    races: {
      get: () => ({
        head: { eyes: [] },
        startStats: { STR: 5, VIT: 5, AGI: 5, INT: 5, WIS: 5, LUCK: 5 }
      })
    },
    forms: {
      values: () => []
    },
    skills: {
      get: () => null
    }
  };
  
  const rebirthSuccess = rebirth(state, dummyContent, () => {});
  assert(rebirthSuccess === true, "Rebirth executed successfully");
  assert(state.minions.dps === 0, "dps minion count reset to 0");
  assert(state.minions.tank === 0, "tank minion count reset to 0");
  assert(state.minions.utility === 0, "utility minion count reset to 0");
  assert(state.minions.tankHp === 0, "tankHp reset to 0");
  assert(state.minions.tankMaxHp === 0, "tankMaxHp reset to 0");
}

console.log("\nAll Spiderling Minion (Queen) tests passed successfully!");

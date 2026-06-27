import { loadI18n, t } from './i18n';
import { loadContent, type Content } from './game/content';
import { loadLangContent } from './game/langContent';
import { GameClock } from './game/clock';
import { newGame, recomputeMaxes, emptyEquipment, emptyAllocated, type GameState, type LogEvent } from './game/state';
import { equipItem, unequipItem, discardItem, forgeItem, forgeCost, autoEquipBest, scrapUpTo, lootDisplayName } from './game/loot';
import { tick, deepRead, allocStat, courtDeath, ensureLayerRooms, useSkillManual, toggleEquip, unequipAll, ensureEquipped, eatFood, advanceRoom, removeSkill, sacrificeSkill, chooseEvent, answerBossRiddle, intSkipRiddle, abandonRiddleForBoss, chooseBossOption, dedupeSkills, respecStats, hasSkillLine, skillSlots, chooseHumanPath, keepGrowing, saveLoadout, loadLoadout, buyStatPointEp, buyTempBuff, injectSkillXp, spawnMinion, spinWeb, collectWeb } from './game/combat';
import { applyRace } from './game/race';
import { assignEye, cycleEyeMode, clearEye, fuseEyes } from './game/eyes';
import { evolve, remapRemovedForms, switchBranch } from './game/evolution';
import { fuse, registerFusionSkill } from './game/fusion';
import { rebirth } from './game/rebirth';
import { buySoulUpgrade } from './game/soul';
import { aggregateBonuses } from './game/effects';
import { chooseRebirthPerk } from './game/teachings';
import { search, readBook, answerRoom, repairScar } from './game/discovery';
import { forage, eatFoundFood, discardFoundFood } from './game/forage';
import { load, save, clear } from './game/save';
import { markSeenSkills } from './game/skill_tree';
import { mount, live, render, pushLog, setLastFusion, resetUi, playEvolveEffect, playRebirthEffect, type UiActions } from './ui';
import type { Difficulty } from '@mri/shared';

const OFFLINE_TICK_CAP = 28800; // 8 hours cap


async function init(): Promise<void> {
  const base = import.meta.env.BASE_URL;
  let state = load() ?? newGame();
  migrate(state);
  const lang = state.lang ?? 'en';
  await loadI18n(base, lang);
  await loadLangContent(base, lang); // native riddles + lore for this language
  const content = await loadContent(base);
  recomputeMaxes(state);
  repairSave(state, content); // content-aware fixes (dedupe skill lineages, remap removed forms) — BEFORE offline
  ensureLayerRooms(state, content); // roll this player's random rooms-per-floor once
  ensureEquipped(state, content); // backfill the equipped loadout from owned active skills
  for (const r of Object.values(state.fusionCache)) registerFusionSkill(content, r);

  function logFn(e: LogEvent): void {
    pushLog(e.key, e.params);
  }

  applyOffline(state, content, logFn);

  const actions: UiActions = {
    onSetAction: (a) => {
      state.action = a;
      state.autoResume = false;
      save(state);
      render(state);
    },
    onDeepRead: () => {
      deepRead(state, content, logFn);
      save(state);
      render(state);
    },
    onUseSkill: (id) => {
      useSkillManual(state, content, id, logFn);
      save(state);
      render(state);
    },
    onToggleMode: () => {
      state.combatMode = state.combatMode === 'auto' ? 'manual' : 'auto';
      save(state);
      render(state);
    },
    onAdvance: () => {
      advanceRoom(state, content, logFn);
      save(state);
      render(state);
    },
    onToggleAutoAdvance: () => {
      state.autoAdvance = !state.autoAdvance;
      save(state);
      render(state);
    },
    onToggleEquip: (id) => {
      toggleEquip(state, content, id);
      save(state);
      render(state);
    },
    onUnequipAll: () => {
      unequipAll(state);
      save(state);
      render(state);
    },
    onSaveLoadout: (slot) => { saveLoadout(state, slot); save(state); render(state); },
    onLoadLoadout: (slot) => { loadLoadout(state, content, slot); save(state); render(state); },
    onBuySoul: (id) => {
      if (buySoulUpgrade(state, id)) {
        recomputeMaxes(state);
        save(state);
        render(state);
      }
    },
    onDeleteSkill: (id) => {
      if (!window.confirm(t('ui.delete_confirm'))) return;
      const def = content.skills.get(id);
      removeSkill(state, content, id);
      if (def) logFn({ key: 'log.skill_deleted', params: { skill: def.locKeyName } });
      save(state);
      render(state);
    },
    onSacrificeSkill: (id) => {
      if (!window.confirm(t('ui.sacrifice_confirm'))) return;
      sacrificeSkill(state, content, id, logFn);
      save(state);
      render(state);
    },
    onSelectLayer: (id) => {
      const layer = content.dungeon.layers.find((l) => l.id === id);
      if (layer && state.tier >= layer.tierReq) {
        state.pos = { layer: id, floor: 1, room: 1 };
        state.enemy = null;
        state.roomCleared = false;
        state.pendingEvent = null; // abandon any open event/riddle when jumping elsewhere
        state.bossRiddle = null;
        save(state);
        render(state);
      }
    },
    onSetPos: (layerId, floor) => {
      // Revisit an already-cleared floor of this layer to farm it.
      const explored = state.exploredMax[layerId] ?? [];
      let reachedFloors = 1;
      for (let f = 1; f <= explored.length; f++) if ((explored[f - 1] ?? 0) > 0) reachedFloors = f;
      if (state.pos.layer === layerId && floor >= 1 && floor <= Math.max(1, reachedFloors)) {
        state.pos = { layer: layerId, floor, room: 1 };
        state.enemy = null;
        state.roomCleared = false;
        state.pendingEvent = null; // abandon any open event/riddle when jumping to another floor
        state.bossRiddle = null;
        save(state);
        render(state);
      }
    },
    onSetRoom: (floor, room) => {
      const cur = content.dungeon.layers.find((l) => l.id === state.pos.layer);
      if (!cur) return;
      const explored = state.exploredMax[cur.id] ?? [];
      const reachedRoom = Math.max(explored[floor - 1] ?? 0, (state.pos.floor === floor) ? state.pos.room : 0);
      if (room >= 1 && room <= reachedRoom) {
        state.pos.floor = floor;
        state.pos.room = room;
        state.enemy = null;
        state.roomCleared = false;
        state.pendingEvent = null;
        state.bossRiddle = null;
        save(state);
        render(state);
      }
    },
    onAllocStat: (stat) => {
      allocStat(state, stat);
      save(state);
      render(state);
    },
    onEvolve: (formId) => {
      const ok = evolve(state, content, formId, logFn);
      save(state);
      render(state);
      if (ok) playEvolveEffect(state.formId); // celebrate the new form (state.formId is now the target)
    },
    onSwitchBranch: (formId) => {
      const ok = switchBranch(state, content, formId, logFn);
      save(state);
      render(state);
      if (ok) playEvolveEffect(state.formId); // same celebration as an evolution
    },
    onFuse: (a, b) => {
      const r = fuse(state, content, a, b, logFn);
      if (r) setLastFusion(r);
      save(state);
      render(state);
    },
    onAssignEye: (slot, ability) => {
      assignEye(state, content, slot, ability);
      save(state);
      render(state);
    },
    onCycleMode: (slot) => {
      cycleEyeMode(state, content, slot);
      save(state);
      render(state);
    },
    onClearEye: (slot) => {
      clearEye(state, slot);
      save(state);
      render(state);
    },
    onFuseEyes: (slotA, slotB) => {
      fuseEyes(state, content, slotA, slotB, logFn);
      save(state);
      render(state);
    },
    onDiscardFood: (i) => {
      state.inventory.splice(i, 1);
      save(state);
      render(state);
    },
    onEat: (i) => {
      eatFood(state, content, i, logFn);
      save(state);
      render(state);
    },
    onToggleAutoEat: () => {
      state.autoEat = !state.autoEat;
      save(state);
      render(state);
    },
    onMeditate: () => {
      state.action = 'meditate';
      state.autoResume = false;
      state.enemy = null;
      save(state);
      render(state);
    },
    onSearch: () => {
      search(state, content, logFn);
      save(state);
      render(state);
    },
    onForage: () => {
      forage(state, content, logFn);
      save(state);
      render(state);
    },
    onForageEat: () => {
      eatFoundFood(state, content, logFn);
      save(state);
      render(state);
    },
    onForageDiscard: () => {
      discardFoundFood(state, logFn);
      save(state);
      render(state);
    },
    onTutorialNext: () => {
      if (typeof state.tutorialStep === 'number') {
        const nextStep = state.tutorialStep + 1;
        state.tutorialStep = nextStep >= 8 ? 'done' : nextStep;
      }
      save(state);
      render(state);
    },
    onTutorialSkip: () => {
      state.tutorialStep = 'skipped';
      save(state);
      render(state);
    },
    onTutorialReopen: () => {
      state.tutorialStep = 0;
      save(state);
      render(state);
    },
    onMarkHintSeen: (id: string) => {
      if (!state.seenHints.includes(id)) state.seenHints.push(id);
      save(state);
    },
    onNavigateGuide: (_anchor: string) => {
      save(state);
    },
    onToggleAutoFood: () => { state.autoSearchFood = !state.autoSearchFood; save(state); render(state); },
    onToggleAutoExplore: () => { state.autoSearchExplore = !state.autoSearchExplore; save(state); render(state); },
    onToggleAutoEvent: () => { state.autoEventDecision = !state.autoEventDecision; save(state); render(state); },
    onSetPuzzleMode: (mode) => { state.autoEventPuzzleMode = mode; save(state); render(state); },
    onSetMoralMode: (mode) => { state.moralAutoMode = mode; save(state); render(state); },
    onSpawnMinion: (type) => {
      if (spawnMinion(state, type)) {
        logFn({ key: `log.minion_spawned_${type}` });
        save(state);
        render(state);
      } else {
        logFn({ key: 'log.minion_spawn_failed' });
      }
    },
    onSpinWeb: () => {
      if (spinWeb(state, logFn)) {
        save(state);
        render(state);
      }
    },
    onCollectWeb: () => {
      collectWeb(state, logFn);
      save(state);
      render(state);
    },
    onChooseRebirthPerk: (perkId) => {
      chooseRebirthPerk(state, perkId);
      save(state);
      render(state);
    },
    onCourtDeath: () => {
      courtDeath(state, content, logFn);
      save(state);
      render(state);
    },
    onRebirth: () => {
      if (rebirth(state, content, logFn)) {
        resetUi();
        save(state);
        render(state);
        playRebirthEffect(state); // death → soul-light → rebirth arc
      }
    },
    onReadBook: (id) => {
      readBook(state, content, id, logFn);
      save(state);
      render(state);
    },
    onAnswerRoom: (answer) => {
      answerRoom(state, content, answer, logFn);
      save(state);
      render(state);
    },
    onChooseEvent: (i) => {
      chooseEvent(state, content, i, logFn);
      save(state);
      render(state);
    },
    onAnswerBossRiddle: (a) => {
      answerBossRiddle(state, content, a, logFn);
      save(state);
      render(state);
    },
    onIntSkipRiddle: () => {
      if (intSkipRiddle(state, content, logFn)) { save(state); render(state); }
    },
    onAbandonRiddle: () => { abandonRiddleForBoss(state, content, logFn); save(state); render(state); },
    onBossChoice: (mode, difficulty) => {
      chooseBossOption(state, content, mode, difficulty, logFn);
      save(state);
      render(state);
    },
    onRepairScar: () => {
      repairScar(state, logFn);
      save(state);
      render(state);
    },
    onSelectRace: (raceId) => {
      if (state.kills > 0 || state.tier > 0 || state.level > 1) return; // race locked after first kill
      applyRace(state, raceId, content);
      state.raceConfirmed = true;
      save(state);
      render(state);
    },
    onEquipItem: (uid) => {
      if (equipItem(state, uid)) {
        recomputeMaxes(state); // worn gear feeds HP/MP/SP
        save(state);
        render(state);
      }
    },
    onUnequipSlot: (slot) => {
      if (unequipItem(state, slot)) {
        recomputeMaxes(state);
        save(state);
        render(state);
      }
    },
    onDiscardItem: (uid) => {
      const ep = discardItem(state, uid);
      if (ep > 0) {
        state.ep += ep;
        logFn({ key: 'log.scrapped', params: { ep } });
      }
      save(state);
      render(state);
    },
    onForgeItem: (uid) => {
      const idx = state.inventoryItems.findIndex((i) => i.uid === uid);
      if (idx < 0) return;
      const cost = forgeCost(state.inventoryItems[idx]);
      if (cost <= 0 || state.ep < cost) return; // maxed or can't afford
      const upgraded = forgeItem(state.inventoryItems[idx]);
      if (!upgraded) return;
      state.ep -= cost;
      state.inventoryItems[idx] = upgraded;
      logFn({ key: 'log.forged', params: { item: lootDisplayName(upgraded), rarity: `rarity.${upgraded.rarity}` } });
      save(state);
      render(state);
    },
    onAutoEquip: () => {
      const n = autoEquipBest(state);
      if (n > 0) { recomputeMaxes(state); logFn({ key: 'log.autoequip', params: { n } }); }
      save(state);
      render(state);
    },
    onScrapCommon: () => {
      const ep = scrapUpTo(state, 'uncommon'); // scrap common + uncommon
      if (ep > 0) { state.ep += ep; logFn({ key: 'log.scrap_all', params: { ep } }); }
      save(state);
      render(state);
    },
    onRespec: () => {
      if (respecStats(state)) { logFn({ key: 'log.respec' }); save(state); render(state); }
    },
    onSetDifficulty: (d: Difficulty) => {
      // Only change the difficulty knobs — never teleport the player or bypass layer/skill progression.
      // (The "start at a deeper layer" behaviour applies on a fresh start / rebirth, not on a live toggle.)
      state.difficulty = d;
      save(state);
      render(state);
    },
    onTogglePermadeath: () => {
      state.permadeath = !state.permadeath;
      save(state);
      render(state);
    },
    onToggleModifierFreeRooms: () => {
      state.modifierFreeRooms = !state.modifierFreeRooms;
      save(state);
      render(state);
    },
    onSetAutosave: (m) => {
      state.autosaveMin = m;
      save(state);
      render(state);
    },
    onSetLang: (l) => {
      state.lang = l;
      void Promise.all([loadI18n(base, l), loadLangContent(base, l)]).then(() => {
        save(state);
        mount(state, content, actions); // re-build shell so sidebar tab labels + native riddles/lore update
      });
    },
    onSaveNow: () => {
      save(state);
      logFn({ key: 'log.saved' });
      render(state);
    },
    onExportSave: () => download('save.json', JSON.stringify(state)),
    onImportSave: () => importSave(),
    onBugReport: () => openIssue(state, 'bug'),
    onSuggest: () => openIssue(state, 'suggestion'),
    onReset: () => {
      if (!window.confirm(t('ui.reset_confirm'))) return; // guard against accidental wipe
      clear();
      state = newGame();
      resetUi();
      save(state);
      render(state);
    },
    onChooseHumanPath: (pathId) => {
      chooseHumanPath(state, content, pathId, logFn);
      save(state);
      render(state);
    },
    onKeepGrow: () => {
      keepGrowing(state, content, logFn);
      save(state);
      render(state);
    },
    onBuyStatPointEp: () => {
      if (buyStatPointEp(state)) {
        logFn({ key: 'log.buy_stat_ep', params: { pts: state.statPoints } });
        save(state);
        render(state);
      }
    },
    onBuyTempBuff: (buffId: string) => {
      if (buyTempBuff(state, buffId)) {
        logFn({ key: `log.buff_${buffId}` });
        save(state);
        render(state);
      }
    },
    onInjectSkillXp: (skillId: string) => {
      if (injectSkillXp(state, content, skillId, logFn)) {
        save(state);
        render(state);
      }
    },
  };

  mount(state, content, actions);

  let ticks = 0;
  const clock = new GameClock(1000, () => {
    tick(state, content, logFn);
    markSeenSkills(state, content);
    ticks += 1;
    if (ticks % Math.max(1, state.autosaveMin * 60) === 0) save(state);
    live(state);
  });
  clock.start();

  window.addEventListener('beforeunload', () => save(state));

  function importSave(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return;
      void file.text().then((text) => {
        try {
          state = JSON.parse(text) as GameState;
          migrate(state);
          recomputeMaxes(state);
          repairSave(state, content);
          for (const r of Object.values(state.fusionCache)) registerFusionSkill(content, r);
          resetUi();
          save(state);
          logFn({ key: 'log.imported' });
        } catch {
          logFn({ key: 'log.import_failed' });
        }
        render(state);
      });
    });
    input.click();
  }
}

/** Backfill fields missing from older saves. */
function migrate(s: GameState): void {
  const d = newGame();
  s.raceId ??= d.raceId;
  s.pos ??= d.pos;
  s.formId ??= d.formId;
  s.eyeAssignments ??= d.eyeAssignments;
  s.fusionCache ??= d.fusionCache;
  s.outbox ??= d.outbox;
  s.inventory ??= [];
  s.spRegenBonus ??= 0;
  s.level ??= 1;
  s.tier ??= 0;
  s.xp ??= 0;
  s.statPoints ??= 0;
  s.autosaveMin ??= 5;
  s.hunger ??= 0;
  s.action ??= 'idle';
  s.autoResume ??= false;
  s.mpTransferUnlocked ??= false;
  if (s.atkCd == null) s.atkCd = 0;
  s.equipped ??= [];
  s.combatMode ??= 'auto';
  s.cooldowns ??= {};
  s.autoEat ??= true;
  s.lastSearchPos ??= '';
  s.fusionUnlocked ??= false;
  s.badFusions ??= 0;
  if (s.maxSp == null) s.maxSp = d.maxSp;
  if (s.sp == null) s.sp = s.maxSp;
  if (s.maxMp == null) s.maxMp = d.maxMp;
  if (s.mp == null) s.mp = s.maxMp;
  // v2 fields — difficulty, rebirth, ruler, meditation, discovery (GDD §C/§7.5/§7.6/§7.7/§8.5).
  s.difficulty ??= d.difficulty;
  s.permadeath ??= d.permadeath;
  s.hellClears ??= [];
  s.rebirthCount ??= 0;
  s.unlocks ??= [];
  s.kills ??= 0;
  s.gatekeeperCleared ??= false;
  s.rebirthBoon ??= 0;
  s.ruler ??= { sin: 0, virtue: 0, taboo: 0, powers: [] };
  s.meditation ??= 0;
  s.meditationUnlocked ??= false;
  s.booksFound ??= [];
  s.discoveries ??= [];
  s.mapFragments ??= 0;
  s.loreFragments ??= 0;
  s.pendingRoom ??= null;
  s.scars ??= 0;
  s.exploredMax ??= {};
  s.layerRooms ??= {};
  s.layerFloors ??= {};
  s.seenForms ??= [];
  s.formHistory ??= [];
  // Eski kayıt: formHistory boşsa en az mevcut formu koy (geçmiş ara formlar kaybolmuş olabilir;
  // ağaç patlamaz, mevcut form doğru "current" görünür).
  if (s.formHistory.length === 0 && s.formId) s.formHistory.push(s.formId);
  // v3 map model: rooms are now per-floor arrays. Drop any old per-layer single-number entries
  // so each floor re-rolls its own random width on next access (fog re-reveals as you move).
  const rooms = s.layerRooms as Record<string, unknown>;
  for (const k of Object.keys(rooms)) if (!Array.isArray(rooms[k])) delete rooms[k];
  const expl = s.exploredMax as Record<string, unknown>;
  for (const k of Object.keys(expl)) if (!Array.isArray(expl[k])) delete expl[k];
  s.autoAdvance ??= false;
  s.roomCleared ??= false;
  s.pendingEvent ??= null;
  s.resolvedEvents ??= [];
  s.bossRiddle ??= null;
  s.riddleLimits ??= {};
  s.statusEffects ??= [];
  // v4 fields — adaptive resistance, death analysis
  s.dmgStreakType ??= undefined;
  if (s.dmgStreak == null) s.dmgStreak = 0;
  s.lastHit ??= undefined;
  // v5 fields — race selection confirmation
  s.raceConfirmed ??= s.kills > 0 || s.tier > 0 || s.level > 1;
  // v6 fields — loot / equipment (humanoid races)
  s.inventoryItems ??= [];
  s.equipment ??= emptyEquipment();
  s.allocated ??= emptyAllocated();
  // v7 fields — race signature mechanics + bestiary. CRITICAL: missing `sig` made `sig + 1` = NaN
  // on the first kill, which cascaded into armor → damage → hp/mp turning NaN. Sanitize aggressively.
  if (!Number.isFinite(s.sig)) s.sig = 0;
  s.sigAbsorb ??= null;
  s.killedEnemies ??= {};
  // v8 fields — Soul prestige tree
  if (!Number.isFinite(s.souls)) s.souls = 0;
  s.soulUpgrades ??= {};
  // Repair any NaN that an earlier build already persisted into core pools.
  if (!Number.isFinite(s.scars)) s.scars = 0;
  if (!Number.isFinite(s.hp)) s.hp = Number.isFinite(s.maxHp) ? s.maxHp : 1;
  if (!Number.isFinite(s.mp)) s.mp = Number.isFinite(s.maxMp) ? s.maxMp : 0;
  if (!Number.isFinite(s.sp)) s.sp = Number.isFinite(s.maxSp) ? s.maxSp : 0;
  // v8 fields — Human Path, room kill quota, skill tree reveal, Threshold Endurance (Faz 3/4)
  s.humanPath ??= undefined;
  s.pendingHumanPath ??= false;
  s.evolveAckCount ??= 0;
  s.loadouts ??= [];
  s.achievements ??= [];
  s.activeQuests ??= [];
  s.questsDone ??= 0;
  s.fusionCount ??= 0;
  s.branchSwitchCount ??= 0;
  s.deaths ??= 0;
  s.racesPlayed ??= [];
  s.gatekeepersByRace ??= [];
  s.treesCompleted ??= [];
  s.roomKillCount ??= 0;
  s.roomEnemyId ??= null;
  s.seenSkillIds ??= [];
  s.nearDeathCount ??= 0;
  s.vitEnduranceXP ??= 0;
  s.vitEndurancePerm ??= 0;
  s.absorbVit ??= 0;
  // v9 fields — Yemek Ara forage mechanic
  s.forageCD ??= 0;
  s.pendingForage ??= null;
  // v10 fields — tutorial sistemi
  s.tutorialStep ??= 0;
  s.seenHints ??= [];
  // v11 fields — Auto-Search & Auto-Event
  s.totalSearchCount ??= 0;
  s.autoSearchUnlocked ??= false;
  s.autoSearchFood ??= false;
  s.autoSearchExplore ??= false;
  s.searchCD ??= 0;
  s.autoEventDecision ??= false;
  s.autoEventPuzzleMode ??= 'skip';
  s.moralAutoMode ??= 'ask';
  // v12 fields — EP Shop
  s.epStatsBought ??= 0;
  s.tempBuffs ??= {};
  // v13 — slime gained a 2nd eye slot; backfill missing e2 for existing slime saves
  if (s.raceId === 'slime' && s.eyeAssignments && !('e2' in s.eyeAssignments)) {
    s.eyeAssignments['e2'] = null;
  }
}

/**
 * Content-aware save repair (needs the loaded content graph, unlike the field-backfill `migrate`).
 * Runs once on load/import, BEFORE offline catch-up so a corrupt save can't be simulated forward:
 *   1. dedupeSkills — collapse duplicate skill slots from the old in-place-evolution grant bug.
 *   2. remapRemovedForms — point saves stuck on a deleted form onto the new binary tree.
 */
/** v1.6.1 balance: the 2nd starting attack skill each single-attack race now gets. */
const RACE_SECOND_ATTACK: Record<string, string> = {
  slime: 'toxic_cloud', skeleton: 'sword_slash', golem: 'heavy_slam', human: 'sword_slash',
};

/** One-time backfill of the new 2nd starting attack skill onto existing characters (v1.6.1).
 *  Flagged in `unlocks` so it runs once; skips if the player already owns it (or an evolved form),
 *  so deleting it later won't re-grant it. */
function applyStartSkillFix(state: GameState, content: Content): void {
  if (state.unlocks.includes('v161_startskill')) return;
  state.unlocks.push('v161_startskill');
  const skill = RACE_SECOND_ATTACK[state.raceId];
  if (!skill || hasSkillLine(state, content, skill)) return;
  state.skills.push({ id: skill, level: 1, exp: 0 });
  if (state.equipped.length < skillSlots(state) && !state.equipped.includes(skill)) {
    state.equipped.push(skill);
  }
}

function repairSave(state: GameState, content: Content): void {
  dedupeSkills(state, content);
  remapRemovedForms(state, content);
  applyStartSkillFix(state, content);
}

/** Simulate elapsed offline time for the active action (idle = frozen, no offline). */
function applyOffline(state: GameState, content: Content, log: (e: LogEvent) => void): void {
  const elapsedSec = Math.floor((Date.now() - state.lastSeen) / 1000);
  if (elapsedSec < 5 || state.action === 'idle') return;
  const ticks = Math.min(elapsedSec, OFFLINE_TICK_CAP);
  const beforeEp = state.ep;
  const silent: (e: LogEvent) => void = () => {};
  for (let i = 0; i < ticks; i++) tick(state, content, silent, true);
  // Sleepless Mind (soul) / Sloth (ruler): idle yield multiplier — extra EP on top of what was simulated.
  const idleBonus = aggregateBonuses(state, content).idleMult - 1;
  if (idleBonus > 0) state.ep += Math.round((state.ep - beforeEp) * idleBonus);
  log({ key: 'log.offline', params: { sec: ticks, ep: state.ep - beforeEp } });
}

function download(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const REPO = 'https://github.com/ArmyHeLL07/monster-reincarnation-incremental';

/** Open a prefilled GitHub issue — bug reports carry debug context, suggestions stay light. */
function openIssue(state: GameState, kind: 'bug' | 'suggestion'): void {
  const desc = window.prompt(t(kind === 'bug' ? 'ui.bug_prompt' : 'ui.suggest_prompt')) ?? '';
  if (!desc.trim()) return;
  const tag = kind === 'bug' ? '[bug]' : '[öneri]';
  const label = kind === 'bug' ? 'bug' : 'enhancement';
  const footer =
    kind === 'bug'
      ? ['---', `T${state.tier} Lv${state.level} · ${state.formId} · ${state.pos.layer}.${state.pos.floor}.${state.pos.room}`, `${navigator.language} · ${navigator.userAgent}`]
      : ['---', navigator.language];
  const body = [desc.trim(), '', ...footer].join('\n');
  const url = `${REPO}/issues/new?title=${encodeURIComponent(`${tag} ${desc.trim().slice(0, 50)}`)}&labels=${encodeURIComponent(label)}&body=${encodeURIComponent(body)}`;
  window.open(url, '_blank', 'noopener');
}

void init();

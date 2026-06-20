import { loadI18n, t } from './i18n';
import { loadContent, type Content } from './game/content';
import { GameClock } from './game/clock';
import { newGame, recomputeMaxes, type GameState, type LogEvent } from './game/state';
import { tick, deepRead, allocStat, courtDeath, ensureLayerRooms, useSkillManual, toggleEquip, ensureEquipped, eatFood, advanceRoom, removeSkill, sacrificeSkill } from './game/combat';
import { assignEye, cycleEyeMode, clearEye, fuseEyes } from './game/eyes';
import { evolve } from './game/evolution';
import { fuse, registerFusionSkill } from './game/fusion';
import { rebirth } from './game/rebirth';
import { search, readBook, answerRoom, repairScar } from './game/discovery';
import { load, save, clear } from './game/save';
import { mount, live, render, pushLog, setLastFusion, resetUi, type UiActions } from './ui';
import type { Difficulty } from '@mri/shared';

const OFFLINE_TICK_CAP = 1800;

async function init(): Promise<void> {
  const base = import.meta.env.BASE_URL;
  let state = load() ?? newGame();
  migrate(state);
  const lang = state.lang ?? (navigator.language.startsWith('tr') ? 'tr' : 'en');
  await loadI18n(base, lang);
  const content = await loadContent(base);
  recomputeMaxes(state);
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
      evolve(state, content, formId, logFn);
      save(state);
      render(state);
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
    onRepairScar: () => {
      repairScar(state, logFn);
      save(state);
      render(state);
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
    onSetAutosave: (m) => {
      state.autosaveMin = m;
      save(state);
      render(state);
    },
    onSetLang: (l) => {
      state.lang = l;
      void loadI18n(base, l).then(() => {
        save(state);
        mount(state, content, actions); // re-build shell so sidebar tab labels update too
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
  };

  mount(state, content, actions);

  let ticks = 0;
  const clock = new GameClock(1000, () => {
    tick(state, content, logFn);
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
  s.statusEffects ??= [];
}

/** Simulate elapsed offline time for the active action (idle = frozen, no offline). */
function applyOffline(state: GameState, content: Content, log: (e: LogEvent) => void): void {
  const elapsedSec = Math.floor((Date.now() - state.lastSeen) / 1000);
  if (elapsedSec < 5 || state.action === 'idle') return;
  const ticks = Math.min(elapsedSec, OFFLINE_TICK_CAP);
  const beforeEp = state.ep;
  const silent: (e: LogEvent) => void = () => {};
  for (let i = 0; i < ticks; i++) tick(state, content, silent);
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

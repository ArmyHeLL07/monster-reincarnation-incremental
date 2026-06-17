import { loadI18n, t } from './i18n';
import { loadContent, type Content } from './game/content';
import { GameClock } from './game/clock';
import { newGame, recomputeMaxes, type GameState, type LogEvent } from './game/state';
import { tick, deepRead, allocStat } from './game/combat';
import { assignEye, cycleEyeMode, clearEye } from './game/eyes';
import { evolve } from './game/evolution';
import { fuse, registerFusionSkill } from './game/fusion';
import { load, save, clear } from './game/save';
import { mount, live, render, pushLog, setLastFusion, resetUi, type UiActions } from './ui';

const OFFLINE_TICK_CAP = 1800;

async function init(): Promise<void> {
  const base = import.meta.env.BASE_URL;
  let state = load() ?? newGame();
  migrate(state);
  const lang = state.lang ?? (navigator.language.startsWith('tr') ? 'tr' : 'en');
  await loadI18n(base, lang);
  const content = await loadContent(base);
  recomputeMaxes(state);
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
    onGoFrontier: () => {
      state.pos = { ...state.furthest };
      state.enemy = null;
      save(state);
      render(state);
    },
    onSetPos: (layer, floor) => {
      const f = state.furthest;
      const unlocked = layer < f.layer || (layer === f.layer && floor <= f.floor);
      if (!unlocked) return;
      state.pos = { layer, floor, room: 1 };
      state.enemy = null;
      save(state);
      render(state);
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
      setLastFusion(fuse(state, content, a, b, logFn));
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
    onDiscardFood: (i) => {
      state.inventory.splice(i, 1);
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
    onBugReport: () => reportBug(state),
    onReset: () => {
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
  s.furthest ??= d.furthest;
  if (s.atkCd == null) s.atkCd = 0;
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
  if (s.maxSp == null) s.maxSp = d.maxSp;
  if (s.sp == null) s.sp = s.maxSp;
  if (s.maxMp == null) s.maxMp = d.maxMp;
  if (s.mp == null) s.mp = s.maxMp;
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

/** Open a prefilled GitHub issue (public bug report). No private/email channel. */
function reportBug(state: GameState): void {
  const desc = window.prompt(t('ui.bug_prompt')) ?? '';
  if (!desc.trim()) return;
  const body = [
    desc.trim(),
    '',
    '---',
    `T${state.tier} Lv${state.level} · ${state.formId} · ${state.pos.layer}.${state.pos.floor}.${state.pos.room}`,
    `${navigator.language} · ${navigator.userAgent}`,
  ].join('\n');
  const url = `${REPO}/issues/new?title=${encodeURIComponent('[bug] ' + desc.trim().slice(0, 50))}&body=${encodeURIComponent(body)}`;
  window.open(url, '_blank', 'noopener');
}

void init();

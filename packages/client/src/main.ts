import type { FusionResult } from '@mri/shared';
import { loadI18n } from './i18n';
import { loadContent, type Content } from './game/content';
import { GameClock } from './game/clock';
import { newGame, recomputeMaxes, type GameState, type LogEvent } from './game/state';
import { tick, manualAttack, deepRead, trainStamina } from './game/combat';
import { assignEye, cycleEyeMode, clearEye } from './game/eyes';
import { evolve } from './game/evolution';
import { fuse } from './game/fusion';
import { load, save, clear } from './game/save';
import { render, pushLog, setSelectedEye } from './ui';

const OFFLINE_TICK_CAP = 1800; // ~30 min of offline progress at 1s/tick

async function init(): Promise<void> {
  // BASE_URL is "/" locally and "/<repo>/" on GitHub Pages.
  const base = import.meta.env.BASE_URL;
  const lang = navigator.language.startsWith('tr') ? 'tr' : 'en';
  await loadI18n(base, lang);
  const content = await loadContent(base);

  let state = load() ?? newGame();
  migrate(state);
  recomputeMaxes(state);

  let lastFusion: FusionResult | null = null;

  function logFn(e: LogEvent): void {
    pushLog(e.key, e.params);
  }

  applyOffline(state, content, logFn);

  const clock = new GameClock(1000, () => {
    tick(state, content, logFn);
    save(state);
    draw();
  });

  function draw(): void {
    render(state, content, {
      lastFusion,
      onToggleCombat: () => {
        state.combatActive = !state.combatActive;
        save(state);
        draw();
      },
      onAttack: () => {
        manualAttack(state, content, logFn);
        save(state);
        draw();
      },
      onDeepRead: () => {
        deepRead(state, content, logFn);
        save(state);
        draw();
      },
      onTrain: () => {
        trainStamina(state, logFn);
        save(state);
        draw();
      },
      onReset: () => {
        clear();
        state = newGame();
        lastFusion = null;
        setSelectedEye(null);
        save(state);
        draw();
      },
      onFuse: (a, b) => {
        lastFusion = fuse(state, a, b, logFn);
        save(state);
        draw();
      },
      onExportOutbox: () => exportOutbox(state),
      onSelectEye: (slotId) => {
        setSelectedEye(slotId);
        draw();
      },
      onAssignEye: (slotId, abilityId) => {
        assignEye(state, content, slotId, abilityId);
        save(state);
        draw();
      },
      onCycleMode: (slotId) => {
        cycleEyeMode(state, content, slotId);
        save(state);
        draw();
      },
      onClearEye: (slotId) => {
        clearEye(state, slotId);
        save(state);
        draw();
      },
      onEvolve: (formId) => {
        evolve(state, content, formId, logFn);
        save(state);
        draw();
      },
    });
  }

  clock.start(); // the GameClock always runs — idle accumulation never stops
  draw();
}

/** Backfill fields missing from older saves so they don't crash newer code. */
function migrate(s: GameState): void {
  const d = newGame();
  s.raceId ??= d.raceId;
  s.formId ??= d.formId;
  s.eyeAssignments ??= d.eyeAssignments;
  s.fusionCache ??= d.fusionCache;
  s.outbox ??= d.outbox;
  s.spTrainingBonus ??= 0;
  s.hunger ??= 0;
  if (s.maxSp == null) s.maxSp = d.maxSp;
  if (s.sp == null) s.sp = s.maxSp;
  if (s.maxMp == null) s.maxMp = d.maxMp;
  if (s.mp == null) s.mp = s.maxMp;
  s.combatActive ??= false;
  s.mpTransferUnlocked ??= false;
}

/** Simulate elapsed offline time (capped), then summarize. */
function applyOffline(state: GameState, content: Content, log: (e: LogEvent) => void): void {
  const elapsedSec = Math.floor((Date.now() - state.lastSeen) / 1000);
  if (elapsedSec < 5) return;
  const ticks = Math.min(elapsedSec, OFFLINE_TICK_CAP);
  const beforeEp = state.ep;
  const silent: (e: LogEvent) => void = () => {};
  for (let i = 0; i < ticks; i++) tick(state, content, silent);
  log({ key: 'log.offline', params: { sec: ticks, ep: state.ep - beforeEp } });
}

function exportOutbox(state: GameState): void {
  const blob = new Blob([JSON.stringify(state.outbox, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'outbox.json';
  a.click();
  URL.revokeObjectURL(url);
}

void init();

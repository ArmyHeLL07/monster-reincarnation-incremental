import type { FusionResult, StatKey, Difficulty, Skill, DungeonLayer, LootItem, LootRarity, EquipSlot, Achievement } from '@mri/shared';
import type { Content } from './game/content';
import type { GameState } from './game/state';
import { MUTATION_POOL } from './game/mutations';
import { currentRoomHazard } from './game/hazards';
import { REBIRTH_PERKS } from './game/teachings';
import { MAX_HUNGER, LEVEL_CAP, MEDITATION_MAX, MAX_INVENTORY, equipStatBonus, effStat } from './game/state';
import { EQUIP_SLOTS, lootDisplayName, unmetReqs, canEquip, forgeCost, itemScore } from './game/loot';
import { equipSetTier, specStat } from './game/effects';
import { appraisalTier, ownedEyeAbilities, isAbilityAssigned } from './game/eyes';
import { currentForm, evolutionReady, evolutionTreeView, isHumanoidForm, availableEvolutions, canEvolve, secretMet, switchBranchCost, switchableTargets, type EvoNode, type EvoNodeStatus } from './game/evolution';
import { achievementMetric } from './game/achievements';
import { questProgress } from './game/quests';
import { riddleById, loreById, storyText, storyLines } from './game/langContent';
import { condMet, foresee, reqText } from './game/roomevents';
import { isRiddleLocked, lockRemainingMin } from './game/riddles';
import { maxFoodSlots, refrigerated, isRotten, SPOIL_THRESHOLD } from './game/inventory';
import { xpToNext, resistReduction, weaknessOf, skillSlots, floorsOf, roomsOf, levelPower, respecCost, roomQuota, rebirthMult, currentRoomModifier, SECRET_HARVEST_SOULS, SECRET_LABYRINTH_KILLS, epStatCost, EP_BUFF_DEFS, injectSkillXpCost, roomPreview, FORESIGHT_WIS_EXACT, FORESIGHT_WIS_ENEMY, LOADOUT_SLOTS, RIDDLE_INT_SOLVE } from './game/combat';
import { buildSkillChains, skillNodeStatus, derivedSkillsView } from './game/skill_tree';
import { resolveFusion } from './game/fusion';
import { OFFICIAL_RACES } from './game/race';
import { forageReveal } from './game/forage';
import { canRebirth } from './game/rebirth';
import { SOUL_UPGRADES, soulLevel, soulUpgradeCost } from './game/soul';
import { diffDef } from './game/difficulty';
import { computeAnalyticsSummary } from './game/analytics';
import { t, tmsg } from './i18n';
import { VERSION, CHANGELOG } from './changelog';
import { TUTORIAL_STEPS, HINT_DEFS, shouldShowHint, markHintSeen, type TutorialStep } from './tutorial';

export interface UiActions {
  onSetAction: (a: 'idle' | 'combat' | 'rest') => void;
  onDeepRead: () => void;
  onUseSkill: (id: string) => void;
  onToggleMode: () => void;
  onAdvance: () => void;
  onToggleAutoAdvance: () => void;
  onToggleEquip: (id: string) => void;
  onUnequipAll: () => void;
  onSaveLoadout: (slot: number) => void;
  onLoadLoadout: (slot: number) => void;
  onDeleteSkill: (id: string) => void;
  onSacrificeSkill: (id: string) => void;
  onSelectLayer: (layerId: number) => void;
  onSetPos: (layerId: number, floor: number) => void;
  onAllocStat: (stat: StatKey) => void;
  onEvolve: (formId: string) => void;
  onKeepGrow: () => void;
  onSwitchBranch: (formId: string) => void;
  onFuse: (aId: string, bId: string) => void;
  onAssignEye: (slotId: string, abilityId: string) => void;
  onCycleMode: (slotId: string) => void;
  onClearEye: (slotId: string) => void;
  onFuseEyes: (slotA: string, slotB: string) => void;
  onDiscardFood: (index: number) => void;
  onEat: (index: number) => void;
  onToggleAutoEat: () => void;
  onSetAutosave: (min: number) => void;
  onSetLang: (lang: 'tr' | 'en' | 'ru') => void;
  onSaveNow: () => void;
  onExportSave: () => void;
  onImportSave: () => void;
  onBugReport: () => void;
  onSuggest: () => void;
  onReset: () => void;
  onMeditate: () => void;
  onSearch: () => void;
  onCourtDeath: () => void;
  onRebirth: () => void;
  onBuySoul: (id: string) => void;
  onReadBook: (id: string) => void;
  onAnswerRoom: (answer: string) => void;
  onChooseEvent: (i: number) => void;
  onAnswerBossRiddle: (answer: string) => void;
  onIntSkipRiddle: () => void;
  onAbandonRiddle: () => void;
  onBossChoice: (mode: 'skip' | 'fight', difficulty: string) => void;
  onRepairScar: () => void;
  onSetDifficulty: (d: Difficulty) => void;
  onTogglePermadeath: () => void;
  onToggleModifierFreeRooms: () => void;
  onSelectRace: (raceId: string) => void;
  /** Story mode: enter (save normal, then continue or start a fresh story run). */
  onEnterStory: () => void;
  /** Story mode: leave back to normal/sandbox. */
  onExitStory: () => void;
  /** Story mode opening: pick the "last thought" → starting race + first chapter. */
  onStoryChoice: (choiceId: string) => void;
  onSetRoom: (floor: number, room: number) => void;
  onEquipItem: (uid: string) => void;
  onUnequipSlot: (slot: EquipSlot) => void;
  onDiscardItem: (uid: string) => void;
  onForgeItem: (uid: string) => void;
  onAutoEquip: () => void;
  onScrapCommon: () => void;
  onRespec: () => void;
  onChooseHumanPath: (pathId: string) => void;
  onBuyStatPointEp: () => void;
  onBuyTempBuff: (buffId: string) => void;
  onInjectSkillXp: (skillId: string) => void;
  onForage: () => void;
  onForageEat: () => void;
  onForageDiscard: () => void;
  onTutorialNext: () => void;
  onTutorialSkip: () => void;
  onTutorialReopen: () => void;
  onMarkHintSeen: (id: string) => void;
  onNavigateGuide: (anchor: string) => void;
  onToggleAutoFood(): void;
  onToggleAutoExplore(): void;
  onToggleAutoEvent(): void;
  onSetPuzzleMode(mode: 'skip' | 'solve'): void;
  onSetMoralMode(mode: 'ask' | 'spare' | 'devour'): void;
  onSpawnMinion(type: 'dps' | 'tank' | 'utility'): void;
  onSpinWeb(): void;
  onCollectWeb(): void;
  onChooseRebirthPerk(perkId: string): void;
  onToggleAutoCastSkills?: () => void;
  onToggleAutoHeal?: () => void;
  onSetAutoHealThreshold?: (val: number) => void;
}

type Tab = 'combat' | 'map' | 'skills' | 'body' | 'inventory' | 'lore' | 'bestiary' | 'stats' | 'settings' | 'guide';
const TABS: Tab[] = ['combat', 'map', 'skills', 'body', 'inventory', 'lore', 'bestiary', 'stats', 'settings', 'guide'];
const STATS: StatKey[] = ['STR', 'VIT', 'AGI', 'INT', 'WIS', 'LUCK'];
const LOG_CAP = 80;

const svg = (inner: string) => `<svg viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
const EYE_SVG = svg('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>');
const ICONS: Record<Tab, string> = {
  combat: svg('<path d="M14 3l7 7-3 3-7-7zM4 20l6-6M3 21l2-1 1-2"/>'),
  map: svg('<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>'),
  skills: svg('<path d="M12 2v6M12 16v6M2 12h6M16 12h6M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/>'),
  body: EYE_SVG,
  inventory: svg('<path d="M4 7h16v13H4zM4 7l2-3h12l2 3M9 11h6"/>'),
  lore: svg('<path d="M4 4h12a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2z"/><path d="M8 8h8M8 12h8"/>'),
  bestiary: svg('<circle cx="12" cy="8" r="4"/><path d="M8 16s0-4 4-4 4 4 4 4"/><path d="M5 20h14"/><path d="M9 12l-1 2M15 12l1 2"/>'),
  stats: svg('<path d="M5 21V11M12 21V4M19 21v-7"/>'),
  settings: svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>'),
  guide: svg('<path d="M4 4h12a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2z"/><path d="M8 8h8M8 12h8M8 16h4"/>'),
};

let CONTENT: Content;
let ACTIONS: UiActions;
let CURSTATE: GameState;
let activeTab: Tab = 'combat';
let selectedA: string | null = null;
let selectedB: string | null = null;
let selectedEye: string | null = null;
let selectedEyeA: string | null = null;
let selectedEyeB: string | null = null;
let activeSkillPart: 'arm' | 'leg' | 'body' | 'eye' = 'arm';
let activeSkillView: 'list' | 'tree' = 'list';
let activeSkillTreeCat: string = 'all';
let expandedSkill: string | null = null;
let lastFusion: FusionResult | null = null;
let selectedEvoNodeId: string | null = null;
let selectedItemUid: string | null = null;
let selectedBestiaryId: string | null = null;
type LogCat = 'combat' | 'discovery' | 'loot' | 'lore';
const logs: Record<LogCat, string[]> = { combat: [], discovery: [], loot: [], lore: [] };
/** Lore log is persistent — never cleared (player reads books there). */
const LORE_LOG_CAP = 200;
/** Whether each log panel is expanded (default: combat open, rest collapsed). */
const logOpen: Record<LogCat, boolean> = { combat: true, discovery: false, loot: false, lore: false };

/** Route a log line to its stream so combat spam never buries loot/discovery. */
function logCategory(key: string): LogCat {
  if (key === 'log.book_lore' || key === 'log.book_deep' || key === 'log.book_ep' || key === 'log.book_insight') return 'lore';
  if (key === 'log.kill' || key === 'log.boss_kill' || key === 'log.larder_full' || key === 'log.offline') return 'loot';
  if (key === 'log.loot_drop' || key === 'log.loot_full' || key === 'log.scrapped') return 'loot';
  if (key === 'log.forged' || key === 'log.scrap_all' || key === 'log.autoequip' || key === 'log.search_chest') return 'loot';
  if (/discover|search|book|room|appraise|ruler|taboo|meditation|gatekeeper|cleared|unlocked|scar|zen|hell|nullity|^ev\./.test(key)) {
    return 'discovery';
  }
  return 'combat';
}

/** Big-moment keys that also pop a toast (new discoveries) — so they aren't buried in the log. */
const TOAST_KEYS = new Set([
  'log.fuse_new', 'log.ruler_unlock', 'log.taboo_authority', 'log.meditation_unlock', 'log.zen',
  'log.search_room', 'log.search_book', 'log.room_solved', 'log.learn_regen', 'log.gatekeeper_down',
  'log.evolve', 'log.evolve_form', 'log.branch_switch', 'log.achievement', 'log.fusion_death', 'log.eyefuse', 'log.eyefuse_blind',
  'log.sin_kill', 'log.evolve_ambush', 'log.skill_sacrificed',
  'log.harvest_festival', 'log.labyrinth_awakening', 'log.soul_gain', 'log.elite_spawn', 'log.devour_skill', 'log.quest_done',
]);

export function pushLog(key: string, params?: Record<string, string | number>): void {
  const cat = logCategory(key);
  const text = tmsg(key, params);
  logs[cat].unshift(text);
  const cap = cat === 'lore' ? LORE_LOG_CAP : LOG_CAP;
  if (logs[cat].length > cap) logs[cat].length = cap;
  if (key.startsWith('log.discover') || TOAST_KEYS.has(key)) pushToast(text);
}

/** Transient top-right pop-up for a freshly discovered skill/feature. */
function pushToast(text: string): void {
  const host = document.querySelector<HTMLElement>('#toasts');
  if (!host) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  const dismiss = (): void => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 350);
  };
  el.addEventListener('click', dismiss); // click to close — toasts no longer flee on their own
  host.appendChild(el);
  while (host.children.length > 6 && host.firstChild) host.removeChild(host.firstChild);
  setTimeout(dismiss, 30000); // long fallback so ignored toasts eventually clear
}
function pushHintToast(hintId: string, targetTab: string | null, guideAnchor: string): void {
  const host = document.querySelector<HTMLElement>('#toasts');
  if (!host) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.style.cssText = 'cursor:default; padding: 0.6rem 0.8rem;';

  const gotoHtml = targetTab
    ? `<button class="ghost hint-goto" data-tab="${targetTab}" data-anchor="${guideAnchor}" style="margin-top:0.4rem;font-size:0.78rem;padding:0.2rem 0.6rem;">${t('hint.goto')}</button>`
    : '';

  el.innerHTML = `
    <div style="font-weight:600;font-size:0.88rem;margin-bottom:0.2rem;">${t(`hint.${hintId}.title`)}</div>
    <div style="font-size:0.82rem;opacity:0.85;">${t(`hint.${hintId}.body`)}</div>
    ${gotoHtml}`;

  const dismiss = (): void => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 350);
  };
  el.querySelector('.hint-goto')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const btn = e.currentTarget as HTMLElement;
    const tab = btn.getAttribute('data-tab') as Tab | null;
    const anchor = btn.getAttribute('data-anchor') ?? '';
    if (tab) {
      activeTab = tab;
      renderTab();
      setTimeout(() => {
        const target = document.querySelector<HTMLElement>(`#${anchor}`);
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
    dismiss();
  });
  el.addEventListener('click', dismiss);
  host.appendChild(el);
  while (host.children.length > 6 && host.firstChild) host.removeChild(host.firstChild);
  setTimeout(dismiss, 12000);
}

function checkAndShowHints(state: GameState): void {
  for (const def of HINT_DEFS) {
    if (!shouldShowHint(def.id, state)) continue;
    markHintSeen(def.id, state);
    ACTIONS.onMarkHintSeen(def.id);
    pushHintToast(def.id, def.targetTab, def.guideAnchor);
  }
}

export function setLastFusion(r: FusionResult): void {
  lastFusion = r;
}
export function resetUi(): void {
  selectedEye = null;
  selectedA = null;
  selectedB = null;
  lastFusion = null;
  expandedSkill = null;
  selectedEvoNodeId = null;
  activeTab = 'combat';
  logs.combat.length = 0;
  logs.discovery.length = 0;
  logs.loot.length = 0;
  // Lore log is intentionally NOT cleared on reset — player keeps their read lore history.
}

function bar(value: number, max: number, color: string): string {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return `<div class="bar"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div>`;
}
// --- live bar updates: mutate existing elements (so CSS `transition: width` slides smoothly) ---
function pctOf(v: number, max: number): number {
  return max > 0 ? Math.max(0, Math.min(100, (v / max) * 100)) : 0;
}
function setW(id: string, v: number, max: number): void {
  const e = document.querySelector<HTMLElement>(`#${id}-f`);
  if (e) e.style.width = `${pctOf(v, max)}%`;
}
function setTxt(id: string, txt: string): void {
  const e = document.querySelector<HTMLElement>(`#${id}`);
  if (e) e.textContent = txt;
}

// ---- shell -----------------------------------------------------------------

export function mount(state: GameState, content: Content, actions: UiActions): void {
  CONTENT = content;
  ACTIONS = actions;
  CURSTATE = state;
  void loadRaceHints(import.meta.env.BASE_URL);
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) return;
  app.innerHTML = `
    <div class="game">
      <header id="topbar" class="topbar"></header>
      <nav id="sidebar" class="sidebar">
        <aside id="ministatus" class="ministatus" aria-label="status"></aside>
        ${TABS.map((tb) => {
          return `<button class="tabbtn" data-tab="${tb}">${ICONS[tb]}<span>${t(`tab.${tb}`)}</span></button>`;
        }).join('')}
      </nav>
      <main id="content" class="content"></main>
      <section class="logpanel">
        ${(['combat', 'discovery', 'loot', 'lore'] as LogCat[]).map((cat) => `
        <div class="logcol">
          <div class="logcol-header" data-logcat="${cat}">
            <h3>${t(`ui.log_${cat}`)}</h3>
            <span class="logcol-toggle">${logOpen[cat] ? '▲' : '▼'}</span>
          </div>
          <ul class="logcol-body${cat === 'lore' ? ' lore-body' : ' short-body'}${logOpen[cat] ? '' : ' collapsed'}" id="log-${cat}"></ul>
        </div>`).join('')}
      </section>
      <div id="toasts" class="toasts" aria-live="polite"></div>
      <div id="tutorial-overlay" class="tutorial-overlay hidden"></div>
      <!-- Floating damage text overlay layer -->
      <div id="damage-text-layer" style="position:fixed; inset:0; pointer-events:none; z-index:99999;"></div>
    </div>
  `;
  app.querySelectorAll<HTMLButtonElement>('.tabbtn').forEach((b) => {
    b.addEventListener('click', () => {
      activeTab = (b.getAttribute('data-tab') as Tab) ?? 'combat';
      renderTab();
    });
  });
  // Log panel collapse/expand
  app.querySelectorAll<HTMLElement>('.logcol-header[data-logcat]').forEach((hdr) => {
    hdr.addEventListener('click', () => {
      const cat = hdr.getAttribute('data-logcat') as LogCat;
      if (!cat) return;
      logOpen[cat] = !logOpen[cat];
      const body = hdr.nextElementSibling as HTMLElement | null;
      const toggle = hdr.querySelector<HTMLElement>('.logcol-toggle');
      if (body) body.classList.toggle('collapsed', !logOpen[cat]);
      if (toggle) toggle.textContent = logOpen[cat] ? '▲' : '▼';
    });
  });
  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.guide-link');
    if (!btn) return;
    const anchor = btn.getAttribute('data-guide');
    if (!anchor) return;
    activeTab = 'guide';
    renderTab();
    setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`#${anchor}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  });
  renderTab();
  live(state);
}

/** Signature of "structural" state — changes only on unlocks/level/evolution, not every tick. */
let lastStructSig = '';
function structureSig(state: GameState): string {
  return [
    state.skills.length,
    state.equipped.length,
    state.fusionUnlocked,
    state.meditationUnlocked,
    state.booksFound.length,
    state.discoveries.length,
    state.statPoints,
    state.tier,
    state.gatekeeperCleared,
    state.ruler.powers.length,
    Object.values(state.eyeAssignments).filter(Boolean).length,
    state.inventoryItems.length,
    Object.values(state.equipment).filter(Boolean).length,
    // During rest/meditate include vital stats so all tabs refresh every tick.
    (state.action === 'rest' || state.action === 'meditate') ? Math.round(state.hp) : 0,
    (state.action === 'rest' || state.action === 'meditate') ? Math.round(state.sp) : 0,
    (state.action === 'rest' || state.action === 'meditate') ? Math.round(state.mp) : 0,
  ].join('|');
}

function spawnFloatingText(text: string, color: string, target: 'player' | 'enemy'): void {
  const layer = document.querySelector<HTMLElement>('#damage-text-layer');
  if (!layer) return;

  let targetEl: HTMLElement | null = null;
  if (target === 'player') {
    targetEl = document.querySelector<HTMLElement>('#ministatus') || document.querySelector<HTMLElement>('#topbar');
  } else {
    targetEl = document.querySelector<HTMLElement>('.enemy-panel');
  }

  if (!targetEl) return;
  const rect = targetEl.getBoundingClientRect();
  const x = rect.left + rect.width / 2 + (Math.random() - 0.5) * 40;
  const y = rect.top + rect.height / 2 + (Math.random() - 0.5) * 20;

  const el = document.createElement('div');
  el.className = 'floating-damage-text';
  el.style.position = 'fixed';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.color = color;
  el.style.pointerEvents = 'none';
  el.style.fontWeight = 'bold';
  el.style.fontSize = '1.6rem';
  el.style.fontFamily = 'var(--disp), sans-serif';
  el.style.zIndex = '99999';
  el.style.textShadow = '1px 1px 3px black, -1px -1px 3px black';
  el.style.whiteSpace = 'nowrap';
  el.textContent = text;

  layer.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

/** Per-tick light update: top bar + mini HUD (smooth bars), logs, and the active tab. */
export function live(state: GameState): void {
  CURSTATE = state;
  syncAchievementFx(state); // fire a centred burst for any achievement unlocked this tick
  syncLoreMasteryFx(state); // …and for any racial lore-mastery passive earned this tick

  // --- Render floating combat texts (QoL/R3) ---
  if (state.floatingTexts && state.floatingTexts.length > 0) {
    for (const f of state.floatingTexts) {
      spawnFloatingText(f.text, f.color, f.target);
    }
    state.floatingTexts = []; // clear queue
  }

  // --- Screen Shake (QoL/R3) ---
  if (state.screenShake > 0) {
    const gameEl = document.querySelector<HTMLElement>('.game');
    if (gameEl) {
      gameEl.classList.remove('shake');
      void gameEl.offsetWidth; // trigger reflow
      gameEl.classList.add('shake');
    }
    state.screenShake = 0; // reset
  }
  const top = document.querySelector<HTMLElement>('#topbar');
  if (top) {
    if (!top.firstElementChild) {
      top.innerHTML = topbarHtml();
      const fsBtn = top.querySelector('#fs-toggle');
      if (fsBtn) {
        if (!document.documentElement.requestFullscreen) {
          (fsBtn as HTMLElement).style.display = 'none';
        } else {
          fsBtn.addEventListener('click', toggleFullscreen);
        }
      }
    }
    updateTopbar(state);
  }
  const mini = document.querySelector<HTMLElement>('#ministatus');
  if (mini) {
    if (!mini.firstElementChild) mini.innerHTML = miniStatusHtml();
    updateMini(state);
  }
  for (const cat of ['combat', 'discovery', 'loot', 'lore'] as LogCat[]) {
    const el = document.querySelector<HTMLElement>(`#log-${cat}`);
    if (el) el.innerHTML = logs[cat].map((l) => `<li>${l}</li>`).join('');
  }
  if (activeTab === 'combat' || activeTab === 'map') {
    // Don't wipe the boss-riddle input while the player is typing in it.
    if (document.activeElement?.id !== 'br-input') renderTab();
  } else if (activeTab === 'lore') {
    // Live-update just the meditation bar (full re-render would clobber the riddle input).
    const ml = document.querySelector<HTMLElement>('#medlive');
    if (ml) ml.innerHTML = medBarHtml(state);
  } else {
    // skills / body / stats: refresh only when something structural changed (a new unlock appears
    // in the SAME tab without needing to switch away and back).
    const sig = structureSig(state);
    if (sig !== lastStructSig) {
      lastStructSig = sig;
      renderTab();
    }
  }
}

/** Full refresh of the active tab + chrome — after an action or tab switch. */
export function render(state: GameState): void {
  CURSTATE = state;
  renderTab();
  live(state);
  checkAndShowHints(state);
  updateTutorialOverlay(state);
}

/** One-shot evolution celebration: a fullscreen light burst + the new form name. Auto-removed.
 *  Imperative (appended to <body>, not part of any re-rendered tab) so ticks don't replay it. */
export function playEvolveEffect(formId: string): void {
  const form = CONTENT.forms.get(formId);
  const name = form ? t(form.locKey) : '';
  const el = document.createElement('div');
  el.className = 'evo-burst';
  el.innerHTML =
    '<div class="evo-burst-ring"></div><div class="evo-burst-rays"></div>' +
    `<div class="evo-burst-text">✦ ${t('ui.evolved')} ✦<span>${name}</span></div>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

/** One-shot achievement celebration — reuses the evolution burst (centred, same look) with the
 *  achievement icon + name. Imperative (appended to <body>) so ticks don't replay it. */
export function playAchievementEffect(a: Achievement): void {
  const rp: Record<string, string> = a.param ? { race: t(`race.${a.param}.name`) } : {};
  const name = t(`${a.locKey}.name`, rp);
  const el = document.createElement('div');
  el.className = 'evo-burst ach-burst';
  el.innerHTML =
    '<div class="evo-burst-ring"></div><div class="evo-burst-rays"></div>' +
    `<div class="evo-burst-text">${a.icon} ${t('ui.achievement_unlocked')} ${a.icon}<span>${name}</span></div>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

// Achievements unlock passively during ticks (not via a user action), so the render loop diffs
// state.achievements against what it has already celebrated and fires the burst for new ones.
// The first sync seeds the set silently so loading a save doesn't replay every past achievement.
let achFxSeeded = false;
const celebratedAch = new Set<string>();
function syncAchievementFx(state: GameState): void {
  const cur = state.achievements ?? [];
  if (!achFxSeeded) {
    for (const id of cur) celebratedAch.add(id);
    achFxSeeded = true;
    return;
  }
  for (const id of cur) {
    if (celebratedAch.has(id)) continue;
    celebratedAch.add(id);
    const a = CONTENT.achievements.get(id);
    if (a) playAchievementEffect(a);
  }
}

/** One-shot lore-mastery celebration — same centred burst as achievements, book-themed. */
export function playLoreMasteryEffect(def: Skill): void {
  const name = t(def.locKeyName);
  const el = document.createElement('div');
  el.className = 'evo-burst ach-burst';
  el.innerHTML =
    '<div class="evo-burst-ring"></div><div class="evo-burst-rays"></div>' +
    `<div class="evo-burst-text">📖 ${t('ui.lore_mastery_unlocked')} 📖<span>${name}</span></div>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

// Lore-mastery passives are granted passively during ticks (checkLoreMastery), so the render loop
// diffs state.loreMasteries against what it has already celebrated and fires the burst for new ones.
// The first sync seeds the set silently so loading a save doesn't replay past unlocks.
let loreFxSeeded = false;
const celebratedLore = new Set<string>();
function syncLoreMasteryFx(state: GameState): void {
  const cur = state.loreMasteries ?? [];
  if (!loreFxSeeded) {
    for (const id of cur) celebratedLore.add(id);
    loreFxSeeded = true;
    return;
  }
  for (const id of cur) {
    if (celebratedLore.has(id)) continue;
    celebratedLore.add(id);
    const def = CONTENT.skills.get(id);
    if (def) playLoreMasteryEffect(def);
  }
}

/** One-shot rebirth celebration: a death→soul-light→rebirth arc. Imperative + auto-removed. */
export function playRebirthEffect(state: GameState): void {
  const el = document.createElement('div');
  el.className = 'rb-burst';
  el.innerHTML =
    '<div class="rb-veil"></div><div class="rb-soul"></div>' +
    `<div class="rb-text">✦ ${t('ui.reborn')} ✦<span>${t('ui.rebirths')}: ${state.rebirthCount}</span></div>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

const HUNGER_COLORS = ['#6fae53', '#d2a73a', '#e0902f', '#bb4140'];

/** Top-bar sub-line (tier/level/form/layer/pos/action) — pure text, cheap to refresh. */
function subLine(state: GameState): string {
  const form = currentForm(state, CONTENT);
  const layer = CONTENT.dungeon.layers.find((l) => l.id === state.pos.layer);
  const posStr = `${state.pos.layer}.${state.pos.floor}.${state.pos.room}`;
  const evo = evolutionReady(state, CONTENT) ? ` · <span class="evoready">${t('ui.evolution_ready')}</span>` : '';
  return `${state.tier >= 1 ? `T${state.tier} · ` : ''}${t('ui.level')} ${state.level} · ${form ? t(form.locKey) : ''} · ${layer ? t(layer.locKey) : ''} ${posStr} · ${t(`act.${state.action}`)}${evo}`;
}

function toggleFullscreen(): void {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.error(`Error enabling fullscreen: ${err.message}`);
    });
  } else {
    document.exitFullscreen().catch((err) => {
      console.error(`Error exiting fullscreen: ${err.message}`);
    });
  }
}

document.addEventListener('fullscreenchange', () => {
  const fsBtn = document.querySelector('#fs-toggle');
  if (fsBtn) {
    if (document.fullscreenElement) {
      fsBtn.innerHTML = `<span class="fs-icon">⛶</span> <span class="fs-text">${t('ui.exit_fullscreen')}</span>`;
      fsBtn.classList.add('active');
    } else {
      fsBtn.innerHTML = `<span class="fs-icon">⛶</span> <span class="fs-text">${t('ui.fullscreen')}</span>`;
      fsBtn.classList.remove('active');
    }
  }
});

/** One labelled bar with stable ids (`#id-v` value, `#id-f` fill) so live() can animate the width. */
function statBarSkel(id: string, label: string, color: string): string {
  return `<div class="statline"><div class="row"><span>${label}</span><span id="${id}-v"></span></div><div class="bar"><div class="bar-fill" id="${id}-f" style="width:0;background:${color}"></div></div></div>`;
}

/** Top bar SKELETON (values filled by updateTopbar so the bars keep their elements → smooth slide). */
/** Version badge (top bar) — hover/tap to reveal the changelog popover. */
function versionBadge(): string {
  // Match the app's language exactly (default English when no saved preference); ru falls back to en.
  const lang = CURSTATE?.lang ?? 'en';
  const entries = CHANGELOG.map((e, i) => {
    const lines = lang === 'tr' ? e.tr : lang === 'ru' ? (e.ru ?? e.en) : e.en;
    const items = lines.map((x) => `<li>${x}</li>`).join('');
    return `<div class="cl-entry${i === 0 ? ' cl-latest' : ''}"><div class="cl-ver">v${e.v} <span class="muted">${e.date}</span></div><ul>${items}</ul></div>`;
  }).join('');
  return `<div class="version-badge" tabindex="0" aria-label="changelog">
      <span class="ver-ic">✦</span><span class="ver-num">v${VERSION}</span>
      <div class="version-pop"><div class="cl-title">${t('ui.changelog')}</div>${entries}</div>
    </div>`;
}

function topbarHtml(): string {
  return `
    <div class="brand-row" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; width: 100%;">
      <div class="brand"><span class="mark">${EYE_SVG}</span>${t('app.title')}</div>
      <div style="display:flex; align-items:center; gap:0.5rem;">
        ${versionBadge()}
        <button id="fs-toggle" class="fs-btn" style="min-height: 32px; padding: 0.2rem 0.6rem; font-size: 0.78rem; display: flex; align-items: center; gap: 0.3rem;">
          <span class="fs-icon">⛶</span> <span class="fs-text">${t('ui.fullscreen')}</span>
        </button>
      </div>
    </div>
    <p class="sub" id="tb-sub"></p>
    <div class="bars">
      <div style="display:flex;align-items:center;gap:0.3rem;margin-bottom:0.2rem;font-size:0.78rem;color:rgba(255,255,255,0.4);">
        ${t('ui.hp')}/${t('ui.mp')}/${t('ui.sp')}
      </div>
      ${statBarSkel('tb-hp', t('ui.hp'), '#6fae53')}
      ${statBarSkel('tb-mp', t('ui.mp'), '#4f86c2')}
      ${statBarSkel('tb-sp', t('ui.sp'), '#d2a73a')}
      ${statBarSkel('tb-hunger', t('ui.hunger'), HUNGER_COLORS[0])}
    </div>
  `;
}

function updateTopbar(state: GameState): void {
  const sub = document.querySelector<HTMLElement>('#tb-sub');
  if (sub) sub.innerHTML = subLine(state);
  setW('tb-hp', state.hp, state.maxHp); setTxt('tb-hp-v', `${Math.round(state.hp)}/${Math.round(state.maxHp)}`);
  setW('tb-mp', state.mp, state.maxMp); setTxt('tb-mp-v', `${Math.round(state.mp)}/${Math.round(state.maxMp)}`);
  setW('tb-sp', state.sp, state.maxSp); setTxt('tb-sp-v', `${Math.round(state.sp)}/${Math.round(state.maxSp)}`);
  const hs = hungerStage(state.hunger);
  setW('tb-hunger', state.hunger, MAX_HUNGER);
  const hf = document.querySelector<HTMLElement>('#tb-hunger-f');
  if (hf) hf.style.background = HUNGER_COLORS[hs];
  setTxt('tb-hunger-v', `%${Math.round((state.hunger / MAX_HUNGER) * 100)} · ${t(`hunger.${hs}`)}`);
}

/** Mini HUD row skeleton (stable `#id-f` fill for smooth slide). */
function miniBarSkel(id: string, label: string, color: string): string {
  return `<div class="mr"><span style="color:${color}">${label}</span><span id="${id}-v"></span></div><div class="mbar"><i id="${id}-f" style="width:0;background:${color}"></i></div>`;
}

/** Compact always-on status HUD (sidebar). Skeleton; values filled by updateMini → smooth bars. */
function miniStatusHtml(): string {
  return `<div class="mf" id="ms-form"></div>
    <div class="mr"><span id="ms-tlv"></span><span id="ms-pos"></span></div>
    ${miniBarSkel('ms-hp', t('ui.hp'), '#6fae53')}
    ${miniBarSkel('ms-mp', t('ui.mp'), 'var(--mp)')}
    ${miniBarSkel('ms-sp', t('ui.sp'), 'var(--sp)')}
    <div class="mr"><span id="ms-hunger-l">${t('ui.hunger')}</span><span id="ms-hunger-v"></span></div><div class="mbar"><i id="ms-hunger-f" style="width:0"></i></div>`;
}

function updateMini(state: GameState): void {
  const form = currentForm(state, CONTENT);
  setTxt('ms-form', form ? t(form.locKey) : '');
  setTxt('ms-tlv', `${state.tier >= 1 ? `T${state.tier} ` : ''}${t('ui.lv')} ${state.level}`);
  setTxt('ms-pos', `${state.pos.layer}.${state.pos.floor}.${state.pos.room}`);
  setW('ms-hp', state.hp, state.maxHp); setTxt('ms-hp-v', `${Math.round(state.hp)}/${Math.round(state.maxHp)}`);
  setW('ms-mp', state.mp, state.maxMp); setTxt('ms-mp-v', `${Math.round(state.mp)}/${Math.round(state.maxMp)}`);
  setW('ms-sp', state.sp, state.maxSp); setTxt('ms-sp-v', `${Math.round(state.sp)}/${Math.round(state.maxSp)}`);
  const hs = hungerStage(state.hunger);
  setW('ms-hunger', state.hunger, MAX_HUNGER);
  const hf = document.querySelector<HTMLElement>('#ms-hunger-f');
  if (hf) hf.style.background = HUNGER_COLORS[hs];
  const hl = document.querySelector<HTMLElement>('#ms-hunger-l');
  if (hl) hl.style.color = HUNGER_COLORS[hs];
  setTxt('ms-hunger-v', `%${Math.round((state.hunger / MAX_HUNGER) * 100)}`);
}

function hungerStage(h: number): number {
  if (h < 50) return 0;
  if (h < 75) return 1;
  if (h < 90) return 2;
  return 3;
}

// ---- tab routing -----------------------------------------------------------

function isHumanoid(state: GameState): boolean {
  return isHumanoidForm(state, CONTENT); // humanoid race OR a humanoid form (slime's Rimuru path)
}

function renderTab(): void {
  const el = document.querySelector<HTMLElement>('#content');
  if (!el) return;
  // The Inventory tab exists only for humanoid races; monsters never see it.
  const invBtn = document.querySelector<HTMLElement>('.tabbtn[data-tab="inventory"]');
  if (invBtn) invBtn.style.display = isHumanoid(CURSTATE) ? '' : 'none';
  if (activeTab === 'inventory' && !isHumanoid(CURSTATE)) activeTab = 'combat';
  document.querySelectorAll<HTMLButtonElement>('.tabbtn').forEach((b) => {
    b.classList.toggle('active', b.getAttribute('data-tab') === activeTab);
  });
  if (!CURSTATE.raceConfirmed) {
    if (CURSTATE.mode === 'story') {
      el.innerHTML = storyIntroScreen(CURSTATE);
      wireStoryIntro(el);
    } else {
      el.innerHTML = raceSelectScreen(CURSTATE);
      wireRaceSelect(el);
    }
    return;
  }
  if (CURSTATE.pendingRebirthPerk) {
    el.innerHTML = rebirthPerkSelectScreen(CURSTATE);
    wireRebirthPerkSelect(el);
    return;
  }
  switch (activeTab) {
    case 'combat':
      el.innerHTML = storyBannerHtml(CURSTATE) + combatTab(CURSTATE);
      wireCombat(el);
      break;
    case 'map':
      el.innerHTML = mapTab(CURSTATE);
      wireMap(el);
      break;
    case 'skills':
      el.innerHTML = skillsTab(CURSTATE);
      wireSkills(el);
      break;
    case 'body':
      el.innerHTML = bodyTab(CURSTATE);
      wireBody(el);
      break;
    case 'inventory':
      el.innerHTML = inventoryTab(CURSTATE);
      wireInventory(el);
      break;
    case 'lore':
      el.innerHTML = loreTab(CURSTATE);
      wireLore(el);
      break;
    case 'bestiary':
      el.innerHTML = bestiaryTab(CURSTATE);
      wireBestiary(el);
      break;
    case 'stats':
      el.innerHTML = statsTab(CURSTATE);
      wireStats(el);
      break;
    case 'settings':
      el.innerHTML = settingsTab(CURSTATE);
      wireSettings(el);
      break;
    case 'guide':
      el.innerHTML = guideTab(CURSTATE);
      wireGuide(el);
      break;
  }
}

// ---- INVENTORY / EQUIPMENT (humanoid races) --------------------------------

const RARITY_ORDER: LootRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

/** Human-readable stat/bonus lines for an item (used in the detail + compare panel). */
function itemStatLines(it: LootItem): string[] {
  const out: string[] = [];
  for (const k of STATS) if (it.statBonus[k]) out.push(`+${it.statBonus[k]} ${k}`);
  if (it.weaponPower) out.push(`+${it.weaponPower} ${t('ui.it_power')}`);
  if (it.armor) out.push(`+${it.armor} ${t('ui.it_armor')}`);
  if (it.dmgMult) out.push(`+${Math.round(it.dmgMult * 100)}% ${t('ui.it_dmg')}`);
  if (it.dodgeBonus) out.push(`+${Math.round(it.dodgeBonus * 100)}% ${t('ui.it_dodge')}`);
  if (it.mpRegen) out.push(`+${it.mpRegen} ${t('ui.it_mpregen')}`);
  if (it.regenMult) out.push(`+${Math.round(it.regenMult * 100)}% ${t('ui.it_regen')}`);
  return out;
}

/** Equipment overview: total flat stats granted by all worn gear. */
function equipSummary(state: GameState): string {
  const eq = equipStatBonus(state);
  const stats = STATS.filter((k) => eq[k]).map((k) => `+${eq[k]} ${k}`);
  let armor = 0;
  let power = 0;
  for (const it of Object.values(state.equipment)) {
    if (!it) continue;
    armor += it.armor ?? 0;
    power += it.weaponPower ?? 0;
  }
  const bits = [...stats];
  if (power) bits.push(`+${power} ${t('ui.it_power')}`);
  if (armor) bits.push(`+${armor} ${t('ui.it_armor')}`);
  const sum = bits.length ? `<p class="muted eq-sum">${bits.join(' · ')}</p>` : '';
  const tier = equipSetTier(state);
  const setLine = tier > 0
    ? `<p class="eq-set"><b class="r-${tier >= 3 ? 'legendary' : tier >= 2 ? 'epic' : 'rare'}">✦ ${t('ui.set_bonus')} ${tier}</b> <span class="muted">${t(`ui.set_bonus_${tier}`)}</span></p>`
    : '';
  return sum + setLine;
}

/** The detail + compare panel for the currently-selected item (bag or equipped). */
function renderItemDetail(state: GameState): string {
  if (!selectedItemUid) return '';
  const bagItem = state.inventoryItems.find((i) => i.uid === selectedItemUid);
  const equippedSlot = EQUIP_SLOTS.find((s) => state.equipment[s]?.uid === selectedItemUid);
  const it = bagItem ?? (equippedSlot ? state.equipment[equippedSlot] : null);
  if (!it) return '';
  const lines = itemStatLines(it).map((l) => `<li>${l}</li>`).join('') || `<li class="muted">—</li>`;
  // compare a bag item against whatever occupies its target slot
  let compare = '';
  if (bagItem) {
    const target = it.type === 'accessory'
      ? (state.equipment.acc1 ?? state.equipment.acc2)
      : state.equipment[it.type];
    if (target) {
      const dPow = (it.weaponPower ?? 0) - (target.weaponPower ?? 0);
      const dArm = (it.armor ?? 0) - (target.armor ?? 0);
      const cmp: string[] = [];
      if (dPow) cmp.push(delta(dPow, t('ui.it_power')));
      if (dArm) cmp.push(delta(dArm, t('ui.it_armor')));
      for (const k of STATS) {
        const d = (it.statBonus[k] ?? 0) - (target.statBonus[k] ?? 0);
        if (d) cmp.push(delta(d, k));
      }
      if (cmp.length) compare = `<div class="it-cmp"><span class="muted">${t('ui.vs_equipped')}:</span> ${cmp.join(' · ')}</div>`;
    }
  }
  // equip requirements (red if unmet)
  let reqLine = '';
  if (it.statReq) {
    const unmet = new Set(unmetReqs(state, it));
    const parts = (Object.keys(it.statReq) as StatKey[]).map(
      (k) => `<span class="${unmet.has(k) ? 'd-down' : 'd-up'}">${k} ${it.statReq![k]}</span>`,
    );
    reqLine = `<div class="it-req"><span class="muted">${t('ui.it_req')}:</span> ${parts.join(' · ')}</div>`;
  }
  const score = itemScore(it);
  const scoreLine = `<div class="it-score" style="font-size:0.85rem; margin-top:0.4rem; color:var(--ember); font-weight:bold;">${t('ui.power_score')}: ${Math.round(score)}</div>`;

  const fCost = forgeCost(it);
  const actions = bagItem
    ? `<button class="it-equip" data-uid="${it.uid}"${canEquip(state, it) ? '' : ' disabled'}>${t('ui.equip')}</button>
       ${fCost > 0 ? `<button class="it-forge ghost" data-uid="${it.uid}"${state.ep >= fCost ? '' : ' disabled'}>${t('ui.forge')} (${fCost} EP)</button>` : ''}
       <button class="it-discard ghost" data-uid="${it.uid}">${t('ui.discard')} (+${it.value} EP)</button>`
    : `<button class="it-unequip" data-slot="${equippedSlot}">${t('ui.unequip')}</button>`;
  return `<section class="panel it-detail r-${it.rarity}">
    <div class="row"><span class="it-name r-${it.rarity}">${it.icon} ${lootDisplayName(it)}</span><span class="muted">${t(`rarity.${it.rarity}`)} · ${t(`slot.${it.type === 'accessory' ? 'acc1' : it.type}`)}</span></div>
    ${scoreLine}
    <ul class="it-stats">${lines}</ul>${reqLine}${compare}
    <div class="controls">${actions}</div></section>`;
}

function delta(d: number, label: string): string {
  const cls = d > 0 ? 'd-up' : 'd-down';
  const pct = !Number.isInteger(d);
  const val = pct ? `${d > 0 ? '+' : ''}${Math.round(d * 100)}%` : `${d > 0 ? '+' : ''}${d}`;
  return `<span class="${cls}">${val} ${label}</span>`;
}

function inventoryTab(state: GameState): string {
  const slotCell = (slot: EquipSlot): string => {
    const it = state.equipment[slot];
    if (!it) return `<div class="eq-slot empty" data-eqslot="${slot}"><span class="eq-lbl">${t(`slot.${slot}`)}</span></div>`;
    return `<div class="eq-slot r-${it.rarity}${selectedItemUid === it.uid ? ' sel' : ''}" data-eqslot="${slot}" data-uid="${it.uid}" title="${lootDisplayName(it)} (${t('ui.power_score')}: ${Math.round(itemScore(it))})">
      <span class="eq-ic">${it.icon}</span><span class="eq-lbl">${t(`slot.${slot}`)}</span></div>`;
  };
  const doll = `<div class="paperdoll">${EQUIP_SLOTS.map(slotCell).join('')}</div>`;
  const sorted = [...state.inventoryItems].sort((a, b) => RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity));
  const bag = sorted.length
    ? sorted.map((it) => {
        // Calculate power score comparison with equipped item
        let slot: EquipSlot = it.type as EquipSlot;
        if (it.type === 'accessory') {
          const acc1 = state.equipment.acc1;
          const acc2 = state.equipment.acc2;
          const s1 = acc1 ? itemScore(acc1) : 0;
          const s2 = acc2 ? itemScore(acc2) : 0;
          slot = s1 <= s2 ? 'acc1' : 'acc2';
        }
        const equipped = state.equipment[slot];
        const eqScore = equipped ? itemScore(equipped) : 0;
        const score = itemScore(it);
        let badge = '';
        if (eqScore > 0) {
          const diff = Math.round(((score - eqScore) / eqScore) * 100);
          const color = diff >= 0 ? '#4caf50' : '#bb4140';
          badge = `<span style="font-size:0.75rem; color:${color}; font-weight:bold; margin-left:0.35rem;">(${diff >= 0 ? '+' : ''}${diff}%)</span>`;
        } else {
          badge = `<span style="font-size:0.75rem; color:#4caf50; font-weight:bold; margin-left:0.35rem;">(New)</span>`;
        }
        return `<button class="bag-cell r-${it.rarity}${selectedItemUid === it.uid ? ' sel' : ''}" data-uid="${it.uid}" title="${lootDisplayName(it)} (${t('ui.power_score')}: ${Math.round(score)})">${it.icon}${badge}</button>`;
      }).join('')
    : `<p class="muted">${t('ui.bag_empty')}</p>`;
  const toolbar = `<div class="controls" style="margin:.2rem 0 0">
      <button class="inv-auto ghost">${t('ui.equip_best')}</button>
      <button class="inv-scrap ghost">${t('ui.scrap_common')}</button>
    </div>`;
  return `
    <section class="panel"><h2>${t('ui.equipment')}</h2>${doll}${equipSummary(state)}</section>
    <section class="panel"><div class="row"><h2 style="margin:0">${t('ui.bag')}</h2><span class="muted">${state.inventoryItems.length}/${MAX_INVENTORY}</span></div>
      ${toolbar}<div class="bag-grid">${bag}</div></section>
    ${renderItemDetail(state)}`;
}

function wireInventory(el: HTMLElement): void {
  el.querySelectorAll<HTMLElement>('.bag-cell, .eq-slot[data-uid]').forEach((c) => {
    c.addEventListener('click', () => {
      const uid = c.getAttribute('data-uid');
      selectedItemUid = selectedItemUid === uid ? null : uid;
      renderTab();
    });
  });
  el.querySelectorAll<HTMLElement>('.eq-slot.empty').forEach((c) => {
    c.addEventListener('click', () => { selectedItemUid = null; renderTab(); });
  });
  el.querySelector<HTMLButtonElement>('.it-equip')?.addEventListener('click', (e) => {
    const uid = (e.currentTarget as HTMLElement).getAttribute('data-uid');
    if (uid) ACTIONS.onEquipItem(uid);
  });
  el.querySelector<HTMLButtonElement>('.it-unequip')?.addEventListener('click', (e) => {
    const slot = (e.currentTarget as HTMLElement).getAttribute('data-slot') as EquipSlot | null;
    if (slot) ACTIONS.onUnequipSlot(slot);
  });
  el.querySelector<HTMLButtonElement>('.it-discard')?.addEventListener('click', (e) => {
    const uid = (e.currentTarget as HTMLElement).getAttribute('data-uid');
    if (uid) { selectedItemUid = null; ACTIONS.onDiscardItem(uid); }
  });
  el.querySelector<HTMLButtonElement>('.it-forge')?.addEventListener('click', (e) => {
    const uid = (e.currentTarget as HTMLElement).getAttribute('data-uid');
    if (uid) ACTIONS.onForgeItem(uid);
  });
  el.querySelector<HTMLButtonElement>('.inv-auto')?.addEventListener('click', () => ACTIONS.onAutoEquip());
  el.querySelector<HTMLButtonElement>('.inv-scrap')?.addEventListener('click', () => ACTIONS.onScrapCommon());
}

// ---- COMBAT ----------------------------------------------------------------

function ownsSkill(state: GameState, id: string): boolean {
  return state.skills.some((s) => s.id === id);
}
/** A feature unlocks once the player has READ the deep layer (INT-gated) of a matching lore book —
 *  merely FINDING the book is not enough (deep-read book ids live in state.discoveries). */
function loreUnlocked(state: GameState, hint: string): boolean {
  return state.discoveries.some((id) => loreById(id)?.hints === hint);
}

/** Element → portrait frame colour (visual flavour only). */
const DMG_COLORS: Record<string, string> = {
  physical: '#989384', pierce: '#c9c4b5', fire: '#e0902f', frost: '#4f86c2', poison: '#8ab23f',
  acid: '#b6d33f', lightning: '#d2a73a', magic: '#9a7fd0', fear: '#a4506a', soul: '#c0626f',
};

/** The enemy "skin": its emoji on an element-coloured frame (bosses glow). Shown even when veiled.
 *  `active` = combat is live → the portrait gets a per-tick attack lunge (synced to the 1s round). */
function enemyPortrait(inst: NonNullable<GameState['enemy']>, active: boolean): string {
  // Elites take a gold frame + glow so they read as special at a glance, over the element colour.
  const color = inst.elite ? '#e6c558' : (DMG_COLORS[inst.damageType] ?? '#989384');
  const glow = inst.isBoss ? `box-shadow:0 0 16px ${color};` : inst.elite ? 'box-shadow:0 0 14px #e6c558;' : '';
  const anim = active ? ' combat-active' : ' idle-foe';
  // A hand-drawn portrait when available; otherwise the emoji glyph.
  const inner = inst.image
    ? `<img class="eportrait-img" src="${assetUrl(inst.image)}" alt="" loading="lazy" />`
    : (inst.icon ?? '❓');
  // color:${color} so the boss-glow keyframe's currentColor matches the element's element-colour.
  return `<div class="eportrait${inst.isBoss ? ' boss' : ''}${inst.elite ? ' elite' : ''}${anim}${inst.image ? ' has-img' : ''}" style="border-color:${color};color:${color};${glow}">${inner}</div>`;
}

/** Resolve an asset path under the Vite base (handles the GitHub Pages "/<repo>/" base). */
function assetUrl(rel: string): string {
  const base = import.meta.env.BASE_URL || '/';
  return base.endsWith('/') ? base + rel : `${base}/${rel}`;
}

/** Race ids that have a hand-drawn portrait under data/races/<id>.png. */
const RACE_PORTRAITS = new Set(['spider', 'slime', 'skeleton', 'wyrmling', 'golem', 'human']);

/** Animated player presence while resting / meditating — portrait + live HP/SP/MP bars. */
function restStage(state: GameState): string {
  const kind = state.action === 'meditate' ? 'meditating' : 'resting';
  const form = currentForm(state, CONTENT);
  let figure: string;
  if (form?.image) {
    figure = `<img class="rest-portrait" src="${assetUrl(form.image)}" alt="" />`;
  } else if (RACE_PORTRAITS.has(state.raceId)) {
    figure = `<img class="rest-portrait" src="${assetUrl(`races/${state.raceId}.png`)}" alt="" />`;
  } else {
    figure = headSvg(state);
  }
  const hp = `<div class="rest-bar-row"><span class="muted" style="font-size:0.78rem">HP</span>${bar(state.hp, state.maxHp, '#6fae53')}<span class="muted" style="font-size:0.78rem">${Math.round(state.hp)}/${state.maxHp}</span></div>`;
  const mp = state.maxMp > 0 ? `<div class="rest-bar-row"><span class="muted" style="font-size:0.78rem">MP</span>${bar(state.mp, state.maxMp, '#4f86c2')}<span class="muted" style="font-size:0.78rem">${Math.round(state.mp)}/${state.maxMp}</span></div>` : '';
  const sp = `<div class="rest-bar-row"><span class="muted" style="font-size:0.78rem">SP</span>${bar(state.sp, state.maxSp, '#d2a73a')}<span class="muted" style="font-size:0.78rem">${Math.round(state.sp)}/${state.maxSp}</span></div>`;
  return `<div class="rest-stage ${kind}"><span class="rest-aura">${figure}</span><span class="rest-label muted">${t(`act.${state.action}`)}</span><div class="rest-bars">${hp}${mp}${sp}</div></div>`;
}

function enemyView(state: GameState): string {
  const inst = state.enemy;
  if (!inst) {
    if (state.action === 'rest' || state.action === 'meditate') return restStage(state);
    if (state.action === 'combat' && state.roomCleared) return `<p class="muted">${t('ui.boss_cleared')}</p>`;
    return `<p class="muted">${state.action === 'combat' ? t('ui.no_enemy') : t(`act.${state.action}`)}</p>`;
  }
  const portrait = enemyPortrait(inst, state.action === 'combat');
  const layer = CONTENT.dungeon.layers.find((l) => l.id === state.pos.layer);
  const isBossRoom = !!layer && state.pos.room >= roomsOf(state, layer, state.pos.floor);
  const quota = roomQuota(state);
  const killBadge = (!isBossRoom && state.action === 'combat')
    ? `<span class="kill-badge${(state.roomKillCount ?? 0) >= quota ? ' kill-quota-met' : ''}">${state.roomKillCount ?? 0}/${quota}</span>`
    : '';
  const eliteBadge = inst.elite ? `<span class="elite-badge">⭐ ${t('ui.elite')}</span>` : '';
  const tier = Math.max(appraisalTier(state), inst.analyzed ? 1 : 0);
  if (tier < 1) {
    // No "seeing eye" slotted — you see the creature's shape but never its true stats.
    const mark = inst.isBoss ? '☠ ' : '';
    return `<div class="erow" style="position:relative">${killBadge}${eliteBadge}${portrait}<div><div><b>${mark}${inst.elite ? '⭐ ' : ''}${t('ui.unknown')}</b></div><div class="muted" style="font-size:0.82rem">${t('ui.enemy_veiled')}</div>${bar(inst.hp, inst.maxHp, '#bb4140')}</div></div>`;
  }
  const baseName = t(inst.locKey);
  const name = `${inst.analyzed ? '🔍 ' : ''}${inst.isBoss ? '☠ ' : ''}${inst.elite ? '⭐ ' : ''}${baseName}`;
  const et = tier + (inst.analyzed ? 1 : 0); // a deep-read (Analyze) reveals one tier deeper, on the enemy
  const bits: string[] = [`<b>${name}</b>`];
  if (et >= 2) bits.push(`[${t(`dmgtype.${inst.damageType}`)}${inst.damageType2 ? '+' + t(`dmgtype.${inst.damageType2}`) : ''}]`);
  if (et >= 3) bits.push(`ATK ${inst.attack}`);
  const hpText = et >= 4 ? `${Math.round(inst.hp)}/${inst.maxHp}` : '';
  let weak = '';
  if (et >= 5) {
    const w = weaknessOf(CONTENT, inst.damageType);
    if (w) weak = `<div class="muted" style="font-size:0.78rem">${t('ui.weak_to')}: <b style="color:var(--venom)">${t(`dmgtype.${w}`)}</b></div>`;
  }
  return `<div class="erow" style="position:relative">${killBadge}${eliteBadge}${portrait}<div style="flex:1">${bits.join(' · ')} ${hpText}${bar(inst.hp, inst.maxHp, '#bb4140')}${weak}</div></div>`;
}

/** A choice-based map event: text + choice buttons (gated/foresighted), blocks combat. */
function eventPanel(state: GameState): string {
  const pe = state.pendingEvent;
  if (!pe) return '';
  const def = CONTENT.events.get(pe.id);
  if (!def) return '';
  const reveal = foresee(state, def);
  const choices = def.choices
    .map((c, i) => {
      const ok = condMet(state, c.requires);
      const allOut = [...(c.outcomes ?? []), ...(c.random?.flatMap((b) => b.outcomes) ?? [])];
      const preview =
        reveal && allOut.length
          ? `<div class="muted ev-foresee">↳ ${allOut.map((o) => t(o.locKeyResult)).join(' / ')}</div>`
          : '';
      const lock = !ok ? ` <span class="muted">(${t('ui.ev_requires')}: ${reqText(c.requires)})</span>` : '';
      return `<button class="evchoice" data-evchoice="${i}"${ok ? '' : ' disabled'}>${t(c.locKey)}${lock}</button>${preview}`;
    })
    .join('');
  return `<section class="panel evpanel"><div class="ev-head">${def.icon ?? '❗'} <b>${t('ui.ev_title')}</b></div>
    <p>${t(def.locKey)}</p><div class="ev-choices">${choices}</div></section>`;
}

/** A boss-riddle challenge: type the answer; once solved, choose skip or fight (3 difficulties). */
function bossRiddlePanel(state: GameState): string {
  const br = state.bossRiddle;
  if (!br) return '';
  const riddle = riddleById(br.riddleId);
  if (!riddle) return '';
  // Hard lore-gate: if the riddle needs lore the player hasn't found, lock it — they must fight the boss.
  if (riddle.loreReq && !state.booksFound.includes(riddle.loreReq) && br.attempts >= 0) {
    const loreTitle = loreById(riddle.loreReq)?.title ?? riddle.loreReq;
    return `<section class="panel brpanel"><div class="ev-head">🧩 <b>${t('ui.br_title')}</b></div>
      <p>${riddle.text}</p>
      <p style="color:#c9a23a;font-size:0.85rem">🔒 ${t('ui.br_lore_locked', { lore: loreTitle })}</p>
      <div class="ev-choices">
        <button class="evchoice" id="br-abandon">⚔️ ${t('ui.br_fight_instead')}</button>
        ${state.stats.INT >= RIDDLE_INT_SOLVE ? `<button id="br-intskip" class="ghost" title="${t('ui.br_intskip_hint')}">🧠 ${t('ui.br_intskip')}</button>` : ''}
      </div></section>`;
  }
  if (br.attempts === -1) {
    return `<section class="panel brpanel"><div class="ev-head">🗝️ <b>${t('ui.br_solved_title')}</b></div>
      <p>${t('ui.br_choose')}</p>
      <div class="ev-choices">
        <button class="evchoice br-skip">🛡️ ${t('ui.boss_skip')}</button>
        <div class="br-fights"><span class="muted">⚔️ ${t('ui.boss_fight')}:</span>
          <button class="br-fight" data-diff="normal">${t('ui.diff_normal')}</button>
          <button class="br-fight" data-diff="hard">${t('ui.diff_hard')}</button>
          <button class="br-fight" data-diff="brutal">${t('ui.diff_brutal')}</button>
        </div>
      </div></section>`;
  }
  return `<section class="panel brpanel"><div class="ev-head">🧩 <b>${t('ui.br_title')}</b> <span class="muted">${t('ui.br_attempts', { left: 3 - br.attempts })}</span></div>
    <p>${riddle.text}</p>
    <p class="muted" style="font-size:0.8rem">↪ ${riddle.clue}</p>
    <div class="controls">
      <input id="br-input" type="text" placeholder="${t('ui.answer')}" autocomplete="off" />
      <button id="br-answer">${t('ui.solve')}</button>
      ${state.stats.INT >= RIDDLE_INT_SOLVE ? `<button id="br-intskip" class="ghost" title="${t('ui.br_intskip_hint')}">🧠 ${t('ui.br_intskip')}</button>` : `<span class="muted" style="font-size:.72rem">🧠 INT ${RIDDLE_INT_SOLVE}</span>`}
    </div></section>`;
}

/** One signature gauge block: icon + label + value text + filled bar + effect hint. */
function sigBlock(icon: string, label: string, valueText: string, value: number, max: number, color: string, hint: string): string {
  return `<div class="sig-block">
    <div class="row"><span>${icon} ${label}</span><span class="sig-val">${valueText}</span></div>
    ${bar(value, max, color)}
    <div class="sig-hint">${hint}</div>
  </div>`;
}

/** Race signature gauge panel shown in the combat tab — always visible for races that have a signature,
 *  so the player can read exactly how much is built up, the effect, and (slime) seconds remaining. */
function raceSigPanel(state: GameState): string {
  const sig = Number.isFinite(state.sig) ? state.sig : 0;
  switch (state.raceId) {
    case 'spider': {
      const pct = Math.round(sig);
      const dmg = Math.round((sig / 100) * (state.stats.STR * 2 + state.level));
      return sigBlock('🕸', t('sig.spider'), `${pct}%`, sig, 100, '#8ab23f',
        sig > 0 ? t('sig.spider_hint', { dmg }) : t('sig.spider_empty'));
    }
    case 'wyrmling': {
      const burst = Math.round(state.stats.INT * 3 + state.level * 2);
      return sigBlock('🔥', t('sig.wyrmling'), `${Math.floor(sig)}/10`, sig, 10, '#e0683c',
        t('sig.wyrmling_hint', { burst }));
    }
    case 'skeleton': {
      const armor = Math.floor(sig);
      return sigBlock('🦴', t('sig.skeleton'), `${armor}/20`, sig, 20, '#cdc6b0',
        t('sig.skeleton_hint', { armor }));
    }
    case 'slime': {
      if (!state.sigAbsorb) {
        return sigBlock('🫧', t('sig.slime'), t('sig.slime_none'), 0, 120, '#5fa8d0', t('sig.slime_empty'));
      }
      const sec = state.sigAbsorb.ticks;
      const elem = t(`dmgtype.${state.sigAbsorb.type}`);
      return sigBlock('🫧', t('sig.slime'), `${elem} · ${sec}s`, sec, 120, '#5fa8d0',
        t('sig.slime_hint', { elem }));
    }
    case 'golem': {
      const layers = Math.floor(sig);
      return sigBlock('🪨', t('sig.golem'), `${layers}/5`, sig, 5, '#9a8a6a',
        t('sig.golem_hint', { absorb: layers * 3 }));
    }
    case 'beastman': {
      const stacks = Math.floor(sig);
      const bonus = stacks * 5;
      return sigBlock('🐾', t('sig.beastman'), `${stacks}/10`, sig, 10, '#8a3a3a',
        stacks > 0 ? t('sig.beastman_hint', { stacks, bonus }) : t('sig.beastman_empty'));
    }
    default:
      return '';
  }
}

const BEHAVIOR_KEYS = ['regen', 'doubleStrike', 'enrage', 'armorPct', 'lifesteal', 'statusBoost'] as const;


function bestiaryTab(state: GameState): string {
  const enemies = [...CONTENT.enemies.values()];
  const appTier = appraisalTier(state);
  const killed = state.killedEnemies ?? {};
  const known = enemies.filter((e) => (killed[e.id] ?? 0) > 0).length;

  // Auto-select first discovered enemy if nothing selected
  if (!selectedBestiaryId) {
    const first = enemies.find((e) => (killed[e.id] ?? 0) > 0);
    if (first) selectedBestiaryId = first.id;
  }

  // --- Left list ---
  const listItems = enemies.map((e) => {
    const n = killed[e.id] ?? 0;
    if (n === 0) {
      return `<div class="bestiary-list-item locked"><span class="bc-icon">🔒</span><span>${t('ui.bestiary_unknown')}</span></div>`;
    }
    const active = selectedBestiaryId === e.id;
    const iconHtml = e.image
      ? `<img class="bc-img" src="${assetUrl(e.image)}" alt="" loading="lazy" />`
      : `<span class="bc-icon">${e.icon ?? '🐾'}</span>`;
    return `<div class="bestiary-list-item${active ? ' active' : ''}" data-bestiary="${e.id}">
      ${iconHtml}<span>💀 ${t(e.locKey)} (${n})</span>
    </div>`;
  }).join('');

  // --- Right detail pane ---
  const detailHtml = bestiaryDetailPane(state, appTier);

  return `<section class="panel">
    <h2>${t('tab.bestiary')} <span class="muted">(${known}/${enemies.length})</span></h2>
    <div class="bestiary-cols">
      <div class="bestiary-list">${listItems}</div>
      <div class="bestiary-detail-pane">${detailHtml}</div>
    </div>
  </section>`;
}

/** Render the detail pane for the currently selected bestiary monster. */
function bestiaryDetailPane(state: GameState, appTier: number): string {
  if (!selectedBestiaryId) {
    return `<div style="text-align:center;color:var(--ash);padding:3rem 1rem;">${t('ui.bestiary_select_hint')}</div>`;
  }
  const enemy = CONTENT.enemies.get(selectedBestiaryId);
  if (!enemy) {
    return `<div style="text-align:center;color:var(--blood);padding:3rem 1rem;">${t('ui.bestiary_error')}</div>`;
  }
  const kills = (state.killedEnemies ?? {})[enemy.id] ?? 0;
  if (kills === 0) {
    return `<div style="text-align:center;color:var(--ember);padding:3rem 1rem;"><b>${t('ui.bestiary_undiscovered')}</b><br><br>${t('ui.bestiary_undiscovered_body')}</div>`;
  }

  // Tier-gated stat reveal (matches Godot: T2 HP/Race, T5 ATK/DEF, T8 Element/Weakness, T12 EXP/Food/Skill, T20+ Flavor)
  const q = () => `<span style="color:var(--ash)">???</span>`;
  const c = (color: string, v: string | number) => `<span style="color:${color}">${v}</span>`;

  const killsStr = c('#5fa8d0', kills);
  const hpStr = appTier >= 2 ? c('#bb4140', enemy.hp) : q();
  const raceStr = appTier >= 2
    ? c('#e0902f', enemy.race ? t(`race.${enemy.race}.name`) : '—')
    : q();
  const atkStr = appTier >= 5 ? c('#e87060', enemy.attack) : q();
  const defStr = appTier >= 5 ? c('#d2a73a', enemy.behavior?.armorPct ? `${Math.round(enemy.behavior.armorPct * 100)}%` : '0') : q();
  const dmgTypeStr = appTier >= 8 ? c('#b07ae0', t(`dmgtype.${enemy.damageType}`)) : q();
  const weak = weaknessOf(CONTENT, enemy.damageType);
  const weakStr = appTier >= 8 ? c('#8ab23f', weak ? t(`dmgtype.${weak}`) : '—') : q();
  const expStr = appTier >= 12 ? c('#d2a73a', `+${enemy.ep} EP`) : q();
  const foodStr = appTier >= 12 ? c('#8ab23f', t('ui.bestiary_food_val', { sat: enemy.satiety })) : q();

  let grantSkillStr = q();
  if (appTier >= 12) {
    const skills = enemy.grantSkills ?? [];
    if (skills.length === 0) {
      grantSkillStr = `<span style="color:var(--ash)">${t('ui.bestiary_none')}</span>`;
    } else {
      grantSkillStr = skills.map((sid) => {
        const sDef = CONTENT.skills.get(sid);
        return sDef ? `<span style="color:#d2a73a">${t(sDef.locKeyName)}</span>` : sid;
      }).join(', ');
    }
  }

  // Behavior tags
  const behTags = enemy.behavior
    ? BEHAVIOR_KEYS.filter((k) => (enemy.behavior as Record<string, unknown>)[k] !== undefined)
        .map((k) => `<span class="beh-tag">${t(`ui.beh_${k}`)}</span>`)
        .join(' ')
    : '';

  // Portrait
  const portrait = enemy.image
    ? `<div style="text-align:center;margin-bottom:0.6rem;"><img src="${assetUrl(enemy.image)}" alt="" style="width:80px;height:80px;object-fit:contain;border:2px solid var(--chitin);border-radius:12px;background:radial-gradient(circle at 50% 38%, #23202e, #0e0c14);" /></div>`
    : `<div style="text-align:center;font-size:2.4rem;margin-bottom:0.4rem;">${enemy.icon ?? '🐾'}</div>`;

  // Flavor text (T20+ or hint)
  const flavorKey = `bestiary.flavor.${enemy.id}`;
  const flavorText = appTier >= 20 ? t(flavorKey) : null;
  const flavorHtml = flavorText
    ? `<div class="bestiary-flavor">📜 ${flavorText}</div>`
    : `<div style="font-size:0.78rem;color:var(--ash);margin-top:0.5rem;">${t('ui.bestiary_flavor_hint')}</div>`;

  return `
    ${portrait}
    <h3>📖 ${t(enemy.locKey)}</h3>
    ${behTags ? `<div style="text-align:center;margin-bottom:0.5rem;">${behTags}</div>` : ''}
    <table class="bestiary-detail-table">
      <tr><td>${t('ui.bestiary_kills')}:</td><td>${killsStr}</td></tr>
      <tr><td>${t('ui.bestiary_race_group')}:</td><td>${raceStr}</td></tr>
      <tr><td>${t('ui.bestiary_max_hp')}:</td><td>${hpStr}</td></tr>
      <tr><td>${t('ui.bestiary_atk')}:</td><td>${atkStr}</td></tr>
      <tr><td>${t('ui.bestiary_def')}:</td><td>${defStr}</td></tr>
      <tr><td>${t('ui.bestiary_dmg_type')}:</td><td>${dmgTypeStr}</td></tr>
      <tr><td>${t('ui.bestiary_weakness')}:</td><td>${weakStr}</td></tr>
      <tr><td>${t('ui.bestiary_exp')}:</td><td>${expStr}</td></tr>
      <tr><td>${t('ui.bestiary_food')}:</td><td>${foodStr}</td></tr>
      <tr><td>${t('ui.bestiary_skill')}:</td><td>${grantSkillStr}</td></tr>
    </table>
    ${flavorHtml}
  `;
}

function wireBestiary(el: HTMLElement): void {
  el.querySelectorAll<HTMLElement>('.bestiary-list-item[data-bestiary]').forEach((b) => {
    b.addEventListener('click', () => {
      selectedBestiaryId = b.getAttribute('data-bestiary');
      renderTab();
    });
  });
}

function foragePanel(state: GameState): string {
  if (!state.pendingForage) return '';
  const reveal = forageReveal(state, CONTENT);
  if (!reveal) return '';
  const name = reveal.name === 'ui.forage_unknown' ? `<span class="muted">${t('ui.forage_unknown')}</span>` : `<b>${t(reveal.name)}</b>`;
  const satLine = reveal.satiety !== null ? `<span>${t('ui.forage_satiety', { sat: reveal.satiety })}</span>` : '';
  const dangerLine = reveal.dangerIcon !== null ? `<span>${reveal.dangerIcon}</span>` : '';
  return `
    <section class="panel forage-panel">
      <h2>${t('ui.forage_panel_title')}</h2>
      <div class="forage-info">${name}${satLine ? ' · ' + satLine : ''}${dangerLine ? ' · ' + dangerLine : ''}</div>
      <div class="controls" style="margin-top:.5rem">
        <button id="forage-eat">${t('ui.forage_eat')}</button>
        <button id="forage-discard" class="ghost">${t('ui.forage_discard')}</button>
      </div>
    </section>`;
}

function forageAutoToggle(state: GameState): string {
  const soulLv = soulLevel(state, 'auto_search');
  if (!state.autoSearchUnlocked && soulLv < 1) {
    return `<span class="muted" style="font-size:0.75rem">${t('auto.locked')} (${state.totalSearchCount}/100)</span>`;
  }
  const foodOn = state.autoSearchFood;
  return `<button class="ghost auto-toggle" id="auto-food-toggle" style="font-size:0.75rem;padding:0.2rem 0.5rem;">
    ${t('auto.food.label')}: <b>${foodOn ? t('auto.on') : t('auto.off')}</b>
  </button>`;
}

function exploreAutoToggle(state: GameState): string {
  const soulLv = soulLevel(state, 'auto_search');
  if (!state.autoSearchUnlocked && soulLv < 1) return '';
  const on = state.autoSearchExplore;
  return `<button class="ghost auto-toggle" id="auto-explore-toggle" style="font-size:0.75rem;padding:0.2rem 0.5rem;">
    ${t('auto.explore.label')}: <b>${on ? t('auto.on') : t('auto.off')}</b>
  </button>`;
}

/** Combat-tab banner shown at the level cap when an evolution is available: lists each open form with
 *  an Evolve button, plus a "Keep Growing" button when higher-tier siblings are still locked (the C
 *  mechanic — lets a staggered node be caught early or climbed past). Soft: combat keeps running. */
function evolveBannerHtml(state: GameState): string {
  if (state.level < LEVEL_CAP || state.pendingHumanPath) return '';
  const selectable = availableEvolutions(state, CONTENT).filter((f) => secretMet(state, f));
  const open = selectable.filter((f) => canEvolve(state, f));
  if (open.length === 0) return '';
  const needTier = selectable.length ? Math.max(...selectable.map((f) => f.tierReq ?? 0)) : 0;
  const rows = open
    .map((f) => {
      const rare = f.secret ? ` <span style="color:#e6c558">✦ ${t('ui.evo_rare')}</span>` : '';
      return `<div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;margin:.25rem 0">
        <span><b>${t(f.locKey)}</b>${rare}</span>
        <button class="evo-action-btn active" data-form="${f.id}" style="min-height:32px;padding:.3rem 1rem">${t('ui.evolve')}</button>
      </div>`;
    })
    .join('');
  const growBtn =
    state.tier < needTier
      ? `<button id="keep-grow" class="ghost" style="width:100%;margin-top:.4rem">${t('ui.keep_growing')} →</button>`
      : '';
  return `<section class="panel" style="border-color:#c9a23a">
    <div style="font-weight:bold;color:#e6c558;margin-bottom:.3rem">✦ ${t('ui.evolve_ready_banner')}</div>
    ${rows}${growBtn}
  </section>`;
}

function autoCombatPanel(state: GameState): string {
  const cfg = state.autoCombatConfig || { autoCastSkills: false, autoHealEnabled: false, autoHealThreshold: 0.35 };
  return `
    <section class="panel autocombat-panel" style="border-color:var(--chitin);">
      <h2>⚔ ${t('ui.autocombat_title')}</h2>
      <div style="display:flex; flex-direction:column; gap:0.5rem; font-size:0.85rem;">
        <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
          <input type="checkbox" id="ac-cast" ${cfg.autoCastSkills ? 'checked' : ''} />
          <span>${t('ui.autocombat_cast')}</span>
        </label>
        <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
          <input type="checkbox" id="ac-heal" ${cfg.autoHealEnabled ? 'checked' : ''} />
          <span>${t('ui.autocombat_heal')}</span>
        </label>
        ${cfg.autoHealEnabled ? `
        <div style="display:flex; align-items:center; gap:0.8rem; margin-left:1.5rem;">
          <span>${t('ui.autocombat_threshold')}:</span>
          <input type="range" id="ac-threshold" min="10" max="90" step="5" value="${Math.round(cfg.autoHealThreshold * 100)}" style="flex:1;" />
          <span style="font-family:var(--mono); min-width:2.5rem; text-align:right;">%${Math.round(cfg.autoHealThreshold * 100)}</span>
        </div>` : ''}
      </div>
    </section>
  `;
}

/**
 * Nullification roadmap: shows the path from resistances → group nullification → ultimate.
 * Each step's name is revealed only if the player owns it OR has Insight ("knowledge = power");
 * otherwise it shows as "???".
 */
function nullificationRoadmap(state: GameState): string {
  const mergers = [...CONTENT.resistanceMergers.values()];
  if (mergers.length === 0) return '';
  const hasInsight = ownsSkill(state, 'insight');
  const owns = (id: string) => state.skills.some((s) => s.id === id);
  const rows = mergers
    .map((m) => {
      const achieved = owns(m.id);
      const total = m.requires.length;
      const have = m.requires.filter((req) => owns(req.skillId)).length;
      const chips = m.requires
        .map((req) => {
          const rdef = CONTENT.skills.get(req.skillId);
          const nm = rdef ? t(rdef.locKeyName) : req.skillId;
          if (owns(req.skillId)) return `<span style="color:var(--venom)">✓ ${nm}</span>`;
          if (hasInsight) return `<span class="muted">${nm}</span>`;
          return `<span class="muted">???</span>`;
        })
        .join(' · ');
      const status = achieved
        ? `<span style="color:var(--gold)">✦ ${t('ui.nullif_achieved')}</span>`
        : `<span class="muted">${have}/${total}</span>`;
      return `<li style="margin-bottom:0.45rem"><b>${t(m.locKey)}</b> — ${status}<div style="font-size:0.78rem;margin-top:0.15rem">${chips}</div></li>`;
    })
    .join('');
  return `
    <section class="panel">
      <h2>${t('ui.nullif_roadmap')}</h2>
      <ul style="list-style:none;padding-left:0;margin:0">${rows}</ul>
      ${hasInsight ? '' : `<p class="muted" style="font-size:0.8rem;margin:0.4rem 0 0">${t('ui.nullif_hint')}</p>`}
    </section>`;
}

function combatTab(state: GameState): string {
  // An open map event takes over the dungeon view — no combat until a choice is made.
  if (state.pendingEvent) return eventPanel(state);
  // An unanswered boss riddle (no guard fighting) takes over too.
  // Defensive: if the riddle can't render (missing/corrupt data) don't blank the screen —
  // fall through to the normal combat view instead of returning an empty string.
  if (state.bossRiddle && !state.enemy) {
    const panel = bossRiddlePanel(state);
    if (panel) return panel;
  }
  const resists = state.resistances
    .map((r) => {
      const def = CONTENT.resistances.get(r.id);
      const name = def ? t(def.locKey) : r.id;
      // Effective per-type reduction (innate slot ≤20% or resistance-chain tier ≤85%).
      const pct = def ? Math.round(resistReduction(state, CONTENT, def.damageType) * 100) : 0;
      return `<li><b>${name}</b> — ${t('ui.lv')} ${r.level} · ${pct}%</li>`;
    })
    .join('');
  const act = (a: 'combat' | 'rest' | 'idle', label: string) =>
    `<button class="actbtn${state.action === a ? ' active' : ''}" data-act="${a}">${label}</button>`;
  // Features unlock through knowledge: meditate/court-death from their lore, analyze(MP) from Insight.
  const meditateBtn =
    state.meditationUnlocked || loreUnlocked(state, 'meditation')
      ? `<button id="meditate"${state.action === 'meditate' ? ' class="active"' : ''}>${t('ui.meditate')}</button>`
      : '';
  const deepBtn = ownsSkill(state, 'insight') ? `<button id="deepread">${t('ui.deepread')}</button>` : '';
  const courtBtn = loreUnlocked(state, 'brink') ? `<button id="courtdeath" class="ghost">${t('ui.court_death')}</button>` : '';
  // In rest mode the player has time to comb the room repeatedly; lastSearchPos only blocks in combat.
  const searched = state.action !== 'rest' && state.lastSearchPos === `${state.pos.layer}.${state.pos.floor}.${state.pos.room}`;
  const searchBtn = state.autoSearchExplore
    ? exploreAutoToggle(state)
    : `<button id="search"${searched ? ' disabled' : ''}>${t('ui.search')}</button>${exploreAutoToggle(state)}`;
  const forageReady = state.forageCD <= 0 && !state.pendingForage;
  const forgageCdSec = (state.forageCD / 1000).toFixed(1);
  const forageBtn = state.pendingForage
    ? forageAutoToggle(state)
    : state.autoSearchFood
      ? forageAutoToggle(state)
      : `<button id="forage-btn"${forageReady ? '' : ' disabled'}>🍃 ${forageReady ? t('ui.forage_btn') : forgageCdSec + 'sn'}</button>${forageAutoToggle(state)}`;
  const statusLine = state.statusEffects.length
    ? `<p class="muted" style="margin:.4rem 0 0">⚠ ${t('ui.status')}: ${state.statusEffects
        .map((s) => s.control
          ? `<b style="color:#9a8a6a">🪨 ${t(`dmgtype.${s.type}`)}</b> ${s.ticksLeft}s`
          : `<b style="color:var(--ember)">${t(`dmgtype.${s.type}`)}</b> ${s.ticksLeft}s (-${s.dmgPerTick})`)
        .join(' · ')}</p>`
    : '';
  const roomMod = currentRoomModifier(state, CONTENT);
  const modifierBadge = roomMod
    ? `<p class="muted" style="margin:.4rem 0 0;color:var(--ember)">🌫 ${t('ui.room_modifier')}: <b>${t(roomMod.locKey + '.name')}</b> — ${t(roomMod.locKey + '.desc')}</p>`
    : (state.modifierFreeRooms ? `<p class="muted" style="margin:.4rem 0 0;color:#4caf50">✨ ${t('ui.room_modifier_free')}</p>` : '');
  const sigPanel = raceSigPanel(state);
  return `
    ${evolveBannerHtml(state)}
    <section class="panel enemy-panel">
      <h2>${t('ui.enemy')}</h2>
      ${enemyView(state)}
      ${statusLine}
      ${modifierBadge}
      ${currentRoomHazard(state) ? `<p class="muted" style="margin:.4rem 0 0;color:#e87060">${currentRoomHazard(state)!.icon} ${t('ui.room_hazard')}: <b>${t(currentRoomHazard(state)!.locKey + '.name')}</b> — ${t(currentRoomHazard(state)!.locKey + '.desc')}</p>` : ''}
    </section>
    ${sigPanel ? `<section class="panel sig-panel"><h2>${t('sig.title')}</h2>${sigPanel}</section>` : ''}
    <div class="controls">
      ${act('combat', t('ui.fight'))}
      ${act('rest', t('ui.rest'))}
      ${act('idle', t('ui.stop'))}
      ${meditateBtn}
    </div>
    ${state.action === 'meditate' ? `<section class="panel">${medBarHtml(state)}</section>` : ''}
    ${advanceControls(state)}
    ${roomPreviewHtml(state)}
    ${skillBar(state)}
    <div class="controls">
      ${deepBtn}
      ${searchBtn}
      ${forageBtn}
      ${courtBtn}
    </div>
    ${foragePanel(state)}
    ${webPanel(state)}
    ${autoCombatPanel(state)}
    <section class="panel">
      <h2>${t('ui.resistances')}</h2>
      <ul>${resists}</ul>
    </section>
    ${nullificationRoadmap(state)}
  `;
}

/** Manual map progression: Advance button unlocks at quota (non-boss) or on room cleared (boss/explore). */
function advanceControls(state: GameState): string {
  const quotaMet = (state.roomKillCount ?? 0) >= roomQuota(state);
  const canManualAdvance = state.action === 'combat' && !state.autoAdvance && (state.roomCleared || quotaMet);
  const advBtn = canManualAdvance ? `<button id="advance" class="advbtn">${t('ui.advance')}</button>` : '';
  const autoBtn = `<button id="autoadvance" class="${state.autoAdvance ? 'active' : 'ghost'}">${t('ui.autoadvance')}: ${state.autoAdvance ? t('ui.on') : t('ui.off')}</button>`;
  return `<div class="controls">${advBtn}${autoBtn}</div>`;
}

/** Önsezi: WIS-tiered foresight of the next room (knowledge = survival). Empty below the WIS threshold. */
function roomPreviewHtml(state: GameState): string {
  const f = roomPreview(state, CONTENT);
  if (!f) return '';
  const parts: string[] = [];
  if (f.wis >= FORESIGHT_WIS_EXACT) {
    if (f.modifierKey) parts.push(`🌫 ${t(f.modifierKey + '.name')}`);
    if (f.hazardKey) parts.push(`${f.hazardIcon ?? '⚠'} ${t(f.hazardKey + '.name')}`);
    if (f.hasEvent) parts.push(`${f.eventIcon ?? '❓'} ${f.moral ? t('ui.foresee_moral') : t('ui.foresee_event')}`);
    if (parts.length === 0) parts.push(`✓ ${t('ui.foresee_calm')}`);
  } else {
    parts.push(f.danger ? `⚠ ${t('ui.foresee_danger')}` : `✓ ${t('ui.foresee_calm')}`);
    if (f.hasEvent) parts.push(`❓ ${t('ui.foresee_event')}`);
  }
  if (f.wis >= FORESIGHT_WIS_ENEMY && f.enemyPool.length) {
    const names = f.enemyPool.slice(0, 3).map((id) => { const e = CONTENT.enemies.get(id); return e ? t(e.locKey) : id; }).join(', ');
    parts.push(`⚔ ${names}`);
  }
  return `<section class="panel" style="border-color:#9a7fd0;padding:.4rem .6rem"><p class="muted" style="margin:0;font-size:.82rem">🔮 ${t('ui.foresee_next')}: ${parts.join(' · ')}</p></section>`;
}

/** Combat mode toggle + equipped skill cast buttons (with live cooldown). */
function skillBar(state: GameState): string {
  const slots = skillSlots(state);
  const mode = state.combatMode === 'auto' ? t('ui.mode_auto') : t('ui.mode_manual');
  const btns = state.equipped
    .map((id) => {
      const def = CONTENT.skills.get(id);
      const cd = state.cooldowns[id] ?? 0;
      const name = def ? t(def.locKeyName) : id;
      const mpBase = def?.mpCost ?? 0;
      const lv = state.skills.find((s) => s.id === id)?.level ?? 1;
      const lvMax = def?.lvMax ?? 10;
      const mpFloor = def?.mpFloor ?? (mpBase > 0 ? 5 : 0);
      const effectiveMp = mpBase > 0
        ? mpFloor + Math.round((mpBase - mpFloor) * (lvMax - lv) / Math.max(1, lvMax - 1))
        : 0;
      const mpTag = effectiveMp > 0 ? ` <span class="muted" style="font-size:0.7em">${effectiveMp}MP</span>` : '';
      return `<button class="castbtn" data-cast="${id}"${cd > 0 ? ' disabled' : ''}>${name}${mpTag}${cd > 0 ? ` <span class="cd">${cd}</span>` : ''}</button>`;
    })
    .join('');
  return `
    <section class="panel">
      <div class="row"><span class="muted">${t('ui.equipped')} ${state.equipped.length}/${slots}</span><button id="mode" class="ghost">${t('ui.mode')}: ${mode}</button></div>
      <div class="controls">${btns || `<span class="muted">${t('ui.no_equipped')}</span>`}</div>
    </section>`;
}

function wireCombat(el: HTMLElement): void {
  el.querySelector<HTMLButtonElement>('#mode')?.addEventListener('click', ACTIONS.onToggleMode);
  el.querySelector<HTMLButtonElement>('#advance')?.addEventListener('click', ACTIONS.onAdvance);
  el.querySelector<HTMLButtonElement>('#autoadvance')?.addEventListener('click', ACTIONS.onToggleAutoAdvance);
  el.querySelectorAll<HTMLButtonElement>('.castbtn[data-cast]').forEach((b) => {
    b.addEventListener('click', () => {
      const id = b.getAttribute('data-cast');
      if (id) ACTIONS.onUseSkill(id);
    });
  });
  el.querySelectorAll<HTMLButtonElement>('.actbtn').forEach((b) => {
    b.addEventListener('click', () => ACTIONS.onSetAction(b.getAttribute('data-act') as 'idle' | 'combat' | 'rest'));
  });
  el.querySelector<HTMLButtonElement>('#deepread')?.addEventListener('click', ACTIONS.onDeepRead);
  el.querySelector<HTMLButtonElement>('#meditate')?.addEventListener('click', ACTIONS.onMeditate);
  el.querySelector<HTMLButtonElement>('#search')?.addEventListener('click', ACTIONS.onSearch);
  el.querySelector<HTMLButtonElement>('#forage-btn')?.addEventListener('click', ACTIONS.onForage);
  el.querySelector<HTMLButtonElement>('#forage-eat')?.addEventListener('click', ACTIONS.onForageEat);
  el.querySelector<HTMLButtonElement>('#forage-discard')?.addEventListener('click', ACTIONS.onForageDiscard);
  el.querySelector<HTMLButtonElement>('#auto-food-toggle')?.addEventListener('click', ACTIONS.onToggleAutoFood);
  el.querySelector<HTMLButtonElement>('#auto-explore-toggle')?.addEventListener('click', ACTIONS.onToggleAutoExplore);
  el.querySelector<HTMLButtonElement>('#courtdeath')?.addEventListener('click', ACTIONS.onCourtDeath);
  el.querySelectorAll<HTMLButtonElement>('.evchoice').forEach((b) =>
    b.addEventListener('click', () => ACTIONS.onChooseEvent(Number(b.dataset.evchoice))),
  );
  el.querySelector<HTMLButtonElement>('#br-answer')?.addEventListener('click', () => {
    const input = el.querySelector<HTMLInputElement>('#br-input');
    if (input && input.value.trim()) ACTIONS.onAnswerBossRiddle(input.value);
  });
  el.querySelector<HTMLButtonElement>('#br-intskip')?.addEventListener('click', () => ACTIONS.onIntSkipRiddle());
  el.querySelector<HTMLButtonElement>('#br-abandon')?.addEventListener('click', () => ACTIONS.onAbandonRiddle());
  el.querySelector<HTMLButtonElement>('.br-skip')?.addEventListener('click', () => ACTIONS.onBossChoice('skip', ''));
  el.querySelectorAll<HTMLButtonElement>('.br-fight').forEach((b) =>
    b.addEventListener('click', () => ACTIONS.onBossChoice('fight', b.dataset.diff ?? 'normal')),
  );
  el.querySelector<HTMLButtonElement>('#web-spin')?.addEventListener('click', () => ACTIONS.onSpinWeb());
  el.querySelector<HTMLButtonElement>('#web-collect')?.addEventListener('click', () => ACTIONS.onCollectWeb());
  // Evolve banner (level-cap, combat tab): evolve now or keep growing toward higher-tier siblings.
  el.querySelectorAll<HTMLButtonElement>('.evo-action-btn[data-form]').forEach((b) => {
    b.addEventListener('click', () => { const f = b.getAttribute('data-form'); if (f) ACTIONS.onEvolve(f); });
  });
  el.querySelector<HTMLButtonElement>('#keep-grow')?.addEventListener('click', ACTIONS.onKeepGrow);

  // --- Auto-Combat Macros event listeners (QoL/R2) ---
  el.querySelector<HTMLInputElement>('#ac-cast')?.addEventListener('change', () => {
    ACTIONS.onToggleAutoCastSkills?.();
  });
  el.querySelector<HTMLInputElement>('#ac-heal')?.addEventListener('change', () => {
    ACTIONS.onToggleAutoHeal?.();
  });
  el.querySelector<HTMLInputElement>('#ac-threshold')?.addEventListener('input', (e) => {
    const val = Number((e.target as HTMLInputElement).value);
    ACTIONS.onSetAutoHealThreshold?.(val);
  });
}

// ---- MAP -------------------------------------------------------------------

/** Fog-of-war grid of one layer: floors are rows (each its own random width), rooms are cells. */
function dungeonGrid(state: GameState, layer: DungeonLayer): string {
  const F = floorsOf(state, layer);
  const onLayer = state.pos.layer === layer.id;
  const explored = state.exploredMax[layer.id] ?? [];
  let rows = '';
  for (let f = 1; f <= F; f++) {
    const R = roomsOf(state, layer, f);
    const reachedRoom = Math.max(explored[f - 1] ?? 0, onLayer && f === state.pos.floor ? state.pos.room : 0);
    let cells = '';
    for (let r = 1; r <= R; r++) {
      const isBoss = r === R;
      const isCurrent = onLayer && f === state.pos.floor && r === state.pos.room;
      const revealed = r <= reachedRoom || isCurrent;
      let cls = 'dcell';
      let glyph = '';
      if (isCurrent) {
        cls += ' current';
        glyph = isBoss ? '☠' : '◈';
      } else if (!revealed) {
        cls += ' fog';
        if (isBoss) cls += ' boss';
      } else {
        cls += ' lit';
        if (isBoss) {
          cls += ' boss';
          glyph = '☠';
        }
      }
      let attrs = '';
      if (revealed && !isCurrent) {
        cls += ' clickable';
        attrs = `data-floor="${f}" data-room="${r}"`;
      }
      cells += `<div class="${cls}" ${attrs}>${glyph}</div>`;
    }
    rows += `<div class="dmap-floor" style="--cols:${R}"><span class="flabel">${f}</span>${cells}</div>`;
  }
  return `<div class="dmap">${rows}</div>`;
}

function mapTab(state: GameState): string {
  const cur = CONTENT.dungeon.layers.find((l) => l.id === state.pos.layer);
  const curRooms = cur ? roomsOf(state, cur, state.pos.floor) : 0;
  const bossSoon = cur && state.pos.room >= curRooms ? ` · <b style="color:var(--ember)">${t('ui.boss')}</b>` : '';
  const pending = state.pendingRoom ? `<p style="color:var(--ember)">⌑ ${t('ui.room_sensed')}: ${t(CONTENT.rooms.get(state.pendingRoom)?.locKey ?? '')}</p>` : '';
  
  let reachedFloors = 1;
  if (cur) {
    const explored = state.exploredMax[cur.id] ?? [];
    for (let f = 1; f <= floorsOf(state, cur); f++) if ((explored[f - 1] ?? 0) > 0) reachedFloors = f;
    if (state.pos.layer === cur.id) reachedFloors = Math.max(reachedFloors, state.pos.floor);
  }

  const legend = `
    <div class="dlegend">
      <span><i class="cur"></i>${t('ui.here')}</span>
      <span><i class="lit"></i>${t('ui.cleared')}</span>
      <span><i class="boss"></i>${t('ui.boss')}</span>
      <span><i class="fog"></i>${t('ui.unknown_cell')}</span>
    </div>`;
  const layers = CONTENT.dungeon.layers
    .map((l) => {
      const unlocked = state.tier >= l.tierReq;
      const current = state.pos.layer === l.id;
      let prog = '';
      if (unlocked) {
        const explored = state.exploredMax[l.id] ?? [];
        let total = 0;
        let done = 0;
        for (let f = 1; f <= floorsOf(state, l); f++) {
          const R = roomsOf(state, l, f);
          total += R;
          done += Math.min(explored[f - 1] ?? 0, R);
        }
        prog = ` <span class="muted">${total > 0 ? Math.floor((done / total) * 100) : 0}%</span>`;
      }
      const status = current
        ? `<span class="muted">${t('ui.current')}</span>`
        : !unlocked
          ? `<span class="muted">${t('ui.locked')} (T${l.tierReq})</span>`
          : `<button class="layerbtn" data-layer="${l.id}">${t('ui.enter')}</button>`;
      return `<li><b>${t(l.locKey)}</b> — T${l.tierReq}+${prog} ${status}</li>`;
    })
    .join('');
  return `
    <section class="panel">
      <div class="row" style="align-items: center; justify-content: space-between;">
        <h2 style="margin:0">${cur ? t(cur.locKey) : t('tab.map')}</h2>
        <span class="muted" style="font-family: var(--mono);">${state.pos.layer}.${state.pos.floor}.${state.pos.room}</span>
      </div>
      
      <div class="row" style="margin: 0.6rem 0; align-items: center; justify-content: space-between; background: #13111a; padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid #201b2b;">
        <span class="muted" style="font-size: 0.86rem; display: inline-flex; align-items: center; gap: 0.4rem;">
          🗺️ ${t('ui.floor')} <b style="color: var(--bone); font-size: 1rem;">${state.pos.floor}/${cur ? floorsOf(state, cur) : '?'}</b> 
          · ${t('ui.room')} <b style="color: var(--bone); font-size: 1rem;">${state.pos.room}/${curRooms || '?'}</b>
          ${bossSoon}
        </span>
        <div class="floor-nav" style="display: flex; gap: 0.3rem;">
          <button class="floor-nav-btn" data-dir="down" ${state.pos.floor <= 1 ? 'disabled' : ''} style="min-width: 32px; height: 28px; padding: 0; font-size: 0.75rem;" title="${t('ui.go_down')}">▼</button>
          <button class="floor-nav-btn" data-dir="up" ${state.pos.floor >= reachedFloors ? 'disabled' : ''} style="min-width: 32px; height: 28px; padding: 0; font-size: 0.75rem;" title="${t('ui.go_up')}">▲</button>
        </div>
      </div>

      ${cur ? dungeonGrid(state, cur) : ''}
      ${legend}
      ${pending}
      ${cur ? farmControls(state, cur) : ''}
    </section>
    <section class="panel"><h2>${t('ui.layers')}</h2><ul>${layers}</ul></section>
  `;
}

/** Buttons to jump back to any already-cleared floor of this layer and farm it. */
function farmControls(state: GameState, layer: DungeonLayer): string {
  const explored = state.exploredMax[layer.id] ?? [];
  let reachedFloors = 1;
  for (let f = 1; f <= floorsOf(state, layer); f++) if ((explored[f - 1] ?? 0) > 0) reachedFloors = f;
  if (state.pos.layer === layer.id) reachedFloors = Math.max(reachedFloors, state.pos.floor);
  if (reachedFloors <= 1 && state.pos.floor === 1) return ''; // nothing earlier to revisit yet
  const btns: string[] = [];
  for (let f = 1; f <= reachedFloors; f++) {
    const here = state.pos.layer === layer.id && state.pos.floor === f;
    btns.push(
      here
         ? `<span class="floorbtn current">${f}</span>`
        : `<button class="floorbtn" data-floor="${f}">${f}</button>`,
    );
  }
  return `<p class="muted" style="margin:0.4rem 0 0.2rem">${t('ui.farm')}</p><div class="controls">${btns.join('')}</div>`;
}

function wireMap(el: HTMLElement): void {
  el.querySelectorAll<HTMLButtonElement>('.layerbtn').forEach((b) => {
    b.addEventListener('click', () => {
      const id = Number(b.getAttribute('data-layer'));
      if (!Number.isNaN(id)) ACTIONS.onSelectLayer(id);
    });
  });
  el.querySelectorAll<HTMLButtonElement>('.floorbtn[data-floor]').forEach((b) => {
    b.addEventListener('click', () => {
      const f = Number(b.getAttribute('data-floor'));
      if (!Number.isNaN(f)) ACTIONS.onSetPos(CURSTATE.pos.layer, f);
    });
  });

  const cur = CONTENT.dungeon.layers.find((l) => l.id === CURSTATE.pos.layer);
  let reachedFloors = 1;
  if (cur) {
    const explored = CURSTATE.exploredMax[cur.id] ?? [];
    for (let f = 1; f <= floorsOf(CURSTATE, cur); f++) if ((explored[f - 1] ?? 0) > 0) reachedFloors = f;
    if (CURSTATE.pos.layer === cur.id) reachedFloors = Math.max(reachedFloors, CURSTATE.pos.floor);
  }

  el.querySelectorAll<HTMLButtonElement>('.floor-nav-btn').forEach((b) => {
    b.addEventListener('click', () => {
      const dir = b.getAttribute('data-dir');
      const curFloor = CURSTATE.pos.floor;
      if (dir === 'down' && curFloor > 1) {
        ACTIONS.onSetPos(CURSTATE.pos.layer, curFloor - 1);
      } else if (dir === 'up' && curFloor < reachedFloors) {
        ACTIONS.onSetPos(CURSTATE.pos.layer, curFloor + 1);
      }
    });
  });

  el.querySelectorAll<HTMLElement>('.dcell.clickable').forEach((b) => {
    b.addEventListener('click', () => {
      const f = Number(b.getAttribute('data-floor'));
      const r = Number(b.getAttribute('data-room'));
      if (!Number.isNaN(f) && !Number.isNaN(r)) ACTIONS.onSetRoom(f, r);
    });
  });
}

// ---- SKILLS (+ fusion) -----------------------------------------------------

function fusableSkills(state: GameState) {
  // All skills except eye-kind can fuse (eyes have their own dedicated fusion system).
  return state.skills.filter((s) => CONTENT.skills.get(s.id)?.kind !== 'eye');
}

/** Body-part category for the tidy grouped list — explicit `part`, else derived from kind/effects. */
const LEG_IDS = new Set(['stealth', 'silent_step', 'phantom_presence', 'climb', 'wall_master', 'many_legged_gait', 'void_step']);
function skillPart(def?: Skill): 'arm' | 'eye' | 'leg' | 'body' {
  if (!def) return 'body';
  if (def.part) return def.part;
  if (def.kind === 'eye') return 'eye';
  if (def.damage !== undefined) return 'arm';
  if (def.dodgeBonus !== undefined || LEG_IDS.has(def.id)) return 'leg';
  return 'body';
}

const SKILL_PARTS: Array<'arm' | 'leg' | 'body' | 'eye'> = ['arm', 'leg', 'body', 'eye'];

function skillRow(state: GameState, s: { id: string; level: number; exp: number; tier?: number }): string {
  const def = CONTENT.skills.get(s.id);
  const name = def ? t(def.locKeyName) : s.id;
  const tierTag = (s.tier ?? 1) > 1 ? `<span class="muted">T${s.tier}</span> ` : '';
  const active = def?.damage !== undefined;
  const eq = state.equipped.includes(s.id);
  const equipBtn = active
    ? `<button class="equipbtn${eq ? ' on' : ''}" data-equip="${s.id}">${eq ? t('ui.unequip') : t('ui.equip')}</button>`
    : '';
  const exp = expandedSkill === s.id;
  const dmgBit = active ? ` · ⚔${def?.damage}${def?.damageType ? ` ${t(`dmgtype.${def.damageType}`)}` : ''}` : '';
  const acq = exp && def?.acquireKey ? `<div class="skilldesc" style="opacity:.75">↳ ${t('ui.acquire_how')}: ${t(def.acquireKey)}</div>` : '';
  const sacUnlocked = state.discoveries.some((id) => !!loreById(id)); // deep-read a lore tome (INT)
  const sacBtn = sacUnlocked
    ? `<button class="sacskill ghost" data-sac="${s.id}">${t('ui.sacrifice')}</button>`
    : `<span class="muted" style="font-size:.78rem">${t('ui.sacrifice_locked')}</span>`;
  const injectCost = exp && def ? injectSkillXpCost(CURSTATE, CONTENT, s.id) : Infinity;
  const injectBtn = exp && Number.isFinite(injectCost)
    ? `<button class="injectxp ghost" data-inject="${s.id}"${CURSTATE.ep >= injectCost ? '' : ' disabled'}>${t('ui.inject_xp')} (${injectCost} EP)</button>`
    : '';
  const actions = exp
    ? `<div class="controls" style="margin:.2rem 0 .5rem 1rem">${injectBtn}<button class="delskill ghost" data-del="${s.id}">${t('ui.delete_skill')}</button>${sacBtn}</div>`
    : '';
  const liveBonus = exp && def && !active ? skillLiveBonus(def, s.level) : '';
  const desc = exp && def ? `<div class="skilldesc">${t(def.locKeyDesc)}${dmgBit}</div>${liveBonus}${acq}${actions}` : '';
  return `<li><span class="skillrow" data-skill="${s.id}">${exp ? '▾' : '▸'} <b>${name}</b> — ${tierTag}${t('ui.lv')} ${s.level} · ${s.exp} xp</span> ${equipBtn}${desc}</li>`;
}

/** Live, level-scaled bonus readout for a passive skill (symbols are language-free). */
function skillLiveBonus(def: Skill, level: number): string {
  const sc = Math.min(1, level / Math.max(1, def.lvMax));
  const pct = (v: number) => Math.round(v * sc * 100);
  const flat = (v: number) => (v * sc).toFixed(1).replace(/\.0$/, '');
  const p: string[] = [];
  if (def.xpMult) p.push(`📘 +${pct(def.xpMult)}% XP`);
  if (def.dmgMult) p.push(`⚔ +${pct(def.dmgMult)}%`);
  if (def.lootMult) p.push(`💰 +${pct(def.lootMult)}%`);
  if (def.regenMult) p.push(`♻ +${pct(def.regenMult)}%`);
  if (def.idleMult) p.push(`🌙 +${pct(def.idleMult)}%`);
  if (def.dodgeBonus) p.push(`💨 +${pct(def.dodgeBonus)}%`);
  if (def.armor) p.push(`🛡 +${flat(def.armor)}`);
  if (def.surviveChance) p.push(`✨ ${pct(def.surviveChance)}%`);
  if (def.painNull) p.push(`🩹 ${pct(def.painNull)}%`);
  if (def.overdrawFrac) p.push(`🔥 +${pct(def.overdrawFrac)}%`);
  if (def.mpRegen) p.push(`🔷 +${flat(def.mpRegen)}`);
  if (def.hpRegen) p.push(`❤ +${flat(def.hpRegen)}`);
  if (def.spRegen) p.push(`⚡ +${flat(def.spRegen)}`);
  if (def.hungerMult && def.hungerMult < 1) p.push(`🍖 -${Math.round((1 - def.hungerMult) * 100)}%`);
  return p.length ? `<div class="skilldesc" style="opacity:.85">${t('ui.live_bonus')}: ${p.join(' · ')}</div>` : '';
}

/** Human Path selection panel — shown when T0 human hits LV10 and must choose a specialization. */
function humanPathPanel(): string {
  const paths = ['tank', 'mage', 'assassin', 'healer'];
  const cards = paths.map((p) =>
    `<button class="human-path-btn panel" data-path="${p}" style="cursor:pointer;text-align:left;margin:.3rem 0">
      <b>${t(`human.path.${p}`)}</b>
      <p class="muted" style="margin:.2rem 0 0">${t(`human.path.${p}.desc`)}</p>
     </button>`,
  ).join('');
  return `<section class="panel" style="border-color:#d98324">
    <h2>${t('ui.human_path_title')}</h2>
    <p class="muted">${t('ui.human_path_intro')}</p>
    ${cards}
  </section>`;
}

/** Skill tree view — chains of evolvesTo nodes with status badges. */
function skillTreePanel(state: GameState): string {
  const cats = ['all', 'arm', 'leg', 'body', 'eye'];
  const catTabs = cats.map((c) =>
    `<button class="subtab${c === activeSkillTreeCat ? ' active' : ''}" data-treecat="${c}">${t(`ui.skill_cat_${c}`)}</button>`,
  ).join('');
  const chains = buildSkillChains(CONTENT, activeSkillTreeCat);
  const renderNode = (id: string): string => {
    const def = CONTENT.skills.get(id);
    const status = skillNodeStatus(state, CONTENT, id);
    if (status === 'hidden') return `<span class="sk-node sk-hidden">${t('ui.skill_node_hidden')}</span>`;
    const name = def ? t(def.locKeyName) : id;
    const slot = state.skills.find((s) => s.id === id);
    const lvLabel = slot ? ` LV${slot.level}` : '';
    const rankBadge = def?.rank ? `<span class="sk-rank sk-rank-${def.rank}">${def.rank}</span>` : '';
    return `<span class="sk-node sk-${status}">${rankBadge}${name}${lvLabel}</span>`;
  };
  const chainHtml = chains.map((chain) =>
    `<div class="sk-chain">${chain.map((id, i) => (i > 0 ? '<span class="sk-arrow">→</span>' : '') + renderNode(id)).join('')}</div>`,
  ).join('');
  const derived = derivedSkillsView(CONTENT, activeSkillTreeCat);
  const derivedHtml = derived.length
    ? `<div class="sk-derived-title muted" style="margin-top:.6rem">${t('ui.skill_derived_title')}</div>` +
      derived.map((d) => {
        const def = CONTENT.skills.get(d.id);
        const status = skillNodeStatus(state, CONTENT, d.id);
        const name = def ? t(def.locKeyName) : d.id;
        const slot = state.skills.find((s) => s.id === d.id);
        const lvLabel = slot ? ` LV${slot.level}` : '';
        return `<div class="sk-chain"><span class="sk-node sk-${status}">${name}${lvLabel}</span><span class="muted" style="font-size:.78rem"> (${t('ui.skill_node_derive')}: ${d.conditionText})</span></div>`;
      }).join('')
    : '';
  return `<section class="panel">
    <div class="row"><h2 style="margin:0">${t('ui.skill_tab_tree')}</h2></div>
    <div class="subtabs">${catTabs}</div>
    <div class="sk-tree">${chainHtml}${derivedHtml}</div>
  </section>`;
}

/** Loadout preset bar: save the current equipped build to a slot, or load a saved one. */
function loadoutBar(state: GameState): string {
  const slots = Array.from({ length: LOADOUT_SLOTS }, (_, i) => {
    const saved = state.loadouts?.[i] ?? [];
    const has = saved.length > 0;
    return `<span style="display:inline-flex;gap:.2rem;align-items:center;margin-right:.5rem">
      <span class="muted" style="font-size:.72rem">${t('ui.loadout_slot')}${i + 1}</span>
      <button class="loadout-save" data-slot="${i}" style="font-size:.68rem;padding:.15rem .4rem" title="${t('ui.loadout_save')}">💾</button>
      <button class="loadout-load" data-slot="${i}" style="font-size:.68rem;padding:.15rem .4rem"${has ? '' : ' disabled'} title="${t('ui.loadout_load')}">📥${has ? ` ${saved.length}` : ''}</button>
    </span>`;
  }).join('');
  return `<div class="row" style="flex-wrap:wrap;margin-top:.4rem"><span class="muted" style="font-size:.72rem">${t('ui.loadouts')}:</span> ${slots}</div>`;
}

function skillsTab(state: GameState): string {
  // Human Path selection takes priority — blocks everything else until chosen
  if (state.pendingHumanPath) {
    return humanPathPanel();
  }

  // Liste / Ağaç toggle
  const viewToggle = `<div class="subtabs" style="margin-bottom:.4rem">
    <button class="subtab${activeSkillView === 'list' ? ' active' : ''}" id="skill-view-list">${t('ui.skill_tab_list')}</button>
    <button class="subtab${activeSkillView === 'tree' ? ' active' : ''}" id="skill-view-tree">${t('ui.skill_tab_tree')}</button>
  </div>`;

  if (activeSkillView === 'tree') {
    return viewToggle + skillTreePanel(state);
  }

  // Category sub-tabs (Kol/Bacak/Vücut/Göz) — only one group shown at a time so the list stays scannable.
  const counts: Record<string, number> = {};
  for (const p of SKILL_PARTS) counts[p] = state.skills.filter((s) => skillPart(CONTENT.skills.get(s.id)) === p).length;
  if (counts[activeSkillPart] === 0) activeSkillPart = SKILL_PARTS.find((p) => counts[p] > 0) ?? 'arm';
  const subtabs = SKILL_PARTS.map(
    (p) => `<button class="subtab${p === activeSkillPart ? ' active' : ''}" data-part="${p}">${t(`ui.part_${p}`)} <span class="muted">${counts[p]}</span></button>`,
  ).join('');
  const partItems = state.skills.filter((s) => skillPart(CONTENT.skills.get(s.id)) === activeSkillPart);
  const rows = partItems.length ? partItems.map((s) => skillRow(state, s)).join('') : `<li class="muted">${t('ui.empty')}</li>`;
  const unequipAllBtn = state.equipped.length > 0
    ? `<button id="unequip-all" class="ghost" style="font-size:.72rem;padding:.2rem .5rem">${t('ui.unequip_all')}</button>`
    : '';
  const listPanel = `<section class="panel"><div class="row"><h2 style="margin:0">${t('ui.skills')}</h2><span class="muted">${t('ui.equipped')} ${state.equipped.length}/${skillSlots(state)} ${unequipAllBtn}</span></div><div class="subtabs">${subtabs}</div><ul>${rows}</ul>${loadoutBar(state)}</section>`;
  if (!selectedA && fusableSkills(state)[0]) selectedA = fusableSkills(state)[0].id;
  if (!selectedB && fusableSkills(state)[1]) selectedB = fusableSkills(state)[1].id;
  const opts = (sel: string | null) =>
    fusableSkills(state)
      .map((s) => {
        const def = CONTENT.skills.get(s.id);
        return `<option value="${s.id}"${s.id === sel ? ' selected' : ''}>${def ? t(def.locKeyName) : s.id}</option>`;
      })
      .join('');
  const fz = lastFusion
    ? `<p><b>${t(lastFusion.locKeyName)}</b> · ${t(`fusion.${lastFusion.cls}`)} · ${lastFusion.magnitude}</p><p class="muted">${t(`fusion.effect.${lastFusion.effectType}.desc`)}</p>`
    : '';
  const hasRaphael = state.skills.some((sk) => sk.id === 'raphael');
  const raphaelPreview = (() => {
    if (!hasRaphael || !selectedA || !selectedB || selectedA === selectedB) return '';
    const preview = resolveFusion(selectedA, selectedB, CONTENT);
    const clsColor = preview.cls === 'synergy' ? '#4a9' : preview.cls === 'quirk' ? '#b93' : '#a44';
    const clsIcon  = preview.cls === 'synergy' ? '▲' : preview.cls === 'quirk' ? '◆' : '▼';
    return `<p style="font-size:.82rem;margin:.3rem 0 0;color:${clsColor}">${clsIcon} ${t('ui.raphael_preview')}: <b>${t(`fusion.${preview.cls}`)}</b> · ${preview.magnitude} · ${t(`fusion.effect.${preview.effectType}.desc`)}</p>`;
  })();
  const raphaelSuggestions = (() => {
    if (!hasRaphael) return '';
    const fusable = fusableSkills(state).map((s) => s.id);
    type Sugg = { a: string; b: string; cls: string; effect: string; mag: number };
    const list: Sugg[] = [];
    for (let i = 0; i < fusable.length; i++) {
      for (let j = i + 1; j < fusable.length; j++) {
        const r = resolveFusion(fusable[i], fusable[j], CONTENT);
        if (r.cls !== 'backfire') list.push({ a: fusable[i], b: fusable[j], cls: r.cls, effect: r.effectType, mag: r.magnitude });
      }
    }
    list.sort((a, b) => {
      const cs = { synergy: 2, quirk: 1, backfire: 0 };
      const d = (cs[b.cls as keyof typeof cs] ?? 0) - (cs[a.cls as keyof typeof cs] ?? 0);
      if (d !== 0) return d;
      const aSpec = a.effect !== 'mix' ? 1 : 0;
      const bSpec = b.effect !== 'mix' ? 1 : 0;
      if (aSpec !== bSpec) return bSpec - aSpec;
      return b.mag - a.mag;
    });
    // Dedupe by effect so the same result isn't suggested from multiple combos
    // (e.g. death_scythe+X and toxic_cloud+X both → envenom_pierce). Sorted best-first,
    // so the first combo per effect wins; 'mix' stays varied (each is a distinct coined result).
    const seenEffect = new Set<string>();
    const top: Sugg[] = [];
    for (const s of list) {
      if (s.effect !== 'mix') {
        if (seenEffect.has(s.effect)) continue;
        seenEffect.add(s.effect);
      }
      top.push(s);
      if (top.length >= 3) break;
    }
    if (!top.length) return '';
    const rows = top.map(({ a, b, cls, effect, mag }) => {
      const clsIcon  = cls === 'synergy' ? '▲' : '◆';
      const clsColor = cls === 'synergy' ? '#4a9' : '#b93';
      const nameA = t(CONTENT.skills.get(a)?.locKeyName ?? a);
      const nameB = t(CONTENT.skills.get(b)?.locKeyName ?? b);
      const effectLabel = effect !== 'mix' ? t(`fusion.effect.${effect}`) : effect;
      return `<button class="ghost suggest-fuse" data-sa="${a}" data-sb="${b}" style="font-size:.76rem;text-align:left;padding:.2rem .4rem;margin:.15rem 0;width:100%"><span style="color:${clsColor}">${clsIcon}</span> ${nameA} + ${nameB} → <b>${effectLabel}</b> · ${mag}</button>`;
    }).join('');
    return `<div style="margin-top:.5rem"><p style="font-size:.78rem;color:#7a6;margin:.2rem 0">${t('ui.raphael_suggest')}:</p>${rows}</div>`;
  })();
  const fusionPanel = state.fusionUnlocked
    ? `
    <section class="panel">
      <h2>${t('ui.fusion')}${hasRaphael ? ` <span class="muted" style="font-size:.75rem">${t('ui.raphael_active')}</span>` : ''}</h2>
      <div class="controls">
        <select id="fa">${opts(selectedA)}</select>
        <select id="fb">${opts(selectedB)}</select>
        <button id="fuse">${t('ui.fuse')}</button>
      </div>
      ${raphaelPreview}
      ${raphaelSuggestions}
      ${fz}
    </section>`
    : `<section class="panel"><h2>${t('ui.fusion')}</h2><p class="muted">${t('ui.fusion_locked')}</p></section>`;
  const acquireGuide = `
    <section class="panel">
      <h2>${t('ui.acquire_title')}</h2>
      <ul class="muted">
        <li>${t('ui.acquire_evolution')}</li>
        <li>${t('ui.acquire_discovery')}</li>
        <li>${t('ui.acquire_eyes')}</li>
        <li>${t('ui.acquire_fusion')}</li>
        <li>${t('ui.acquire_lore')}</li>
        <li>${t('ui.acquire_ruler')}</li>
      </ul>
    </section>`;
  return `
    ${viewToggle}
    <div class="skillscols">${listPanel}${fusionPanel}</div>
    ${acquireGuide}
  `;
}

function wireSkills(el: HTMLElement): void {
  // Human path choice
  el.querySelectorAll<HTMLButtonElement>('.human-path-btn[data-path]').forEach((b) => {
    b.addEventListener('click', () => {
      const path = b.getAttribute('data-path');
      if (path) ACTIONS.onChooseHumanPath(path);
    });
  });

  // Liste / Ağaç view toggle
  el.querySelector<HTMLButtonElement>('#skill-view-list')?.addEventListener('click', () => {
    activeSkillView = 'list';
    renderTab();
  });
  el.querySelector<HTMLButtonElement>('#skill-view-tree')?.addEventListener('click', () => {
    activeSkillView = 'tree';
    renderTab();
  });

  // Tree category tabs
  el.querySelectorAll<HTMLButtonElement>('.subtab[data-treecat]').forEach((b) => {
    b.addEventListener('click', () => {
      activeSkillTreeCat = b.getAttribute('data-treecat') ?? 'all';
      renderTab();
    });
  });

  el.querySelector<HTMLSelectElement>('#fa')?.addEventListener('change', (e) => {
    selectedA = (e.target as HTMLSelectElement).value;
  });
  el.querySelector<HTMLSelectElement>('#fb')?.addEventListener('change', (e) => {
    selectedB = (e.target as HTMLSelectElement).value;
  });
  el.querySelector<HTMLButtonElement>('#fuse')?.addEventListener('click', () => {
    if (selectedA && selectedB) ACTIONS.onFuse(selectedA, selectedB);
  });
  el.querySelectorAll<HTMLButtonElement>('.equipbtn[data-equip]').forEach((b) => {
    b.addEventListener('click', () => {
      const id = b.getAttribute('data-equip');
      if (id) ACTIONS.onToggleEquip(id);
    });
  });
  el.querySelector<HTMLButtonElement>('#unequip-all')?.addEventListener('click', () => ACTIONS.onUnequipAll());
  el.querySelectorAll<HTMLButtonElement>('.loadout-save[data-slot]').forEach((b) =>
    b.addEventListener('click', () => ACTIONS.onSaveLoadout(Number(b.getAttribute('data-slot')))));
  el.querySelectorAll<HTMLButtonElement>('.loadout-load[data-slot]').forEach((b) =>
    b.addEventListener('click', () => ACTIONS.onLoadLoadout(Number(b.getAttribute('data-slot')))));
  el.querySelectorAll<HTMLButtonElement>('.subtab[data-part]').forEach((b) => {
    b.addEventListener('click', () => {
      activeSkillPart = (b.getAttribute('data-part') as 'arm' | 'leg' | 'body' | 'eye') ?? 'arm';
      renderTab();
    });
  });
  el.querySelectorAll<HTMLButtonElement>('.delskill[data-del]').forEach((b) => {
    b.addEventListener('click', () => {
      const id = b.getAttribute('data-del');
      if (id) ACTIONS.onDeleteSkill(id);
    });
  });
  el.querySelectorAll<HTMLButtonElement>('.injectxp[data-inject]').forEach((b) => {
    b.addEventListener('click', () => { const id = b.getAttribute('data-inject'); if (id) ACTIONS.onInjectSkillXp(id); });
  });
  el.querySelectorAll<HTMLButtonElement>('.sacskill[data-sac]').forEach((b) => {
    b.addEventListener('click', () => {
      const id = b.getAttribute('data-sac');
      if (id) ACTIONS.onSacrificeSkill(id);
    });
  });
  el.querySelectorAll<HTMLElement>('.skillrow[data-skill]').forEach((row) => {
    row.addEventListener('click', () => {
      const id = row.getAttribute('data-skill');
      expandedSkill = expandedSkill === id ? null : id; // tap to read its description, tap again to close
      renderTab();
    });
  });
  el.querySelectorAll<HTMLButtonElement>('.suggest-fuse[data-sa]').forEach((b) => {
    b.addEventListener('click', () => {
      const a = b.getAttribute('data-sa');
      const sb = b.getAttribute('data-sb');
      if (a && sb) { selectedA = a; selectedB = sb; renderTab(); }
    });
  });
}

// ---- BODY (eyes + larder) --------------------------------------------------

function headSvg(state: GameState): string {
  const race = CONTENT.races.get(state.raceId);
  if (!race) return '';
  const eyes = race.head.eyes
    .map((e) => {
      const a = state.eyeAssignments[e.id];
      const color = a
        ? a.fusedId
          ? a.blind
            ? '#c0626f'
            : '#9a7fd0'
          : a.mode === 'active'
            ? '#d98324'
            : '#c9a227'
        : '#3a3a48';
      const ring = selectedEye === e.id ? `<circle cx="${e.x}" cy="${e.y}" r="${e.r + 5}" fill="none" stroke="#fff" stroke-width="2"/>` : '';
      return `<g class="eye" data-eye="${e.id}" style="cursor:pointer"><circle cx="${e.x}" cy="${e.y}" r="${e.r + 10}" fill="transparent"/><circle cx="${e.x}" cy="${e.y}" r="${e.r}" fill="${color}" stroke="#15151c" stroke-width="2"/>${ring}</g>`;
    })
    .join('');
  return `<svg viewBox="${race.head.viewBox}" class="head" role="img">${race.head.silhouette}${eyes}</svg>`;
}

function eyePanel(state: GameState): string {
  if (!selectedEye) return `<p class="muted">${t('ui.tap_eye')}</p>`;
  const a = state.eyeAssignments[selectedEye];
  const owned = ownedEyeAbilities(state, CONTENT);
  const abilBtns = owned
    .map((s) => {
      const def = CONTENT.skills.get(s.id);
      const here = a?.abilityId === s.id;
      const elsewhere = !here && isAbilityAssigned(state, s.id);
      return `<button class="ability${here ? ' on' : ''}" data-ability="${s.id}">${def ? t(def.locKeyName) : s.id}${elsewhere ? ' ⟳' : ''}</button>`;
    })
    .join('');
  const eyeName = (id: string) => t(CONTENT.skills.get(id)?.locKeyName ?? id);
  const cur = a
    ? a.fusedId
      ? `${eyeName(a.abilityId)} + ${eyeName(a.fusedId)} (${t('ui.hybrid_eye')})${a.blind ? ` ⚠ ${t('ui.eye_blind')}` : ''}`
      : `${eyeName(a.abilityId)} · ${t(`eyemode.${a.mode}`)}`
    : t('ui.empty_eye');
  const modeBtn = a && !a.fusedId ? `<button id="mode" class="ghost">${t('ui.mode')}: ${t(`eyemode.${a.mode}`)}</button>` : '';
  const clearBtn = a ? `<button id="cleareye" class="ghost">${t('ui.clear')}</button>` : '';
  return `<div class="row"><span><b>${t('ui.eye')} ${selectedEye}</b></span><span>${cur}</span></div><div class="controls">${abilBtns || `<span class="muted">${t('ui.no_eye_abilities')}</span>`}</div><div class="controls">${modeBtn}${clearBtn}</div>`;
}

function larderPanel(state: GameState): string {
  if (!state.skills.some((s) => s.id === 'larder')) {
    return `<section class="panel"><h2>${t('ui.inventory')}</h2><p class="muted">${t('ui.locked')}</p></section>`;
  }
  const items = state.inventory
    .map((it, i) => {
      const def = CONTENT.enemies.get(it.enemyId);
      const name = def ? t(def.locKey) : it.enemyId;
      const fresh = Math.max(0, Math.round((1 - it.decay / SPOIL_THRESHOLD) * 100));
      const status = isRotten(it) ? `<span style="color:#c0444f">${t('ui.rotten')}</span>` : `${t('ui.fresh')} ${fresh}%`;
      return `<li>${name} — ${status} <button class="eatbtn" data-eat="${i}">${t('ui.eat')}</button> <button class="discard" data-idx="${i}">✕</button></li>`;
    })
    .join('') || `<span class="muted">${t('ui.empty')}</span>`;
  const autoBtn = `<button id="autoeat" class="${state.autoEat ? 'active' : 'ghost'}">${t('ui.autoeat')}: ${state.autoEat ? t('ui.on') : t('ui.off')}</button>`;
  return `<section class="panel"><div class="row"><h2 style="margin:0">${t('ui.inventory')} (${state.inventory.length}/${maxFoodSlots(state)})${refrigerated(state) ? ' ❄' : ''}</h2>${autoBtn}</div><ul>${items}</ul></section>`;
}

/** Slots holding a plain (non-hybrid) eye — the candidates for fusion. */
function plainEyeSlots(state: GameState): { slot: string; name: string }[] {
  return Object.entries(state.eyeAssignments)
    .filter(([, a]) => a && !a.fusedId)
    .map(([slot, a]) => ({ slot, name: t(CONTENT.skills.get(a!.abilityId)?.locKeyName ?? a!.abilityId) }));
}

/** Eye Fusion panel (Body tab) — gated by the 'eyes' lore; fuse two slotted eyes into a hybrid. */
function eyeFusionPanel(state: GameState): string {
  if (!loreUnlocked(state, 'eyes')) {
    return `<section class="panel"><h2>${t('ui.eyefusion')}</h2><p class="muted">${t('ui.eyefusion_locked')}</p></section>`;
  }
  const slots = plainEyeSlots(state);
  if (slots.length < 2) {
    return `<section class="panel"><h2>${t('ui.eyefusion')}</h2><p class="muted">${t('ui.eyefusion_need2')}</p></section>`;
  }
  if (!selectedEyeA || !slots.some((s) => s.slot === selectedEyeA)) selectedEyeA = slots[0].slot;
  if (!selectedEyeB || !slots.some((s) => s.slot === selectedEyeB)) selectedEyeB = slots[1].slot;
  const opts = (sel: string | null) =>
    slots.map((s) => `<option value="${s.slot}"${s.slot === sel ? ' selected' : ''}>${s.name}</option>`).join('');
  return `
    <section class="panel">
      <h2>${t('ui.eyefusion')}</h2>
      <div class="controls">
        <select id="efa">${opts(selectedEyeA)}</select>
        <select id="efb">${opts(selectedEyeB)}</select>
        <button id="efuse">${t('ui.eyefuse')}</button>
      </div>
      <p class="muted">${t('ui.eyefusion_hint')}</p>
    </section>`;
}

function bodyTab(state: GameState): string {
  return `<section class="panel"><h2>${t('ui.eyes')}</h2>${headSvg(state)}${eyePanel(state)}</section>${eyeFusionPanel(state)}${larderPanel(state)}`;
}

function wireBody(el: HTMLElement): void {
  el.querySelectorAll<SVGGElement>('.eye').forEach((g) => {
    g.addEventListener('click', () => {
      const id = g.getAttribute('data-eye');
      if (id) {
        selectedEye = id;
        renderTab();
      }
    });
  });
  el.querySelectorAll<HTMLButtonElement>('.ability').forEach((b) => {
    b.addEventListener('click', () => {
      const id = b.getAttribute('data-ability');
      if (id && selectedEye) ACTIONS.onAssignEye(selectedEye, id);
    });
  });
  el.querySelector<HTMLButtonElement>('#mode')?.addEventListener('click', () => {
    if (selectedEye) ACTIONS.onCycleMode(selectedEye);
  });
  el.querySelector<HTMLButtonElement>('#cleareye')?.addEventListener('click', () => {
    if (selectedEye) ACTIONS.onClearEye(selectedEye);
  });
  el.querySelector<HTMLSelectElement>('#efa')?.addEventListener('change', (e) => {
    selectedEyeA = (e.target as HTMLSelectElement).value;
  });
  el.querySelector<HTMLSelectElement>('#efb')?.addEventListener('change', (e) => {
    selectedEyeB = (e.target as HTMLSelectElement).value;
  });
  el.querySelector<HTMLButtonElement>('#efuse')?.addEventListener('click', () => {
    if (selectedEyeA && selectedEyeB) ACTIONS.onFuseEyes(selectedEyeA, selectedEyeB);
  });
  el.querySelectorAll<HTMLButtonElement>('.discard').forEach((b) => {
    b.addEventListener('click', () => {
      const i = Number(b.getAttribute('data-idx'));
      if (!Number.isNaN(i)) ACTIONS.onDiscardFood(i);
    });
  });
  el.querySelectorAll<HTMLButtonElement>('.eatbtn[data-eat]').forEach((b) => {
    b.addEventListener('click', () => {
      const i = Number(b.getAttribute('data-eat'));
      if (!Number.isNaN(i)) ACTIONS.onEat(i);
    });
  });
  el.querySelector<HTMLButtonElement>('#autoeat')?.addEventListener('click', ACTIONS.onToggleAutoEat);
}

// ---- LORE / DISCOVERY (books, rooms, fragments) ----------------------------

/** Meditation progress bar inner (live-updatable without re-rendering the whole tab). */
function medBarHtml(state: GameState): string {
  const pct = Math.floor((state.meditation / MEDITATION_MAX) * 100);
  const meditating = state.action === 'meditate' ? ` <span class="evoready">●</span>` : '';
  return `<div class="row"><span>${t('ui.meditation')}${meditating}</span><span>${pct}% · ☼ ${state.ruler.virtue.toFixed(2)}</span></div>${bar(state.meditation, MEDITATION_MAX, '#9a7fd0')}`;
}

function loreTab(state: GameState): string {
  // Pending secret room: a riddle to type the answer to ("open sesame").
  let roomHtml = `<p class="muted">${t('ui.no_room')}</p>`;
  if (state.pendingRoom) {
    const room = CONTENT.rooms.get(state.pendingRoom);
    if (room) {
      const locked = isRiddleLocked(state, state.pendingRoom);
      const input = locked
        ? `<p style="color:var(--ember)">🔒 ${t('ui.riddle_locked', { min: lockRemainingMin(state, state.pendingRoom) })}</p>`
        : `<div class="controls">
          <input id="riddle" type="text" placeholder="${t('ui.answer')}" autocomplete="off" />
          <button id="answer">${t('ui.solve')}</button>
        </div>`;
      roomHtml = `
        <div class="row"><b>${t(room.locKey)}</b></div>
        <p class="muted">${t(room.locKeyClue)}</p>
        ${input}`;
    }
  }

  const books = state.booksFound.length
    ? [...state.booksFound]
        .map((id) => loreById(id))
        .filter((b): b is NonNullable<typeof b> => !!b)
        .sort((a, b) => a.order - b.order)
        .map((bk) => {
          const read = state.discoveries.includes(bk.id);
          const deep = state.stats.INT >= bk.intReq;
          const tag = read ? '✓' : deep ? '★' : `INT ${bk.intReq}`;
          return `<li><button class="readbook" data-book="${bk.id}">${bk.title}</button> <span class="muted">${tag}</span></li>`;
        })
        .join('')
    : `<span class="muted">${t('ui.empty')}</span>`;

  const medUnlocked = state.meditationUnlocked || state.meditation > 0;
  const medHtml = medUnlocked
    ? `<section class="panel"><div id="medlive">${medBarHtml(state)}</div></section>`
    : '';

  return `
    <section class="panel">
      <h2>${t('ui.discovery')}</h2>
      <p class="muted">${t('ui.fragments')}: 🗺 ${state.mapFragments} · 📜 ${state.loreFragments} · ${t('ui.solved')}: ${state.discoveries.length}</p>
      ${roomHtml}
    </section>
    <section class="panel"><h2>${t('ui.books')}</h2><ul>${books}</ul></section>
    ${medHtml}
  `;
}

function wireLore(el: HTMLElement): void {
  el.querySelectorAll<HTMLButtonElement>('.readbook').forEach((b) => {
    b.addEventListener('click', () => {
      const id = b.getAttribute('data-book');
      if (id) ACTIONS.onReadBook(id);
    });
  });
  el.querySelector<HTMLButtonElement>('#answer')?.addEventListener('click', () => {
    const input = el.querySelector<HTMLInputElement>('#riddle');
    if (input && input.value.trim()) ACTIONS.onAnswerRoom(input.value);
  });
}

// ---- STATS (+ evolution) ---------------------------------------------------

/** Evolution node status label — uses the loaded i18n dict (not state.lang, which may be unset). */
function evoStatusText(status: EvoNodeStatus): string {
  const key = `ui.evo_${status}`;
  const s = t(key);
  return s === key ? status : s; // unknown status → raw
}

/** Dikey dallanan evrim ağacı (alttan-yukarı dairesel düğümler ve SVG bağlantıları) */
function evolutionTree(state: GameState): string {
  const nodes: EvoNode[] = evolutionTreeView(state, CONTENT);
  if (!nodes.length) return '';

  if (!selectedEvoNodeId || !nodes.some((n) => n.id === selectedEvoNodeId)) {
    selectedEvoNodeId = state.formId;
  }
  if (!nodes.some((n) => n.id === selectedEvoNodeId)) {
    selectedEvoNodeId = nodes[0]?.id || null;
  }

  const tiers = [...new Set(nodes.map((n) => n.tier))].sort((a, b) => a - b);
  const maxTier = tiers.length > 1 ? tiers[tiers.length - 1] : 1;

  const coords = new Map<string, { x: number; y: number }>();
  const marginY = 12; // vertical margin percentage

  for (const tier of tiers) {
    const tierNodes = nodes.filter((n) => n.tier === tier);
    if (tier > 0) {
      tierNodes.sort((a, b) => {
        const getParentAvgX = (node: EvoNode): number => {
          if (!node.parents.length) return 50;
          let sum = 0, count = 0;
          for (const pId of node.parents) {
            const pCoord = coords.get(pId);
            if (pCoord) { sum += pCoord.x; count++; }
          }
          return count > 0 ? sum / count : 50;
        };
        const ax = getParentAvgX(a);
        const bx = getParentAvgX(b);
        if (Math.abs(ax - bx) < 0.01) {
          return a.id.localeCompare(b.id);
        }
        return ax - bx;
      });
    } else {
      tierNodes.sort((a, b) => a.id.localeCompare(b.id));
    }

    for (let i = 0; i < tierNodes.length; i++) {
      const node = tierNodes[i];
      const x = ((i + 0.5) / tierNodes.length) * 100;
      const y = 100 - marginY - (tier / maxTier) * (100 - 2 * marginY);
      coords.set(node.id, { x, y });
    }
  }

  let pathsHtml = '';
  for (const node of nodes) {
    const fromCoord = coords.get(node.id);
    if (!fromCoord) continue;

    for (const childId of node.children) {
      const childNode = nodes.find((n) => n.id === childId);
      if (!childNode) continue;
      const toCoord = coords.get(childId);
      if (!toCoord) continue;

      const fromIsUnlocked = node.status === 'past' || node.status === 'current';
      const toIsUnlocked = childNode.status === 'past' || childNode.status === 'current' || childNode.status === 'available';
      const isPathUnlocked = fromIsUnlocked && toIsUnlocked;
      const pathClass = isPathUnlocked ? 'unlocked' : 'locked';

      pathsHtml += `<path class="evo-path ${pathClass}" d="M ${fromCoord.x} ${fromCoord.y} L ${toCoord.x} ${toCoord.y}" />`;
    }
  }

  const nodesHtml = nodes
    .map((n) => {
      const coord = coords.get(n.id)!;
      const name = n.name ? t(n.name) : '???';
      const isSelected = n.id === selectedEvoNodeId ? ' selected' : '';

      let icon = '';
      if (n.status === 'current') icon = '◉';
      else if (n.status === 'past') icon = '✓';
      else if (n.status === 'available') icon = '✦';
      else if (n.status === 'locked') icon = '🔒';
      else if (n.status === 'missed') icon = '✕';
      else icon = '?';

      return `
        <div class="evo-node ${n.status} tier-${n.tier}${isSelected}" data-form-id="${n.id}" style="left: ${coord.x}%; top: ${coord.y}%;">
          <div class="evo-circle">${icon}</div>
          <div class="evo-node-label">${name}</div>
        </div>
      `;
    })
    .join('');

  return `
    <div class="evotree-viewport">
      <div class="evotree-container">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="evotree-svg">
          ${pathsHtml}
        </svg>
        ${nodesHtml}
      </div>
    </div>
  `;
}

function evolutionInfoCard(state: GameState): string {
  const nodes = evolutionTreeView(state, CONTENT);
  if (!selectedEvoNodeId) return '';
  const n = nodes.find((x) => x.id === selectedEvoNodeId);
  if (!n) return '';

  const name = n.name ? t(n.name) : '???';

  let bonusHtml = '';
  if (n.statBonus) {
    const list = Object.entries(n.statBonus)
      .map(([k, v]) => `<li><b>${k}</b>: +${v}</li>`)
      .join('');
    if (list) {
      bonusHtml = `
        <div>
          <div class="evo-info-section-title">${t('ui.stats')}</div>
          <ul style="padding-left:1.1rem;margin:0;font-size:0.82rem;list-style-type:square;color:var(--bone);">${list}</ul>
        </div>
      `;
    }
  }

  let skillsHtml = '';
  if (n.grantSkills && n.grantSkills.length > 0) {
    const list = n.grantSkills
      .map((id) => {
        const sDef = CONTENT.skills.get(id);
        const sName = sDef ? t(sDef.locKeyName) : id;
        const sDesc = sDef ? t(sDef.locKeyDesc) : '';
        return `<li style="margin-bottom: 0.3rem;"><b>${sName}</b><br><span class="muted" style="font-size:0.75rem">${sDesc}</span></li>`;
      })
      .join('');
    if (list) {
      skillsHtml = `
        <div>
          <div class="evo-info-section-title">${t('ui.skills')}</div>
          <ul style="padding-left:1.1rem;margin:0;font-size:0.82rem;list-style-type:none;color:var(--bone);">${list}</ul>
        </div>
      `;
    }
  }

  const levelReqMet = state.level >= n.levelReq;
  const tierReqMet = state.tier >= n.tierReq;
  const levelColor = levelReqMet ? 'var(--venom)' : 'var(--blood)';
  const tierColor = tierReqMet ? 'var(--venom)' : 'var(--ember)';
  const statusLabel = evoStatusText(n.status);
  const currentLabel = t('ui.evo_current_short');

  const tierReqLine =
    n.tierReq > 0
      ? `<span style="color:${tierColor}; font-weight:bold;"> · T${n.tierReq}</span>`
      : '';

  const lockedReason =
    !levelReqMet
      ? t('ui.evo_locked', { lv: n.levelReq })
      : `${t('ui.evo_locked_tier')} T${n.tierReq}`;

  // A 'missed' node is an unchosen sibling branch — offer a high-EP re-route into it.
  const switchCost = switchBranchCost(state);
  const isSwitchable = n.status === 'missed' && switchableTargets(state, CONTENT).some((f) => f.id === n.id);
  const switchBtn = isSwitchable
    ? (state.ep ?? 0) >= switchCost
      ? `<button class="branch-switch-btn" data-switch="${n.id}" style="min-height:36px; padding:0.4rem 1rem; border-color:#c9a23a; color:#e6c558;">${t('ui.switch_branch')} · ${switchCost} EP</button>`
      : `<button disabled style="min-height:36px; padding:0.4rem 1rem; opacity:0.5;">${t('ui.switch_branch')} · ${switchCost} EP</button>`
    : '';

  const actionBtn =
    n.status === 'available'
      ? `<button class="evo-action-btn active" data-form="${n.id}" style="min-height:36px; padding:0.4rem 1.2rem;">${t('ui.evolve')}</button>`
      : n.status === 'locked'
        ? `<button disabled style="min-height:36px; padding:0.4rem 1.2rem; opacity:0.5;">${lockedReason}</button>`
        : switchBtn;

  return `
    <div class="evo-info-card status-${n.status}">
      <div class="evo-info-header">
        <div class="evo-info-title">${name}</div>
        <div class="evo-info-status">${statusLabel}</div>
      </div>
      <div class="evo-info-grid">
        ${bonusHtml || `<div class="muted" style="font-size:0.82rem;">${t('ui.empty')}</div>`}
        ${skillsHtml || `<div class="muted" style="font-size:0.82rem;">${t('ui.empty')}</div>`}
        <div style="grid-column: span 2; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.6rem; margin-top: 0.2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <div style="font-size: 0.82rem;">
            ${t('ui.evo_requires')}:
            <span style="color:${levelColor}; font-weight:bold;">${t('ui.level')} ${n.levelReq}</span>${tierReqLine}
            <span class="muted">(${currentLabel}: ${state.level} / T${state.tier})</span>
          </div>
          ${actionBtn}
        </div>
      </div>
    </div>
  `;
}

/** Kill counter + (slime/spider) progress toward their hidden evolution path. */
function killStatsHtml(state: GameState): string {
  const kills = state.kills ?? 0;
  const totalKilled = Object.values(state.killedEnemies ?? {}).reduce((s, n) => s + (n ?? 0), 0);
  let line = `<p class="muted kill-line">⚔ ${t('ui.kills_life')}: <b>${kills}</b> · ${t('ui.kills_total')}: ${totalKilled}</p>`;
  // Hidden path progress — only for the race that has one, and only until it's unlocked.
  const secret = state.raceId === 'slime'
    ? { goal: SECRET_HARVEST_SOULS, label: t('ui.harvest_progress'), color: '#9a7fd0' }
    : state.raceId === 'spider'
      ? { goal: SECRET_LABYRINTH_KILLS, label: t('ui.labyrinth_progress'), color: '#8ab23f' }
      : null;
  if (secret && kills < secret.goal) {
    line += `<div class="row" style="margin-top:.3rem;font-size:.8rem"><span>${secret.label}</span><span>${kills}/${secret.goal}</span></div>${bar(kills, secret.goal, secret.color)}`;
  } else {
    if (secret) line += `<p class="kill-line" style="color:${secret.color};font-size:.82rem">✦ ${secret.label} ✓</p>`;
    // Every race gets a generic kill milestone bar (next round target) for a sense of progress.
    const MILESTONES = [100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
    const next = MILESTONES.find((m) => totalKilled < m);
    if (next) {
      const prev = MILESTONES[MILESTONES.indexOf(next) - 1] ?? 0;
      line += `<div class="row" style="margin-top:.3rem;font-size:.8rem"><span>${t('ui.next_milestone')}</span><span>${totalKilled}/${next}</span></div>${bar(totalKilled - prev, next - prev, '#c8a23f')}`;
    }
  }
  return line;
}

function specBuffPanel(state: GameState): string {
  const alloc = state.allocated ?? {};
  const over100 = (Object.keys(alloc) as (keyof typeof alloc)[]).filter((k) => (alloc[k] ?? 0) >= 100);
  if (over100.length === 0) return '';
  const spec = specStat(state);
  const SPEC_KEYS: Record<string, string> = {
    STR: 'ui.spec_str', VIT: 'ui.spec_vit', AGI: 'ui.spec_agi',
    INT: 'ui.spec_int', WIS: 'ui.spec_wis', LUCK: 'ui.spec_luck',
  };
  const colour = spec ? '#4a9' : '#a44';
  const icon   = spec ? '✦' : '✗';
  const label  = spec ? t(SPEC_KEYS[spec]) : t('ui.spec_cancelled');
  return `<p style="font-size:.82rem;margin:.35rem 0 0;color:${colour}">${icon} ${t('ui.spec_buff')}: <b>${label}</b></p>`;
}

function analyticsPanel(state: GameState): string {
  const summary = computeAnalyticsSummary(state);
  if (summary.totalEncounters === 0) {
    return `
      <section class="panel">
        <h2>📊 ${t('ui.analytics_title')}</h2>
        <p class="muted" style="margin:0.5rem 0 0;">${t('ui.analytics_none')}</p>
      </section>
    `;
  }

  return `
    <section class="panel">
      <h2>📊 ${t('ui.analytics_title')}</h2>
      <div style="display:flex; flex-direction:column; gap:0.4rem; margin-top:0.5rem; font-size:0.85rem;">
        <div class="row">
          <span class="muted">${t('ui.analytics_dps')}</span>
          <b style="font-family:var(--mono); color:#e0902f;">${summary.avgDps}</b>
        </div>
        <div class="row">
          <span class="muted">${t('ui.analytics_ep')}</span>
          <b style="font-family:var(--mono); color:#bb4140;">${summary.avgEpPerSec}</b>
        </div>
        <div class="row">
          <span class="muted">${t('ui.analytics_regen')}</span>
          <b style="font-family:var(--mono); color:#6fae53;">${summary.avgRegenEfficiency}</b>
        </div>
      </div>
    </section>
  `;
}

function statsTab(state: GameState): string {
  const statRows = STATS.map(
    (k) =>
      `<li><div class="row"><b>${t(`stat.${k}`)}</b><span>${state.stats[k]} ${state.statPoints > 0 ? `<button class="statadd" data-stat="${k}">+</button>` : ''}</span></div><p class="muted statdesc">${t(`stat.${k}.desc`)}</p></li>`,
  ).join('');
  const treeHtml = evolutionTree(state);
  const infoCardHtml = evolutionInfoCard(state);
  const form = currentForm(state, CONTENT);
  return `
    <section class="panel">
      <div class="row"><span>${state.tier >= 1 ? `T${state.tier} · ` : ''}${t('ui.level')} ${state.level}/${LEVEL_CAP}</span><span>${state.level >= LEVEL_CAP ? t('ui.evolution_ready') : `${t('ui.xp')} ${state.xp}/${xpToNext(state.level)}`}</span></div>
      ${bar(state.level >= LEVEL_CAP ? 1 : state.xp, state.level >= LEVEL_CAP ? 1 : xpToNext(state.level), '#6d44d9')}
      <p class="muted">${t('ui.statpoints')}: ${state.statPoints} · ${t('ui.auto_power')}: +${Math.round((levelPower(state) - 1) * 100)}%</p>
      ${specBuffPanel(state)}
      ${killStatsHtml(state)}
      <ul>${statRows}</ul>
      ${respecCost(state) > 0 ? `<button id="respec" class="ghost"${state.ep >= respecCost(state) ? '' : ' disabled'}>${t('ui.respec')} (${respecCost(state)} EP)</button>` : ''}
    </section>
    ${epShopPanel(state)}
    ${questsPanel(state)}
    ${statisticsPanel(state)}
    ${analyticsPanel(state)}
    ${achievementsPanel(state)}
    ${minionPanel(state)}
    ${mutationsPanel(state)}
    ${perksPanel(state)}
    <section class="panel" style="overflow: visible;">
      <h2>${t('ui.evolution')}</h2>
      <p class="muted">${t('ui.form')}: <b>${form ? t(form.locKey) : state.formId}</b></p>
      ${treeHtml}
      ${infoCardHtml}
    </section>
    ${racePanel(state)}
    ${rulerPanel(state)}
    ${rebirthPanel(state)}
  `;
}

function minionPanel(state: GameState): string {
  if (state.raceId !== 'spider' || state.tier < 5) return '';
  if (!state.minions) {
    state.minions = { dps: 0, tank: 0, utility: 0, tankHp: 0, tankMaxHp: 0 };
  }
  const perkBonus = state.rebirthPerks?.filter((p) => p === 'queens_blessing').length ?? 0;
  const limit = (Math.max(1, Math.floor(effStat(state, 'WIS') / 10) + Math.floor(state.level / 5)) * (state.formId === 'arachnid_sovereign' ? 2 : 1)) + perkBonus;
  const total = state.minions.dps + state.minions.tank + state.minions.utility;
  
  return `
    <section class="panel">
      <h2>${t('ui.queen_panel')}</h2>
      <div class="row">
        <span>${t('ui.minions_limit')}:</span>
        <span><b>${total} / ${limit}</b></span>
      </div>
      <ul style="margin-top:0.5rem; list-style:none; padding:0;">
        <li style="margin-bottom:0.5rem;">
          <div class="row">
            <span>DPS: ${state.minions.dps}</span>
            <button class="spawn-minion-btn" data-type="dps"${total >= limit || state.sp < 10 || state.mp < 5 ? ' disabled' : ''}>${t('ui.spawn')}</button>
          </div>
        </li>
        <li style="margin-bottom:0.5rem;">
          <div class="row">
            <span>TANK: ${state.minions.tank} ${state.minions.tank > 0 ? `(${state.minions.tankHp}/${state.minions.tankMaxHp} HP)` : ''}</span>
            <button class="spawn-minion-btn" data-type="tank"${total >= limit || state.sp < 10 || state.mp < 5 ? ' disabled' : ''}>${t('ui.spawn')}</button>
          </div>
        </li>
        <li style="margin-bottom:0.5rem;">
          <div class="row">
            <span>UTILITY: ${state.minions.utility}</span>
            <button class="spawn-minion-btn" data-type="utility"${total >= limit || state.sp < 10 || state.mp < 5 ? ' disabled' : ''}>${t('ui.spawn')}</button>
          </div>
        </li>
      </ul>
    </section>
  `;
}

function questsPanel(state: GameState): string {
  if (!CONTENT.quests || CONTENT.quests.size === 0) return '';
  const rows = (state.activeQuests ?? [])
    .map((q) => {
      const def = CONTENT.quests.get(q.id);
      if (!def) return '';
      const { cur, target } = questProgress(state, CONTENT, q);
      const name = t(`${def.locKey}.name`);
      const desc = t(`${def.locKey}.desc`);
      const reward = [def.reward.ep ? `+${def.reward.ep} EP` : '', def.reward.statPoints ? `+${def.reward.statPoints} SP` : ''].filter(Boolean).join(' ');
      return `<div style="margin:.35rem 0">
        <div class="row" style="font-size:.85rem"><span>${def.icon} <b>${name}</b> <span class="muted" style="font-size:.72rem">${desc}</span></span><span class="muted" style="font-size:.78rem">${cur}/${target} · ${reward}</span></div>
        ${bar(cur, target, '#6fae53')}
      </div>`;
    })
    .join('');
  if (!rows) return '';
  return `<section class="panel"><h2>${t('ui.quests_title')}</h2>${rows}</section>`;
}

let achievementsOpen = false; // Stats-tab achievements list starts collapsed (32 rows = a lot of scroll)

function achievementsPanel(state: GameState): string {
  const all = [...CONTENT.achievements.values()];
  if (all.length === 0) return '';
  const unlocked = new Set(state.achievements ?? []);
  const header = `<h2 id="ach-toggle" style="cursor:pointer;user-select:none;margin:0">${achievementsOpen ? '▾' : '▸'} ${t('ui.achievements_title')} <span class="muted" style="font-size:.8rem">${unlocked.size}/${all.length}</span></h2>`;
  if (!achievementsOpen) return `<section class="panel">${header}</section>`;
  const rows = all
    .map((a) => {
      const got = unlocked.has(a.id);
      const rp: Record<string, string> = a.param ? { race: t(`race.${a.param}.name`) } : {};
      const name = t(`${a.locKey}.name`, rp);
      const desc = t(`${a.locKey}.desc`, rp);
      if (got) {
        return `<div style="display:flex;gap:.5rem;align-items:center;margin:.3rem 0">
          <span style="font-size:1.2rem">${a.icon}</span>
          <span><b style="color:#e6c558">${name}</b><br><span class="muted" style="font-size:.75rem">${desc}</span></span>
        </div>`;
      }
      const prog = `${Math.min(achievementMetric(state, a.metric, a.param), a.threshold)}/${a.threshold}`;
      return `<div style="display:flex;gap:.5rem;align-items:center;margin:.3rem 0;opacity:.45">
        <span style="font-size:1.2rem;filter:grayscale(1)">${a.icon}</span>
        <span><b>${name}</b> <span class="muted" style="font-size:.72rem">(${prog})</span><br><span class="muted" style="font-size:.75rem">${desc}</span></span>
      </div>`;
    })
    .join('');
  return `
    <section class="panel">
      ${header}
      ${rows}
    </section>`;
}

function statisticsPanel(state: GameState): string {
  const ticks = state.totalTicks ?? 0;
  const h = Math.floor(ticks / 3600);
  const m = Math.floor((ticks % 3600) / 60);
  const s = ticks % 60;
  const timeStr = h > 0
    ? t('ui.time_hms', { h, m, s })
    : m > 0
      ? t('ui.time_ms', { m, s })
      : t('ui.time_s', { s });

  const deepL = state.deepestLayer ?? 1;
  const deepF = state.deepestFloor ?? 1;
  const deepR = state.deepestRoom ?? 1;
  const discCount = (state.discoveries?.length ?? 0) + (state.booksFound?.length ?? 0);
  const enemyTypes = Object.keys(state.killedEnemies ?? {}).length;

  const rows: [string, string | number][] = [
    [t('ui.stats_playtime'), timeStr],
    [t('ui.stats_deepest'), t('ui.stats_deepest_pos', { layer: deepL, floor: deepF, room: deepR })],
    [t('ui.stats_rebirths'), state.rebirthCount ?? 0],
    [t('ui.stats_discoveries'), discCount],
    [t('ui.stats_enemies_seen'), enemyTypes],
  ];

  const rowsHtml = rows
    .map(([label, val]) => `<div class="row" style="margin:.25rem 0"><span class="muted">${label}</span><b>${val}</b></div>`)
    .join('');

  return `
    <section class="panel">
      <h2>${t('ui.stats_panel')}</h2>
      ${rowsHtml}
    </section>`;
}

/** EP mağazası — stat puanı, geçici buff ve skill XP enjeksiyonu. */
function epShopPanel(state: GameState): string {
  const statCost = epStatCost(state);
  const canStat = state.ep >= statCost;
  const statBtn = `<button id="buy-stat-ep" class="ghost"${canStat ? '' : ' disabled'}>${t('ui.ep_stat_buy')} (${statCost} EP)</button>`;

  const now = Date.now();
  const buffRows = Object.entries(EP_BUFF_DEFS).map(([id, def]) => {
    const active = (state.tempBuffs?.[id] ?? 0) > now;
    const remaining = active ? Math.ceil(((state.tempBuffs?.[id] ?? 0) - now) / 60000) : 0;
    const canBuy = state.ep >= def.cost;
    const label = t(`ui.buff_${id}`);
    const status = active ? `<span class="muted"> ✓ ${remaining}${t('ui.buff_min')}</span>` : '';
    return `<div class="row" style="margin:.3rem 0"><span>${label}${status}</span><button class="buff-buy ghost" data-buff="${id}"${canBuy ? '' : ' disabled'}>${def.cost} EP</button></div>`;
  }).join('');

  return `
    <section class="panel">
      <h2>${t('ui.ep_shop')} <span class="muted">(${state.ep} EP)</span></h2>
      <div style="margin-bottom:.6rem">${statBtn} <span class="muted" style="font-size:.8rem">${t('ui.ep_stat_desc')} #${(state.epStatsBought ?? 0) + 1}</span></div>
      <h3 style="margin:.5rem 0 .2rem">${t('ui.ep_buffs')}</h3>
      ${buffRows}
    </section>`;
}

/** Full-screen race selector — shown until the player confirms a race on a fresh save. */
function raceSelectScreen(state: GameState): string {
  const raceCards = [...CONTENT.races.values()]
    .map((r) => {
      const active = r.id === state.raceId;
      const locked = !OFFICIAL_RACES.has(r.id);
      const eyeCount = r.head.eyes.length;
      const startSkillNames = (r.startSkills ?? [])
        .map((id) => {
          const s = CONTENT.skills.get(id);
          return s ? t(s.locKeyName) : id;
        })
        .join(', ');
      // The race's own portrait fills the card behind a dark gradient (keeps text legible).
      const bg = `linear-gradient(180deg, rgba(14,12,20,0.15) 0%, rgba(14,12,20,0.55) 55%, rgba(14,12,20,0.92) 100%), url('${assetUrl(`races/${r.id}.png`)}')`;
      return `
        <button class="race-card${active ? ' race-card-active' : ''}${locked ? ' race-card-locked' : ''}"${locked ? ' disabled' : ` data-race="${r.id}"`} style="background-image:${bg}${locked ? ';filter:grayscale(0.75) brightness(0.55)' : ''}">
          ${locked ? `<div style="position:absolute;top:0.4rem;right:0.5rem;font-size:0.7rem;background:rgba(0,0,0,0.65);border-radius:6px;padding:0.12rem 0.45rem;color:var(--ash)">🔒 ${t('ui.race_locked')}</div>` : ''}
          <div class="race-card-name">${t(r.locKey)}</div>
          <div class="muted">${t('ui.eyes')}: ${eyeCount}</div>
          ${locked ? '' : startSkillNames ? `<div class="muted" style="font-size:0.8rem">${startSkillNames}</div>` : ''}
          ${locked ? '' : raceHintPanel(r.id, state.lang ?? 'en')}
        </button>`;
    })
    .join('');
  const curRace = CONTENT.races.get(state.raceId);
  return `
    <section class="panel" style="max-width:min(960px,100%);margin:2rem auto">
      <h2>${t('ui.race_select')}</h2>
      <p class="muted">${t('ui.race_select_info')}</p>
      <div class="controls" style="margin-bottom:0.8rem;">
        ${(['tr', 'en', 'ru'] as const).map((l) => `<button class="lang${state.lang === l ? ' active' : ''}" data-lang="${l}">${({ tr: 'Türkçe', en: 'English', ru: 'Русский' } as Record<string, string>)[l]}</button>`).join('')}
      </div>
      <div class="race-grid">${raceCards}</div>
      <div style="margin-top:1.2rem">
        <button id="confirm-race" class="actbtn active">
          ${t('ui.pick_race')}: ${curRace ? t(curRace.locKey) : state.raceId}
        </button>
        <button id="enter-story" class="ghost" style="margin-left:0.6rem">${t('ui.story_mode')}</button>
      </div>
    </section>
  `;
}

function wireRaceSelect(el: HTMLElement): void {
  el.querySelectorAll<HTMLButtonElement>('.lang').forEach((b) => {
    b.addEventListener('click', () => ACTIONS.onSetLang(b.getAttribute('data-lang') as 'tr' | 'en' | 'ru'));
  });
  el.querySelectorAll<HTMLButtonElement>('.race-card').forEach((b) => {
    b.addEventListener('click', () => {
      const r = b.getAttribute('data-race');
      if (r) ACTIONS.onSelectRace(r); // onSelectRace also sets raceConfirmed=true and re-renders
    });
  });
  el.querySelector<HTMLButtonElement>('#confirm-race')?.addEventListener('click', () => {
    ACTIONS.onSelectRace(CURSTATE.raceId); // confirm current selection
  });
  el.querySelector<HTMLButtonElement>('#enter-story')?.addEventListener('click', () => ACTIONS.onEnterStory());
}

/** Story-mode narration banner atop the combat view: chapter intro while in progress, ending when done. */
function storyBannerHtml(state: GameState): string {
  if (state.mode !== 'story') return '';
  const txt = state.storyEnded ? storyText('ending') : storyText(`intro.${state.storyChapter}`);
  if (!txt) return '';
  const head = state.storyEnded ? t('ui.story_the_end') : t('ui.story_chapter');
  return `<section class="panel" style="border-color:#7a5cc0">
    <div style="font-weight:bold;color:#b79cf0;margin-bottom:.3rem">📖 ${head}</div>
    <div style="opacity:.92;line-height:1.5">${txt}</div>
  </section>`;
}

/** Story-Mode opening: the truck-kun death scene + the "last thought" → starting race choice. */
function storyIntroScreen(state: GameState): string {
  void state;
  const lines = storyLines('opening.truck').map((p) => `<p style="margin:0.4rem 0;line-height:1.6">${p}</p>`).join('');
  const choices = CONTENT.story.opening.choices.map((c) => {
    const race = CONTENT.races.get(c.race);
    const raceName = race ? t(race.locKey) : c.race;
    return `
      <button class="race-card" data-choice="${c.id}" style="text-align:left">
        <div style="font-size:1.05rem">${storyText(`choice.${c.id}`)}</div>
        <div class="muted" style="font-size:0.8rem;margin-top:0.3rem">→ ${raceName}</div>
      </button>`;
  }).join('');
  return `
    <section class="panel" style="max-width:min(720px,100%);margin:2rem auto">
      <h2>${t('ui.story_mode')}</h2>
      <div style="opacity:0.92;margin:1rem 0">${lines}</div>
      <p class="muted" style="margin-top:1rem">${storyText('opening.prompt')}</p>
      <div class="race-grid" style="margin-top:0.6rem">${choices}</div>
      <div style="margin-top:1.2rem">
        <button id="story-cancel" class="ghost">${t('ui.story_cancel')}</button>
      </div>
    </section>
  `;
}

function wireStoryIntro(el: HTMLElement): void {
  el.querySelectorAll<HTMLButtonElement>('.race-card').forEach((b) => {
    b.addEventListener('click', () => {
      const c = b.getAttribute('data-choice');
      if (c) ACTIONS.onStoryChoice(c);
    });
  });
  el.querySelector<HTMLButtonElement>('#story-cancel')?.addEventListener('click', () => ACTIONS.onExitStory());
}

function racePanel(state: GameState): string {
  const currentRace = CONTENT.races.get(state.raceId);
  const raceName = currentRace ? t(currentRace.locKey) : state.raceId;
  const canChange = state.kills === 0 && state.tier === 0 && state.level === 1;
  const raceButtons = canChange
    ? [...CONTENT.races.values()]
        .map((r) => {
          const active = r.id === state.raceId;
          const locked = !OFFICIAL_RACES.has(r.id);
          return `<button class="racepick${active ? ' active' : ''}"${locked ? ' disabled' : ` data-race="${r.id}"`}>${t(r.locKey)}${locked ? ' 🔒' : ''}</button>`;
        })
        .join('')
    : '';
  return `
    <section class="panel">
      <h2>${t('ui.race_select')}</h2>
      <p class="muted">${t('ui.form')}: <b>${raceName}</b></p>
      ${canChange ? `<p class="muted">${t('ui.race_select_info')}</p><div class="controls">${raceButtons}</div>` : ''}
    </section>`;
}

function rulerPanel(state: GameState): string {
  const powers = CONTENT.ruler
    .filter((r) => state.ruler.powers.includes(r.id))
    .map((r) => `<li><b>${t(r.locKeyName)}</b> <span class="muted">${r.pole === 'sin' ? '🔥' : '☼'}</span> — ${t(r.locKeyDesc)}</li>`)
    .join('');
  const taboo = state.ruler.taboo > 0 ? ` · <b style="color:#a4506a">${t('ui.taboo')} ${state.ruler.taboo}</b>` : '';
  const scar = state.scars > 0
    ? `<div class="row"><span style="color:#c0626f">${t('ui.scars')}: ${state.scars}</span><button id="repair" class="ghost">${t('ui.repair')} (20 EP)</button></div>`
    : '';
  return `
    <section class="panel">
      <h2>${t('ui.ruler')}</h2>
      <div class="row"><span>🔥 ${t('ui.sin')}</span><span>${Math.floor(state.ruler.sin)}</span></div>
      <div class="row"><span>☼ ${t('ui.virtue')}</span><span>${Math.floor(state.ruler.virtue)}</span></div>
      <p class="muted">${t('ui.ep')}: ${state.ep}${taboo}</p>
      ${powers ? `<ul>${powers}</ul>` : `<p class="muted">${t('ui.no_ruler')}</p>`}
      ${scar}
    </section>
  `;
}

function rebirthPanel(state: GameState): string {
  const ready = canRebirth(state);
  const rb = state.rebirthCount ?? 0;
  const mult = rebirthMult(state);
  const multLine = rb > 0 ? ` · <span style="color:#c8a23f">♻ ×${mult.toFixed(1)}</span>` : '';
  const info = `${t('ui.rebirths')}: ${rb}${state.rebirthBoon > 0 ? ` · +${state.rebirthBoon} ${t('ui.boon')}` : ''}${multLine}`;
  return `
    <section class="panel">
      <h2>${t('ui.rebirth')}</h2>
      <p class="muted">${info}</p>
      ${ready
        ? `<p>${t('ui.rebirth_ready')}</p><button id="rebirth">${t('ui.rebirth_do')}</button>`
        : `<p class="muted">${t('ui.rebirth_locked')}</p>`}
    </section>
    ${soulTreePanel(state)}
  `;
}

/** The Soul prestige tree — spend Souls earned at rebirth on permanent, strategy-shaping upgrades. */
function soulTreePanel(state: GameState): string {
  const souls = Math.floor(state.souls ?? 0);
  // Hidden until the player has earned their first Souls (keeps early game uncluttered).
  if (souls <= 0 && (state.rebirthCount ?? 0) === 0 && Object.keys(state.soulUpgrades ?? {}).length === 0) return '';
  const rows = SOUL_UPGRADES.map((u) => {
    const lvl = soulLevel(state, u.id);
    const cost = soulUpgradeCost(state, u.id);
    const maxed = !Number.isFinite(cost);
    const afford = souls >= cost;
    const lvlText = u.maxLevel > 0 ? `${lvl}/${u.maxLevel}` : `${lvl}`;
    const btn = maxed
      ? `<span class="soul-max">${t('ui.soul_max')}</span>`
      : `<button class="soul-buy${afford ? '' : ' disabled'}" data-soul="${u.id}"${afford ? '' : ' disabled'}>${t('ui.soul_buy')} · ${cost}✦</button>`;
    return `<li class="soul-row">
      <div class="soul-head"><b>${u.icon} ${t(u.locKey)}</b> <span class="muted">${t('ui.lv')} ${lvlText}</span></div>
      <div class="muted soul-desc">${t(u.locKeyDesc)}</div>
      <div class="soul-act">${btn}</div>
    </li>`;
  }).join('');
  return `<section class="panel soul-panel">
    <div class="row"><h2 style="margin:0">${t('ui.soul_tree')}</h2><span class="soul-bal">✦ ${souls}</span></div>
    <p class="muted" style="font-size:0.8rem">${t('ui.soul_info')}</p>
    <ul class="soul-list">${rows}</ul>
  </section>`;
}

function wireStats(el: HTMLElement): void {
  el.querySelectorAll<HTMLButtonElement>('.statadd').forEach((b) => {
    b.addEventListener('click', () => ACTIONS.onAllocStat(b.getAttribute('data-stat') as StatKey));
  });
  el.querySelector<HTMLButtonElement>('#respec')?.addEventListener('click', () => ACTIONS.onRespec());
  el.querySelector<HTMLButtonElement>('#buy-stat-ep')?.addEventListener('click', () => ACTIONS.onBuyStatPointEp());
  el.querySelectorAll<HTMLButtonElement>('.buff-buy[data-buff]').forEach((b) => {
    b.addEventListener('click', () => { const id = b.getAttribute('data-buff'); if (id) ACTIONS.onBuyTempBuff(id); });
  });
  el.querySelectorAll<HTMLElement>('.evo-node[data-form-id]').forEach((node) => {
    node.addEventListener('click', () => {
      const id = node.getAttribute('data-form-id');
      if (id) {
        selectedEvoNodeId = id;
        render(CURSTATE);
      }
    });
  });
  el.querySelectorAll<HTMLButtonElement>('.evo-action-btn[data-form]').forEach((b) => {
    b.addEventListener('click', () => {
      const f = b.getAttribute('data-form');
      if (f) ACTIONS.onEvolve(f);
    });
  });
  el.querySelectorAll<HTMLButtonElement>('.branch-switch-btn[data-switch]').forEach((b) => {
    b.addEventListener('click', () => {
      const f = b.getAttribute('data-switch');
      if (f) ACTIONS.onSwitchBranch(f);
    });
  });
  el.querySelector<HTMLElement>('#ach-toggle')?.addEventListener('click', () => {
    achievementsOpen = !achievementsOpen;
    render(CURSTATE);
  });
  el.querySelector<HTMLButtonElement>('#rebirth')?.addEventListener('click', ACTIONS.onRebirth);
  el.querySelector<HTMLButtonElement>('#repair')?.addEventListener('click', ACTIONS.onRepairScar);
  el.querySelectorAll<HTMLButtonElement>('.spawn-minion-btn').forEach((b) => {
    b.addEventListener('click', () => {
      const type = b.getAttribute('data-type');
      if (type === 'dps' || type === 'tank' || type === 'utility') ACTIONS.onSpawnMinion(type);
    });
  });
  el.querySelectorAll<HTMLButtonElement>('.soul-buy[data-soul]').forEach((b) => {
    b.addEventListener('click', () => {
      const id = b.getAttribute('data-soul');
      if (id) ACTIONS.onBuySoul(id);
    });
  });
  el.querySelectorAll<HTMLButtonElement>('.racepick').forEach((b) => {
    b.addEventListener('click', () => {
      const r = b.getAttribute('data-race');
      if (r) ACTIONS.onSelectRace(r);
    });
  });
}

// ---- TUTORIAL OVERLAY ------------------------------------------------------

function updateTutorialOverlay(state: GameState): void {
  const overlay = document.querySelector<HTMLElement>('#tutorial-overlay');
  if (!overlay) return;

  const step = state.tutorialStep;

  if (step === 'done' || step === 'skipped' || !state.raceConfirmed) {
    overlay.classList.add('hidden');
    return;
  }

  if (typeof step !== 'number') { overlay.classList.add('hidden'); return; }

  const def: TutorialStep | undefined = TUTORIAL_STEPS[step];
  if (!def) { overlay.classList.add('hidden'); return; }

  const total = TUTORIAL_STEPS.length;
  const gotoBtn = def.targetTab
    ? `<button class="ghost tut-goto tutorial-goto" data-tab="${def.targetTab}" data-sel="${def.targetSelector ?? ''}">${t('tut.goto')}</button>`
    : '';
  const isLast = step === total - 1;

  overlay.innerHTML = `
    <div class="tutorial-box">
      <div class="tutorial-step-count">${t('tut.step')} ${step + 1} ${t('tut.of')} ${total}</div>
      <h2>${t(`${def.i18nPrefix}.title`)}</h2>
      <p>${t(`${def.i18nPrefix}.body`)}</p>
      <div class="tutorial-actions">
        ${gotoBtn}
        <button class="ghost tut-skip">${t('tut.skip_all')}</button>
        <button class="actbtn active tut-next">${isLast ? t('tut.done') : t('tut.next')}</button>
      </div>
    </div>`;

  overlay.classList.remove('hidden');
  wireTutorialOverlay(overlay);
}

function wireTutorialOverlay(overlay: HTMLElement): void {
  overlay.querySelector<HTMLButtonElement>('.tut-next')?.addEventListener('click', () => {
    ACTIONS.onTutorialNext();
  });
  overlay.querySelector<HTMLButtonElement>('.tut-skip')?.addEventListener('click', () => {
    ACTIONS.onTutorialSkip();
  });
  overlay.querySelectorAll<HTMLButtonElement>('.tut-goto').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab') as Tab | null;
      const sel = btn.getAttribute('data-sel');
      if (tab) {
        activeTab = tab;
        renderTab();
        if (sel) {
          setTimeout(() => {
            const el = document.querySelector<HTMLElement>(sel);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      }
    });
  });
}

// ---- GUIDE TAB -------------------------------------------------------------

let raceHintsCache: Record<string, Record<string, Record<string, string>>> | null = null;

async function loadRaceHints(base: string): Promise<void> {
  try {
    raceHintsCache = await fetch(`${base}race_hints.json`).then((r) => r.json());
  } catch {
    raceHintsCache = {};
  }
}

function raceHintPanel(raceId: string, lang: string): string {
  if (!raceHintsCache) return '';
  const hint = raceHintsCache[raceId];
  if (!hint) return '';
  const l = (hint[lang] ?? hint['en'] ?? {}) as Record<string, string>;
  return `
    <div class="race-hint-panel" style="margin-top:0.8rem; padding:0.8rem; background:rgba(255,255,255,0.04); border-radius:6px; font-size:0.85rem; line-height:1.5;">
      ${l.strength ? `<div><span style="color:var(--venom)">⬆ ${t('race_hint.strength')}:</span> ${l.strength}</div>` : ''}
      ${l.weakness ? `<div><span style="color:var(--blood)">⬇ ${t('race_hint.weakness')}:</span> ${l.weakness}</div>` : ''}
      ${l.growth ? `<div><span class="muted">🌱 ${t('race_hint.growth')}:</span> ${l.growth}</div>` : ''}
      ${l.note ? `<div><span class="muted">✦ ${t('race_hint.note')}:</span> ${l.note}</div>` : ''}
    </div>`;
}

const GUIDE_SECTIONS = [
  'basics', 'combat', 'skills', 'map', 'hunger', 'stats',
  'inventory', 'soul', 'fusion', 'human_path', 'lore', 'races',
] as const;

function guideSectionHtml(section: string, state: GameState): string {
  const isRaces = section === 'races';
  const racesExtra = isRaces
    ? [...(CONTENT?.races?.values() ?? [])].map((r) => {
        const hint = raceHintPanel(r.id, state.lang ?? 'en');
        return hint
          ? `<div style="margin-top:1rem;"><b>${t(r.locKey)}</b>${hint}</div>`
          : '';
      }).join('')
    : '';
  return `
    <section class="panel" id="guide-${section}" style="scroll-margin-top:1rem;">
      <h3 style="margin-bottom:0.5rem;">${t(`guide.${section}.title`)}</h3>
      <p class="muted" style="line-height:1.6;">${t(`guide.${section}.body`)}</p>
      ${racesExtra}
    </section>`;
}

function guideTab(state: GameState): string {
  const sections = GUIDE_SECTIONS.map((s) => guideSectionHtml(s, state)).join('');
  return `
    <div style="padding:0.5rem 0;">
      <h2 style="margin-bottom:1rem;">${t('guide.title')}</h2>
      ${sections}
    </div>`;
}

function wireGuide(_el: HTMLElement): void {
  // Guide sekmesi tamamen statik HTML — etkileşim yok.
}

// ---- SETTINGS --------------------------------------------------------------

function settingsTab(state: GameState): string {
  const autosave = [5, 10, 15]
    .map((m) => `<button class="autosave${state.autosaveMin === m ? ' active' : ''}" data-min="${m}">${m}</button>`)
    .join('');
  const LANG_LABEL: Record<string, string> = { tr: 'Türkçe', en: 'English', ru: 'Русский' };
  const langs = (['tr', 'en', 'ru'] as const)
    .map((l) => `<button class="lang${state.lang === l ? ' active' : ''}" data-lang="${l}">${LANG_LABEL[l]}</button>`)
    .join('');
  const diffs = [...CONTENT.difficulties.values()]
    .map((d) => `<button class="diff${state.difficulty === d.id ? ' active' : ''}" data-diff="${d.id}">${t(d.locKey)}</button>`)
    .join('');
  const cur = diffDef(state, CONTENT);
  return `
    <section class="panel">
      <div class="row"><span>${t('ui.difficulty')}</span><span class="muted">${t(cur.locKey)}</span></div>
      <div class="controls">${diffs}</div>
      <div class="row"><span>${t('ui.permadeath')}</span><button id="permadeath" class="${state.permadeath ? 'active' : 'ghost'}">${state.permadeath ? t('ui.on') : t('ui.off')}</button></div>
      <p class="muted">${t('ui.permadeath_hint')}</p>
    </section>
    <section class="panel">
      <div class="row"><span>${t('ui.language')}</span><span></span></div>
      <div class="controls">${langs}</div>
      <div class="row"><span>${t('ui.autosave')}</span><span></span></div>
      <div class="controls">${autosave}</div>
    </section>
    <section class="panel">
      <div class="row"><span>${t('ui.modifier_free_toggle')}</span>
        <button id="modifier-free-toggle" class="${state.modifierFreeRooms ? 'actbtn active' : 'ghost'}">${state.modifierFreeRooms ? t('ui.on') : t('ui.off')}</button>
      </div>
      <p class="muted">${t('ui.modifier_free_hint')}</p>
    </section>
    <section class="panel">
      <h3 style="margin-bottom:0.5rem;font-size:0.9rem;">${t('auto.event.label')}</h3>
      <div class="controls">
        <button id="auto-event-toggle" class="${state.autoEventDecision ? 'actbtn active' : 'ghost'}">
          ${t('auto.event.label')}: ${state.autoEventDecision ? t('auto.on') : t('auto.off')}
        </button>
        <span style="font-size:0.78rem;color:${state.stats.INT >= 50 ? '#7a6' : '#c66'}">${t('auto.event.hint')} (INT: ${state.stats.INT}/50)</span>
      </div>
      ${state.autoEventDecision ? `
      <div class="controls" style="margin-top:0.4rem;">
        <span class="muted" style="font-size:0.8rem">${t('auto.puzzle.label')}:</span>
        <button id="puzzle-skip" class="${state.autoEventPuzzleMode === 'skip' ? 'actbtn active' : 'ghost'}" style="font-size:0.8rem">
          ${t('auto.puzzle.skip')}
        </button>
        <button id="puzzle-solve" class="${state.autoEventPuzzleMode === 'solve' ? 'actbtn active' : 'ghost'}" style="font-size:0.8rem">
          ${t('auto.puzzle.solve')}
        </button>
      </div>` : ''}
    </section>
    <section class="panel">
      <h3 style="margin-bottom:0.5rem;font-size:0.9rem;">${t('ui.moral_auto')}</h3>
      <div class="controls">
        <button id="moral-ask" class="${state.moralAutoMode === 'ask' ? 'actbtn active' : 'ghost'}" style="font-size:0.8rem">${t('ui.moral_ask')}</button>
        <button id="moral-spare" class="${state.moralAutoMode === 'spare' ? 'actbtn active' : 'ghost'}" style="font-size:0.8rem">${t('ui.moral_spare')}</button>
        <button id="moral-devour" class="${state.moralAutoMode === 'devour' ? 'actbtn active' : 'ghost'}" style="font-size:0.8rem">${t('ui.moral_devour')}</button>
      </div>
      <span class="muted" style="font-size:0.78rem">${t('ui.moral_auto_hint')}</span>
    </section>
    <section class="panel">
      <div class="controls">
        <button id="savenow" class="ghost">${t('ui.save')}</button>
        <button id="exportsave" class="ghost">${t('ui.export_save')}</button>
        <button id="importsave" class="ghost">${t('ui.import_save')}</button>
      </div>
      <div class="controls">
        <button id="bugreport">${t('ui.bug_report')}</button>
        <button id="suggest">${t('ui.suggest')}</button>
        <button id="reset" class="ghost">${t('ui.reset')}</button>
      </div>
      <div class="controls">
        <button id="tutorial-reopen">${t('tut.reopen')}</button>
        <button id="mode-switch" class="ghost">${state.mode === 'story' ? t('ui.story_back') : t('ui.story_mode')}</button>
      </div>
    </section>
    <section class="panel">
      <h3 style="margin-bottom:0.5rem;font-size:0.9rem;">${t('ui.support_title')}</h3>
      <div class="controls">
        <button id="patreon-link" class="actbtn">${t('ui.support')}</button>
        ${location.hostname.endsWith('github.io') ? `<button id="play-supported" class="ghost">${t('ui.play_supported')}</button>` : ''}
      </div>
      ${location.hostname.endsWith('github.io') ? `<span class="muted" style="font-size:0.78rem">${t('ui.play_supported_hint')}</span>` : ''}
    </section>
    <section class="panel">
      <h3 style="margin-bottom:0.5rem;font-size:0.9rem;">${t('ui.supporters_title')}</h3>
      ${supportersHtml()}
    </section>
  `;
}

/** Render the in-game supporters list (from data/supporters.json), grouped by tier. */
function supportersHtml(): string {
  const s = CONTENT.supporters;
  const esc = (n: string): string =>
    n.replace(/[&<>"]/g, (c) => (({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as Record<string, string>)[c] ?? c));
  const groups: Array<[string[], string, string]> = [
    [s.apex ?? [], '👑 Apex', '#e6c558'],
    [s.evolved ?? [], '🐉 Evolved', '#e0902f'],
    [s.spiderling ?? [], '🕷️ Spiderling', '#8ab23f'],
  ];
  const total = groups.reduce((n, [list]) => n + list.length, 0);
  if (total === 0) return `<p class="muted" style="font-size:0.82rem">${t('ui.supporters_empty')}</p>`;
  return groups
    .filter(([list]) => list.length > 0)
    .map(([list, label, color]) =>
      `<div style="margin:0.35rem 0"><span style="color:${color};font-family:var(--disp);font-size:0.78rem;letter-spacing:0.06em">${label}</span> <span style="font-size:0.85rem;color:var(--bone)">${list.map(esc).join(' · ')}</span></div>`,
    )
    .join('');
}

function wireSettings(el: HTMLElement): void {
  el.querySelectorAll<HTMLButtonElement>('.autosave').forEach((b) => {
    b.addEventListener('click', () => ACTIONS.onSetAutosave(Number(b.getAttribute('data-min'))));
  });
  el.querySelectorAll<HTMLButtonElement>('.lang').forEach((b) => {
    b.addEventListener('click', () => ACTIONS.onSetLang(b.getAttribute('data-lang') as 'tr' | 'en' | 'ru'));
  });
  el.querySelectorAll<HTMLButtonElement>('.diff').forEach((b) => {
    b.addEventListener('click', () => ACTIONS.onSetDifficulty(b.getAttribute('data-diff') as Difficulty));
  });
  el.querySelector<HTMLButtonElement>('#permadeath')?.addEventListener('click', ACTIONS.onTogglePermadeath);
  el.querySelector<HTMLButtonElement>('#savenow')?.addEventListener('click', ACTIONS.onSaveNow);
  el.querySelector<HTMLButtonElement>('#exportsave')?.addEventListener('click', ACTIONS.onExportSave);
  el.querySelector<HTMLButtonElement>('#importsave')?.addEventListener('click', ACTIONS.onImportSave);
  el.querySelector<HTMLButtonElement>('#bugreport')?.addEventListener('click', ACTIONS.onBugReport);
  el.querySelector<HTMLButtonElement>('#suggest')?.addEventListener('click', ACTIONS.onSuggest);
  el.querySelector<HTMLButtonElement>('#patreon-link')?.addEventListener('click', () => window.open('https://www.patreon.com/cw/ArmyHeLL07', '_blank', 'noopener'));
  el.querySelector<HTMLButtonElement>('#play-supported')?.addEventListener('click', () => window.open('https://monster-reincarnation.pages.dev', '_blank', 'noopener'));
  el.querySelector<HTMLButtonElement>('#reset')?.addEventListener('click', ACTIONS.onReset);
  el.querySelector<HTMLButtonElement>('#tutorial-reopen')?.addEventListener('click', ACTIONS.onTutorialReopen);
  el.querySelector<HTMLButtonElement>('#mode-switch')?.addEventListener('click', () => {
    if (CURSTATE.mode === 'story') ACTIONS.onExitStory(); else ACTIONS.onEnterStory();
  });
  el.querySelector<HTMLButtonElement>('#modifier-free-toggle')?.addEventListener('click', ACTIONS.onToggleModifierFreeRooms);
  el.querySelector<HTMLButtonElement>('#auto-event-toggle')?.addEventListener('click', ACTIONS.onToggleAutoEvent);
  el.querySelector<HTMLButtonElement>('#moral-ask')?.addEventListener('click', () => ACTIONS.onSetMoralMode('ask'));
  el.querySelector<HTMLButtonElement>('#moral-spare')?.addEventListener('click', () => ACTIONS.onSetMoralMode('spare'));
  el.querySelector<HTMLButtonElement>('#moral-devour')?.addEventListener('click', () => ACTIONS.onSetMoralMode('devour'));
  el.querySelector<HTMLButtonElement>('#puzzle-skip')?.addEventListener('click', () => ACTIONS.onSetPuzzleMode('skip'));
  el.querySelector<HTMLButtonElement>('#puzzle-solve')?.addEventListener('click', () => ACTIONS.onSetPuzzleMode('solve'));
}

function rebirthPerkSelectScreen(state: GameState): string {
  const choices = state.rebirthPerkChoices ?? [];
  const cards = choices.map((perkId) => {
    const perk = REBIRTH_PERKS.find((p) => p.id === perkId);
    if (!perk) return '';
    return `
      <button class="perk-card" data-perk="${perk.id}">
        <div class="perk-icon">${perk.icon}</div>
        <h3 class="perk-name">${perk.icon} ${t(perk.locKey)}</h3>
        <p class="perk-desc">${t(perk.locKeyDesc)}</p>
      </button>
    `;
  }).join('');

  return `
    <div class="race-select-screen" style="max-width:600px; margin:2rem auto; text-align:center;">
      <h2 style="color:var(--gold); font-size:1.8rem; margin-bottom:0.5rem;">✨ ${t('ui.teachings_title')}</h2>
      <p class="muted" style="margin-bottom:2rem;">${t('ui.teachings_subtitle')}</p>
      <div class="perk-cards-grid" style="display:flex; flex-direction:column; gap:1rem;">
        ${cards}
      </div>
    </div>
  `;
}

function wireRebirthPerkSelect(el: HTMLElement): void {
  el.querySelectorAll<HTMLButtonElement>('.perk-card').forEach((btn) => {
    btn.addEventListener('click', () => {
      const perkId = btn.getAttribute('data-perk');
      if (perkId) {
        ACTIONS.onChooseRebirthPerk(perkId);
      }
    });
  });
}

function webPanel(state: GameState): string {
  if (state.raceId !== 'spider' || state.tier < 3) return '';

  const isSovereign = state.formId === 'arachnid_sovereign';
  const maxDurability = isSovereign ? 1000 : 500;

  if (!state.webRoom) {
    const canSpin = state.roomCleared && state.sp >= 20 && state.sig >= 10;
    return `
      <section class="panel web-panel">
        <h2>🕸️ ${t('ui.web_status')}</h2>
        <p class="muted" style="font-size:0.82rem; margin-bottom:0.5rem;">${t('ui.web_spin_desc')}</p>
        <button id="web-spin" class="actbtn"${canSpin ? '' : ' disabled'} style="font-size:0.8rem; padding:0.4rem 0.8rem;">
          ${t('btn.spin_web')} (20 SP · 10 🕸)
        </button>
      </section>
    `;
  }

  const roomStr = `${state.webRoom.layer}.${state.webRoom.floor}.${state.webRoom.room}`;
  const ep = Math.round(state.webAccEp);
  const food = state.webAccFood?.length ?? 0;
  const loot = state.webAccLoot?.length ?? 0;
  
  return `
    <section class="panel web-panel">
      <h2>🕸️ ${t('ui.web_status')}</h2>
      <div style="font-size:0.85rem; margin-bottom:0.4rem;">
        <b>${t('ui.web_room')}:</b> ${roomStr} · 
        <b>${t('ui.web_durability')}:</b> ${state.webTicks}/${maxDurability}
      </div>
      ${bar(state.webTicks, maxDurability, '#8ab23f')}
      <div style="font-size:0.82rem; margin-top:0.5rem; margin-bottom:0.5rem;">
        <b>${t('ui.web_accumulated')}:</b> +${ep} EP, ${food} food, ${loot} loot
      </div>
      <button id="web-collect" class="actbtn" style="font-size:0.8rem; padding:0.4rem 0.8rem;">
        ${t('btn.collect_web')}
      </button>
    </section>
  `;
}

function mutationsPanel(state: GameState): string {
  if (!state.mutations || state.mutations.length === 0) return '';
  const badges = state.mutations.map((mutId) => {
    const def = MUTATION_POOL.find((m) => m.id === mutId);
    if (!def) return '';
    const color = def.positive ? 'var(--venom)' : 'var(--blood)';
    return `<span class="mut-badge" style="display:inline-block; background:${color}; padding:0.2rem 0.5rem; border-radius:4px; font-size:0.75rem; font-weight:600; color:#fff; margin-right:0.3rem; margin-bottom:0.3rem;">${t(def.locKey)}</span>`;
  }).join('');
  
  return `
    <section class="panel">
      <h2>🧬 ${t('ui.mutations')}</h2>
      <div style="display:flex; flex-wrap:wrap; margin-top:0.4rem;">
        ${badges}
      </div>
    </section>
  `;
}

function perksPanel(state: GameState): string {
  if (!state.rebirthPerks || state.rebirthPerks.length === 0) return '';
  
  const counts = state.rebirthPerks.reduce((acc, p) => {
    acc[p] = (acc[p] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const rows = Object.entries(counts).map(([perkId, count]) => {
    const perk = REBIRTH_PERKS.find((p) => p.id === perkId);
    if (!perk) return '';
    const multiplier = count > 1 ? ` <span style="color:var(--gold); font-weight:bold;">x${count}</span>` : '';
    return `
      <li style="margin-bottom:0.4rem; font-size:0.85rem; display:flex; align-items:center; gap:0.4rem;">
        <span>${perk.icon}</span>
        <span><b>${t(perk.locKey)}</b>${multiplier} — ${t(perk.locKeyDesc)}</span>
      </li>
    `;
  }).join('');

  return `
    <section class="panel">
      <h2>📿 ${t('ui.teachings_perks_title')}</h2>
      <ul style="list-style:none; padding:0; margin:0.4rem 0 0;">
        ${rows}
      </ul>
    </section>
  `;
}

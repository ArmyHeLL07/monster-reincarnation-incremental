import type { FusionResult, StatKey, Difficulty, Skill, DungeonLayer } from '@mri/shared';
import type { Content } from './game/content';
import type { GameState } from './game/state';
import { MAX_HUNGER, LEVEL_CAP, MEDITATION_MAX } from './game/state';
import { appraisalTier, ownedEyeAbilities, isAbilityAssigned } from './game/eyes';
import { currentForm, evolutionReady, evolutionTreeView } from './game/evolution';
import { condMet, foresee, reqText } from './game/roomevents';
import { isRiddleLocked, lockRemainingMin } from './game/riddles';
import { maxFoodSlots, refrigerated, isRotten, SPOIL_THRESHOLD } from './game/inventory';
import { xpToNext, weaknessOf, skillSlots, floorsOf, roomsOf, levelPower } from './game/combat';
import { canRebirth } from './game/rebirth';
import { diffDef } from './game/difficulty';
import { t, tmsg } from './i18n';

export interface UiActions {
  onSetAction: (a: 'idle' | 'combat' | 'rest') => void;
  onDeepRead: () => void;
  onUseSkill: (id: string) => void;
  onToggleMode: () => void;
  onAdvance: () => void;
  onToggleAutoAdvance: () => void;
  onToggleEquip: (id: string) => void;
  onDeleteSkill: (id: string) => void;
  onSacrificeSkill: (id: string) => void;
  onSelectLayer: (layerId: number) => void;
  onSetPos: (layerId: number, floor: number) => void;
  onAllocStat: (stat: StatKey) => void;
  onEvolve: (formId: string) => void;
  onFuse: (aId: string, bId: string) => void;
  onAssignEye: (slotId: string, abilityId: string) => void;
  onCycleMode: (slotId: string) => void;
  onClearEye: (slotId: string) => void;
  onFuseEyes: (slotA: string, slotB: string) => void;
  onDiscardFood: (index: number) => void;
  onEat: (index: number) => void;
  onToggleAutoEat: () => void;
  onSetAutosave: (min: number) => void;
  onSetLang: (lang: 'tr' | 'en') => void;
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
  onReadBook: (id: string) => void;
  onAnswerRoom: (answer: string) => void;
  onChooseEvent: (i: number) => void;
  onAnswerBossRiddle: (answer: string) => void;
  onBossChoice: (mode: 'skip' | 'fight', difficulty: string) => void;
  onRepairScar: () => void;
  onSetDifficulty: (d: Difficulty) => void;
  onTogglePermadeath: () => void;
  onSelectRace: (raceId: string) => void;
}

type Tab = 'combat' | 'map' | 'skills' | 'body' | 'lore' | 'stats' | 'settings';
const TABS: Tab[] = ['combat', 'map', 'skills', 'body', 'lore', 'stats', 'settings'];
const STATS: StatKey[] = ['STR', 'VIT', 'AGI', 'INT', 'WIS', 'LUCK'];
const LOG_CAP = 80;

const svg = (inner: string) => `<svg viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
const EYE_SVG = svg('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>');
const ICONS: Record<Tab, string> = {
  combat: svg('<path d="M14 3l7 7-3 3-7-7zM4 20l6-6M3 21l2-1 1-2"/>'),
  map: svg('<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>'),
  skills: svg('<path d="M12 2v6M12 16v6M2 12h6M16 12h6M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/>'),
  body: EYE_SVG,
  lore: svg('<path d="M4 4h12a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2z"/><path d="M8 8h8M8 12h8"/>'),
  stats: svg('<path d="M5 21V11M12 21V4M19 21v-7"/>'),
  settings: svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>'),
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
let expandedSkill: string | null = null;
let lastFusion: FusionResult | null = null;
type LogCat = 'combat' | 'discovery' | 'loot';
const logs: Record<LogCat, string[]> = { combat: [], discovery: [], loot: [] };

/** Route a log line to its stream so combat spam never buries loot/discovery. */
function logCategory(key: string): LogCat {
  if (key === 'log.kill' || key === 'log.boss_kill' || key === 'log.larder_full' || key === 'log.offline') return 'loot';
  if (/discover|search|book|room|appraise|ruler|taboo|meditation|gatekeeper|cleared|unlocked|scar|zen|hell|nullity/.test(key)) {
    return 'discovery';
  }
  return 'combat';
}

/** Big-moment keys that also pop a toast (new discoveries) — so they aren't buried in the log. */
const TOAST_KEYS = new Set([
  'log.fuse_new', 'log.ruler_unlock', 'log.taboo_authority', 'log.meditation_unlock', 'log.zen',
  'log.search_room', 'log.search_book', 'log.room_solved', 'log.learn_regen', 'log.gatekeeper_down',
  'log.evolve', 'log.evolve_form', 'log.fusion_death', 'log.eyefuse', 'log.eyefuse_blind',
  'log.sin_kill', 'log.evolve_ambush', 'log.skill_sacrificed',
]);

export function pushLog(key: string, params?: Record<string, string | number>): void {
  const cat = logCategory(key);
  const text = tmsg(key, params);
  logs[cat].unshift(text);
  if (logs[cat].length > LOG_CAP) logs[cat].length = LOG_CAP;
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
export function setLastFusion(r: FusionResult): void {
  lastFusion = r;
}
export function resetUi(): void {
  selectedEye = null;
  selectedA = null;
  selectedB = null;
  lastFusion = null;
  expandedSkill = null;
  activeTab = 'combat';
  logs.combat.length = 0;
  logs.discovery.length = 0;
  logs.loot.length = 0;
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
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) return;
  app.innerHTML = `
    <div class="game">
      <header id="topbar" class="topbar"></header>
      <nav id="sidebar" class="sidebar">
        <aside id="ministatus" class="ministatus" aria-label="status"></aside>
        ${TABS.map((tb) => `<button class="tabbtn" data-tab="${tb}">${ICONS[tb]}<span>${t(`tab.${tb}`)}</span></button>`).join('')}
      </nav>
      <main id="content" class="content"></main>
      <section class="logpanel">
        <div class="logcol"><h3>${t('ui.log_combat')}</h3><div class="log" id="log-combat"></div></div>
        <div class="logcol"><h3>${t('ui.log_discovery')}</h3><div class="log" id="log-discovery"></div></div>
        <div class="logcol"><h3>${t('ui.log_loot')}</h3><div class="log" id="log-loot"></div></div>
      </section>
      <div id="toasts" class="toasts" aria-live="polite"></div>
    </div>
  `;
  app.querySelectorAll<HTMLButtonElement>('.tabbtn').forEach((b) => {
    b.addEventListener('click', () => {
      activeTab = (b.getAttribute('data-tab') as Tab) ?? 'combat';
      renderTab();
    });
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
  ].join('|');
}

/** Per-tick light update: top bar + mini HUD (smooth bars), logs, and the active tab. */
export function live(state: GameState): void {
  CURSTATE = state;
  const top = document.querySelector<HTMLElement>('#topbar');
  if (top) {
    if (!top.firstElementChild) top.innerHTML = topbarHtml(); // build skeleton once → bars keep their elements
    updateTopbar(state);
  }
  const mini = document.querySelector<HTMLElement>('#ministatus');
  if (mini) {
    if (!mini.firstElementChild) mini.innerHTML = miniStatusHtml();
    updateMini(state);
  }
  for (const cat of ['combat', 'discovery', 'loot'] as LogCat[]) {
    const el = document.querySelector<HTMLElement>(`#log-${cat}`);
    if (el) el.innerHTML = logs[cat].map((l) => `<div>${l}</div>`).join('');
  }
  if (activeTab === 'combat' || activeTab === 'map') {
    renderTab();
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

/** One labelled bar with stable ids (`#id-v` value, `#id-f` fill) so live() can animate the width. */
function statBarSkel(id: string, label: string, color: string): string {
  return `<div class="statline"><div class="row"><span>${label}</span><span id="${id}-v"></span></div><div class="bar"><div class="bar-fill" id="${id}-f" style="width:0;background:${color}"></div></div></div>`;
}

/** Top bar SKELETON (values filled by updateTopbar so the bars keep their elements → smooth slide). */
function topbarHtml(): string {
  return `
    <div class="brand"><span class="mark">${EYE_SVG}</span>${t('app.title')}</div>
    <p class="sub" id="tb-sub"></p>
    <div class="bars">
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

function renderTab(): void {
  const el = document.querySelector<HTMLElement>('#content');
  if (!el) return;
  document.querySelectorAll<HTMLButtonElement>('.tabbtn').forEach((b) => {
    b.classList.toggle('active', b.getAttribute('data-tab') === activeTab);
  });
  switch (activeTab) {
    case 'combat':
      el.innerHTML = combatTab(CURSTATE);
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
    case 'lore':
      el.innerHTML = loreTab(CURSTATE);
      wireLore(el);
      break;
    case 'stats':
      el.innerHTML = statsTab(CURSTATE);
      wireStats(el);
      break;
    case 'settings':
      el.innerHTML = settingsTab(CURSTATE);
      wireSettings(el);
      break;
  }
}

// ---- COMBAT ----------------------------------------------------------------

function ownsSkill(state: GameState, id: string): boolean {
  return state.skills.some((s) => s.id === id);
}
/** A feature unlocks once the player has READ the deep layer (INT-gated) of a matching lore book —
 *  merely FINDING the book is not enough (deep-read book ids live in state.discoveries). */
function loreUnlocked(state: GameState, hint: string): boolean {
  return state.discoveries.some((id) => CONTENT.books.get(id)?.hints === hint);
}

/** Element → portrait frame colour (visual flavour only). */
const DMG_COLORS: Record<string, string> = {
  physical: '#989384', pierce: '#c9c4b5', fire: '#e0902f', frost: '#4f86c2', poison: '#8ab23f',
  acid: '#b6d33f', lightning: '#d2a73a', magic: '#9a7fd0', fear: '#a4506a', soul: '#c0626f',
};

/** The enemy "skin": its emoji on an element-coloured frame (bosses glow). Shown even when veiled. */
function enemyPortrait(inst: NonNullable<GameState['enemy']>): string {
  const color = DMG_COLORS[inst.damageType] ?? '#989384';
  const glow = inst.isBoss ? `box-shadow:0 0 16px ${color};` : '';
  return `<div class="eportrait${inst.isBoss ? ' boss' : ''}" style="border-color:${color};${glow}">${inst.icon ?? '❓'}</div>`;
}

function enemyView(state: GameState): string {
  const inst = state.enemy;
  if (!inst) {
    if (state.action === 'combat' && state.roomCleared) return `<p class="muted">✓ ${t('ui.room_cleared')}</p>`;
    return `<p class="muted">${state.action === 'combat' ? t('ui.no_enemy') : t(`act.${state.action}`)}</p>`;
  }
  const portrait = enemyPortrait(inst);
  const tier = appraisalTier(state);
  if (tier < 1) {
    // No "seeing eye" slotted — you see the creature's shape but never its true stats.
    const mark = inst.isBoss ? '☠ ' : '';
    return `<div class="erow">${portrait}<div><div><b>${mark}${t('ui.unknown')}</b></div><div class="muted" style="font-size:0.82rem">${t('ui.enemy_veiled')}</div>${bar(inst.hp, inst.maxHp, '#bb4140')}</div></div>`;
  }
  const baseName = tier >= 1 ? t(inst.locKey) : t('ui.unknown');
  const name = `${inst.analyzed ? '🔍 ' : ''}${inst.isBoss ? '☠ ' : ''}${baseName}`;
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
  return `<div class="erow">${portrait}<div style="flex:1">${bits.join(' · ')} ${hpText}${bar(inst.hp, inst.maxHp, '#bb4140')}${weak}</div></div>`;
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
  const riddle = CONTENT.bossRiddles.get(br.riddleId);
  if (!riddle) return '';
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
    <p>${t(riddle.locKey)}</p>
    <p class="muted" style="font-size:0.8rem">↪ ${t(riddle.locKeyClue)}</p>
    <div class="controls">
      <input id="br-input" type="text" placeholder="${t('ui.answer')}" autocomplete="off" />
      <button id="br-answer">${t('ui.solve')}</button>
    </div></section>`;
}

function combatTab(state: GameState): string {
  // An open map event takes over the dungeon view — no combat until a choice is made.
  if (state.pendingEvent) return eventPanel(state);
  // An unanswered boss riddle (no guard fighting) takes over too.
  if (state.bossRiddle && !state.enemy) return bossRiddlePanel(state);
  const resists = state.resistances
    .map((r) => {
      const def = CONTENT.resistances.get(r.id);
      const name = def ? t(def.locKey) : r.id;
      const right = r.nullified && def ? t(def.nullityKey) : `${t('ui.lv')} ${r.level} · ${Math.min(r.level * 5, 90)}%`;
      return `<li><b>${name}</b> — ${right}</li>`;
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
  const searched = state.lastSearchPos === `${state.pos.layer}.${state.pos.floor}.${state.pos.room}`;
  const searchBtn = `<button id="search"${searched ? ' disabled' : ''}>${t('ui.search')}</button>`;
  const statusLine = state.statusEffects.length
    ? `<p class="muted" style="margin:.4rem 0 0">⚠ ${t('ui.status')}: ${state.statusEffects
        .map((s) => `<b style="color:var(--ember)">${t(`dmgtype.${s.type}`)}</b> ${s.ticksLeft}s (-${s.dmgPerTick})`)
        .join(' · ')}</p>`
    : '';
  return `
    <section class="panel">
      <h2>${t('ui.enemy')}</h2>
      ${enemyView(state)}
      ${statusLine}
    </section>
    <div class="controls">
      ${act('combat', t('ui.fight'))}
      ${act('rest', t('ui.rest'))}
      ${act('idle', t('ui.stop'))}
      ${meditateBtn}
    </div>
    ${state.action === 'meditate' ? `<section class="panel">${medBarHtml(state)}</section>` : ''}
    ${advanceControls(state)}
    ${skillBar(state)}
    <div class="controls">
      ${deepBtn}
      ${searchBtn}
      ${courtBtn}
    </div>
    <section class="panel">
      <h2>${t('ui.resistances')}</h2>
      <ul>${resists}</ul>
    </section>
  `;
}

/** Manual map progression: an "Advance" button when a room is cleared + the auto-advance toggle. */
function advanceControls(state: GameState): string {
  // Manual mode farms in place; "Advance" is always available to step to the next room.
  const advBtn =
    state.action === 'combat' && !state.autoAdvance ? `<button id="advance" class="advbtn">${t('ui.advance')}</button>` : '';
  const autoBtn = `<button id="autoadvance" class="${state.autoAdvance ? 'active' : 'ghost'}">${t('ui.autoadvance')}: ${state.autoAdvance ? t('ui.on') : t('ui.off')}</button>`;
  return `<div class="controls">${advBtn}${autoBtn}</div>`;
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
      return `<button class="castbtn" data-cast="${id}"${cd > 0 ? ' disabled' : ''}>${name}${cd > 0 ? ` <span class="cd">${cd}</span>` : ''}</button>`;
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
  el.querySelector<HTMLButtonElement>('#courtdeath')?.addEventListener('click', ACTIONS.onCourtDeath);
  el.querySelectorAll<HTMLButtonElement>('.evchoice').forEach((b) =>
    b.addEventListener('click', () => ACTIONS.onChooseEvent(Number(b.dataset.evchoice))),
  );
  el.querySelector<HTMLButtonElement>('#br-answer')?.addEventListener('click', () => {
    const input = el.querySelector<HTMLInputElement>('#br-input');
    if (input && input.value.trim()) ACTIONS.onAnswerBossRiddle(input.value);
  });
  el.querySelector<HTMLButtonElement>('.br-skip')?.addEventListener('click', () => ACTIONS.onBossChoice('skip', ''));
  el.querySelectorAll<HTMLButtonElement>('.br-fight').forEach((b) =>
    b.addEventListener('click', () => ACTIONS.onBossChoice('fight', b.dataset.diff ?? 'normal')),
  );
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
      cells += `<div class="${cls}">${glyph}</div>`;
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
      <div class="row"><h2 style="margin:0">${cur ? t(cur.locKey) : t('tab.map')}</h2><span>${state.pos.layer}.${state.pos.floor}.${state.pos.room}</span></div>
      <p class="muted">${t('ui.floor')} ${state.pos.floor}/${cur ? floorsOf(state, cur) : '?'} · ${t('ui.room')} ${state.pos.room}/${curRooms || '?'}${bossSoon}</p>
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
}

// ---- SKILLS (+ fusion) -----------------------------------------------------

function fusableSkills(state: GameState) {
  // Only active-damage skills can fuse — keeps results sensible (no eye/util "banespike").
  return state.skills.filter((s) => CONTENT.skills.get(s.id)?.damage !== undefined);
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
  const sacUnlocked = state.discoveries.some((id) => CONTENT.books.has(id)); // deep-read a Sacrifice Journal (INT)
  const sacBtn = sacUnlocked
    ? `<button class="sacskill ghost" data-sac="${s.id}">${t('ui.sacrifice')}</button>`
    : `<span class="muted" style="font-size:.78rem">${t('ui.sacrifice_locked')}</span>`;
  const actions = exp
    ? `<div class="controls" style="margin:.2rem 0 .5rem 1rem"><button class="delskill ghost" data-del="${s.id}">${t('ui.delete_skill')}</button>${sacBtn}</div>`
    : '';
  const desc = exp && def ? `<div class="skilldesc">${t(def.locKeyDesc)}${dmgBit}</div>${acq}${actions}` : '';
  return `<li><span class="skillrow" data-skill="${s.id}">${exp ? '▾' : '▸'} <b>${name}</b> — ${tierTag}${t('ui.lv')} ${s.level} · ${s.exp} xp</span> ${equipBtn}${desc}</li>`;
}

function skillsTab(state: GameState): string {
  // Category sub-tabs (Kol/Bacak/Vücut/Göz) — only one group shown at a time so the list stays scannable.
  const counts: Record<string, number> = {};
  for (const p of SKILL_PARTS) counts[p] = state.skills.filter((s) => skillPart(CONTENT.skills.get(s.id)) === p).length;
  if (counts[activeSkillPart] === 0) activeSkillPart = SKILL_PARTS.find((p) => counts[p] > 0) ?? 'arm';
  const subtabs = SKILL_PARTS.map(
    (p) => `<button class="subtab${p === activeSkillPart ? ' active' : ''}" data-part="${p}">${t(`ui.part_${p}`)} <span class="muted">${counts[p]}</span></button>`,
  ).join('');
  const partItems = state.skills.filter((s) => skillPart(CONTENT.skills.get(s.id)) === activeSkillPart);
  const rows = partItems.length ? partItems.map((s) => skillRow(state, s)).join('') : `<li class="muted">${t('ui.empty')}</li>`;
  const listPanel = `<section class="panel"><div class="row"><h2 style="margin:0">${t('ui.skills')}</h2><span class="muted">${t('ui.equipped')} ${state.equipped.length}/${skillSlots(state)}</span></div><div class="subtabs">${subtabs}</div><ul>${rows}</ul></section>`;
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
  const fusionPanel = state.fusionUnlocked
    ? `
    <section class="panel">
      <h2>${t('ui.fusion')}</h2>
      <div class="controls">
        <select id="fa">${opts(selectedA)}</select>
        <select id="fb">${opts(selectedB)}</select>
        <button id="fuse">${t('ui.fuse')}</button>
      </div>
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
    <div class="skillscols">${listPanel}${fusionPanel}</div>
    ${acquireGuide}
  `;
}

function wireSkills(el: HTMLElement): void {
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
        .map((id) => CONTENT.books.get(id))
        .filter((b): b is NonNullable<typeof b> => !!b)
        .sort((a, b) => a.order - b.order)
        .map((bk) => {
          const read = state.discoveries.includes(bk.id);
          const deep = state.stats.INT >= bk.intReq;
          const tag = read ? '✓' : deep ? '★' : `INT ${bk.intReq}`;
          return `<li><button class="readbook" data-book="${bk.id}">${t('book.' + bk.id + '.title')}</button> <span class="muted">${tag}</span></li>`;
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

/** Dikey dallanan evrim ağacı: tier satırları, durum-stilli düğümler, available'da [Evrimleş]. */
function evolutionTree(state: GameState): string {
  const nodes = evolutionTreeView(state, CONTENT);
  if (!nodes.length) return '';
  const tiers = [...new Set(nodes.map((n) => n.tier))].sort((a, b) => a - b);
  const rows = tiers
    .map((tier) => {
      const cells = nodes
        .filter((n) => n.tier === tier)
        .map((n) => {
          const name = n.name ? t(n.name) : '???';
          const bonus = n.statBonus
            ? Object.entries(n.statBonus)
                .map(([k, v]) => `+${v}${k}`)
                .join(' ')
            : '';
          const skills = n.grantSkills?.length ? ` · ${n.grantSkills.length} skill` : '';
          let detail = '';
          if (n.status === 'available') {
            detail = `<div class="muted evo-d">${bonus}${skills}</div><button class="evo" data-form="${n.id}">${t('ui.evolve')}</button>`;
          } else if (n.status === 'locked') {
            detail = `<div class="muted evo-d">${t('ui.evo_locked', { lv: n.levelReq })}</div>`;
          } else if (n.status === 'missed') {
            detail = `<div class="muted evo-d">✕ ${t('ui.evo_missed')}</div>`;
          } else if (n.status === 'hidden') {
            detail = `<div class="muted evo-d">${t('ui.evo_hidden')}</div>`;
          } else if ((n.status === 'past' || n.status === 'current') && bonus) {
            detail = `<div class="muted evo-d">${bonus}${skills}</div>`;
          }
          const mark = n.status === 'current' ? '◉ ' : n.status === 'past' ? '✓ ' : '';
          return `<div class="evo-node ${n.status}"><div class="evo-name">${mark}${name}</div>${detail}</div>`;
        })
        .join('');
      return `<div class="evo-tier"><span class="evo-tlabel">T${tier}</span><div class="evo-cells">${cells}</div></div>`;
    })
    .join('');
  return `<div class="evotree">${rows}</div>`;
}

function statsTab(state: GameState): string {
  const statRows = STATS.map(
    (k) =>
      `<li><div class="row"><b>${t(`stat.${k}`)}</b><span>${state.stats[k]} ${state.statPoints > 0 ? `<button class="statadd" data-stat="${k}">+</button>` : ''}</span></div><p class="muted statdesc">${t(`stat.${k}.desc`)}</p></li>`,
  ).join('');
  const treeHtml = evolutionTree(state);
  const form = currentForm(state, CONTENT);
  return `
    <section class="panel">
      <div class="row"><span>${state.tier >= 1 ? `T${state.tier} · ` : ''}${t('ui.level')} ${state.level}/${LEVEL_CAP}</span><span>${state.level >= LEVEL_CAP ? t('ui.evolution_ready') : `${t('ui.xp')} ${state.xp}/${xpToNext(state.level)}`}</span></div>
      ${bar(state.level >= LEVEL_CAP ? 1 : state.xp, state.level >= LEVEL_CAP ? 1 : xpToNext(state.level), '#6d44d9')}
      <p class="muted">${t('ui.statpoints')}: ${state.statPoints} · ${t('ui.auto_power')}: +${Math.round((levelPower(state) - 1) * 100)}%</p>
      <ul>${statRows}</ul>
    </section>
    <section class="panel">
      <h2>${t('ui.evolution')}</h2>
      <p class="muted">${t('ui.form')}: <b>${form ? t(form.locKey) : state.formId}</b></p>
      ${treeHtml}
    </section>
    ${racePanel(state)}
    ${rulerPanel(state)}
    ${rebirthPanel(state)}
  `;
}

function racePanel(state: GameState): string {
  const currentRace = CONTENT.races.get(state.raceId);
  const raceName = currentRace ? t(currentRace.locKey) : state.raceId;
  const canChange = state.kills === 0 && state.tier === 0 && state.level === 1;
  const raceButtons = canChange
    ? [...CONTENT.races.values()]
        .map((r) => {
          const active = r.id === state.raceId;
          return `<button class="racepick${active ? ' active' : ''}" data-race="${r.id}">${t(r.locKey)}</button>`;
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
  const info = `${t('ui.rebirths')}: ${state.rebirthCount}${state.rebirthBoon > 0 ? ` · +${state.rebirthBoon} ${t('ui.boon')}` : ''}`;
  return `
    <section class="panel">
      <h2>${t('ui.rebirth')}</h2>
      <p class="muted">${info}</p>
      ${ready
        ? `<p>${t('ui.rebirth_ready')}</p><button id="rebirth">${t('ui.rebirth_do')}</button>`
        : `<p class="muted">${t('ui.rebirth_locked')}</p>`}
    </section>
  `;
}

function wireStats(el: HTMLElement): void {
  el.querySelectorAll<HTMLButtonElement>('.statadd').forEach((b) => {
    b.addEventListener('click', () => ACTIONS.onAllocStat(b.getAttribute('data-stat') as StatKey));
  });
  el.querySelectorAll<HTMLButtonElement>('.evo').forEach((b) => {
    b.addEventListener('click', () => {
      const f = b.getAttribute('data-form');
      if (f) ACTIONS.onEvolve(f);
    });
  });
  el.querySelector<HTMLButtonElement>('#rebirth')?.addEventListener('click', ACTIONS.onRebirth);
  el.querySelector<HTMLButtonElement>('#repair')?.addEventListener('click', ACTIONS.onRepairScar);
  el.querySelectorAll<HTMLButtonElement>('.racepick').forEach((b) => {
    b.addEventListener('click', () => {
      const r = b.getAttribute('data-race');
      if (r) ACTIONS.onSelectRace(r);
    });
  });
}

// ---- SETTINGS --------------------------------------------------------------

function settingsTab(state: GameState): string {
  const autosave = [5, 10, 15]
    .map((m) => `<button class="autosave${state.autosaveMin === m ? ' active' : ''}" data-min="${m}">${m}</button>`)
    .join('');
  const langs = (['tr', 'en'] as const)
    .map((l) => `<button class="lang${state.lang === l ? ' active' : ''}" data-lang="${l}">${l === 'tr' ? 'Türkçe' : 'English'}</button>`)
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
    </section>
  `;
}

function wireSettings(el: HTMLElement): void {
  el.querySelectorAll<HTMLButtonElement>('.autosave').forEach((b) => {
    b.addEventListener('click', () => ACTIONS.onSetAutosave(Number(b.getAttribute('data-min'))));
  });
  el.querySelectorAll<HTMLButtonElement>('.lang').forEach((b) => {
    b.addEventListener('click', () => ACTIONS.onSetLang(b.getAttribute('data-lang') as 'tr' | 'en'));
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
  el.querySelector<HTMLButtonElement>('#reset')?.addEventListener('click', ACTIONS.onReset);
}

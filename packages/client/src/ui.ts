import type { FusionResult, StatKey, DamageType } from '@mri/shared';
import type { Content } from './game/content';
import type { GameState } from './game/state';
import { MAX_HUNGER, LEVEL_CAP } from './game/state';
import { appraisalTier, ownedEyeAbilities, isAbilityAssigned } from './game/eyes';
import { availableEvolutions, currentForm, canEvolve, evolutionReady } from './game/evolution';
import { maxFoodSlots, refrigerated, isRotten, SPOIL_THRESHOLD } from './game/inventory';
import { xpToNext, rulerStatus } from './game/combat';
import { t, tmsg } from './i18n';

export interface UiActions {
  onSetAction: (a: 'idle' | 'combat' | 'rest') => void;
  onDeepRead: () => void;
  onBrink: () => void;
  onGoFrontier: () => void;
  onSetPos: (layer: number, floor: number) => void;
  onAllocStat: (stat: StatKey) => void;
  onEvolve: (formId: string) => void;
  onFuse: (aId: string, bId: string) => void;
  onAssignEye: (slotId: string, abilityId: string) => void;
  onCycleMode: (slotId: string) => void;
  onClearEye: (slotId: string) => void;
  onDiscardFood: (index: number) => void;
  onSetAutosave: (min: number) => void;
  onSetLang: (lang: 'tr' | 'en') => void;
  onSaveNow: () => void;
  onExportSave: () => void;
  onImportSave: () => void;
  onBugReport: () => void;
  onReset: () => void;
}

type Tab = 'combat' | 'map' | 'skills' | 'body' | 'stats' | 'settings';
const TABS: Tab[] = ['combat', 'map', 'skills', 'body', 'stats', 'settings'];
const STATS: StatKey[] = ['STR', 'VIT', 'AGI', 'INT', 'WIS', 'LUCK'];
const LOG_CAP = 80;

const svg = (inner: string) => `<svg viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
const EYE_SVG = svg('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>');
const ICONS: Record<Tab, string> = {
  combat: svg('<path d="M14 3l7 7-3 3-7-7zM4 20l6-6M3 21l2-1 1-2"/>'),
  map: svg('<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>'),
  skills: svg('<path d="M12 2v6M12 16v6M2 12h6M16 12h6M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/>'),
  body: EYE_SVG,
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
let lastFusion: FusionResult | null = null;
const logLines: string[] = [];

export function pushLog(key: string, params?: Record<string, string | number>): void {
  logLines.unshift(tmsg(key, params));
  if (logLines.length > LOG_CAP) logLines.length = LOG_CAP;
}
export function setLastFusion(r: FusionResult): void {
  lastFusion = r;
}
export function resetUi(): void {
  selectedEye = null;
  selectedA = null;
  selectedB = null;
  lastFusion = null;
  activeTab = 'combat';
}

function bar(value: number, max: number, color: string): string {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return `<div class="bar"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div>`;
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
        ${TABS.map((tb) => `<button class="tabbtn" data-tab="${tb}">${ICONS[tb]}<span>${t(`tab.${tb}`)}</span></button>`).join('')}
      </nav>
      <main id="content" class="content"></main>
      <section class="logpanel"><div class="log" id="log"></div></section>
    </div>
  `;
  app.querySelectorAll<HTMLButtonElement>('.tabbtn').forEach((b) => {
    b.addEventListener('click', () => {
      activeTab = (b.getAttribute('data-tab') as Tab) ?? 'combat';
      renderTab();
    });
  });
  const top = document.querySelector<HTMLElement>('#topbar');
  if (top) top.innerHTML = topbarShell(); // built once; values updated by refs in live()
  renderTab();
  live(state);
}

/** Per-tick light update: bars/log via refs (so bars slide smoothly, not rebuilt). */
export function live(state: GameState): void {
  CURSTATE = state;
  updateTopbar(state);
  const log = document.querySelector<HTMLElement>('#log');
  if (log) log.innerHTML = logLines.map((l) => `<div>${l}</div>`).join('');
  if (activeTab === 'combat') updateCombat(state);
}

/** Full refresh of the active tab + chrome — after an action or tab switch. */
export function render(state: GameState): void {
  CURSTATE = state;
  renderTab();
  live(state);
}

function barRow(id: string, label: string, color: string): string {
  return `<div class="statline"><div class="row"><span>${label}</span><span id="${id}-txt"></span></div><div class="bar"><div class="bar-fill" id="${id}-fill" style="background:${color}"></div></div></div>`;
}

/** The top bar structure, built once; values are filled by updateTopbar via refs. */
function topbarShell(): string {
  return `
    <div class="brand"><span class="mark">${EYE_SVG}</span>${t('app.title')}</div>
    <p class="sub" id="sub"></p>
    <div class="bars">
      ${barRow('hp', t('ui.hp'), '#6fae53')}
      ${barRow('mp', t('ui.mp'), '#4f86c2')}
      ${barRow('sp', t('ui.sp'), '#d2a73a')}
      ${barRow('hunger', t('ui.hunger'), '#6fae53')}
    </div>
  `;
}

function setBar(id: string, value: number, max: number, text: string, color?: string): void {
  const fill = document.querySelector<HTMLElement>(`#${id}-fill`);
  const txt = document.querySelector<HTMLElement>(`#${id}-txt`);
  if (fill) {
    fill.style.width = `${max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0}%`;
    if (color) fill.style.background = color;
  }
  if (txt) txt.textContent = text;
}

function updateTopbar(state: GameState): void {
  const form = currentForm(state, CONTENT);
  const layer = CONTENT.dungeon.layers.find((l) => l.id === state.pos.layer);
  const stage = hungerStage(state.hunger);
  const evo = evolutionReady(state, CONTENT) ? ` · <span class="evoready">${t('ui.evolution_ready')}</span>` : '';
  const sub = document.querySelector<HTMLElement>('#sub');
  if (sub) {
    sub.innerHTML = `${state.tier >= 1 ? `T${state.tier} · ` : ''}${t('ui.level')} ${state.level} · ${form ? t(form.locKey) : ''} · ${layer ? t(layer.locKey) : ''} ${state.pos.layer}.${state.pos.floor}.${state.pos.room} · ${t(`act.${state.action}`)}${evo}`;
  }
  setBar('hp', state.hp, state.maxHp, `${Math.round(state.hp)}/${Math.round(state.maxHp)}`);
  setBar('mp', state.mp, state.maxMp, `${Math.round(state.mp)}/${Math.round(state.maxMp)}`);
  setBar('sp', state.sp, state.maxSp, `${Math.round(state.sp)}/${Math.round(state.maxSp)}`);
  setBar('hunger', state.hunger, MAX_HUNGER, t(`hunger.${stage}`), ['#6fae53', '#d2a73a', '#e0902f', '#bb4140'][stage]);
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

/** The attacker element that is strong against `type` (i.e. the enemy's weakness). */
function weaknessOf(type: DamageType): DamageType | null {
  const sv = CONTENT.elements.strongVs;
  for (const k of Object.keys(sv) as DamageType[]) if (sv[k] === type) return k;
  return null;
}

/** Build the enemy info line + HP bar text from the current appraisal tier. */
function enemyInfoHtml(state: GameState): string {
  const inst = state.enemy;
  if (!inst) return `<p class="muted">${state.action === 'combat' ? t('ui.no_enemy') : t(`act.${state.action}`)}</p>`;
  const tier = appraisalTier(state);
  const baseName = tier >= 1 ? t(inst.locKey) : t('ui.unknown');
  const name = inst.isBoss ? `☠ ${baseName}` : baseName;
  const bits: string[] = [`<b>${name}</b>`];
  if (tier >= 2) bits.push(`[${t(`dmgtype.${inst.damageType}`)}${inst.damageType2 ? '+' + t(`dmgtype.${inst.damageType2}`) : ''}]`);
  if (tier >= 2) {
    const weak = weaknessOf(inst.damageType);
    if (weak) bits.push(`<span class="weak">⚠ ${t('ui.weak')} ${t(`dmgtype.${weak}`)}</span>`);
  }
  if (tier >= 3) bits.push(`ATK ${inst.attack}`);
  const hpText = tier >= 4 ? `${Math.round(inst.hp)}/${inst.maxHp}` : '';
  return `<div>${bits.join(' · ')} ${hpText}</div>`;
}

/** Per-tick refresh of the enemy info + HP bar via refs, so the bar slides smoothly. */
function updateCombat(state: GameState): void {
  const info = document.querySelector<HTMLElement>('#enemy-info');
  if (info) info.innerHTML = enemyInfoHtml(state);
  const fill = document.querySelector<HTMLElement>('#enemy-fill');
  if (fill) {
    const inst = state.enemy;
    const pct = inst && inst.maxHp > 0 ? Math.max(0, Math.min(100, (inst.hp / inst.maxHp) * 100)) : 0;
    fill.style.width = `${pct}%`;
  }
}

function combatTab(state: GameState): string {
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
  return `
    <section class="panel">
      <h2>${t('ui.enemy')}</h2>
      <div id="enemy-info"></div>
      <div class="bar"><div class="bar-fill" id="enemy-fill" style="background:#bb4140"></div></div>
    </section>
    <div class="controls">
      ${act('combat', t('ui.fight'))}
      ${act('rest', t('ui.rest'))}
      ${act('idle', t('ui.stop'))}
      <button id="deepread">${t('ui.deepread')}</button>
      <button id="brink" class="ghost">${t('ui.brink')}</button>
    </div>
    <section class="panel">
      <h2>${t('ui.resistances')}</h2>
      <ul>${resists}</ul>
    </section>
  `;
}

function wireCombat(el: HTMLElement): void {
  el.querySelectorAll<HTMLButtonElement>('.actbtn').forEach((b) => {
    b.addEventListener('click', () => ACTIONS.onSetAction(b.getAttribute('data-act') as 'idle' | 'combat' | 'rest'));
  });
  el.querySelector<HTMLButtonElement>('#deepread')?.addEventListener('click', ACTIONS.onDeepRead);
  el.querySelector<HTMLButtonElement>('#brink')?.addEventListener('click', ACTIONS.onBrink);
  updateCombat(CURSTATE); // fill immediately so the bar has a starting width to slide from
}

// ---- MAP -------------------------------------------------------------------

/** True if (layer, floor) has been reached and is safe to farm (at/behind the frontier). */
function floorUnlocked(state: GameState, layer: number, floor: number): boolean {
  const f = state.furthest;
  return layer < f.layer || (layer === f.layer && floor <= f.floor);
}

function mapTab(state: GameState): string {
  const cur = CONTENT.dungeon.layers.find((l) => l.id === state.pos.layer);
  const bossSoon = cur && state.pos.room >= cur.roomsPerFloor ? ` · <b style="color:var(--ember)">${t('ui.boss')}</b>` : '';
  const atFrontier =
    state.pos.layer === state.furthest.layer &&
    state.pos.floor === state.furthest.floor &&
    state.pos.room === state.furthest.room;
  const frontierCtrl = atFrontier
    ? `<p class="muted">${t('ui.at_frontier')}</p>`
    : `<button id="gofrontier">${t('ui.frontier')} → ${state.furthest.layer}.${state.furthest.floor}.${state.furthest.room}</button>`;

  const layers = CONTENT.dungeon.layers
    .map((l) => {
      const reached = l.id <= state.furthest.layer;
      if (!reached) {
        const why = state.tier >= l.tierReq ? t('ui.locked') : `${t('ui.locked')} (T${l.tierReq})`;
        return `<li><b>${t(l.locKey)}</b> <span class="muted">${why}</span></li>`;
      }
      // Farm buttons for every unlocked floor of a reached layer.
      const floors: string[] = [];
      for (let f = 1; f <= l.floors; f++) {
        if (!floorUnlocked(state, l.id, f)) break;
        const here = state.pos.layer === l.id && state.pos.floor === f;
        floors.push(
          here
            ? `<span class="floorbtn current">${f}</span>`
            : `<button class="floorbtn" data-layer="${l.id}" data-floor="${f}">${f}</button>`,
        );
      }
      return `<li><b>${t(l.locKey)}</b><div class="controls">${floors.join('')}</div></li>`;
    })
    .join('');

  return `
    <section class="panel">
      <h2>${t('tab.map')}</h2>
      <p><b>${state.pos.layer}.${state.pos.floor}.${state.pos.room}</b> — ${cur ? t(cur.locKey) : ''}</p>
      <p class="muted">${t('ui.floor')} ${state.pos.floor}/${cur?.floors ?? '?'} · ${t('ui.room')} ${state.pos.room}/${cur?.roomsPerFloor ?? '?'}${bossSoon}</p>
      ${cur ? bar(state.pos.room, cur.roomsPerFloor, '#8ab23f') : ''}
      <div class="controls">${frontierCtrl}</div>
    </section>
    <section class="panel">
      <h2>${t('ui.layers')}</h2>
      <p class="muted">${t('ui.farm')}</p>
      <ul class="floorlist">${layers}</ul>
    </section>
  `;
}

function wireMap(el: HTMLElement): void {
  el.querySelector<HTMLButtonElement>('#gofrontier')?.addEventListener('click', ACTIONS.onGoFrontier);
  el.querySelectorAll<HTMLButtonElement>('.floorbtn[data-layer]').forEach((b) => {
    b.addEventListener('click', () => {
      const layer = Number(b.getAttribute('data-layer'));
      const floor = Number(b.getAttribute('data-floor'));
      if (!Number.isNaN(layer) && !Number.isNaN(floor)) ACTIONS.onSetPos(layer, floor);
    });
  });
}

// ---- SKILLS (+ fusion) -----------------------------------------------------

function fusableSkills(state: GameState) {
  return state.skills.filter((s) => s.id !== 'larder');
}

function skillsTab(state: GameState): string {
  const skills = state.skills
    .filter((s) => CONTENT.skills.get(s.id)?.kind !== 'eye')
    .map((s) => {
      const def = CONTENT.skills.get(s.id);
      const name = def ? t(def.locKeyName) : s.id;
      const tierTag = (s.tier ?? 1) > 1 ? `<span class="muted">T${s.tier}</span> ` : '';
      return `<li><b>${name}</b> — ${tierTag}${t('ui.lv')} ${s.level} · ${s.exp} xp</li>`;
    })
    .join('');
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
  return `
    <section class="panel"><h2>${t('ui.skills')}</h2><ul>${skills}</ul></section>
    <section class="panel">
      <h2>${t('ui.fusion')}</h2>
      <div class="controls">
        <select id="fa">${opts(selectedA)}</select>
        <select id="fb">${opts(selectedB)}</select>
        <button id="fuse">${t('ui.fuse')}</button>
      </div>
      ${fz}
    </section>
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
}

// ---- BODY (eyes + larder) --------------------------------------------------

function headSvg(state: GameState): string {
  const race = CONTENT.races.get(state.raceId);
  if (!race) return '';
  const eyes = race.head.eyes
    .map((e) => {
      const a = state.eyeAssignments[e.id];
      const color = a ? (a.mode === 'active' ? '#d98324' : '#c9a227') : '#3a3a48';
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
  const cur = a ? `${t(CONTENT.skills.get(a.abilityId)?.locKeyName ?? a.abilityId)} · ${t(`eyemode.${a.mode}`)}` : t('ui.empty_eye');
  const modeBtn = a ? `<button id="mode" class="ghost">${t('ui.mode')}: ${t(`eyemode.${a.mode}`)}</button>` : '';
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
      return `<li>${name} — ${status} <button class="discard" data-idx="${i}">✕</button></li>`;
    })
    .join('') || `<span class="muted">${t('ui.empty')}</span>`;
  return `<section class="panel"><h2>${t('ui.inventory')} (${state.inventory.length}/${maxFoodSlots(state)})${refrigerated(state) ? ' ❄' : ''}</h2><ul>${items}</ul></section>`;
}

function bodyTab(state: GameState): string {
  return `<section class="panel"><h2>${t('ui.eyes')}</h2>${headSvg(state)}${eyePanel(state)}</section>${larderPanel(state)}`;
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
  el.querySelectorAll<HTMLButtonElement>('.discard').forEach((b) => {
    b.addEventListener('click', () => {
      const i = Number(b.getAttribute('data-idx'));
      if (!Number.isNaN(i)) ACTIONS.onDiscardFood(i);
    });
  });
}

// ---- STATS (+ evolution) ---------------------------------------------------

function statsTab(state: GameState): string {
  const statRows = STATS.map(
    (k) =>
      `<li><b>${t(`stat.${k}`)}</b>: ${state.stats[k]} ${state.statPoints > 0 ? `<button class="statadd" data-stat="${k}">+</button>` : ''}</li>`,
  ).join('');
  const evos = availableEvolutions(state, CONTENT);
  const evoHtml = evos.length
    ? evos
        .map(
          (f) =>
            `<div class="panel"><div class="row"><b>${t(f.locKey)}</b><span>${t('ui.lv')} ${f.levelReq}+</span></div><p class="muted">${t(`${f.locKey}.desc`)}</p><button class="evo" data-form="${f.id}"${canEvolve(state, f) ? '' : ' disabled'}>${t('ui.evolve')}</button></div>`,
        )
        .join('')
    : `<span class="muted">${t('ui.final_form')}</span>`;
  const form = currentForm(state, CONTENT);
  return `
    <section class="panel">
      <div class="row"><span>${state.tier >= 1 ? `T${state.tier} · ` : ''}${t('ui.level')} ${state.level}/${LEVEL_CAP}</span><span>${state.level >= LEVEL_CAP ? t('ui.evolution_ready') : `${t('ui.xp')} ${state.xp}/${xpToNext(state.level)}`}</span></div>
      ${bar(state.level >= LEVEL_CAP ? 1 : state.xp, state.level >= LEVEL_CAP ? 1 : xpToNext(state.level), '#6d44d9')}
      <p class="muted">${t('ui.statpoints')}: ${state.statPoints}</p>
      <ul>${statRows}</ul>
    </section>
    ${rulerPanel(state)}
    <section class="panel">
      <h2>${t('ui.evolution')}</h2>
      <p class="muted">${t('ui.form')}: <b>${form ? t(form.locKey) : state.formId}</b></p>
      ${evoHtml}
    </section>
  `;
}

function rulerPanel(state: GameState): string {
  const r = rulerStatus(state, CONTENT);
  // Hidden until the axis or meditation actually wakes up — keeps the early game clean.
  if (r.sin === 0 && r.virtue === 0 && state.medGauge === 0 && !state.zenUnlocked) return '';
  const sinTag = r.sinActive ? ` · <span class="sin">${t('ui.active')}</span>` : '';
  const virTag = r.virtueActive ? ` · <span class="virtue">${t('ui.active')}</span>` : '';
  const flags = `${r.parallelMind ? ` <span class="virtue">⟡ ${t('ui.parallel_mind')}</span>` : ''}${r.taboo ? ` <span class="sin">⛧ ${t('ui.taboo')}</span>` : ''}`;
  const medPct = Math.round((state.medGauge / CONTENT.meditation.gaugeMax) * 100);
  const medRow = state.zenUnlocked
    ? `<div class="row"><span class="virtue">☯ ${t('ui.meditation')}: ${t('ui.zen_on')}</span></div>`
    : `<div class="row"><span>☯ ${t('ui.meditation')}</span><span>${medPct}%</span></div>${bar(state.medGauge, CONTENT.meditation.gaugeMax, '#5aa9c2')}`;
  return `
    <section class="panel">
      <h2>${t('ui.axis')}</h2>
      <div class="row"><span class="sin">😈 ${t('ui.sin')} ${Math.floor(r.sin)} · ${r.sinRulers}/${r.max}${sinTag}</span></div>
      <div class="row"><span class="virtue">😇 ${t('ui.virtue')} ${Math.floor(r.virtue)} · ${r.virtueRulers}/${r.max}${virTag}</span></div>
      ${flags ? `<p class="muted">${flags}</p>` : ''}
      ${medRow}
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
}

// ---- SETTINGS --------------------------------------------------------------

function settingsTab(state: GameState): string {
  const autosave = [5, 10, 15]
    .map((m) => `<button class="autosave${state.autosaveMin === m ? ' active' : ''}" data-min="${m}">${m}</button>`)
    .join('');
  const langs = (['tr', 'en'] as const)
    .map((l) => `<button class="lang${state.lang === l ? ' active' : ''}" data-lang="${l}">${l === 'tr' ? 'Türkçe' : 'English'}</button>`)
    .join('');
  return `
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
  el.querySelector<HTMLButtonElement>('#savenow')?.addEventListener('click', ACTIONS.onSaveNow);
  el.querySelector<HTMLButtonElement>('#exportsave')?.addEventListener('click', ACTIONS.onExportSave);
  el.querySelector<HTMLButtonElement>('#importsave')?.addEventListener('click', ACTIONS.onImportSave);
  el.querySelector<HTMLButtonElement>('#bugreport')?.addEventListener('click', ACTIONS.onBugReport);
  el.querySelector<HTMLButtonElement>('#reset')?.addEventListener('click', ACTIONS.onReset);
}

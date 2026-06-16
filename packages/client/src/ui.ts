import type { FusionResult, StatKey } from '@mri/shared';
import type { Content } from './game/content';
import type { GameState } from './game/state';
import { MAX_HUNGER } from './game/state';
import { appraisalTier, ownedEyeAbilities, isAbilityAssigned } from './game/eyes';
import { availableEvolutions, currentForm, canEvolve, evolutionReady } from './game/evolution';
import { maxFoodSlots, refrigerated, isRotten, SPOIL_THRESHOLD } from './game/inventory';
import { xpToNext } from './game/combat';
import { t, tmsg } from './i18n';

export interface UiActions {
  onSetAction: (a: 'idle' | 'combat' | 'rest') => void;
  onDeepRead: () => void;
  onSelectZone: (zoneId: string) => void;
  onAllocStat: (stat: StatKey) => void;
  onEvolve: (formId: string) => void;
  onFuse: (aId: string, bId: string) => void;
  onAssignEye: (slotId: string, abilityId: string) => void;
  onCycleMode: (slotId: string) => void;
  onClearEye: (slotId: string) => void;
  onDiscardFood: (index: number) => void;
  onSetAutosave: (min: number) => void;
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
function statBar(label: string, v: number, max: number, color: string): string {
  return `<div class="statline"><div class="row"><span>${label}</span><span>${Math.round(v)}/${Math.round(max)}</span></div>${bar(v, max, color)}</div>`;
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
  renderTab();
  live(state);
}

/** Per-tick light update: top bar, log, and the combat tab (no inputs to lose there). */
export function live(state: GameState): void {
  CURSTATE = state;
  const top = document.querySelector<HTMLElement>('#topbar');
  if (top) top.innerHTML = topbarHtml(state);
  const log = document.querySelector<HTMLElement>('#log');
  if (log) log.innerHTML = logLines.map((l) => `<div>${l}</div>`).join('');
  if (activeTab === 'combat') renderTab();
}

/** Full refresh of the active tab + chrome — after an action or tab switch. */
export function render(state: GameState): void {
  CURSTATE = state;
  renderTab();
  live(state);
}

function topbarHtml(state: GameState): string {
  const form = currentForm(state, CONTENT);
  const zone = CONTENT.zones.get(state.zoneId);
  const evo = evolutionReady(state, CONTENT) ? ` · <span class="evoready">${t('ui.evolution_ready')}</span>` : '';
  const stage = hungerStage(state.hunger);
  return `
    <div class="brand"><span class="mark">${EYE_SVG}</span>${t('app.title')}</div>
    <p class="sub">${t('ui.level')} ${state.level} · ${form ? t(form.locKey) : ''} · ${zone ? t(zone.locKey) : ''} · ${t(`act.${state.action}`)}${evo}</p>
    <div class="bars">
      ${statBar(t('ui.hp'), state.hp, state.maxHp, '#6fae53')}
      ${statBar(t('ui.mp'), state.mp, state.maxMp, '#4f86c2')}
      ${statBar(t('ui.sp'), state.sp, state.maxSp, '#d2a73a')}
      <div class="statline"><div class="row"><span>${t('ui.hunger')}</span><span>${t(`hunger.${stage}`)}</span></div>${bar(state.hunger, MAX_HUNGER, ['#6fae53', '#d2a73a', '#e0902f', '#bb4140'][stage])}</div>
    </div>
  `;
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

function enemyView(state: GameState): string {
  const inst = state.enemy;
  if (!inst) return `<p class="muted">${state.action === 'combat' ? t('ui.no_enemy') : t(`act.${state.action}`)}</p>`;
  const def = CONTENT.enemies.get(inst.id);
  const tier = appraisalTier(state);
  const name = tier >= 1 && def ? t(def.locKey) : t('ui.unknown');
  const bits: string[] = [`<b>${name}</b>`];
  if (def) {
    if (tier >= 2) bits.push(`[${t(`dmgtype.${def.damageType}`)}${def.damageType2 ? '+' + t(`dmgtype.${def.damageType2}`) : ''}]`);
    if (tier >= 3) bits.push(`ATK ${def.attack}`);
  }
  const hpText = tier >= 4 ? `${inst.hp}/${inst.maxHp}` : '';
  return `<div>${bits.join(' · ')} ${hpText}</div>${bar(inst.hp, inst.maxHp, '#bb4140')}`;
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
      ${enemyView(state)}
    </section>
    <div class="controls">
      ${act('combat', t('ui.fight'))}
      ${act('rest', t('ui.rest'))}
      ${act('idle', t('ui.stop'))}
      <button id="deepread">${t('ui.deepread')}</button>
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
}

// ---- MAP -------------------------------------------------------------------

function mapTab(state: GameState): string {
  const zones = [...CONTENT.zones.values()]
    .map((z) => {
      const req = z.levelReq ?? 1;
      const locked = state.level < req;
      const current = state.zoneId === z.id;
      const btn = locked
        ? `<span class="muted">${t('ui.locked')} (${t('ui.lv')} ${req})</span>`
        : current
          ? `<span class="muted">${t('ui.current')}</span>`
          : `<button class="zonebtn" data-zone="${z.id}">${t('ui.enter')}</button>`;
      return `<li><b>${t(z.locKey)}</b> — ${t('ui.lv')} ${req}+ ${btn}</li>`;
    })
    .join('');
  return `<section class="panel"><h2>${t('tab.map')}</h2><ul>${zones}</ul></section>`;
}

function wireMap(el: HTMLElement): void {
  el.querySelectorAll<HTMLButtonElement>('.zonebtn').forEach((b) => {
    b.addEventListener('click', () => {
      const z = b.getAttribute('data-zone');
      if (z) ACTIONS.onSelectZone(z);
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
      return `<li><b>${name}</b> — ${t('ui.lv')} ${s.level} · ${s.exp} xp</li>`;
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
    ? `<p><b>${t(lastFusion.locKeyName)}</b> · ${t(`fusion.${lastFusion.cls}`)} · ${lastFusion.magnitude}</p><p class="muted">${t(`${lastFusion.locKeyName}.desc`)}</p>`
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
            `<button class="evo" data-form="${f.id}"${canEvolve(state, f) ? '' : ' disabled'}>${t(f.locKey)} · ${t('ui.lv')} ${f.levelReq}</button>`,
        )
        .join('')
    : `<span class="muted">${t('ui.final_form')}</span>`;
  const form = currentForm(state, CONTENT);
  return `
    <section class="panel">
      <div class="row"><span>${t('ui.level')} ${state.level}</span><span>${t('ui.xp')} ${state.xp}/${xpToNext(state.level)}</span></div>
      ${bar(state.xp, xpToNext(state.level), '#6d44d9')}
      <p class="muted">${t('ui.statpoints')}: ${state.statPoints}</p>
      <ul>${statRows}</ul>
    </section>
    <section class="panel">
      <h2>${t('ui.evolution')}</h2>
      <p class="muted">${t('ui.form')}: <b>${form ? t(form.locKey) : state.formId}</b></p>
      <div class="controls">${evoHtml}</div>
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
  return `
    <section class="panel">
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
  el.querySelector<HTMLButtonElement>('#savenow')?.addEventListener('click', ACTIONS.onSaveNow);
  el.querySelector<HTMLButtonElement>('#exportsave')?.addEventListener('click', ACTIONS.onExportSave);
  el.querySelector<HTMLButtonElement>('#importsave')?.addEventListener('click', ACTIONS.onImportSave);
  el.querySelector<HTMLButtonElement>('#bugreport')?.addEventListener('click', ACTIONS.onBugReport);
  el.querySelector<HTMLButtonElement>('#reset')?.addEventListener('click', ACTIONS.onReset);
}

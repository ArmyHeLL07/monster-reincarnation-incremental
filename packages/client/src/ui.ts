import type { FusionResult } from '@mri/shared';
import type { Content } from './game/content';
import type { GameState } from './game/state';
import { MAX_HUNGER } from './game/state';
import { appraisalTier, ownedEyeAbilities, isAbilityAssigned } from './game/eyes';
import { availableEvolutions, currentForm, canEvolve } from './game/evolution';
import { t, tmsg } from './i18n';

export interface UiActions {
  lastFusion: FusionResult | null;
  onToggleCombat: () => void;
  onAttack: () => void;
  onDeepRead: () => void;
  onTrain: () => void;
  onReset: () => void;
  onFuse: (aId: string, bId: string) => void;
  onExportOutbox: () => void;
  onSelectEye: (slotId: string) => void;
  onAssignEye: (slotId: string, abilityId: string) => void;
  onCycleMode: (slotId: string) => void;
  onClearEye: (slotId: string) => void;
  onEvolve: (formId: string) => void;
}

const LOG_CAP = 60;
const logLines: string[] = [];
let selectedA: string | null = null;
let selectedB: string | null = null;
let selectedEye: string | null = null;

export function pushLog(key: string, params?: Record<string, string | number>): void {
  logLines.unshift(tmsg(key, params));
  if (logLines.length > LOG_CAP) logLines.length = LOG_CAP;
}

export function setSelectedEye(id: string | null): void {
  selectedEye = id;
}

function bar(value: number, max: number, color: string): string {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return `<div class="bar"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div>`;
}

function statRow(label: string, value: number, max: number, color: string): string {
  return `<div class="row"><span>${label}</span><span>${Math.round(value)}/${Math.round(max)}</span></div>${bar(value, max, color)}`;
}

function hungerStage(hunger: number): number {
  if (hunger < 50) return 0;
  if (hunger < 75) return 1;
  if (hunger < 90) return 2;
  return 3;
}

function enemyView(state: GameState, content: Content): string {
  const inst = state.enemy;
  if (!inst) return `<p class="muted">${t('ui.no_enemy')}</p>`;
  const def = content.enemies.get(inst.id);
  const tier = appraisalTier(state);
  const name = tier >= 1 && def ? t(def.locKey) : t('ui.unknown');
  const bits: string[] = [`<b>${name}</b>`];
  if (def) {
    if (tier >= 2) bits.push(`[${t(`dmgtype.${def.damageType}`)}]`);
    if (tier >= 3) bits.push(`ATK ${def.attack}`);
  }
  const hpText = tier >= 4 ? `${inst.hp}/${inst.maxHp}` : '';
  return `<div>${bits.join(' · ')} ${hpText}</div>${bar(inst.hp, inst.maxHp, '#c0444f')}`;
}

function headView(state: GameState, content: Content): string {
  const race = content.races.get(state.raceId);
  if (!race) return '';
  const eyes = race.head.eyes
    .map((e) => {
      const a = state.eyeAssignments[e.id];
      const color = a ? (a.mode === 'active' ? '#d98324' : '#c9a227') : '#3a3a48';
      const ring =
        selectedEye === e.id
          ? `<circle cx="${e.x}" cy="${e.y}" r="${e.r + 5}" fill="none" stroke="#fff" stroke-width="2"/>`
          : '';
      return `<g class="eye" data-eye="${e.id}" style="cursor:pointer">
        <circle cx="${e.x}" cy="${e.y}" r="${e.r + 10}" fill="transparent"/>
        <circle cx="${e.x}" cy="${e.y}" r="${e.r}" fill="${color}" stroke="#15151c" stroke-width="2"/>
        ${ring}
      </g>`;
    })
    .join('');
  return `<svg viewBox="${race.head.viewBox}" class="head" role="img">${race.head.silhouette}${eyes}</svg>`;
}

function eyePanel(state: GameState, content: Content): string {
  if (!selectedEye) return `<p class="muted">${t('ui.tap_eye')}</p>`;
  const a = state.eyeAssignments[selectedEye];
  const owned = ownedEyeAbilities(state, content);
  const abilBtns = owned
    .map((s) => {
      const def = content.skills.get(s.id);
      const name = def ? t(def.locKeyName) : s.id;
      const here = a?.abilityId === s.id;
      const elsewhere = !here && isAbilityAssigned(state, s.id);
      return `<button class="ability${here ? ' on' : ''}" data-ability="${s.id}">${name}${elsewhere ? ' ⟳' : ''}</button>`;
    })
    .join('');
  const cur = a
    ? `${t(content.skills.get(a.abilityId)?.locKeyName ?? a.abilityId)} · ${t(`eyemode.${a.mode}`)}`
    : t('ui.empty_eye');
  const modeBtn = a ? `<button id="mode" class="ghost">${t('ui.mode')}: ${t(`eyemode.${a.mode}`)}</button>` : '';
  const clearBtn = a ? `<button id="cleareye" class="ghost">${t('ui.clear')}</button>` : '';
  return `
    <div class="row"><span><b>${t('ui.eye')} ${selectedEye}</b></span><span>${cur}</span></div>
    <div class="controls">${abilBtns || `<span class="muted">${t('ui.no_eye_abilities')}</span>`}</div>
    <div class="controls">${modeBtn}${clearBtn}</div>
  `;
}

function fusionName(r: FusionResult, content: Content): string {
  if (r.locKeyName === 'fusion.temp') {
    const a = content.skills.get(r.aId)?.locKeyName ?? r.aId;
    const b = content.skills.get(r.bId)?.locKeyName ?? r.bId;
    return tmsg('fusion.temp', { a, b });
  }
  return t(r.locKeyName);
}

function skillOptions(state: GameState, content: Content, selected: string | null): string {
  return state.skills
    .map((s) => {
      const def = content.skills.get(s.id);
      const name = def ? t(def.locKeyName) : s.id;
      return `<option value="${s.id}"${s.id === selected ? ' selected' : ''}>${name}</option>`;
    })
    .join('');
}

export function render(state: GameState, content: Content, actions: UiActions): void {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) return;

  if (!selectedA && state.skills[0]) selectedA = state.skills[0].id;
  if (!selectedB && state.skills[1]) selectedB = state.skills[1].id;

  const zone = content.zones.get(state.zoneId);
  const zoneName = zone ? t(zone.locKey) : state.zoneId;
  const form = currentForm(state, content);
  const formName = form ? t(form.locKey) : state.formId;
  const evos = availableEvolutions(state, content);
  const evoBtns = evos.length
    ? evos
        .map(
          (f) =>
            `<button class="evo" data-form="${f.id}"${canEvolve(state, f) ? '' : ' disabled'}>${t(f.locKey)} · ${f.epCost} EP</button>`,
        )
        .join('')
    : `<span class="muted">${t('ui.final_form')}</span>`;
  const stage = hungerStage(state.hunger);
  const hungerColor = ['#3fa34d', '#c9a227', '#d98324', '#c0444f'][stage];

  const nonEye = state.skills.filter((s) => content.skills.get(s.id)?.kind !== 'eye');
  const skills = nonEye
    .map((s) => {
      const def = content.skills.get(s.id);
      const name = def ? t(def.locKeyName) : s.id;
      return `<li><b>${name}</b> — ${t('ui.lv')} ${s.level} · ${s.exp} xp</li>`;
    })
    .join('');

  const resists = state.resistances
    .map((r) => {
      const def = content.resistances.get(r.id);
      const name = def ? t(def.locKey) : r.id;
      const right =
        r.nullified && def ? t(def.nullityKey) : `${t('ui.lv')} ${r.level} · ${Math.min(r.level * 5, 90)}%`;
      return `<li><b>${name}</b> — ${right}</li>`;
    })
    .join('');

  const log = logLines.map((l) => `<div>${l}</div>`).join('');
  const fz = actions.lastFusion
    ? `<p><b>${fusionName(actions.lastFusion, content)}</b> · ${t(`fusion.${actions.lastFusion.cls}`)} · ${actions.lastFusion.magnitude}</p>`
    : '';
  const transfer = state.mpTransferUnlocked ? `<p class="muted">${t('ui.mp_transfer_on')}</p>` : '';

  app.innerHTML = `
    <h1>${t('app.title')}</h1>
    <p class="muted">${t('ui.form')}: ${formName} · ${t('ui.zone')}: ${zoneName} · ${t('ui.ep')}: ${state.ep}</p>

    <section class="panel">
      ${statRow(t('ui.hp'), state.hp, state.maxHp, '#3fa34d')}
      ${statRow(t('ui.mp'), state.mp, state.maxMp, '#3f6fa3')}
      ${statRow(t('ui.sp'), state.sp, state.maxSp, '#c9a227')}
      <div class="row"><span>${t('ui.hunger')}</span><span>${t(`hunger.${stage}`)}</span></div>
      ${bar(state.hunger, MAX_HUNGER, hungerColor)}
      ${transfer}
    </section>

    <section class="panel">
      <h2>${t('ui.enemy')}</h2>
      ${enemyView(state, content)}
    </section>

    <div class="controls">
      <button id="combat">${state.combatActive ? t('ui.rest') : t('ui.engage')}</button>
      <button id="attack">${t('ui.attack')}</button>
      <button id="deepread">${t('ui.deepread')}</button>
    </div>
    <div class="controls">
      <button id="train" class="ghost">${t('ui.train')}</button>
      <button id="reset" class="ghost">${t('ui.reset')}</button>
    </div>

    <details open class="panel">
      <summary>${t('ui.evolution')}</summary>
      <p class="muted">${t('ui.form')}: <b>${formName}</b></p>
      <div class="controls">${evoBtns}</div>
    </details>

    <details open class="panel">
      <summary>${t('ui.eyes')}</summary>
      ${headView(state, content)}
      ${eyePanel(state, content)}
    </details>

    <details class="panel">
      <summary>${t('ui.skills')}</summary>
      <ul>${skills}</ul>
    </details>

    <details class="panel">
      <summary>${t('ui.resistances')}</summary>
      <ul>${resists}</ul>
    </details>

    <details class="panel">
      <summary>${t('ui.fusion')}</summary>
      <div class="controls">
        <select id="fa">${skillOptions(state, content, selectedA)}</select>
        <select id="fb">${skillOptions(state, content, selectedB)}</select>
        <button id="fuse">${t('ui.fuse')}</button>
      </div>
      ${fz}
    </details>

    <details class="panel">
      <summary>${t('ui.telemetry')} (${state.outbox.length})</summary>
      <button id="export" class="ghost">${t('ui.export')}</button>
    </details>

    <details open class="panel">
      <summary>${t('ui.log')}</summary>
      <div class="log">${log}</div>
    </details>
  `;

  const click = (id: string, fn: () => void) =>
    app.querySelector<HTMLButtonElement>(`#${id}`)?.addEventListener('click', fn);

  click('combat', actions.onToggleCombat);
  click('attack', actions.onAttack);
  click('deepread', actions.onDeepRead);
  click('train', actions.onTrain);
  click('reset', actions.onReset);
  click('export', actions.onExportOutbox);
  click('fuse', () => {
    if (selectedA && selectedB) actions.onFuse(selectedA, selectedB);
  });
  if (selectedEye) {
    click('mode', () => actions.onCycleMode(selectedEye as string));
    click('cleareye', () => actions.onClearEye(selectedEye as string));
  }

  app.querySelector<HTMLSelectElement>('#fa')?.addEventListener('change', (e) => {
    selectedA = (e.target as HTMLSelectElement).value;
  });
  app.querySelector<HTMLSelectElement>('#fb')?.addEventListener('change', (e) => {
    selectedB = (e.target as HTMLSelectElement).value;
  });
  app.querySelectorAll<SVGGElement>('.eye').forEach((g) => {
    g.addEventListener('click', () => {
      const id = g.getAttribute('data-eye');
      if (id) actions.onSelectEye(id);
    });
  });
  app.querySelectorAll<HTMLButtonElement>('.ability').forEach((b) => {
    b.addEventListener('click', () => {
      const id = b.getAttribute('data-ability');
      if (id && selectedEye) actions.onAssignEye(selectedEye, id);
    });
  });
  app.querySelectorAll<HTMLButtonElement>('.evo').forEach((b) => {
    b.addEventListener('click', () => {
      const id = b.getAttribute('data-form');
      if (id) actions.onEvolve(id);
    });
  });
}

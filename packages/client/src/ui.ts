import type { FusionResult } from '@mri/shared';
import type { Content } from './game/content';
import type { GameState } from './game/state';
import { MAX_HUNGER } from './game/state';
import { t, tmsg } from './i18n';

export interface UiActions {
  onToggleCombat: () => void;
  onAttack: () => void;
  onDeepRead: () => void;
  onTrain: () => void;
  onReset: () => void;
  onFuse: (aId: string, bId: string) => void;
  onExportOutbox: () => void;
  lastFusion: FusionResult | null;
}

const LOG_CAP = 60;
const logLines: string[] = [];
let selectedA: string | null = null;
let selectedB: string | null = null;

export function pushLog(key: string, params?: Record<string, string | number>): void {
  logLines.unshift(tmsg(key, params));
  if (logLines.length > LOG_CAP) logLines.length = LOG_CAP;
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

function eyeTier(state: GameState): number {
  for (const slot of state.skills) {
    if (slot.id === 'appraisal') return slot.level;
    if (slot.id === 'insight') return slot.level + 10;
  }
  return 0;
}

function enemyView(state: GameState, content: Content): string {
  const inst = state.enemy;
  if (!inst) return `<p class="muted">${t('ui.no_enemy')}</p>`;
  const def = content.enemies.get(inst.id);
  const tier = eyeTier(state);
  const name = tier >= 1 && def ? t(def.locKey) : t('ui.unknown');
  const bits: string[] = [`<b>${name}</b>`];
  if (def) {
    if (tier >= 2) bits.push(`[${t(`dmgtype.${def.damageType}`)}]`);
    if (tier >= 3) bits.push(`ATK ${def.attack}`);
  }
  const hpText = tier >= 4 ? `${inst.hp}/${inst.maxHp}` : '';
  return `<div>${bits.join(' · ')} ${hpText}</div>${bar(inst.hp, inst.maxHp, '#c0444f')}`;
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
  const stage = hungerStage(state.hunger);
  const hungerColor = ['#3fa34d', '#c9a227', '#d98324', '#c0444f'][stage];

  const skills = state.skills
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
  const opts = skillOptions(state, content, selectedA);
  const optsB = skillOptions(state, content, selectedB);
  const fz = actions.lastFusion
    ? `<p><b>${fusionName(actions.lastFusion, content)}</b> · ${t(`fusion.${actions.lastFusion.cls}`)} · ${actions.lastFusion.magnitude}</p>`
    : '';
  const transfer = state.mpTransferUnlocked ? `<p class="muted">${t('ui.mp_transfer_on')}</p>` : '';

  app.innerHTML = `
    <h1>${t('app.title')}</h1>
    <p class="muted">${t('ui.zone')}: ${zoneName} · ${t('ui.ep')}: ${state.ep}</p>

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
        <select id="fa">${opts}</select>
        <select id="fb">${optsB}</select>
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

  app.querySelector<HTMLButtonElement>('#combat')?.addEventListener('click', actions.onToggleCombat);
  app.querySelector<HTMLButtonElement>('#attack')?.addEventListener('click', actions.onAttack);
  app.querySelector<HTMLButtonElement>('#deepread')?.addEventListener('click', actions.onDeepRead);
  app.querySelector<HTMLButtonElement>('#train')?.addEventListener('click', actions.onTrain);
  app.querySelector<HTMLButtonElement>('#reset')?.addEventListener('click', actions.onReset);
  app.querySelector<HTMLButtonElement>('#export')?.addEventListener('click', actions.onExportOutbox);
  app.querySelector<HTMLSelectElement>('#fa')?.addEventListener('change', (e) => {
    selectedA = (e.target as HTMLSelectElement).value;
  });
  app.querySelector<HTMLSelectElement>('#fb')?.addEventListener('change', (e) => {
    selectedB = (e.target as HTMLSelectElement).value;
  });
  app.querySelector<HTMLButtonElement>('#fuse')?.addEventListener('click', () => {
    if (selectedA && selectedB) actions.onFuse(selectedA, selectedB);
  });
}

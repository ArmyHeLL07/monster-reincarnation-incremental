import type { Content } from './game/content';
import type { GameState } from './game/state';
import { t, tmsg } from './i18n';

export interface UiActions {
  autoRunning: boolean;
  onToggleAuto: () => void;
  onAttack: () => void;
  onReset: () => void;
}

const LOG_CAP = 60;
const logLines: string[] = [];

export function pushLog(key: string, params?: Record<string, string | number>): void {
  logLines.unshift(tmsg(key, params));
  if (logLines.length > LOG_CAP) logLines.length = LOG_CAP;
}

function bar(value: number, max: number, color: string): string {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return `<div class="bar"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div>`;
}

/** Appraisal "knowledge" tier — gates how much enemy info is shown (GDD §5.0.7). */
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

export function render(state: GameState, content: Content, actions: UiActions): void {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) return;

  const zone = content.zones.get(state.zoneId);
  const zoneName = zone ? t(zone.locKey) : state.zoneId;

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
        r.nullified && def
          ? t(def.nullityKey)
          : `${t('ui.lv')} ${r.level} · ${Math.min(r.level * 5, 90)}%`;
      return `<li><b>${name}</b> — ${right}</li>`;
    })
    .join('');

  const log = logLines.map((l) => `<div>${l}</div>`).join('');

  app.innerHTML = `
    <h1>${t('app.title')}</h1>
    <p class="muted">${t('ui.zone')}: ${zoneName} · ${t('ui.ep')}: ${state.ep}</p>

    <section class="panel">
      <div class="row"><span>${t('ui.hp')}</span><span>${state.hp}/${state.maxHp}</span></div>
      ${bar(state.hp, state.maxHp, '#3fa34d')}
    </section>

    <section class="panel">
      <h2>${t('ui.enemy')}</h2>
      ${enemyView(state, content)}
    </section>

    <div class="controls">
      <button id="auto">${actions.autoRunning ? t('ui.stop_auto') : t('ui.start_auto')}</button>
      <button id="attack">${t('ui.attack')}</button>
      <button id="reset" class="ghost">${t('ui.reset')}</button>
    </div>

    <section class="panel">
      <h2>${t('ui.skills')}</h2>
      <ul>${skills}</ul>
    </section>

    <section class="panel">
      <h2>${t('ui.resistances')}</h2>
      <ul>${resists}</ul>
    </section>

    <section class="panel">
      <h2>${t('ui.log')}</h2>
      <div class="log">${log}</div>
    </section>
  `;

  app.querySelector<HTMLButtonElement>('#auto')?.addEventListener('click', actions.onToggleAuto);
  app.querySelector<HTMLButtonElement>('#attack')?.addEventListener('click', actions.onAttack);
  app.querySelector<HTMLButtonElement>('#reset')?.addEventListener('click', actions.onReset);
}

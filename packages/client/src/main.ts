import { comboKey, fnv1a, type Skill } from '@mri/shared';

// --- minimal localization (data-driven, no hardcoded language) ---
type Dict = Record<string, string>;
let dict: Dict = {};

function t(key: string, params: Record<string, string | number> = {}): string {
  let s = dict[key] ?? key;
  for (const [k, v] of Object.entries(params)) s = s.replace(`{${k}}`, String(v));
  return s;
}

// --- deterministic fusion (instant, offline, Marvion-less) ---
const FUSION_CLASSES = ['synergy', 'quirk', 'backfire'] as const;

function resolveFusion(a: Skill, b: Skill) {
  const key = comboKey(a.id, b.id);
  const h = fnv1a(key);
  const cls = FUSION_CLASSES[h % FUSION_CLASSES.length];
  const magnitude = 5 + (h % 20);
  // A known combo gets a curated label; unknown combos fall back to a temporary tag.
  const nameKey = key === comboKey('venom_bite', 'silk_thread') ? 'fusion.poison_web' : key;
  return { key, cls, magnitude, name: t(nameKey) };
}

async function init(): Promise<void> {
  const lang = navigator.language.startsWith('tr') ? 'tr' : 'en';
  dict = await fetch(`/i18n/${lang}.json`).then((r) => r.json());
  const skills: Skill[] = await fetch('/skills.sample.json').then((r) => r.json());

  document.title = t('app.title');
  const app = document.querySelector<HTMLDivElement>('#app')!;
  app.innerHTML = `
    <h1>${t('app.title')}</h1>
    <h2>${t('ui.skills')}</h2>
    <ul>
      ${skills.map((s) => `<li><b>${t(s.locKeyName)}</b> — ${t(s.locKeyDesc)}</li>`).join('')}
    </ul>
    <button id="fuse">${t('ui.fuse')}</button>
    <p id="out"></p>
  `;

  const a = skills.find((s) => s.id === 'venom_bite')!;
  const b = skills.find((s) => s.id === 'silk_thread')!;
  document.querySelector<HTMLButtonElement>('#fuse')!.addEventListener('click', () => {
    const r = resolveFusion(a, b);
    document.querySelector<HTMLParagraphElement>('#out')!.textContent = t('fusion.result', {
      name: r.name,
      cls: t(`fusion.${r.cls}`),
      mag: r.magnitude,
    });
  });
}

void init();

import type { GameState } from './game/state';

export interface TutorialStep {
  id: string;
  /** i18n key prefix — {prefix}.title ve {prefix}.body olarak okunur */
  i18nPrefix: string;
  /** Hedef sekme; wizard 'Götür' butonuna tıklanınca bu sekme açılır */
  targetTab: string | null;
  /** DOM selector — sekme açıldıktan sonra scroll/highlight edilecek element */
  targetSelector: string | null;
}

export interface HintDef {
  id: string;
  i18nPrefix: string;
  targetTab: string | null;
  /** Kılavuz sekmesi anchor'ı — hint toast'taki 'Götür' linki buraya gider */
  guideAnchor: string;
  /** Bu fonksiyon true döndürdüğünde hint tetiklenir */
  trigger: (state: GameState) => boolean;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  { id: 'welcome',   i18nPrefix: 'tut.step1', targetTab: null,     targetSelector: null },
  { id: 'bars',      i18nPrefix: 'tut.step2', targetTab: null,     targetSelector: '#topbar' },
  { id: 'combat',    i18nPrefix: 'tut.step3', targetTab: 'combat', targetSelector: null },
  { id: 'skills',    i18nPrefix: 'tut.step4', targetTab: 'skills', targetSelector: null },
  { id: 'map',       i18nPrefix: 'tut.step5', targetTab: 'map',    targetSelector: null },
  { id: 'hunger',    i18nPrefix: 'tut.step6', targetTab: null,     targetSelector: '#tb-hunger-f' },
  { id: 'stats',     i18nPrefix: 'tut.step7', targetTab: 'stats',  targetSelector: null },
  { id: 'evolution', i18nPrefix: 'tut.step8', targetTab: 'stats',  targetSelector: '.evo-tree' },
];

export const HINT_DEFS: HintDef[] = [
  {
    id: 'skill_levelup',
    i18nPrefix: 'hint.skill_levelup',
    targetTab: 'skills',
    guideAnchor: 'guide-skills',
    trigger: (s) => s.skills.some((sk) => sk.level >= 2),
  },
  {
    id: 'evo_available',
    i18nPrefix: 'hint.evo_available',
    targetTab: 'stats',
    guideAnchor: 'guide-skills',
    trigger: (s) => s.seenForms.length > 0 || s.formHistory.length > 1,
  },
  {
    id: 'stat_point',
    i18nPrefix: 'hint.stat_point',
    targetTab: 'stats',
    guideAnchor: 'guide-stats',
    trigger: (s) => s.statPoints > 0,
  },
  {
    id: 'fusion_unlock',
    i18nPrefix: 'hint.fusion_unlock',
    targetTab: 'skills',
    guideAnchor: 'guide-fusion',
    trigger: (s) => s.fusionUnlocked,
  },
  {
    id: 'meditation_unlock',
    i18nPrefix: 'hint.meditation_unlock',
    targetTab: 'stats',
    guideAnchor: 'guide-soul',
    trigger: (s) => s.meditationUnlocked,
  },
  {
    id: 'soul_tree',
    i18nPrefix: 'hint.soul_tree',
    targetTab: 'stats',
    guideAnchor: 'guide-soul',
    trigger: (s) => s.souls > 0,
  },
  {
    id: 'human_path',
    i18nPrefix: 'hint.human_path',
    targetTab: 'stats',
    guideAnchor: 'guide-human_path',
    trigger: (s) => s.pendingHumanPath || s.humanPath !== undefined,
  },
  {
    id: 'first_item',
    i18nPrefix: 'hint.first_item',
    targetTab: 'inventory',
    guideAnchor: 'guide-inventory',
    trigger: (s) => s.inventoryItems.length > 0,
  },
  {
    id: 'first_bestiary',
    i18nPrefix: 'hint.first_bestiary',
    targetTab: 'bestiary',
    guideAnchor: 'guide-lore',
    trigger: (s) => Object.keys(s.killedEnemies).length > 0,
  },
  {
    id: 'hunger_warning',
    i18nPrefix: 'hint.hunger_warning',
    targetTab: null,
    guideAnchor: 'guide-hunger',
    trigger: (s) => s.hunger > 0 && s.hunger / 100 > 0.7,
  },
];

/** Hint gösterilmeli mi? seenHints'e bakılır + trigger koşulu kontrol edilir. */
export function shouldShowHint(id: string, state: GameState): boolean {
  if (state.seenHints.includes(id)) return false;
  const def = HINT_DEFS.find((h) => h.id === id);
  return def ? def.trigger(state) : false;
}

/** Hint'i gösterildi olarak işaretle (state'e yazar, save çağırmaz). */
export function markHintSeen(id: string, state: GameState): void {
  if (!state.seenHints.includes(id)) state.seenHints.push(id);
}

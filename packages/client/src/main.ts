import { loadI18n } from './i18n';
import { loadContent } from './game/content';
import { GameClock } from './game/clock';
import { newGame, type LogEvent } from './game/state';
import { tick, manualAttack } from './game/combat';
import { load, save, clear } from './game/save';
import { render, pushLog } from './ui';

async function init(): Promise<void> {
  // BASE_URL is "/" locally and "/<repo>/" on GitHub Pages.
  const base = import.meta.env.BASE_URL;
  const lang = navigator.language.startsWith('tr') ? 'tr' : 'en';
  await loadI18n(base, lang);
  const content = await loadContent(base);

  let state = load() ?? newGame();

  function logFn(e: LogEvent): void {
    pushLog(e.key, e.params);
  }

  const clock = new GameClock(1000, () => {
    tick(state, content, logFn);
    save(state);
    draw();
  });

  function draw(): void {
    render(state, content, {
      autoRunning: clock.running,
      onToggleAuto: () => {
        clock.toggle();
        draw();
      },
      onAttack: () => {
        manualAttack(state, content, logFn);
        save(state);
        draw();
      },
      onReset: () => {
        clock.stop();
        clear();
        state = newGame();
        save(state);
        draw();
      },
    });
  }

  draw();
}

void init();

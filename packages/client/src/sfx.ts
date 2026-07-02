// Ses katmanı (Ali devir listesi #4, v1.23.45): 6 kısa efekt — ses DOSYASI YOK, Web Audio ile
// anında sentezlenir (repo hafif, ağ isteği yok; ileride data/sfx/ dosyalarıyla değiştirilebilir).
// Opt-in: Ayarlar'dan açılana dek AudioContext hiç oluşturulmaz (incremental oyuncusu sekmeyi
// saatlerce açık tutar — varsayılan sessiz, tarayıcı autoplay kurallarıyla da uyumlu).

let ctx: AudioContext | null = null;
let enabled = false;
let lastHitAt = 0;

export function setSfxEnabled(on: boolean): void {
  enabled = on;
  if (on && !ctx) {
    try { ctx = new AudioContext(); } catch { ctx = null; }
  }
  if (on && ctx && ctx.state === 'suspended') void ctx.resume().catch(() => {});
}

export type SfxName = 'hit' | 'crit' | 'hurt' | 'evolve' | 'death' | 'achievement' | 'button';

/** Tek osilatör notası: hızlı atak + üstel sönüm zarfı (tık/çıtırtı olmadan kısa efekt). */
function tone(freq: number, dur: number, type: OscillatorType, vol: number, at = 0, slideTo?: number): void {
  if (!ctx) return;
  const t0 = ctx.currentTime + at;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

export function sfx(name: SfxName): void {
  if (!enabled || !ctx) return;
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
  if (name === 'hit' || name === 'hurt') {
    const now = Date.now();
    if (now - lastHitAt < 90) return; // vuruş yağmurunda spam kesici
    lastHitAt = now;
  }
  switch (name) {
    case 'button': tone(1900, 0.045, 'square', 0.045); break;
    case 'hit': tone(220, 0.08, 'square', 0.11, 0, 140); break;
    case 'hurt': tone(130, 0.12, 'sawtooth', 0.11, 0, 70); break;
    case 'crit': tone(330, 0.07, 'square', 0.15); tone(660, 0.09, 'square', 0.13, 0.06); break;
    case 'achievement': tone(660, 0.1, 'triangle', 0.15); tone(880, 0.12, 'triangle', 0.14, 0.09); tone(1320, 0.18, 'triangle', 0.12, 0.18); break;
    case 'evolve': tone(262, 0.14, 'triangle', 0.14); tone(392, 0.14, 'triangle', 0.14, 0.12); tone(523, 0.16, 'triangle', 0.14, 0.24); tone(784, 0.3, 'triangle', 0.13, 0.36); break;
    case 'death': tone(392, 0.5, 'sawtooth', 0.12, 0, 65); tone(196, 0.7, 'sine', 0.11, 0.15, 49); break;
  }
}

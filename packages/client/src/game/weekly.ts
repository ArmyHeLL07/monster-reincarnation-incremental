import type { WeeklyMod } from '@mri/shared';
import type { Content } from './content';

// Haftalık "Derinlik Akıntısı" (Ali devir listesi #2, v1.23.42): haftada bir değişen global kural.
// Seçim istemci saatiyle deterministiktir — sunucu gerekmez, herkes aynı haftayı görür.
const WEEK_MS = 604_800_000; // 7 gün

/** Havuzdaki aktif haftanın indexi (count 0 ise 0 döner, çağıran null'lar). */
export function weeklyIndex(count: number, now = Date.now()): number {
  return count > 0 ? Math.floor(now / WEEK_MS) % count : 0;
}

/** Bu haftanın global modifiyeri — havuz boş/yüklenmemişse null. */
export function currentWeekly(content: Content): WeeklyMod | null {
  const pool = content.weekly;
  return pool && pool.length ? (pool[weeklyIndex(pool.length)] ?? null) : null;
}

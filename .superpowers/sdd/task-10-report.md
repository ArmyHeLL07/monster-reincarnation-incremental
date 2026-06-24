# Task 10 Report: Changelog v1.13.0

## Status: COMPLETED

### Summary
Successfully added v1.13.0 changelog entry documenting the Resistance Nullification feature to `packages/client/src/changelog.ts`.

### Changes Made

**File Modified:**
- `packages/client/src/changelog.ts`

**Entry Added (at TOP of CHANGELOG array):**
- Version: `1.13.0`
- Date: `2026-06-24`
- Languages: Turkish (tr), English (en), Russian (ru)

**Features Documented:**
1. 14 resistance chains (T1→T5 evolution) — fire, frost, lightning, wind, earth, darkness, light, acid, physical, pierce, poison, paralyze, fear, soul
2. Group merger system — Physical/Magic/Status Nullification (auto-merge when all T5s complete)
3. Ultimate Nullification — Lv10 grants 100% immunity (nullifier enemies exempt)
4. 4 new damage/resistance types — wind, earth, darkness, light
5. 7 new passive chains — Five Senses, Probability Correction, Thunder Fear, Night Vision, Dragon Armor, Deathless, Athletics
6. Auto T1 chain unlock — first damage of that type triggers opening

### Commit Hash
```
f695d5b chore: v1.13.0 changelog — resistance nullification sistemi (Task 10)
```

### TypeScript Compilation
```
✓ tsc --noEmit: No errors (clean compilation)
```

### Notes
- Entry follows existing changelog pattern with tri-language translation arrays (tr/en/ru)
- Placed at top of CHANGELOG array as newest version (v1.12.0 now second)
- Updated VERSION constant context remains v1.12.0 (VERSION is typically updated separately with a build release step)
- All feature descriptions accurately reflect the Resistance Nullification system specification

---

## Final Code Review Fixes (2026-06-24)

Four issues from the code review resolved in a single commit.

### Fix 1 — I-3: Double `aggregateBonuses` call in `enemyAttack` (line ~993)
Removed the redundant `const nullBonuses = aggregateBonuses(state, content)` call. `b` already carries
`physNullReduction`, `magicNullReduction`, `statusNullReduction`, `ultimateNullLv` (added in Task 1).
All two references to `nullBonuses` replaced with `b` (line 1017 call to `getGroupNullPct`, line 995 `.ultimateNullLv`).

### Fix 2 — I-2: `applyMerger` deleted skills before guard check
Reordered so `content.skills.get(merger.id)` guard runs **before** the `state.skills.filter` mutation.
Previously, a missing skill definition would delete component skills and then silently return, causing permanent data loss.

### Fix 3 — I-1: `magic` damage type missing from MAGIC group
Added `'magic'` to two arrays in `combat.ts`:
- `getGroupNullPct`: `MAGIC: DamageType[]` array (line ~1607)
- `isRelevantForNull`: `MAGIC_TYPES: DamageType[]` array (line ~1619)
`magic` was intentionally NOT added to `T1_MAP` in `autoUnlockChainSkill` — magic has no chain skill per spec.

### Fix 4 — M-1: T5 chain XP cost wrong
Changed `Math.min(tier, 5)` to `Math.min(tier, 4)` in `resistChainExpToNext`.
T5 chain skills now correctly use `totals[4] = 1200` → 240 XP/level, matching the spec (T4→T5 total = 1200).
Also updated the fallback from `?? 2000` to `?? 1200` to be consistent.

### TypeScript Compilation
```
✓ tsc --noEmit: No errors (clean compilation)
```

### Concerns
None. All four changes are isolated and low-risk. The `magic` type addition (Fix 3) is the broadest change
but correct — `magic` damage hitting without group nullification was a silent gameplay gap.

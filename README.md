# Monster Reincarnation — Incremental

> A *kill → skill → evolve → reincarnate* incremental/idle game where **knowledge is survival power**.
> Inspired by the *spider reincarnation* premise — all names original and copyright-safe.

**Status:** 🚧 Early prototype (design-complete, scaffolding in progress). Free browser demo first; Steam later via a desktop wrapper.

---

## Highlights

- **Knowledge = survival.** Progress comes from *understanding* which skill/combination beats which threat — not brute numbers.
- **Skill evolution chains.** Every skill levels LV1→LV10, then evolves into a stronger form (no infinite number bloat).
- **Branching race evolution**, damage-based resistances → immunities, hunger/feeding, a stamina (SP) layer that limits idle farming, and a layered eye-slot system (Appraisal, gradual info reveal).
- **Deterministic skill fusion** with a shared **global discovery pool** (a combo is generated once, universe-wide) — the game is single-player, but discoveries are common.
- **Data-driven & multilanguage by construction.** All content lives in JSON; no language is hardcoded — every player-facing string comes from a localization table.
- **Mobile-first.** Responsive, touch-friendly UI — plays in the phone browser; the demo auto-deploys to GitHub Pages on every push to `main`.

## Tech stack

| Layer | Choice |
|-------|--------|
| Client | TypeScript + Vite (DOM/Canvas — no 3D) |
| Backend | Cloudflare Workers + R2 (telemetry mailbox) + KV/D1 (global fusion cache) |
| Shared | `@mri/shared` — types shared between client & worker |
| Later | Steam via Electron/Tauri wrapper |

## Repository layout

```
.
├─ docs/            # design documents (GDD, skill catalog, race data)
├─ data/            # data-driven JSON: skills, i18n, … (single source of content)
├─ packages/
│  ├─ shared/       # @mri/shared — shared TS types + fusion hash
│  ├─ client/       # @mri/client — Vite web demo
│  └─ server/       # @mri/server — Cloudflare Worker (mailbox + global cache)
└─ package.json     # npm workspaces root
```

## Quickstart

```bash
npm install

# run the web demo (http://localhost:5173)
npm run dev

# run the backend worker locally
npm run server:dev

# type-check everything
npm run typecheck
```

## Design docs

The full game design lives in [`docs/`](./docs):

- [`docs/GDD.md`](./docs/GDD.md) — Game Design Document (core loop, stats & skills, evolution, stamina, idle, rebirth…)
- [`docs/Skill_Catalog.md`](./docs/Skill_Catalog.md) — comprehensive skill reference
- [`docs/Spider_Race_Data.md`](./docs/Spider_Race_Data.md) — the first race's data tables

## Roadmap

1. **Vertical-slice prototype** — core loop, idle, hunger, stamina, one eye slot, a minimal deterministic fusion + local telemetry outbox.
2. **Backend** — Cloudflare mailbox + global fusion cache.
3. **Steam** — desktop wrapper.

## License

**Proprietary — all rights reserved.** Copyright © 2026 Atıl (ArmyHeLL07).
No use, copying, modification, or distribution without prior written permission.
See [`LICENSE`](./LICENSE).

# 🕷️ Monster Reincarnation — Incremental

> A *kill → skill → evolve → reincarnate* idle/incremental game where **knowledge is survival power**.
> Inspired by the *spider reincarnation* premise — all names original and copyright-safe.

## ▶ Play — free, in your browser (no install)

- **▶ Play now:** https://monster-reincarnation.pages.dev
- **Ad-free mirror:** https://armyhell07.github.io/monster-reincarnation-incremental/
- 🌍 English · Türkçe · Русский &nbsp;·&nbsp; 📱 works on mobile

## 💜 Support

Made by a solo dev and free to play. If you'd like to support development — and get your
name on the in-game **Supporters** board (it can even name a monster):

- **Patreon:** https://www.patreon.com/cw/ArmyHeLL07

Supporters show up in-game (Settings → Supporters) and sync automatically.

## What makes it different

- **Knowledge = survival.** Progress comes from *understanding* which skill/element beats which threat — not brute numbers.
- **Evolution everywhere.** Skills level LV1→LV10 then evolve; forms branch into a 10-tier tree; **8 playable races** — Spider, Human, Slime, Skeleton, Wyrmling, Golem, Beastkin, Demon.
- **Elements & nullification.** A full element advantage cycle, damage resistances that climb toward true 100% immunity, and status effects.
- **Deterministic skill fusion** — combine skills into new ones; results are consistent and shareable.
- **Idle-friendly,** with a stamina layer (no infinite AFK), dungeons, a bestiary, a story mode, and rebirth/prestige.
- **Privacy-friendly:** your save lives in your own browser, no account needed. [Privacy policy](https://monster-reincarnation.pages.dev/privacy.html).

## Development

TypeScript + Vite client, Cloudflare Workers backend, npm workspaces.

```bash
npm install
npm run dev          # web client → http://localhost:5173
npm run typecheck    # type-check all packages
npm run build        # production build
```

```
packages/
├─ shared/   # @mri/shared — shared TS types
├─ client/   # the Vite web game
└─ server/   # Cloudflare Worker (supporters sync, …)
data/        # data-driven JSON: skills, races, i18n, …
```

## License

**Proprietary — all rights reserved.** © 2026 Atıl (ArmyHeLL07).
No use, copying, modification, or distribution without prior written permission.

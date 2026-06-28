# Gothic RPG UI/UX Blueprint Audit Report

## 1. Observation
After a thorough read-only investigation of the codebase (specifically `packages/client/index.html`, `packages/client/src/ui.ts`, and `packages/client/src/main.ts`), we mapped the current implementation against the Gothic RPG UI/UX Blueprint in `docs/studio_game_design_document.md`.

Below are the direct observations from the codebase:

### 1.1 Primary Background & Panel Background
*   **Codebase CSS Variables (`packages/client/index.html` lines 13-15):**
    ```css
    --abyss: #0a0910;
    --stone: #15131c;
    --stone2: #1e1a28;
    ```
*   **Body Styling (`packages/client/index.html` line 34):**
    ```css
    background: radial-gradient(1100px 480px at 50% -8%, #1b1828 0%, var(--abyss) 62%) fixed, var(--abyss);
    ```
*   **Panel Styling (`packages/client/index.html` line 82):**
    ```css
    background: linear-gradient(180deg, var(--stone2), var(--stone));
    ```
*   **GDD Specification (Section 1.1):**
    *   Primary Background: Abyss Dark (`#060408`)
    *   Alternative BG: Abyss Alternate (`#0a0910`)
    *   Panel Background: Stone Dark (`#15121b` / `#15131c`)
*   **Finding:**
    *   The primary background is set to `#0a0910` (Abyss Alternate) and uses a purple radial gradient starting from `#1b1828` instead of the solid `#060408` (Abyss Dark) void spaces layout.
    *   Panels use a gradient starting from `#1e1a28` (a lighter purple-gray) and ending at `#15131c`. This is significantly lighter and more purple than the specified Stone Dark.

### 1.2 Borders & Trims
*   **Codebase Panel Border (`packages/client/index.html` line 83):**
    ```css
    border: 1px solid var(--chitin);
    ```
    *Where `--chitin` is defined on line 16 as `#2c2838`.*
*   **GDD Specification (Section 1.3):**
    *   Double Borders: A primary gold border (`#cfa74e`) flanked internally by a thin dark border (`#383140`) to create depth.
*   **Finding:**
    *   Double borders are not implemented. Panels use a single 1px solid chitin border (`#2c2838`). No gold trims are applied.

### 1.3 Typography
*   **Codebase Font Imports (`packages/client/index.html` lines 8-10):**
    ```html
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&display=swap" rel="stylesheet" />
    ```
*   **Codebase Font Variables (`packages/client/index.html` lines 26-27):**
    ```css
    --disp: 'Cinzel', Georgia, serif;
    --body: system-ui, -apple-system, sans-serif;
    ```
*   **GDD Specification (Section 1.2):**
    *   Display/Headers: **Cinzel** (serif) for all major category headings, tabs, boss titles, etc. Text shadow: `text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8), 0 0 10px rgba(207, 167, 78, 0.3);`.
    *   Body/Details: **Cormorant Garamond** (or **Crimson Pro**).
*   **Finding:**
    *   Only `Cinzel` is loaded. `Cormorant Garamond` / `Crimson Pro` are missing entirely from font links.
    *   Body text uses system sans-serif (`system-ui, -apple-system, sans-serif`) instead of the required old-world serif font.
    *   Headers like `h3` (used in `.logcol h3` and `.skillgroup h3`) have no explicit font-family variable applied, meaning they inherit the body sans-serif font instead of `Cinzel`.
    *   Text-shadows for headers are not implemented as specified.

### 1.4 Low HP Vignette & Micro-animations
*   **Codebase Keyframes & Classes:**
    *   No references to `vignettePulse` or `.low-hp-vignette` in `index.html` or source code.
    *   No hover glows (`goldPulse`), page fold skew animations, or border pulses for active selections.
*   **GDD Specification (Section 1.5):**
    *   Pulsing red shadow vignette layer for low health / hazard.
    *   Hover glows (`goldPulse`) and page fold skew transitions on tab selection.
*   **Finding:**
    *   These animations are completely missing from both the styles and application logic.

### 1.5 Other Theme Inconsistencies & Mismatches
*   **Green Venom Accent Usage:**
    *   The current UI relies heavily on a bright green venom accent color: `--venom: #8ab23f` and `--venom-dim: #586f2c`.
    *   This green is used for active tab buttons, button active states, maps, cell highlights, and panel top highlight lines.
    *   This is a significant mismatch with the Classic Gothic/Dark RPG theme, which should feature Antique Gold (`#cfa74e` / `#d2a73a`) and Blood Red (`#bb4140`) as the primary accents and alert indicators.

---

## 2. Logic Chain

1.  **Abyss Dark background mismatch**:
    *   *Observation*: `packages/client/index.html` uses `#0a0910` and `#1b1828` gradient for `body` background.
    *   *Inference*: The backdrop does not use Abyss Dark (`#060408`) and instead has a purple gradient, which deviates from the design blueprint.
2.  **Panel backgrounds mismatch**:
    *   *Observation*: Panels are styled with a gradient from `--stone2` (`#1e1a28`) to `--stone` (`#15131c`).
    *   *Inference*: Panels look lighter and more purple than the requested solid Stone Dark (`#15121b` / `#15131c`).
3.  **Missing double borders**:
    *   *Observation*: `.panel` is styled with `border: 1px solid var(--chitin)`. No gold border (`#cfa74e`) flanked by dark border (`#383140`) is defined.
    *   *Inference*: The double border gothic styling is completely unimplemented.
4.  **Fonts incomplete**:
    *   *Observation*: Google Fonts request contains only `Cinzel`. Font-family for `--body` is `system-ui, -apple-system, sans-serif`.
    *   *Inference*: Cormorant Garamond / Crimson Pro are not loaded. The body font uses standard modern sans-serif rather than gothic serif. Additionally, header fonts are inconsistent since `h3` lacks the `var(--disp)` font family.
5.  **Missing Low HP Vignette**:
    *   *Observation*: Search results for "vignette" return 0 hits in `index.html` and `.ts` files.
    *   *Inference*: Faint blood-vignettes in logs and low HP vignette pulses are entirely missing.
6.  **Missing micro-animations**:
    *   *Observation*: No `goldPulse` or `skew` styling exists in CSS, and active states use green transitions instead of gold pulses.
    *   *Inference*: Hover glows, active border pulses, and page fold skew transitions are not implemented.

---

## 3. Caveats
No caveats. All observations were gathered directly from the codebase via static file inspection. Build verification was performed to confirm that the project currently compiles cleanly in its default state.

---

## 4. Conclusion
The Classic Gothic RPG Theme is not currently implemented according to the Visual Style Guide. The UI instead uses a modern purple-and-green "venom" aesthetic. All major components of Section 1 of the GDD (colors, double borders, body fonts, vignette pulses, and gothic micro-animations) are either missing or misconfigured.

---

## 5. Implementation Strategy

To implement the missing visual guidelines without breaking the application, follow this clean implementation strategy:

### Step 1: Update Google Fonts Imports (`packages/client/index.html`)
Add `Cormorant Garamond` (weights 400, 500, 600, 700) to the Google Fonts link tag.
```html
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />
```

### Step 2: Refactor CSS Variables and Global Rules (`packages/client/index.html`)
Align the theme colors and fonts with the blueprint:
```css
:root {
  --abyss: #060408;          /* Abyss Dark */
  --abyss-alt: #0a0910;      /* Abyss Alternate */
  --stone: #15121b;          /* Stone Dark Primary */
  --stone2: #15131c;         /* Stone Dark Secondary */
  --chitin: #383140;         /* Secondary Border / Chitin Black */
  --gold: #cfa74e;           /* Antique Gold */
  --gold-dim: #d2a73a;       /* Gilded Gold */
  --blood: #bb4140;          /* Blood Red Alert */
  --bone: #ede9e0;           /* Alabaster / Bone Primary Text */
  --parchment: #f0ebd8;      /* Bone Parchment Accent */
  --ash: #989384;
  --rad: 4px;                /* Gothic panel radius */
  
  --disp: 'Cinzel', Georgia, serif;
  --body: 'Cormorant Garamond', Georgia, serif;
  --mono: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
}

body {
  margin: 0; padding: 0.7rem; line-height: 1.5; color: var(--bone);
  font-family: var(--body); font-size: 1.1rem;
  background: var(--abyss);
}

h1, h2, h3, .gothic-header {
  font-family: var(--disp);
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8), 0 0 10px rgba(207, 167, 78, 0.3);
}
```

### Step 3: Implement Gothic Panels & Double Borders (`packages/client/index.html`)
Replace panel highlight rules with the GDD double-border specification:
```css
.panel {
  position: relative;
  background: var(--stone);
  border: 3px double var(--gold);
  border-radius: var(--rad);
  padding: 15px;
  box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.9), 0 5px 15px rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  opacity: 0.85; /* Glassmorphism layer transparency */
}

/* Thin dark border flanking internally */
.panel::before {
  content: '';
  position: absolute;
  top: -6px; left: -6px; right: -6px; bottom: -6px;
  border: 1px solid var(--chitin);
  pointer-events: none;
  border-radius: calc(var(--rad) + 2px);
}
```

### Step 4: Implement Micro-animations and Hover Glows (`packages/client/index.html`)
Add the `@keyframes` and hover rule extensions:
```css
@keyframes goldPulse {
  0% { box-shadow: 0 0 5px rgba(207, 167, 78, 0.4); }
  50% { box-shadow: 0 0 15px rgba(207, 167, 78, 0.8); }
  100% { box-shadow: 0 0 5px rgba(207, 167, 78, 0.4); }
}

button:hover, .gothic-btn:hover {
  animation: goldPulse 1.5s infinite;
  border-color: var(--gold-dim);
}

/* Page fold skew tab transition */
.tabbtn {
  transition: transform 0.15s ease, color 0.15s, border-color 0.15s;
}
.tabbtn:active {
  transform: skewX(-6deg) translateY(1px);
}
```

### Step 5: Implement Low HP red vignette pulse (`packages/client/index.html` & `packages/client/src/ui.ts`)
1.  **Add CSS for vignette pulse:**
    ```css
    @keyframes vignettePulse {
      0% { box-shadow: inset 0 0 20px rgba(187, 65, 64, 0.4); }
      50% { box-shadow: inset 0 0 40px rgba(187, 65, 64, 0.8); }
      100% { box-shadow: inset 0 0 20px rgba(187, 65, 64, 0.4); }
    }
    .low-hp-vignette {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      pointer-events: none;
      z-index: 9999;
      animation: vignettePulse 2s infinite ease-in-out;
    }
    ```
2.  **Add logic to `ui.ts` to toggle this class:**
    In `packages/client/src/ui.ts`, inside the `mount()` or `live()` update cycles, check:
    ```typescript
    const isLowHp = CURSTATE.hp / CURSTATE.maxHp < 0.35;
    let vignette = document.querySelector('.low-hp-vignette');
    if (isLowHp) {
      if (!vignette) {
        vignette = document.createElement('div');
        vignette.className = 'low-hp-vignette';
        document.body.appendChild(vignette);
      }
    } else {
      vignette?.remove();
    }
    ```

---

## 6. Verification Method
Verify that the overhaul is correctly integrated and styled:
1.  Verify compilation: Run `cmd.exe /c npm run typecheck` to confirm no TypeScript compilation errors.
2.  Verify compilation/packaging: Run `cmd.exe /c npm run build` to verify Vite bundle successfully packages the client static page.
3.  Inspect `packages/client/dist/index.html` manually or load in a browser preview to check:
    *   No errors regarding missing Google Font assets (check fonts load).
    *   Double gold borders visible on `.panel` components.
    *   Text-shadow and font-family correct on `h3` headers.
    *   Active/accent coloring matches gold and blood red rather than green venom.

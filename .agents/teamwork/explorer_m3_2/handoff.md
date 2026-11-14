# Milestone 3 Handoff Report — CSS White Wall & Frame Visuals

**Explorer**: Explorer M3-2  
**Role**: CSS White Wall & Frame Visuals Explorer  
**Milestone**: Milestone 3 (Product Page Simplification & Dynamic Frame Visualizer)  
**Parent Orchestrator**: 9cbe72cd-c919-4c71-951f-2cc0ee756513  
**Status**: Completed (Hard Handoff)  

---

## 1. Observation

Direct examination of `styles.css`, `script.js`, `product.html`, and `tests/e2e/` reveals the following concrete facts:

### 1.1 Current Background on `.detail-main-image`
- **Location**: `styles.css` lines 835–846:
  ```css
  .detail-main-image {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 20px;
    background: radial-gradient(ellipse at 50% 30%, var(--surface-2) 0%, var(--poster-wall) 100%);
    padding: clamp(16px, 4vw, 36px);
    overflow: hidden;
    box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.12);
    min-height: 340px;
  }
  ```
- **Values**:
  - In light theme (`:root[data-theme="light"]`, lines 35–55): `--surface-2: #f4ecdf;` and `--poster-wall: #eadfce;`. This creates a muddy tan/beige radial gradient.
  - In dark theme (`:root[data-theme="dark"]`, lines 1–30): `--surface-2: #2f2b26;` and `--poster-wall: #302a22;`. This creates a dark murky brown radial gradient.
- **Specification**: `PROJECT.md` Feature 12, `ORIGINAL_REQUEST.md` Requirement R3, and `tests/harness.js` line 471 (`AuthoritativePricing.wallBackgroundGradient`) specify:
  `linear-gradient(180deg, #fbfbfb 0%, #f1f2f5 100%)`.
- **Gap**: There is no clean gallery white wall background in either theme.

### 1.2 Frame Border and Shadow Definitions
- **Location**: `styles.css` lines 858–869:
  ```css
  .detail-main-image.frame-black img {
    border: 14px solid #18181b;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55), 0 4px 16px rgba(0, 0, 0, 0.3);
  }
  .detail-main-image.frame-white img {
    border: 14px solid #ffffff;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45), 0 4px 16px rgba(0, 0, 0, 0.2);
  }
  .detail-main-image.frame-none img {
    border: 1px solid rgba(255, 255, 255, 0.16);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3);
  }
  ```
- **Gaps**:
  1. `.detail-main-image.frame-transparent` is **completely missing**. `script.js` line 34–37 assigns `class: "frame-transparent"`. When the user selects "Transparent", `.frame-transparent` is applied to `.detail-main-image`, but because only `.frame-none` exists in CSS, it falls back to unstyled `.detail-main-image img` with no frameless paper shadow.
  2. For `frame-none`, `border: 1px solid rgba(255, 255, 255, 0.16)` renders a faint gray outline instead of a clean, unframed paper art print with `border: none;`.
  3. For `frame-white`, when placed against a gallery white wall, a pure white border without perimeter keyline or multi-tiered daylight drop shadow blends into the wall.
  4. For `frame-black`, `#18181b` at 14px is heavy on mobile screens and lacks subtle outer perimeter definition.

### 1.3 Swatch Dot Indicators
- **Location**: `script.js` lines 3137–3144:
  ```html
  <div class="variant-options frame-options">
    ${product.frames.map((frame) => `
      <button type="button" class="${frame === state.detailFrame ? "is-selected" : ""}" data-frame="${frame}">
        <span class="dot ${frame.toLowerCase()}"></span>
        <span>${getFrameOptionLabel(frame)}</span>
      </button>
    `).join("")}
  </div>
  ```
- **Gap**: `grep_search` and `Select-String` confirm that `.dot` does NOT appear anywhere in `styles.css`. The `<span class="dot ...">` is currently an unstyled inline element (0px × 0px, completely invisible).

### 1.4 Test Suite Failures (Automated Run)
Running `node tests/e2e/runner.js tier1` yields verbatim failures directly caused by these missing styles:
```
✖ [Tier 1: Feature 10 — Dynamic White Frame Selection] -> F10-4: Stylesheet defines .frame-white styling and white dot swatch
    Reason: styles.css must define .dot.white
✖ [Tier 1: Feature 11 — Dynamic Transparent/Frameless Selection] -> F11-4: Stylesheet defines .frame-transparent styling removing outer frame borders
    Reason: styles.css must define .frame-transparent
✖ [Tier 2: Boundaries for Feature 10 (Dynamic White Frame Selection)] -> B10-4: Swatch dot .dot.white has visible border definition in styles.css
    Reason: Expected styles.css to match regex /\.dot\.white\b|\.dot/i
```

### 1.5 Responsive Layout Behaviors
- **Location**: `styles.css` lines 2502–2515:
  ```css
  @media (max-width: 560px) {
    .frame-options {
      display: flex !important;
      flex-direction: row;
      gap: 3px;
    }
    .frame-options button {
      flex: 1;
      min-width: 0;
      padding: 0 4px;
      font-size: 0.72rem;
      gap: 3px;
    }
  }
  ```
- On screens ≤ 480px, static 14px borders consume 28px of artwork width on small devices.
- In addition, "Transparent / Frameless" (or Arabic "شفاف / بدون إطار") has 23 characters with `white-space: nowrap;`. Without text truncation (`text-overflow: ellipsis`), it risks overflowing or expanding the 3rd button disproportionately on 320px viewports.

---

## 2. Logic Chain

1. **White Wall Justification**:
   - The user request R3 explicitly asks for "a white wall-like background behind the posters for a clean, professional look".
   - The project test oracle (`tests/harness.js:471`) and test `f12_white_wall_background.test.js` mandate `linear-gradient(180deg, #fbfbfb 0%, #f1f2f5 100%)`.
   - Test `b12_white_wall_boundaries.test.js` (B12-1) requires a solid fallback color before the linear gradient: `background: #fbfbfb; background: linear-gradient(180deg, #fbfbfb 0%, #f1f2f5 100%);`.
   - An architectural gallery wall needs a subtle border (`1px solid rgba(0,0,0,0.08)`) and ambient inner shadow (`inset 0 1px 4px rgba(0,0,0,0.04)`) to simulate a recessed exhibition alcove.
   - In dark theme, maintaining the crisp white display background acts as an illuminated gallery lightbox against the dark surrounding UI. Adding `border: 1px solid rgba(255,255,255,0.12)` and deeper ambient drop-shadow (`0 8px 30px rgba(0,0,0,0.45)`) creates clean contrast without blinding halo effects.

2. **Frame Styling Justification**:
   - **Black Frame**: Needs rich matte black `#141414` (replacing generic `#18181b`), responsive 12px border (scaling to 9px on mobile), and three-tiered elevation shadow: `0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.18), 0 2px 4px rgba(0, 0, 0, 0.12)`.
   - **White Frame**: Because the background is off-white (`#fbfbfb` to `#f1f2f5`), a white frame (`#ffffff`) requires an outer perimeter boundary line (`outline: 1px solid rgba(0, 0, 0, 0.08);` or `box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08)`) and realistic daylight drop-shadow (`0 14px 28px rgba(0,0,0,0.12), 0 10px 10px rgba(0,0,0,0.08)`). This ensures the white molding separates distinctly from the white wall.
   - **Transparent / Frameless**: Must support both `.frame-transparent` and `.frame-none`. Removing borders (`border: none;`) and applying soft daylight paper drop shadow (`0 8px 16px rgba(0, 0, 0, 0.10), 0 2px 6px rgba(0, 0, 0, 0.05)`) with a 1px boundary (`outline: 1px solid rgba(0, 0, 0, 0.06)`) simulates high-grade art paper mounted directly onto the wall.

3. **Swatch Dots Justification**:
   - `styles.css` needs base `.dot` rules (14px diameter circular chips, `border-radius: 50%`, inline-block, vertically centered).
   - `.dot.black`: `#111111` with `border: 1px solid rgba(255, 255, 255, 0.25)` so it is clearly defined even on dark buttons.
   - `.dot.white`: `#ffffff` with `border: 1px solid #cccccc` so it is clearly visible against light and selected button backgrounds.
   - `.dot.transparent` / `.dot.none`: A modern diagonal slash (`linear-gradient(135deg, ...)`) with a slate line (`#94a3b8`) on white inside a circular border (`#cbd5e1`), universally recognized as "clear / unframed".
   - Selected state: `.variant-options button.is-selected .dot` scales by `1.12x` with an inner ring shadow for tactile feedback.

4. **Responsive Sizing Justification**:
   - At desktop (`> 640px`), 12px frame border is visually balanced.
   - At mobile (`≤ 640px`), 12px border can be overwhelming; scaling to 9px preserves artwork visibility.
   - Adding `overflow: hidden; text-overflow: ellipsis;` to `.frame-options button span:not(.dot)` guarantees that long labels ("Transparent / Frameless" and "شفاف / بدون إطار") truncate gracefully rather than causing button height jumps or flexbox blowout.

---

## 3. Caveats

1. **Replaced Content (`<img>`) Shadow Painting**:
   - Standard HTML `<img>` elements paint image pixels above `box-shadow: inset ...`. While outer box-shadows render perfectly around the border-box, inset shadows directly on `<img>` do not bite into the raster image content. To provide crisp inner matting and outer boundaries, `outline` and outer `box-shadow` with 0-spread keylines are utilized.
2. **White Frame Contrast on White Wall**:
   - The white wall gradient ends at `#f1f2f5` (approx 94% lightness), while the frame is `#ffffff` (100% lightness). While there is a natural 6% lightness delta, the key to visual separation is the 1px perimeter outline (`outline: 1px solid rgba(0, 0, 0, 0.08)`) and the multi-layer drop shadow (`0 14px 28px rgba(0, 0, 0, 0.12)`). Without these, the white frame would feel washed out.
3. **Asset Minification Prerequisite**:
   - `product.html` loads `styles.min.css`. When Worker M3 modifies `styles.css`, `node build-assets.js` MUST be executed to re-minify `styles.min.css` and copy it to `admin/styles.min.css` and `admin/styles.css`.

---

## 4. Conclusion & Actionable CSS for Worker M3

Worker M3 can apply the following exact changes to `styles.css` to satisfy all Milestone 3 visual requirements and pass the automated test suite.

### 4.1 Replacement Chunk 1: `.detail-main-image` Gallery White Wall & Frame Styles
In `styles.css`, replace lines 835–870 with:

```css
/* ── Detail Main Image Gallery White Wall Visualizer (Milestone 3 Feature 12) ── */
.detail-main-image {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background: #fbfbfb;
  background: linear-gradient(180deg, #fbfbfb 0%, #f1f2f5 100%);
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: clamp(16px, 4vw, 36px);
  overflow: hidden;
  box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.04), 0 4px 20px rgba(0, 0, 0, 0.04);
  min-height: 340px;
  transition: background 300ms ease, border-color 300ms ease, box-shadow 300ms ease;
}

:root[data-theme="dark"] .detail-main-image,
[data-theme="dark"] .detail-main-image {
  background: #fcfcfd;
  background: linear-gradient(180deg, #fcfcfd 0%, #f0f2f5 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.06), 0 8px 30px rgba(0, 0, 0, 0.45);
}

.detail-main-image img {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 72vh;
  object-fit: contain;
  display: block;
  border-radius: 3px;
  box-sizing: border-box;
  transition: border 250ms cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 250ms cubic-bezier(0.16, 1, 0.3, 1),
              transform 250ms cubic-bezier(0.16, 1, 0.3, 1);
}

/* 1. Black Frame — Deep matte gallery black molding */
.detail-main-image.frame-black img {
  border: 12px solid #141414;
  outline: 1px solid rgba(0, 0, 0, 0.2);
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25),
              0 10px 10px rgba(0, 0, 0, 0.18),
              0 2px 4px rgba(0, 0, 0, 0.12);
}

/* 2. White Frame — Crisp gallery white molding with outer keyline & daylight shadow against white wall */
.detail-main-image.frame-white img {
  border: 12px solid #ffffff;
  outline: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.15),
              0 0 0 1px rgba(0, 0, 0, 0.08),
              0 14px 28px rgba(0, 0, 0, 0.12),
              0 10px 10px rgba(0, 0, 0, 0.08),
              0 2px 4px rgba(0, 0, 0, 0.04);
}

/* 3. Transparent / Frameless — Pure print paper finish with soft daylight lift */
.detail-main-image.frame-transparent img,
.detail-main-image.frame-none img {
  border: none;
  outline: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.10),
              0 2px 6px rgba(0, 0, 0, 0.05);
}
```

### 4.2 Addition Chunk 2: Swatch Dot Indicator Styles
In `styles.css`, right around line 1315 (after `.frame-options button`):

```css
/* ── Frame Option Swatch Dots (Milestone 3 Feature 13) ── */
.dot {
  display: inline-block;
  width: 14px;
  height: 14px;
  min-width: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  vertical-align: middle;
  box-sizing: border-box;
  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 180ms ease;
}

/* Black frame swatch dot */
.dot.black {
  background-color: #111111;
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
}

/* White frame swatch dot with visible border */
.dot.white {
  background-color: #ffffff;
  border: 1px solid #cccccc;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

/* Transparent / Frameless swatch dot (subtle diagonal clear slash) */
.dot.transparent,
.dot.none {
  background: linear-gradient(135deg, #ffffff calc(50% - 1.5px), #94a3b8 calc(50% - 1.5px), #94a3b8 calc(50% + 1.5px), #ffffff calc(50% + 1.5px));
  border: 1px solid #cbd5e1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.10);
}

/* Button active/selected state enhancement for swatch dots */
.variant-options button.is-selected .dot {
  transform: scale(1.12);
}
.variant-options button.is-selected .dot.black {
  border-color: rgba(255, 255, 255, 0.45);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.35), 0 2px 5px rgba(0, 0, 0, 0.3);
}
.variant-options button.is-selected .dot.white {
  border-color: rgba(0, 0, 0, 0.25);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5), 0 2px 5px rgba(0, 0, 0, 0.15);
}
.variant-options button.is-selected .dot.transparent,
.variant-options button.is-selected .dot.none {
  border-color: rgba(0, 0, 0, 0.25);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5), 0 2px 5px rgba(0, 0, 0, 0.15);
}
```

### 4.3 Replacement Chunk 3: Responsive Scaling & Button Stability
In `styles.css`, under `@media (max-width: 640px)` or `@media (max-width: 560px)` (around line 2502):

```css
  /* Responsive visualizer adjustments */
  .detail-main-image {
    min-height: 270px;
    padding: 14px 10px;
    border-radius: 14px;
  }
  .detail-main-image.frame-black img {
    border-width: 9px;
  }
  .detail-main-image.frame-white img {
    border-width: 9px;
  }

  .dot {
    width: 11px;
    height: 11px;
    min-width: 11px;
  }

  .frame-options {
    display: flex !important;
    flex-direction: row;
    gap: 3px;
  }

  .frame-options button {
    flex: 1;
    min-width: 0;
    padding: 0 4px;
    font-size: 0.72rem;
    gap: 3px;
    overflow: hidden;
  }

  .frame-options button span:not(.dot) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
```

---

## 5. Verification Method

### 5.1 Automated Test Execution
Run the project automated test suite via Node:
```powershell
node tests/e2e/runner.js tier1
node tests/e2e/runner.js tier2
```

**Expected Results Upon Implementation**:
1. `f10_dynamic_white_frame.test.js`:
   - `F10-4: Stylesheet defines .frame-white styling and white dot swatch` -> **PASS** (matches `/\.dot\.white\b/`).
2. `f11_dynamic_transparent_frame.test.js`:
   - `F11-4: Stylesheet defines .frame-transparent styling removing outer frame borders` -> **PASS** (matches `/\.frame-transparent\b/`).
3. `b09_b11_frames_boundaries.test.js`:
   - `B10-4: Swatch dot .dot.white has visible border definition in styles.css` -> **PASS** (matches `/\.dot\.white\b|\.dot/i`).
4. `f12_white_wall_background.test.js`:
   - All tests F12-1 through F12-5 -> **PASS**.
5. `b12_white_wall_boundaries.test.js`:
   - B12-1 (solid background fallback) and B12-3 through B12-5 -> **PASS**.

### 5.2 Build Command Verification
After editing `styles.css`, run:
```powershell
node build-assets.js
```
Verify that `styles.min.css` is updated cleanly without errors.

### 5.3 Invalidation Conditions
- Any removal of `.dot.white` or `.frame-transparent` will invalidate tests F10-4, F11-4, and B10-4.
- Changing `linear-gradient(180deg, #fbfbfb 0%, #f1f2f5 100%)` to another color or omitting solid `#fbfbfb` fallback will fail F12-1 and B12-1.

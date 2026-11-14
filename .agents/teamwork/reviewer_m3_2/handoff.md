# Review & Adversarial Challenge Report: Milestone 3 (CSS White Wall & Presentation)

**Reviewer**: Reviewer M3-2 (`reviewer_m3_2`)  
**Role**: CSS White Wall & Presentation Reviewer  
**Milestone**: Milestone 3 (Product Page Simplification & Dynamic Frame Visualizer)  
**Parent Orchestrator Conversation ID**: `9cbe72cd-c919-4c71-951f-2cc0ee756513`  
**Verdict**: **APPROVE**  
**Date**: 2026-11-10  

---

## 1. Observation

### 1.1 Direct Inspection of Source & Production Stylesheets (`styles.css`, `styles.min.css`, `admin/styles.min.css`)
1. **Gallery White Wall Background (`styles.css:835-856`)**:
   - Lines 841–846 define:
     ```css
     background: #fbfbfb;
     background: linear-gradient(180deg, #fbfbfb 0%, #f1f2f5 100%);
     padding: clamp(16px, 4vw, 36px);
     overflow: hidden;
     border: 1px solid rgba(0, 0, 0, 0.08);
     box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.04);
     ```
   - Dark theme override (`styles.css:850-856`):
     ```css
     :root[data-theme="dark"] .detail-main-image,
     [data-theme="dark"] .detail-main-image {
       background: #fbfbfb;
       background: linear-gradient(180deg, #fbfbfb 0%, #f1f2f5 100%);
       border: 1px solid rgba(255, 255, 255, 0.12);
       box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.06), 0 8px 30px rgba(0, 0, 0, 0.45);
     }
     ```
   - *Result*: Matches requirement R3 and Feature 12 verbatim.

2. **Frame Borders & Elevation Shadows (`styles.css:869-887`)**:
   - Black frame (`styles.css:869-873`):
     ```css
     .detail-main-image.frame-black img,
     .frame-black img {
       border: 12px solid #141414;
       box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.18), 0 2px 4px rgba(0, 0, 0, 0.12);
     }
     ```
   - White frame (`styles.css:874-878`):
     ```css
     .detail-main-image.frame-white img,
     .frame-white img {
       border: 12px solid #ffffff;
       outline: 1px solid rgba(0, 0, 0, 0.08);
       box-shadow: 0 14px 28px rgba(0, 0, 0, 0.12), 0 10px 10px rgba(0, 0, 0, 0.08);
     }
     ```
   - Transparent / None frame (`styles.css:880-887`):
     ```css
     .detail-main-image.frame-transparent img,
     .detail-main-image.frame-none img,
     .frame-transparent img,
     .frame-none img {
       border: none;
       outline: 1px solid rgba(0, 0, 0, 0.06);
       box-shadow: 0 8px 16px rgba(0, 0, 0, 0.10), 0 2px 6px rgba(0, 0, 0, 0.05);
     }
     ```
   - *Result*: Matches Features 10 and 11 specifications.

3. **Frame Swatch Dots (`styles.css:1335-1360`)**:
   - `.dot`: 14px x 14px circular chip (`border-radius: 50%`, `display: inline-block`, `vertical-align: middle`, `flex-shrink: 0`).
   - `.dot.black`: `#111111` with `border: 1px solid rgba(255, 255, 255, 0.25)`.
   - `.dot.white`: `#ffffff` with `border: 1px solid #cccccc`.
   - `.dot.transparent, .dot.none`: `background: linear-gradient(135deg, #ffffff 42%, #94a3b8 43%, #94a3b8 57%, #ffffff 58%)` with `border: 1px solid #cbd5e1`.
   - Active state (`.variant-options button.is-selected .dot`): `transform: scale(1.12); box-shadow: 0 0 0 2px var(--accent-subtle, rgba(212, 114, 59, 0.25));`.
   - *Result*: Matches Feature 13 specifications.

4. **Responsive Mobile Rules (`styles.css:3422-3431`)**:
   - Responsive scaling:
     ```css
     @media (max-width: 640px) {
       .detail-main-image.frame-black img,
       .detail-main-image.frame-white img {
         border-width: 9px;
       }
       .frame-options button span:not(.dot) {
         overflow: hidden;
         text-overflow: ellipsis;
         white-space: nowrap;
       }
     }
     ```
   - *Result*: Responsive scaling to 9px border and ellipsis protection for long text verified.

5. **Production Minification Parity**:
   - Re-running `node build-assets.js` generates byte-for-byte idempotent files:
     - `styles.min.css` (58,396 bytes)
     - `admin/styles.min.css` (58,396 bytes)
   - Both minified files contain all new selectors: `.detail-main-image`, `.frame-black img`, `.frame-white img`, `.frame-transparent img`, `.dot`, `.dot.black`, `.dot.white`, `.dot.transparent`, `.dot.none`, and `@media (max-width:640px)`.

### 1.2 Test Execution Results
1. **Isolated Milestone 3 Suite**:
   - Command:
     ```powershell
     node -e "require('./tests/e2e/tier1-features/f09_black_frame_default.test.js'); require('./tests/e2e/tier1-features/f10_dynamic_white_frame.test.js'); require('./tests/e2e/tier1-features/f11_dynamic_transparent_frame.test.js'); require('./tests/e2e/tier1-features/f12_white_wall_background.test.js'); require('./tests/e2e/tier1-features/f13_product_page_layout.test.js'); require('./tests/e2e/tier2-boundaries/b09_b11_frames_boundaries.test.js'); require('./tests/e2e/tier2-boundaries/b12_white_wall_boundaries.test.js'); require('./tests/e2e/tier2-boundaries/b13_layout_boundaries.test.js'); require('./tests/e2e/tier4-scenarios/scenario_1_full_buyer_journey.test.js'); const { runner } = require('./tests/harness'); runner.run().then(r => console.log('M3 Total:', r.total, 'Passed:', r.passed, 'Failed:', r.failed));"
     ```
   - Result: `M3 Total: 51 Passed: 51 Failed: 0` (100% pass).
2. **Full Test Suite (`node tests/run-all.js`)**:
   - Result: `TOTAL: 200/203 passed (3 failed) in 0.15s`
   - Tier 1: 88/90 passed (2 failures are F16-1 and F16-2, assigned to Milestone 4).
   - Tier 2: 90/90 passed (100%).
   - Tier 3: 18/18 passed (100%).
   - Tier 4: 4/5 passed (1 failure is Scenario 5, assigned to Milestone 4).
3. **M1 & M2 Adversarial Regression Suites**:
   - `tests/stress_pricing_invariance.js`: 52/52 assertions passed (100%).
   - `tests/challenger_m2_sync_stress.js`: 55/55 assertions passed (100%).
   - `tests/challenger_m2_stock_price_stress.js`: 123/123 assertions passed (100%).

---

## 2. Logic Chain

1. **White Wall Presentation Invariance (Observation 1.1.1)**:
   - The user requirement specifies a clean white wall-like background behind posters for a gallery aesthetic.
   - The previous background was a dark radial gradient (`radial-gradient(ellipse at 50% 30%, var(--surface-2) 0%, var(--poster-wall) 100%)`).
   - The updated CSS applies `#fbfbfb` fallback and `linear-gradient(180deg, #fbfbfb 0%, #f1f2f5 100%)` with subtle perimeter border `rgba(0, 0, 0, 0.08)` and inner shadow `inset 0 1px 4px rgba(0, 0, 0, 0.04)`.
   - In dark mode, instead of turning black/dark-gray (which would ruin the poster contrast), the background remains the illuminated gallery white wall lightbox with an expanded atmospheric shadow (`0 8px 30px rgba(0, 0, 0, 0.45)`).
   - *Inference*: Requirement R3 and Feature 12 are fully satisfied across light and dark themes.

2. **Frame Styling & Visual Contrast Hierarchy (Observation 1.1.2)**:
   - For black frames: 12px matte black `#141414` provides a bold physical frame with 3-tier elevation shadow for realistic wall projection.
   - For white frames: On an off-white wall (`#fbfbfb` to `#f1f2f5`), a white frame (`#ffffff`) would blend into the wall without boundary demarcation. The addition of `outline: 1px solid rgba(0, 0, 0, 0.08)` and the daylight shadow (`0 14px 28px rgba(0, 0, 0, 0.12)`) provides crisp physical edge definition without muddying the white frame.
   - For transparent/frameless: `border: none` removes the wood frame entirely, while a 1px boundary keyline `outline: 1px solid rgba(0, 0, 0, 0.06)` and soft paper lift shadow (`0 8px 16px rgba(0, 0, 0, 0.10)`) accurately conveys a premium frameless paper print floating in front of the wall.
   - *Inference*: Features 10 and 11 meet both visual aesthetics and technical boundary requirements.

3. **Swatch Dot Interaction & Scaling (Observation 1.1.3 & 1.1.4)**:
   - `script.js` renders `<span class="dot ${frame.toLowerCase()}"></span>`.
   - Defining `.dot.black`, `.dot.white`, `.dot.transparent`, and `.dot.none` resolves the previously missing CSS classes that caused invisible swatches and test failures (`F10-4`, `F11-4`, `B10-4`).
   - In active state, scaling by 1.12x and applying a focus glow (`0 0 0 2px var(--accent-subtle)`) provides clear tactile feedback.
   - On narrow mobile viewports (≤ 640px), `.detail-main-image.frame-black img, .detail-main-image.frame-white img` scales down from 12px to 9px, preventing horizontal overflow while preserving frame visibility. Text ellipsis protection (`.frame-options button span:not(.dot)`) protects responsive layout on small phone screens.
   - *Inference*: Feature 13 and responsive criteria are completely satisfied.

4. **Integrity & Anti-Cheat Audit**:
   - Inspected git diffs across `styles.css`, `styles.min.css`, `product.html`, and `script.js`.
   - Confirmed no hardcoded test values, no facade/mock classes, and no bypassing of build tools.
   - Minified assets `styles.min.css` and `admin/styles.min.css` are genuine compilations produced by `build-assets.js`.
   - *Inference*: No integrity violations exist.

---

## 3. Caveats

1. **Milestone 4 Out-of-Scope Failures**:
   - Running `node tests/run-all.js` outputs 3 failures (F16-1, F16-2, S5).
   - These 3 failures are strictly assigned to Milestone 4 (adding `products-bundle.js` script tag to `our-work.html` and `faq.html`). They do not impact Milestone 3 in any way.
2. **Browser CSS Engine Compatibility**:
   - The CSS relies on `clamp(16px, 4vw, 36px)`, `aspect-ratio`, and `color-mix` / CSS variables, which are fully supported across all modern browsers (Chrome, Edge, Safari, Firefox).
3. **Asset Build Discipline**:
   - Any future modifications to `styles.css` must be compiled using `node build-assets.js` to keep `styles.min.css` and `admin/styles.min.css` synchronized. This was confirmed to be currently in 100% sync.

---

## 4. Conclusion

- **Feature 10 (Dynamic White Frame)**: Fully verified with 12px border, daylight shadow, outline separation keyline, and white swatch dot.
- **Feature 11 (Dynamic Transparent Frame)**: Fully verified supporting both `Transparent` and `None` aliases, borderless styling, and paper lift shadow.
- **Feature 12 (White Wall Gallery Background)**: Fully verified with `linear-gradient(180deg, #fbfbfb 0%, #f1f2f5 100%)`, `#fbfbfb` fallback, subtle inset border, and dark mode lightbox override.
- **Feature 13 (Product Page Layout Simplification)**: Fully verified with responsive frame scaling (9px on mobile), swatch dots, text ellipsis protection, and zero-flicker frame switching.
- **Test Pass Rate**: Milestone 3 isolated suite is **51/51 passed (100%)**; full test suite pass rate is **200/203 passed** (with 0 regressions across M1/M2).
- **Integrity Audit**: Clean — no hardcoding, no facades, no shortcuts.
- **Final Verdict**: **APPROVE**.

---

## 5. Verification Method

To independently reproduce and verify this assessment:

1. **Verify CSS Rules and Idempotent Minification**:
   ```powershell
   node -e "
   const fs = require('fs');
   const assert = require('assert');
   const css = fs.readFileSync('styles.css', 'utf8');
   const min = fs.readFileSync('styles.min.css', 'utf8');
   assert(css.includes('linear-gradient(180deg, #fbfbfb 0%, #f1f2f5 100%)'));
   assert(css.includes('border: 12px solid #141414;'));
   assert(css.includes('border: 12px solid #ffffff;'));
   assert(css.includes('.dot.black') && css.includes('.dot.white') && css.includes('.dot.transparent'));
   assert(min.includes('.detail-main-image') && min.includes('.frame-black') && min.includes('.dot.white'));
   console.log('CSS Verification: PASSED');
   "
   ```

2. **Verify Milestone 3 Automated Tests (51/51 Pass)**:
   ```powershell
   node -e "require('./tests/e2e/tier1-features/f09_black_frame_default.test.js'); require('./tests/e2e/tier1-features/f10_dynamic_white_frame.test.js'); require('./tests/e2e/tier1-features/f11_dynamic_transparent_frame.test.js'); require('./tests/e2e/tier1-features/f12_white_wall_background.test.js'); require('./tests/e2e/tier1-features/f13_product_page_layout.test.js'); require('./tests/e2e/tier2-boundaries/b09_b11_frames_boundaries.test.js'); require('./tests/e2e/tier2-boundaries/b12_white_wall_boundaries.test.js'); require('./tests/e2e/tier2-boundaries/b13_layout_boundaries.test.js'); require('./tests/e2e/tier4-scenarios/scenario_1_full_buyer_journey.test.js'); const { runner } = require('./tests/harness'); runner.run().then(r => console.log('M3 Total:', r.total, 'Passed:', r.passed, 'Failed:', r.failed));"
   ```

3. **Verify Regression Suite Invariance**:
   ```powershell
   node tests/stress_pricing_invariance.js
   node tests/challenger_m2_sync_stress.js
   node tests/challenger_m2_stock_price_stress.js
   ```

4. **Invalidation Conditions**:
   - Modifying `.detail-main-image` background gradient or removing `#fbfbfb` fallback will invalidate `F12-1` and `B12-1`.
   - Removing `.dot.white` or `.frame-transparent` will invalidate `F10-4`, `F11-4`, and `B10-4`.
   - Modifying mobile responsive rules in `@media (max-width: 640px)` will cause frame clipping or overflow on mobile devices.

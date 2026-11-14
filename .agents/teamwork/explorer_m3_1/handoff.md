# Handoff Report — Milestone 3: Frame Switching & State Architecture

**Agent**: Explorer M3-1 (`explorer_m3_1`)  
**Role**: Frame Switching & State Explorer  
**Task**: Investigation of Default Frame Preview, Dynamic In-Place Frame Switching, Add-to-Cart Synchronization, and Custom Upload Compatibility  
**Target Milestone**: Milestone 3 (Features 10, 11, 12, 13, 14)  
**Date**: 2026-11-10  

---

## 1. Observation

### 1.1 Default Frame Initialization & Load Flow
1. **Initial State Declaration (`script.js:1210-1224`)**:
   ```javascript
   const state = {
     lang: localStorage.getItem(LOCAL_STORAGE_LANG_KEY) || "en",
     theme: localStorage.getItem(LOCAL_STORAGE_THEME_KEY) || "light",
     search: "",
     cart: loadCart(),
     selectedProduct: null,
     detailSize: "20x30",
     detailFrame: "Black", // <-- Properly initialized to "Black"
     customUpload: loadCustomUpload(),
     ...
   };
   ```
2. **Product Detail Load Flow (`script.js:4506-4511`)**:
   ```javascript
   const pageProductId = getPageProductId();
   if (pageProductId) {
     const params = new URLSearchParams(window.location.search);
     if (params.has("size")) state.detailSize = params.get("size");
     if (params.has("frame")) state.detailFrame = params.get("frame");
     renderDetail(pageProductId);
   }
   ```
   *Deficiency*: If `product.html` is visited without a `?frame=` query parameter (e.g. `product.html?id=cars-001`), `state.detailFrame` is not explicitly set; if the user had previously selected another frame in a SPA flow or if `state.detailFrame` became dirty/null, it does not reliably re-default to `"Black"`.
3. **`renderDetail(productId)` Frame Fallback (`script.js:3078-3081`)**:
   ```javascript
   state.selectedProduct = product.id;
   if (!product.sizes[state.detailSize]) state.detailSize = Object.keys(product.sizes)[0];
   if (!product.frames.includes(state.detailFrame)) state.detailFrame = product.frames[0];
   ```
   *Critical Flaw*: Across the catalog (`*-products.js` files and `products-bundle.js`), every product defines `frames: ["None", "Black", "White"]`.
   If `state.detailFrame` is null, undefined, or not found in `product.frames`, `product.frames[0]` evaluates to **`"None"`**, directly violating Requirement R3 which requires `"Black"` frame default on every product detail load.

### 1.2 Current Dynamic Frame Switching Architecture
In `script.js:4010-4014`:
```javascript
const frameButton = event.target.closest("[data-frame]");
if (frameButton) {
  state.detailFrame = frameButton.dataset.frame;
  renderDetail(state.selectedProduct); // <-- Full innerHTML rebuild
}
```
*Current Behavior*:
- Clicking any frame option button re-invokes `renderDetail(state.selectedProduct)`.
- `renderDetail()` replaces `productDetail.innerHTML` in its entirety (~90 lines of HTML).
- This creates severe user-experience regressions:
  1. **DOM Flicker & Image Reloading**: Destroys and recreates `<div class="detail-main-image">` and `<img id="detailMainImage">`, causing DOM churn, image flash, and potential re-decoding.
  2. **Gallery Thumbnail Selection Wipeout**: If the user clicked a gallery thumbnail button (`script.js:3993-4002`), switching the frame destroys the DOM and resets `#detailMainImage.src` back to `product.image` (`previewImage`), losing the user's thumbnail choice.
  3. **Disorienting Page Auto-Scroll**: If `productGrid` exists (`index.html`), lines 3171-3173 trigger `productDetail.scrollIntoView({ behavior: "smooth", block: "start" })` on every frame click!
  4. **Accessibility & Focus Loss**: Active element focus is lost on every frame button click.

### 1.3 Stylesheet Classes & Missing Definitions
In `styles.css:858-869`:
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
*Gaps Identified*:
1. **Missing `.frame-transparent` in CSS**: `styles.css` only defines `.frame-none`. When `script.js` uses `"Transparent"` or applies `frame-transparent`, no CSS rule matches. Test `F11-4` explicitly asserts `/\.frame-transparent\b/` in `styles.css` and currently fails.
2. **Missing Swatch Dot Classes**: In `script.js:3140`, `<span class="dot ${frame.toLowerCase()}"></span>` is rendered. However, `styles.css` has zero CSS rules for `.dot.black`, `.dot.white`, `.dot.none`, or `.dot.transparent`. Tests `F10-4` and `B10-4` specifically fail because `.dot.white` is missing.
3. **White Wall Background (Feature 12)**: Currently, `.detail-main-image` in `styles.css:841` uses `radial-gradient(ellipse at 50% 30%, var(--surface-2) 0%, var(--poster-wall) 100%)`. Feature 12 in `PROJECT.md` and Test `F12-1` require gallery-style clean white wall background `linear-gradient(180deg, #fbfbfb 0%, #f1f2f5 100%)`.

### 1.4 Add-to-Cart Synchronization
In `script.js:3292-3358` (`addToCart`):
```javascript
async function addToCart(productId, size = "20x30", frame = "Black", originEl = null) {
  ...
  const resolvedSize = product.sizes[size] ? size : Object.keys(product.sizes)[0];
  const resolvedFrame = product.frames.includes(frame) ? frame : product.frames[0];
  ...
  const key = product.isCustom
    ? `${product.id}-${resolvedSize}-${resolvedFrame}-${Date.now()}`
    : `${product.id}-${resolvedSize}-${resolvedFrame}`;
  ...
  state.cart.push({
    key,
    productId: product.id,
    size: resolvedSize,
    frame: resolvedFrame,
    upload,
    quantity: 1
  });
```
*Observations*:
1. At line 4016-4017, the detail page Add-to-Cart button calls `addToCart(state.selectedProduct, state.detailSize, state.detailFrame, detailAdd);`.
2. Line 3320 resolves `resolvedFrame`. If `frame` is `"Transparent"` while `product.frames` contains `["None", "Black", "White"]`, `product.frames.includes("Transparent")` returns `false`, causing it to fall back to `product.frames[0]` (`"None"`).
3. If `frame` is undefined or null, fallback to `product.frames[0]` (`"None"`) can improperly override default `"Black"`.
4. Pricing check: `itemUnitPrice(product, size, frame)` in `script.js:1331-1334` looks up `frameOptions[frame]?.price || 0`. In `script.js:33-38`, all frame options have `price: 0`. Frame switching has a 0 EGP price delta (Milestone 1 inclusive pricing contract verified).

### 1.5 Custom Design Upload Flow
In `script.js:4084-4116`:
- User selects file via `<input type="file" data-upload-design>`.
- Generates `objectUrl = URL.createObjectURL(file)`, stored in `state.customUpload.url` and `state.customUploadFile`.
- Saves to IndexedDB and calls `renderDetail(state.selectedProduct)`.
- In `renderDetail` lines 3085-3086:
  `rawPreview = (product.isCustom && state.customUpload && state.customUpload.url && !state.customUpload.previewError) ? state.customUpload.url : product.image;`
  `#detailMainImage.src` displays the uploaded image inside `.detail-main-image.frame-${state.detailFrame.toLowerCase()}`.
- If the user selects a frame AFTER uploading: with in-place class swapping, the `objectUrl` on `#detailMainImage` is untouched, allowing instant, flicker-free preview of Black, White, and Transparent frames on user custom art.

### 1.6 Duplicate Back Button on `product.html` (Feature 14)
- `product.html:78-85` contains a static `<div class="page-back-bar"><a class="page-back-btn" href="index.html">...</a></div>`.
- `script.js:3089-3096` injects a second `<div class="page-back-bar"><a class="page-back-btn" href="index.html">...</a></div>` inside `productDetail.innerHTML`.
- Both are displayed simultaneously when `productDetail` unhides, producing two duplicate back buttons.

---

## 2. Logic Chain

```
[User loads product page or clicks product link]
                     │
                     ▼
[1. Default Frame Evaluation]
  - State initialized with detailFrame: "Black"
  - URL parameter checked: params.get("frame") || "Black"
  - Fallback logic: product.frames.includes("Black") ? "Black" : product.frames[0] || "Black"
  - Result: detail-main-image always starts with .frame-black on load
                     │
                     ▼
[2. Frame Option Click Event: [data-frame="White|Black|Transparent|None"]]
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
[Old: Re-render innerHTML]   [New: In-Place Swap Architecture]
  ✖ Destroy DOM tree          ✔ Query .detail-main-image container
  ✖ Image flash/re-decode     ✔ Swap classes: remove frame-* / add frame-white
  ✖ Kill active gallery thumb ✔ Toggle .is-selected on button[data-frame]
  ✖ Smooth-scroll jump        ✔ Update .price-line small frame label text
  ✖ Focus lost                ✔ Update URL via history.replaceState
                              ✔ Image #detailMainImage completely untouched
                              ✔ CSS transition (250ms ease) runs smoothly
                     │
                     ▼
[3. Add-to-Cart Synchronization]
  - User clicks [data-detail-add]
  - Parameters passed: (state.selectedProduct, state.detailSize, state.detailFrame)
  - addToCart resolves frame: normalizes "Transparent" <-> "None"
  - Cart item record stored with frame: state.detailFrame
  - Item unit price remains base dimension price (0 EGP adder)
  - Cart drawer and WhatsApp order string display localized frame label
```

### Why In-Place Class Swapping is Architecturally Superior
1. **Zero Layout Thrashing & Zero Image Flickering**: Swapping classes on `.detail-main-image` changes only the CSS border and box-shadow on the descendant `img`. The browser does not rebuild the DOM, re-parse HTML, or re-download/re-decode the image asset.
2. **Preserves Active State & Session Artifacts**:
   - For custom poster designs: The blob `objectUrl` stays loaded in the DOM without re-attaching or re-verifying through `Image()` probe.
   - For multi-image products: The user's clicked gallery thumbnail (`data-gallery-image`) remains displayed on screen while frames are previewed.
3. **Smooth CSS Transitions**: `styles.css:856` already specifies `transition: border 250ms ease, box-shadow 250ms ease, transform 250ms ease;`. With in-place class swapping, switching between Black, White, and Transparent animates smoothly over 250ms like an interactive visualizer.
4. **URL Synchronization**: Using `window.history.replaceState` updates the browser URL bar to `product.html?id=...&size=...&frame=...` without triggering a page reload, ensuring sharing or bookmarking works seamlessly.

---

## 3. Caveats & Edge Cases

1. **"Transparent" vs "None" Alias Equivalence**:
   - Static product bundle data defines `"None"` in `frames: ["None", "Black", "White"]`.
   - Requirement R3 and `PROJECT.md` specify `"Transparent"`.
   - `frameOptions` in `script.js` supports both keys, with `price: 0` and class `"frame-transparent"`.
   - *Requirement*: Helper functions must treat `"Transparent"` and `"None"` interchangeably. If `product.frames` has `"None"` and the user selects `"Transparent"`, it must match and display cleanly without error.
2. **Custom Upload Preview Errors**:
   - If a user uploads an invalid file type or corrupt image, `previewProbe.onerror` in `script.js:4109` triggers and sets `previewError = true`. In that scenario, `renderDetail()` is invoked to restore the default fallback image. This is appropriate for error recovery and does not conflict with in-place frame swapping.
3. **Browser History & Back/Forward Navigation**:
   - Since `history.replaceState` is used for in-page frame switching, it modifies the current history entry without pushing new entries, keeping browser back navigation clean (one click returns to the store catalog).
   - If the user uses the browser Back button to return to `product.html` from another page, `getPageProductId()` and URL param parsing re-initialize the state.
4. **Language Toggling (`toggleLanguage()`)**:
   - When language changes, `renderDetail()` is legitimately called to translate strings (descriptions, button labels, size guides). When it runs, it must preserve `state.detailFrame` and render the appropriate `frame-${state.detailFrame.toLowerCase()}` class.
5. **Asset Minification Requirement**:
   - `product.html` loads `script.min.js` and `styles.min.css`. Any changes made to `script.js` and `styles.css` will NOT take effect in the browser unless `node build-assets.js` is executed to recompile minified bundles.

---

## 4. Conclusion & Actionable Implementation Instructions

Worker M3 should implement the following targeted changes:

### 4.1 Changes to `styles.css`
1. **Add `.frame-transparent` (and alias with `.frame-none`)** around line 866:
   ```css
   .detail-main-image.frame-none img,
   .detail-main-image.frame-transparent img {
     border: 1px solid rgba(255, 255, 255, 0.16);
     box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3);
   }
   ```
2. **Update Gallery White Wall Background (Feature 12)** at line 841:
   ```css
   .detail-main-image {
     position: relative;
     display: flex;
     align-items: center;
     justify-content: center;
     border-radius: 20px;
     background: linear-gradient(180deg, #fbfbfb 0%, #f1f2f5 100%);
     padding: clamp(16px, 4vw, 36px);
     overflow: hidden;
     box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.08), 0 10px 30px rgba(0, 0, 0, 0.05);
     min-height: 340px;
   }
   ```
3. **Add Swatch Dot Styles (Feature 13)** in `styles.css`:
   ```css
   .variant-options button .dot {
     display: inline-block;
     width: 14px;
     height: 14px;
     border-radius: 50%;
     border: 1px solid rgba(0, 0, 0, 0.2);
     flex-shrink: 0;
   }
   .variant-options button .dot.black {
     background-color: #18181b;
     border-color: #27272a;
   }
   .variant-options button .dot.white {
     background-color: #ffffff;
     border-color: #d4d4d8;
   }
   .variant-options button .dot.none,
   .variant-options button .dot.transparent {
     background: linear-gradient(135deg, rgba(200, 200, 200, 0.4) 0%, rgba(240, 240, 240, 0.8) 100%);
     border: 1px dashed #a1a1aa;
   }
   ```

### 4.2 Changes to `script.js`
1. **Helper Function for Normalizing Frame Classes & Fallbacks**:
   ```javascript
   function normalizeFrameKey(frame) {
     if (!frame) return "Black";
     const lower = String(frame).toLowerCase();
     if (lower === "white") return "White";
     if (lower === "transparent" || lower === "none") return "Transparent";
     return "Black";
   }

   function getFrameContainerClass(frame) {
     const normalized = normalizeFrameKey(frame).toLowerCase();
     return `frame-${normalized}`;
   }
   ```
2. **Default Frame Invariant in `renderDetail(productId)`**:
   Around lines 3078-3081:
   ```javascript
   state.selectedProduct = product.id;
   if (!product.sizes[state.detailSize]) state.detailSize = Object.keys(product.sizes)[0];
   
   // Default frame must be Black if available, otherwise first valid frame
   if (!state.detailFrame || !product.frames.some(f => normalizeFrameKey(f) === normalizeFrameKey(state.detailFrame))) {
     state.detailFrame = product.frames.includes("Black") ? "Black" : product.frames[0] || "Black";
   }
   ```
3. **In-Place Frame Switcher Implementation**:
   Implement `switchDetailFrame(newFrame)` in `script.js`:
   ```javascript
   function switchDetailFrame(frame) {
     const product = getProduct(state.selectedProduct);
     if (!product) return;
     
     state.detailFrame = frame;
     const normalized = normalizeFrameKey(frame);
     
     // 1. In-place class swapping on main image container
     const mainImage = document.querySelector(".detail-main-image");
     if (mainImage) {
       mainImage.classList.remove("frame-black", "frame-white", "frame-transparent", "frame-none");
       mainImage.classList.add(`frame-${normalized.toLowerCase()}`);
       if (normalized === "Transparent") mainImage.classList.add("frame-none");
     }
     
     // 2. Update button selection states
     document.querySelectorAll(".variant-options.frame-options button, [data-frame]").forEach((btn) => {
       const isMatch = btn.dataset.frame === frame || 
                       (normalizeFrameKey(btn.dataset.frame) === normalized);
       btn.classList.toggle("is-selected", isMatch);
     });
     
     // 3. In-place update of price line frame label
     const frameLabelEl = document.querySelector(".price-line small");
     if (frameLabelEl) {
       const currentLang = state.lang || "en";
       frameLabelEl.textContent = `${state.detailSize} ${currentLang === "ar" ? "سم مع" : "cm with"} ${getFrameOptionLabel(frame)}`;
     }
     
     // 4. Update URL without reload
     try {
       const url = new URL(window.location.href);
       url.searchParams.set("frame", frame);
       window.history.replaceState({}, "", url.toString());
     } catch (e) {}
   }
   ```
4. **Wire In-Place Switcher to Click Event Listener**:
   Replace lines 4010-4014 in `script.js`:
   ```javascript
   // Before:
   const frameButton = event.target.closest("[data-frame]");
   if (frameButton) {
     state.detailFrame = frameButton.dataset.frame;
     renderDetail(state.selectedProduct);
   }

   // After:
   const frameButton = event.target.closest("[data-frame]");
   if (frameButton) {
     switchDetailFrame(frameButton.dataset.frame);
   }
   ```
5. **Sanitize `addToCart` Frame Resolution**:
   In `script.js:3320`:
   ```javascript
   let targetFrame = frame || state.detailFrame || "Black";
   let resolvedFrame = product.frames.find(f => f === targetFrame) ||
                       (normalizeFrameKey(targetFrame) === "Transparent" && product.frames.find(f => f === "None" || f === "Transparent")) ||
                       (product.frames.includes("Black") ? "Black" : product.frames[0] || "Black");
   ```
6. **Remove Duplicate Back Button on `product.html` (Feature 14)**:
   In `renderDetail(productId)`:
   Check if `.page-back-bar` is already present on the page (in static HTML) before rendering the dynamic back bar, or avoid injecting the back bar inside `productDetail.innerHTML` when running on `product.html`.

### 4.3 Rebuild Step
Execute the asset build script to update minified assets:
```powershell
node build-assets.js
```

---

## 5. Verification Method

### Automated Test Suite Commands
Run the automated test runner to verify Milestone 3 compliance:

1. **Verify Individual M3 Feature Tests**:
   ```powershell
   node tests/e2e/tier1-features/f09_black_frame_default.test.js
   node tests/e2e/tier1-features/f10_dynamic_white_frame.test.js
   node tests/e2e/tier1-features/f11_dynamic_transparent_frame.test.js
   node tests/e2e/tier1-features/f12_white_wall_background.test.js
   node tests/e2e/tier1-features/f13_product_page_layout.test.js
   ```

2. **Verify M3 Boundary Tests**:
   ```powershell
   node tests/e2e/tier2-boundaries/b09_b11_frames_boundaries.test.js
   node tests/e2e/tier2-boundaries/b12_white_wall_boundaries.test.js
   node tests/e2e/tier2-boundaries/b13_layout_boundaries.test.js
   ```

3. **Verify Full Test Runner**:
   ```powershell
   node tests/run-all.js
   ```
   *Expected Result*: Tests `F10-4`, `F11-4`, and `B10-4` pass completely (resolving 3 of the 6 failing tests across the suite).

### Manual Assertion Invalidation Checks
- **DOM Stability Check**: In browser DevTools, inspect `#detailMainImage`. When toggling Black, White, and Transparent buttons, the `#detailMainImage` element must NOT be re-created in the DOM tree (mutation observer on `#detailMainImage` reports no node removals/replacements; only class attribute mutation on parent `.detail-main-image`).
- **Thumbnail Invariance Check**: Click a secondary gallery thumbnail. Then click White frame, then Black frame. The thumbnail image must remain on screen without reverting to the product primary image.
- **Cart Key Check**: Add a poster with White frame, then add the same poster with Black frame. Verify cart contains 2 distinct line items with respective frames indicated.

# Frontend & Cleanup Comprehensive Audit (Survey Phase)

**Author:** `teamwork_explorer_survey_3`  
**Date:** 2026-11-10  
**Scope:** Product page layout & framing preview, homepage & navigation across viewports, server/connection stability (`sw.js`, `firebase.json`), and codebase cleanup (leftover artifacts, unrequested features, console logs).

---

## Executive Summary

This survey audited the frontend presentation, interactive behaviors, navigation across all HTML pages, caching/service worker layer, and root directory cleanliness of the Poster Lab Store.

### Key Critical Findings
1. **Product Page Framing & Background (R3):**
   - The preview background (`.detail-main-image`) currently uses a dark brown (`#302a22`) or beige (`#eadfce`) gradient instead of the required clean white wall-like background.
   - The default frame selection falls back to `"None"` in `renderDetail()` because `product.frames` has `["None", "Black", "White"]`, rather than defaulting reliably to `"Black"`.
   - The frame option button swatch dots (`.dot.black`, `.dot.white`, `.dot.none`) are completely missing from `styles.css`, causing empty, invisible spans.
   - Frame switching triggers a full innerHTML teardown in `renderDetail()`, destroying and recreating DOM nodes instead of a smooth dynamic class update.
   - The product page has **duplicate stacked "Back to store" buttons**: one hardcoded in `product.html` (lines 78-85) and one dynamically injected by `renderDetail()` in `script.js` (lines 2857-2864).
2. **Multi-page Navigation & Broken Cart Data (R4):**
   - Category links inside the mobile navigation drawer (`buildNavMenu()` in `script.js:3943`) use relative query parameters `href="?cat=${c.id}"`. Clicking any category while on `product.html`, `our-work.html`, or `faq.html` leads to a broken empty state ("No products found"). They must link to `index.html?cat=${c.id}`.
   - Both `our-work.html` and `faq.html` fail to import `products-bundle.min.js`. When a customer opens the cart drawer on either page, all cart items disappear and the cart total calculates as 0 EGP because `getProduct(id)` returns undefined.
3. **Severe Checkout Network Bottleneck (R4):**
   - In `script.js:3508-3520`, placing an order on WhatsApp triggers a loop that fetches catalog poster images from the local store and uploads each image to `tmpfiles.org/api/v1/upload`. This adds 5–15 seconds of latency, triggers network errors, and is completely redundant for catalog posters that already have persistent store URLs.
4. **Service Worker & Hosting Configuration Conflicts (R4):**
   - `sw.js:131` intercepts ALL fetch requests (including cross-origin streaming/long-polling requests to `firestore.googleapis.com` and `identitytoolkit.googleapis.com`) without restricting caching to same-origin requests (`requestUrl.origin === self.location.origin`).
   - `firebase.json:48-55` applies a 24-hour cache header (`Cache-Control: public, max-age=86400`) to all `.js` files, inadvertently caching `sw.js` and blocking instant updates.
5. **Codebase Artifacts & Unrequested Features (R5):**
   - Root directory contains 3 leftover test scratchpads (`scratchpad_phbf08cl.md`, `scratchpad_q2u9oq20.md`, `scratchpad_sl9ajhoy.md`), 2 unneeded generation scripts (`_gen-three.mjs`, `gen-lists.js`), and 1 malformed JSON artifact (`album-artist-new.json`).
   - Gimmicky, unrequested animations (`spawnConfetti`, `animateFlyToCart`, `initCardTiltEffects`) add visual clutter and CPU overhead to a clean professional storefront.

---

## Detailed Investigation

### 1. Product Page Layout, Framing & Visualization (R3)

#### 1.1 Frame Selection & Default State
- **Observed Code (`script.js:1012, 2848`):**
  ```javascript
  // script.js line 1012:
  const state = {
    ...
    detailFrame: "Black",
    ...
  };

  // script.js line 2848:
  if (!product.frames.includes(state.detailFrame)) state.detailFrame = product.frames[0];
  ```
- **The Issue:**
  In `products-bundle.js`, every product definition has:
  ```json
  "frames": ["None", "Black", "White"]
  ```
  Notice that `"None"` is the first element (`product.frames[0]`). If `state.detailFrame` was set to `"None"` while viewing a previous product or if a query parameter was not passed, navigating to a product page can retain `"None"`.
  According to Acceptance Criterion:
  > *"Product page displays poster previews with a black frame by default."*
  `state.detailFrame` must default to `"Black"`.

#### 1.2 Missing CSS for Swatch Dots
- **Observed Code (`script.js:2907`):**
  ```javascript
  <button type="button" class="${frame === state.detailFrame ? "is-selected" : ""}" data-frame="${frame}">
    <span class="dot ${frame.toLowerCase()}"></span>
    <span>${getFrameOptionLabel(frame)}</span>
  </button>
  ```
- **The Issue:**
  In `styles.css`, `.dot` has **zero rules**. There are no declarations for `.dot.black`, `.dot.white`, or `.dot.none`.
  As a result, each frame button has an empty 0x0 inline span.
- **Recommended Fix in `styles.css`:**
  ```css
  .variant-options .dot {
    display: inline-block;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    margin-inline-end: 6px;
    vertical-align: middle;
    flex-shrink: 0;
  }
  .variant-options .dot.black {
    background: #18181b;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2);
  }
  .variant-options .dot.white {
    background: #ffffff;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.25);
  }
  .variant-options .dot.none {
    background: transparent;
    border: 1.5px dashed var(--muted);
  }
  ```

#### 1.3 Wall-like Background Behind Poster Preview
- **Observed Code (`styles.css:835-846`):**
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
  Where `--poster-wall` is defined as:
  - Dark theme (`styles.css:22`): `#302a22` (dark muddy brown)
  - Light theme (`styles.css:42`): `#eadfce` (beige/tan)
- **The Requirement:**
  > *"Poster display area includes a clean white wall-like background behind the framed poster for a clean, professional look."*
- **Recommended Fix:**
  Create a realistic white gallery wall appearance:
  ```css
  .detail-main-image {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
    background: linear-gradient(180deg, #fbfbfb 0%, #f1f2f5 100%);
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.04);
    padding: clamp(24px, 5vw, 48px);
    overflow: hidden;
    min-height: 380px;
  }
  ```

#### 1.4 Realistic Framing Styles (Black, White, Transparent)
- **Observed Code (`styles.css:858-869`):**
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
- **The Issue:**
  - On a white wall, `.frame-white img` with just `#ffffff` borders lacks depth and separation. Adding an inner bevel and wall shadow makes both black and white frames look like real physical frames.
  - For `frame-none`, the requirement specifies *"transparent/frameless"*, clearing/removing the frame border entirely (`border: none;`) with a subtle print paper elevation shadow.
- **Recommended Enhancements:**
  ```css
  .detail-main-image.frame-black img {
    border: 12px solid #141416;
    outline: 1px solid rgba(0, 0, 0, 0.4);
    box-shadow: 0 18px 45px rgba(0, 0, 0, 0.28), 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  .detail-main-image.frame-white img {
    border: 12px solid #ffffff;
    outline: 1px solid rgba(0, 0, 0, 0.12);
    box-shadow: 0 18px 45px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  .detail-main-image.frame-none img {
    border: none;
    outline: none;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.08);
  }
  ```

#### 1.5 Dynamic Switching Without Full DOM Teardown
- **Observed Code (`script.js:3705-3709`):**
  ```javascript
  const frameButton = event.target.closest("[data-frame]");
  if (frameButton) {
    state.detailFrame = frameButton.dataset.frame;
    renderDetail(state.selectedProduct);
  }
  ```
- **The Issue:**
  Calling `renderDetail()` completely wipes `productDetail.innerHTML`, destroying and recreating the image and all DOM elements. This causes an image flicker, scroll jumps, and disrupts smooth switching.
- **Solution:**
  When clicking `[data-frame]`, update the classes in place:
  1. Find `.detail-main-image`, update its class: `frame-black`, `frame-white`, or `frame-none`.
  2. Toggle `is-selected` on the frame buttons.
  3. Update `state.detailFrame`.
  4. Update the price line text.

#### 1.6 Duplicate Back Button Bug
- **Observed in `product.html` lines 78-85:**
  ```html
  <div class="page-back-bar" style="padding:16px clamp(16px, 4vw, 42px) 0 8px;">
    <a class="page-back-btn" href="index.html" aria-label="Back to store">
      ...
      <span data-t="backToStore">Back to store</span>
    </a>
  </div>
  <section class="detail-shell" id="productDetail" hidden></section>
  ```
- **Observed in `script.js` lines 2857-2864:**
  ```javascript
  productDetail.innerHTML = `
    <div class="page-back-bar">
      <a class="page-back-btn" href="index.html" ...>
  `;
  ```
- **Result:** Two identical "Back to store" buttons render on top of each other on `product.html`.
- **Solution:** Keep only one `page-back-bar` (preferably in `product.html` or inside the shell, but not both).

---

### 2. Homepage, Navigation & Asset Loading (R4)

#### 2.1 Nav Drawer Sub-category Links Break on Non-Home Pages
- **Observed Code (`script.js:3943`):**
  ```javascript
  ${cats.map(c => `<a class="nav-sub" href="?cat=${c.id}" data-nav-close>${c.label[lang]}</a>`).join("")}
  ```
- **The Bug:**
  `href="?cat=${c.id}"` is a relative query string.
  - If a user is on `product.html?id=cars-001`, clicking "Cars" navigates to `product.html?cat=cars`.
  - Since `getPageProductId()` is null, `product.html` displays:
    `<div class="empty-state">No products found...</div>`.
  - The same bug occurs if the user is on `our-work.html` or `faq.html`.
- **Solution:** Change `href="?cat=${c.id}"` to `href="index.html?cat=${c.id}"`.

#### 2.2 Missing `products-bundle.min.js` in `our-work.html` and `faq.html`
- **Observed Scripts in `our-work.html:192-197` & `faq.html:221-226`:**
  ```html
  <script defer src="firebase-config.js"></script>
  <script defer src="script.min.js"></script>
  <script defer src="admin-access.js"></script>
  ```
  Neither page includes `<script defer src="products-bundle.min.js"></script>`.
- **The Bug:**
  `script.min.js` runs on every page and manages the Cart Drawer. When a user has items in their cart and visits `our-work.html` or `faq.html` and opens the cart drawer, `renderCart()` executes:
  ```javascript
  const product = getProduct(item.productId);
  if (!product) return "";
  ```
  Because `products-bundle.min.js` is not loaded, `getProduct()` returns `undefined`. All cart items render as blank empty space, and the subtotal is calculated as 0 EGP.
- **Solution:** Add `<script defer src="products-bundle.min.js"></script>` to both `our-work.html` and `faq.html`.

#### 2.3 Variable Shadowing in `script.js`
- **Observed Code (`script.js:2614, 4106`):**
  - Line 2614: `let catParam = null;` in outer scope.
  - Line 4106: `const catParam = new URLSearchParams(window.location.search).get("cat");` inside `init()` IIFE.
- **The Issue:**
  Line 4106 shadows the outer variable, causing state sync inconsistencies when category filters are updated dynamically.
- **Solution:** Assign directly to `catParam` instead of declaring a shadowing `const`.

#### 2.4 Unnecessary WhatsApp Checkout Image Uploads
- **Observed Code (`script.js:3508-3520`):**
  ```javascript
  // Standard product or Series
  const imagesToUpload = (product.gallery && product.gallery.length) ? product.gallery : [product.image];
  uploadPromises.push((async () => {
    const urls = [];
    for (let i = 0; i < imagesToUpload.length; i++) {
      const imgUrl = productImageUrl(imagesToUpload[i]);
      const fileName = `${product.name.replace(/\s+/g, "_")}_${i + 1}.png`;
      const url = await uploadWithProgress(imgUrl, fileName);
      if (url) urls.push(url);
    }
    return { index, label: getProductName(product), urls };
  })());
  ```
- **The Issue:**
  When a customer clicks "Send final order to WhatsApp", the website downloads all images of standard catalog posters from itself and POSTs them to `tmpfiles.org/api/v1/upload`.
  This takes 5–15 seconds, often fails with `"Failed to upload some product images"`, and is completely redundant because standard catalog items already have persistent URLs and product IDs in the WhatsApp message text.
- **Solution:** Only upload user-submitted custom design files (`item.upload`). Never upload standard catalog poster assets to third-party temporary hosts.

---

### 3. Server, Service Worker & Firebase Stability (R4)

#### 3.1 Service Worker (`sw.js`) Intercepting Cross-Origin API Calls
- **Observed Code (`sw.js:91-131`):**
  ```javascript
  self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    let requestUrl;
    try { requestUrl = new URL(event.request.url); } catch { return; }
    if (requestUrl.protocol !== 'http:' && requestUrl.protocol !== 'https:') return;

    // Checks only local image origin
    const isLocalImage = requestUrl.origin === self.location.origin && requestUrl.pathname.includes('/assets/');
    ...
    // Line 131: Intercepts all other GET requests, including cross-origin!
    event.respondWith( ... caches.match(event.request) ... )
  ```
- **The Problem:**
  Firestore SDK uses GET requests for WebChannel streaming connections (`firestore.googleapis.com/.../channel?...`).
  Because `sw.js` does not check `if (requestUrl.origin !== self.location.origin) return;`, it attempts to cache streaming Firestore connections, resulting in connection hangs, silent failures, or stale snapshots.
- **Solution:**
  Add an origin guard at the top of the fetch listener:
  ```javascript
  if (requestUrl.origin !== self.location.origin) return;
  ```

#### 3.2 Firebase Hosting 24-Hour Cache on `sw.js`
- **Observed in `firebase.json:48-55`:**
  ```json
  {
    "source": "**/*.@(js|css)",
    "headers": [
      {
        "key": "Cache-Control",
        "value": "public, max-age=86400"
      }
    ]
  }
  ```
- **The Problem:**
  `sw.js` matches `**/*.@(js|css)`! Firebase Hosting sends `Cache-Control: public, max-age=86400` on the service worker script. Browsers can cache `sw.js` for 24 hours, delaying bug fixes and cache updates.
- **Solution:**
  Add a specific header rule for `/sw.js` in `firebase.json`:
  ```json
  {
    "source": "/sw.js",
    "headers": [
      {
        "key": "Cache-Control",
        "value": "no-cache, no-store, must-revalidate"
      }
    ]
  }
  ```

#### 3.3 Live Snapshot Re-render Disrupting Active Customer Interactions
- **Observed in `script.js:789-792` (`applyRemoteProducts`):**
  ```javascript
  const pid = getPageProductId();
  if (pid) {
    renderDetail(pid);
  }
  ```
- **The Problem:**
  Whenever an admin updates any product in Firestore, the realtime `onSnapshot` fires in the store. If a user is on `product.html`, `applyRemoteProducts()` calls `renderDetail(pid)` unconditionally, which resets the user's selected frame, size, and custom uploaded design.
- **Solution:**
  Only re-render product details if the updated product matches `pid` AND user has not made active modifications, or update prices in-place without wiping user inputs.

---

### 4. Codebase Audit & Cleanup (R5)

#### 4.1 Leftover Scratchpads and Junk Files
The following files in the project root are leftover artifacts from previous development tasks and testing runs:
| File | Size | Description / Issue |
|---|---|---|
| `scratchpad_phbf08cl.md` | 708 B | Old browser testing plan |
| `scratchpad_q2u9oq20.md` | 1,889 B | Old task log referencing local machine file paths (`C:\Users\...`) |
| `scratchpad_sl9ajhoy.md` | 1,357 B | Old blocker log referencing OneDrive paths |
| `_gen-three.mjs` | 1,782 B | Ad-hoc script with hardcoded `D:/Poster Lab Store...` paths |
| `gen-lists.js` | 979 B | Standalone utility script generating `cars_list.json` and `movies_list.json` |
| `album-artist-new.json` | 11,050 B | Malformed JSON file (starts with a leading comma `,` on line 1) |

#### 4.2 Unrequested / Cluttered Features
- **Falling Confetti (`spawnConfetti` in `script.js:2946-2976`):**
  Spawns 16 DOM nodes with random transforms on every add-to-cart click. Unrequested, gimmicky, and non-professional.
- **Flying Cloned Image (`animateFlyToCart` in `script.js:2978-3015`):**
  Creates animated DOM clone flying across the screen. Unrequested.
- **Card 3D Tilt Effect (`initCardTiltEffects` in `script.js`):**
  Adds heavy mousemove listeners to all product cards. Unnecessary performance cost.
- **Dead `--scene-image` CSS variable:**
  Injected in `script.js:2867` but non-existent in CSS.

#### 4.3 Console Logs and Warnings
- 4 `console.log` / `console.warn` calls and 21 `console.error` calls in `script.js`.
- Service worker registration outputs `console.log('Service Worker registered:', reg)`. Production builds should run cleanly with minimal or no extraneous logging.

---

## Actionable Recommendations Summary

1. **Product Page (R3):**
   - Update `.detail-main-image` background in `styles.css` to a clean white wall surface.
   - Enforce `"Black"` as default selected frame on product page load.
   - Add `.dot.black`, `.dot.white`, `.dot.none` styling in `styles.css`.
   - Update frame classes (`.frame-black`, `.frame-white`, `.frame-none`) for clean contrast against the white wall.
   - Implement in-place dynamic frame switching instead of full DOM teardown.
   - Remove duplicate "Back to store" button.
2. **Homepage & Navigation (R4):**
   - Change drawer category links to `index.html?cat=${c.id}`.
   - Add `<script defer src="products-bundle.min.js"></script>` to `our-work.html` and `faq.html`.
   - Eliminate redundant store image uploads to `tmpfiles.org` during WhatsApp order placement.
3. **Server & Connection Stability (R4):**
   - Restrict service worker caching in `sw.js` strictly to same-origin requests (`requestUrl.origin === self.location.origin`).
   - Add `Cache-Control: no-cache, no-store, must-revalidate` for `/sw.js` in `firebase.json`.
4. **Cleanup (R5):**
   - Delete root leftover scratchpad files (`scratchpad_*.md`), `_gen-three.mjs`, `gen-lists.js`, and `album-artist-new.json`.
   - Remove unrequested confetti and fly-to-cart animation code.

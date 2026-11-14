# Survey Handoff Report — Frontend & Cleanup

**Agent:** `teamwork_explorer_survey_3`  
**Parent:** `orchestrator` (`9cbe72cd-c919-4c71-951f-2cc0ee756513`)  
**Type:** Hard Handoff (Survey Complete)  
**Detailed Report Reference:** `.agents/teamwork/explorer_survey_3/analysis.md`

---

## 1. Observation

1. **Product Page Framing & Background:**
   - In `styles.css:835-846`, `.detail-main-image` uses `background: radial-gradient(ellipse at 50% 30%, var(--surface-2) 0%, var(--poster-wall) 100%)`. In `styles.css:22,42`, `--poster-wall` is set to `#302a22` (dark muddy brown) in dark theme and `#eadfce` (beige/tan) in light theme.
   - In `script.js:2848`, `if (!product.frames.includes(state.detailFrame)) state.detailFrame = product.frames[0];`. In `products-bundle.js`, all products define `"frames": ["None", "Black", "White"]`, causing the fallback default to be `"None"` instead of `"Black"`.
   - In `script.js:2907`, frame buttons render `<span class="dot ${frame.toLowerCase()}"></span>`. In `styles.css`, `.dot` has zero style definitions, rendering as an empty, invisible 0x0 element.
   - In `styles.css:858-869`, `.detail-main-image.frame-none img` applies `border: 1px solid rgba(255, 255, 255, 0.16)` rather than transparent/frameless (`border: none`).
   - In `script.js:3705-3709`, frame clicking triggers `renderDetail(state.selectedProduct)`, which replaces `productDetail.innerHTML` entirely, recreating the image and causing visual flicker.
   - In `product.html:78-85` and `script.js:2857-2864`, two identical `.page-back-bar` elements are rendered on `product.html`, displaying duplicate "Back to store" buttons stacked vertically.
2. **Multi-page Navigation & Broken Cart:**
   - In `script.js:3943`, drawer collection links are constructed as `href="?cat=${c.id}"`. Clicking these links while on `product.html`, `our-work.html`, or `faq.html` loads that page with the category query param, triggering the empty state `<div class="empty-state">No products found</div>` (e.g. `script.js:4208`).
   - In `our-work.html:192-197` and `faq.html:221-226`, `<script defer src="products-bundle.min.js"></script>` is omitted. Opening the cart drawer on either page calls `renderCart()` -> `getProduct(item.productId)` (`script.js:3129-3130`), which returns `undefined` for all store products, rendering blank cart items and resetting cart total to 0 EGP.
3. **WhatsApp Order Latency & Unnecessary Uploads:**
   - In `script.js:3508-3520`, checkout logic iterates over standard store catalog images and calls `uploadWithProgress(imgUrl, fileName)` to upload local catalog files to `tmpfiles.org/api/v1/upload`.
4. **Service Worker & Caching:**
   - In `sw.js:91-131`, `self.addEventListener('fetch', ...)` intercepts all HTTP/HTTPS GET requests, including cross-origin requests to `firestore.googleapis.com` and `identitytoolkit.googleapis.com`, without checking `requestUrl.origin === self.location.origin`.
   - In `firebase.json:48-55`, `"source": "**/*.@(js|css)"` applies `Cache-Control: public, max-age=86400` to all JavaScript files including `sw.js`.
5. **Codebase Cleanup:**
   - Root directory contains 3 leftover testing plans: `scratchpad_phbf08cl.md`, `scratchpad_q2u9oq20.md`, `scratchpad_sl9ajhoy.md`.
   - Root directory contains 2 unused generator scripts: `_gen-three.mjs` (hardcoded path `D:/Poster Lab Store...`), `gen-lists.js`.
   - Root directory contains 1 malformed JSON artifact: `album-artist-new.json` (syntax error: leading comma on line 1).
   - `script.js` contains unrequested micro-animations: `spawnConfetti` (lines 2946-2976), `animateFlyToCart` (lines 2978-3015), and `initCardTiltEffects`.

---

## 2. Logic Chain

1. **Product Framing (R3):**
   - *Observation 1* shows `.detail-main-image` uses brown/tan backgrounds (`#302a22` / `#eadfce`) and `product.frames[0]` is `"None"`, while `.dot` is unstyled and `frame-none` retains a border.
   - *Therefore*, the product page currently fails Acceptance Criteria R3 (black frame default, dynamic white/transparent switching, white wall background).
   - *Fix requirement:* Update `.detail-main-image` background to clean white gallery wall styling (`#fbfbfb` to `#f1f2f5`), enforce `"Black"` default in `state.detailFrame` and fallback logic, style `.dot.black`, `.dot.white`, `.dot.none`, make `frame-none` borderless, and update frame classes dynamically without DOM reconstruction.
2. **Navigation & Cart Integrity (R4):**
   - *Observation 2* shows drawer category links use `href="?cat=..."` and `our-work.html`/`faq.html` lack `products-bundle.min.js`.
   - *Therefore*, navigating categories from non-index pages breaks with "No products found", and viewing cart on `our-work.html` or `faq.html` breaks cart state.
   - *Fix requirement:* Prefix drawer category links with `index.html?cat=...` and add `products-bundle.min.js` to `our-work.html` and `faq.html`.
3. **Server & Connection Stability (R4):**
   - *Observation 4* shows `sw.js` intercepts cross-origin requests and `firebase.json` caches `sw.js` for 24h.
   - *Therefore*, Firestore streaming/long-polling connections are at risk of hanging or failing, and service worker fixes cannot propagate immediately to clients.
   - *Fix requirement:* Add origin check `if (requestUrl.origin !== self.location.origin) return;` to `sw.js` and set `Cache-Control: no-cache, no-store, must-revalidate` for `/sw.js` in `firebase.json`.
4. **Checkout Latency (R4):**
   - *Observation 3* shows WhatsApp ordering fetches and uploads static store catalog images to `tmpfiles.org`.
   - *Therefore*, WhatsApp checkout suffers massive unnecessary latency and failure rates.
   - *Fix requirement:* Restrict temporary server uploads strictly to custom user design uploads (`item.upload`).
5. **Codebase Cleanup (R5):**
   - *Observation 5* identifies 6 junk files and unnecessary animation overhead.
   - *Therefore*, the repository contains unrequested features and leftover development debris violating Acceptance Criterion R5.
   - *Fix requirement:* Delete the 6 leftover files and remove `spawnConfetti` / `animateFlyToCart`.

---

## 3. Caveats

- In accordance with read-only explorer constraints, no source files were modified during this turn.
- Image assets on disk were verified: all 1,019 products referenced in `products-bundle.js` exist on disk.
- Pricing values (Requirement R1) and Admin Panel Live Sync internals (Requirement R2) are surveyed in depth by peer explorers `survey_1` and `survey_2`.

---

## 4. Conclusion

The frontend presentation, navigation, and connection stability require targeted, high-impact fixes:
1. Revamp product framing: white gallery wall background, black frame default, seamless dynamic switching, styled swatch dots, and removal of duplicate back button.
2. Fix multi-page navigation links (`index.html?cat=...`) and add `products-bundle.min.js` to `our-work.html` and `faq.html`.
3. Stabilize service worker and server caching (`sw.js` same-origin restriction and `firebase.json` no-cache rule on `sw.js`).
4. Eliminate redundant catalog image uploads to `tmpfiles.org` during WhatsApp checkout.
5. Clean up root directory by deleting 6 leftover scratchpad/generator files and removing unrequested confetti/fly-to-cart animations.

---

## 5. Verification Method

To verify these findings independently:
1. **Product Framing & Background:**
   - Inspect `styles.css:835-869` and `script.js:2848, 2907, 3705-3709`.
   - Open `product.html?id=football-001` in browser: observe brown/tan background, missing color swatches in frame buttons, and duplicate back buttons.
2. **Navigation & Cart on Subpages:**
   - Inspect `script.js:3943`: check `href="?cat=${c.id}"`. Open `product.html` -> open drawer -> click any category -> verify empty state error.
   - Inspect `our-work.html` and `faq.html`: check script tags to confirm absence of `products-bundle.min.js`.
3. **Service Worker Cross-origin Interception:**
   - Inspect `sw.js:91-131`: verify absence of origin guard before `caches.match(event.request)`.
   - Inspect `firebase.json:48-55`: verify `**/*.@(js|css)` matches `sw.js` with 86400s max-age.
4. **Leftover Files:**
   - Run `Get-ChildItem -File` in repository root to view `scratchpad_*.md`, `_gen-three.mjs`, `gen-lists.js`, `album-artist-new.json`.

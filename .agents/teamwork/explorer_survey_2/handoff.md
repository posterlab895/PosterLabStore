# Handoff Report: Admin Panel & Store Live Synchronization Audit

**Agent Identity:** teamwork_explorer_survey_2 (Admin Sync Explorer)  
**Parent Agent ID:** 9cbe72cd-c919-4c71-951f-2cc0ee756513  
**Working Directory:** `d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\explorer_survey_2`  
**Reference Analysis:** `analysis.md`  

---

## 1. Observation

1. **Admin Panel Architecture & File Inventory**:
   - `admin/panel.html` loads:
     - Firebase v8 SDK (`firebase-app.js`, `firebase-auth.js`, `firebase-firestore.js` via gstatic)
     - `firebase-config.js` (line 234)
     - `products-bundle.min.js` (line 235)
     - `admin-panel.min.js` (line 236)
     - `admin-extras.js` (line 237)
   - Synchronous access check exists in `admin/panel.html` (line 44) and `admin-panel.js` (lines 8–16):
     ```javascript
     const sessionActive = localStorage.getItem('pls-admin-session') === 'true';
     const sessionEmail = (localStorage.getItem('pls-admin-email') || '').toLowerCase().trim();
     if (!sessionActive || sessionEmail !== 'posterlab895@gmail.com') {
       window.location.replace('login.html');
     }
     ```
   - Storefront navbar access is managed by `admin-access.js` (lines 68–165), injecting the ⚙️ gear icon into `.header-actions` and menu link into `[data-nav-body]` when `posterlab895@gmail.com` is active.

2. **Data Storage & Management**:
   - Admin panel reads custom products via `safeJSON('pls-products', [])` (`admin-panel.js:56`).
   - `allProducts()` in `admin-panel.js:101–120` merges `getHardcodedProducts()` (from `window.products`) with `getAdminProducts()`.
   - On save, `saveProduct()` writes to `localStorage['pls-products']` and calls `saveProductToFirestore()` (`admin-panel.js:190–213`), executing:
     `await db.collection('products').doc(product.id).set(clean, { merge: true })`.
   - Verification via Node.js fetch confirmed that Firestore project `poster-labstore` is active, readable/writable, and currently contains exactly 1 document: `/products/football-001`.

3. **Frontend Store Data Loading (`script.js`)**:
   - On load, `script.js:542–556` runs `getMergedProducts()`, which copies `products` (from `products-bundle.js`) and merges overrides from `localStorage['pls-products']`.
   - Asynchronously, `script.js:4109` triggers `syncProductsFromFirestore()`, which executes `db.collection('products').get()` and registers `initStoreRealtimeListeners()`.
   - `initStoreRealtimeListeners()` (`script.js:805`) attaches `db.collection('products').onSnapshot(...)`. Upon update, `applyRemoteProducts()` updates `localStorage['pls-products']` and re-renders `productGrid` or `renderDetail(pid)`.

4. **Pricing Discrepancies Across the Codebase**:
   - Requirement R1: `20x30 cm = 180`, `30x40 cm = 200`, `40x50 cm = 250`, `50x70 cm = 300`.
   - In all `*-products.js` (e.g. `cars-products.js:10–16`):
     `basePrice: 60`, `sizes: { "20x30": 60, "30x40": 80, "40x50": 250, "50x70": 300 }`.
   - In `script.js:33–37`:
     `const frameOptions = { None: { label: "Poster only", price: 0 }, Black: { label: "Black frame", price: 120 }, White: { label: "White frame", price: 120 } };`
   - In `script.js:1121`:
     `function itemUnitPrice(product, size, frame) { return product.sizes[size] + frameOptions[frame].price; }`.
   - Result:
     - 40x50 cm with Black frame = 250 + 120 = 370 (wrong; should be 250).
     - 50x70 cm with Black frame = 300 + 120 = 420 (wrong; should be 300).
     - 20x30 cm with None frame = 60 (wrong; should be 180).
   - In `admin-panel.js:707, 752`: default sizes are hardcoded as `20x30=60, 30x40=80, 40x50=250, 50x70=300`.
   - In `admin/panel.html:171`: placeholder shows `20x30=60, 30x40=80, 40x50=100, 50x70=120`.

5. **Frame Options Crash & Missing Styling**:
   - `frameOptions` only defines `None`, `Black`, `White`.
   - If `Transparent` or `Frameless` is passed (Requirement R3), `frameOptions['Transparent']` is `undefined`, causing `itemUnitPrice` to throw `TypeError: Cannot read properties of undefined (reading 'price')`.
   - In `styles.css:858–869`, only `.frame-black`, `.frame-white`, `.frame-none` exist; `.frame-transparent` is missing.
   - Default frame: `script.js:2848` defaults to `product.frames[0]` which is currently `"None"` across all products, whereas R3 requires defaulting to `"Black"`.
   - Background: `--poster-wall` is `#eadfce` (beige/tan) in light mode, whereas R3 requests a clean white wall-like background.

6. **Missing Local Cross-Tab Sync & Resilience Handlers**:
   - `script.js` has no `window.addEventListener('storage')` for `pls-products` or `pls-coupons`.
   - `BroadcastChannel` is completely absent from both `script.js` and `admin-panel.js`.
   - `script.js` does not listen to `firebase-ready` or `online` events.
   - In `firebase-config.js:42`, `merge: true` is incorrectly placed in `firebaseDb.settings({...})`.

7. **Stock / Quantity Disconnection & Metadata Loss**:
   - Admin Panel inputs `quantity`, but `script.js` never checks or displays `product.quantity`.
   - `admin-panel.js:768–782` discards existing `tags` array and collapses multi-image `gallery` to a single image upon saving.

---

## 2. Logic Chain

1. **Step 1: Tracing Data Flow from Admin to Store**
   - Observations 1 and 2 show that admin actions modify `localStorage['pls-products']` and send document updates to Firestore `/products/{id}`.
   - Observation 3 shows that the store reads from static `products` array overlaid with `localStorage['pls-products']`, and listens to Firestore via `onSnapshot`.
   - *Inference*: Changes in admin panel DO synchronize to the store via Firestore `onSnapshot`. However, because `storage` event and `BroadcastChannel` listeners are missing in `script.js`, same-browser cross-tab synchronization requires an unnecessary cloud round-trip, which fails if the browser is offline or on a weak connection.

2. **Step 2: Pricing Logic Audit**
   - Observation 4 shows that `itemUnitPrice()` sums `product.sizes[size]` and `frameOptions[frame].price`.
   - When the user requested: 20x30 = 180, 30x40 = 200, 40x50 = 250, 50x70 = 300, the legacy codebase was splitting this artificially into size prices (60, 80, 250, 300) and adding a 120 frame surcharge, causing massive overcharging for 40x50 (370) and 50x70 (420), and severe undercharging (60, 80) when frameless.
   - *Inference*: To achieve 100% price compliance, size prices across all `*-products.js`, `build-products.js`, and `admin-panel.js` must be set directly to 180, 200, 250, 300 with basePrice 180, and `frameOptions` frame surcharge must be 0 (inclusive pricing).

3. **Step 3: Frame Switching and Interface Stability**
   - Observation 5 shows that selecting a transparent/frameless option causes an unhandled TypeError because `frameOptions` has no safe property access and lacks the Transparent key.
   - *Inference*: `frameOptions` must safely handle `Transparent`/`Frameless`, `styles.css` must support `.frame-transparent`, and default frame selection must be set to `Black`.

4. **Step 4: Stock Synchronization**
   - Observation 7 shows that `quantity` is saved by admin panel but ignored by `script.js`.
   - *Inference*: To satisfy R2 ("changes made in the admin panel (products, prices, frames, stock) are listened to and synchronized live"), `script.js` must respect `product.quantity`, showing stock status and disabling checkout when `quantity === 0`.

---

## 3. Caveats

- **Network Dependency**: While Firestore was verified live via REST API, WebSocket real-time updates require standard Firebase domain access (`firestore.googleapis.com`, `identitytoolkit.googleapis.com`). Multi-tab offline persistence is enabled in `firebase-config.js` via `enablePersistence({ synchronizeTabs: true })`.
- **Minified Build Assets**: `index.html`, `product.html`, and `panel.html` load `.min.js` and `.min.css` files. Any edits made to `script.js`, `admin-panel.js`, `styles.css`, or `admin.css` must be compiled using `node build-assets.js` and `node build-products.js` to ensure the live pages load the updated code.
- **Read-Only Investigation**: As an Explorer agent, no application source files have been modified in this turn; all findings and solutions are documented in `analysis.md` and this handoff.

---

## 4. Conclusion

The Admin Panel connection architecture is fundamentally operational with Firestore, but suffers from **five critical structural deficiencies**:
1. **Broken pricing math**: Inconsistent base prices and frame surcharge causing 370/420 EGP totals and 60 EGP unframed glitches.
2. **Missing cross-tab synchronization**: Lack of `storage` event and `BroadcastChannel` in `script.js`.
3. **Crash on Transparent frame**: Uncaught TypeError on `frameOptions[frame].price`.
4. **Ignored stock**: Product `quantity` is saved but never enforced in storefront.
5. **Metadata destruction**: Admin edits strip search tags and gallery images.

The complete architectural roadmap to resolve these issues has been drafted in `analysis.md`.

---

## 5. Verification Method

To independently verify the observations:

1. **Verify Pricing Inconsistency**:
   - Inspect `script.js:33` and `script.js:1121` (`view_file`). Notice `frameOptions.Black.price = 120`.
   - Inspect `cars-products.js:10–16` (`view_file`). Notice sizes `20x30: 60`, `30x40: 80`, `40x50: 250`, `50x70: 300`.
   - Calculate: 40x50 with Black frame = 250 + 120 = 370.

2. **Verify Frame Options Crash Risk**:
   - In `script.js:33`, see defined keys: `None`, `Black`, `White`.
   - In `script.js:1122`, evaluate `itemUnitPrice(product, '20x30', 'Transparent')`: `frameOptions['Transparent'].price` yields `TypeError: Cannot read properties of undefined (reading 'price')`.

3. **Verify Firestore Endpoint & Live Count**:
   - Run command:
     ```powershell
     node -e "fetch('https://firestore.googleapis.com/v1/projects/poster-labstore/databases/(default)/documents/products').then(r => r.json()).then(d => console.log('Products:', d.documents ? d.documents.length : 0))"
     ```
   - Confirms Firestore is live and returns 1 document (`football-001`).

4. **Verify Build Tools**:
   - Run `node build-assets.js` and `node build-products.js`. Both exit with code 0.

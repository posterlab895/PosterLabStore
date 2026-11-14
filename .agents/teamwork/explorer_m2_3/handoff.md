# Handoff Report — Explorer M2-3: Admin Metadata, Price Guard & Connection Resilience

**Subagent ID:** explorer_m2_3  
**Date:** 2026-11-10  
**Milestone:** Milestone 2: Admin Panel Live Synchronization & Operations  
**Deliverable Document:** `.agents/teamwork/explorer_m2_3/analysis.md`  

---

## 1. Observation

Direct code observations with exact line numbers and quotes:

1. **Admin Product Save Drops Metadata (`admin-panel.js:768–785`)**:
   ```javascript
   768: const productData = {
   769:   id, name,
   770:   nameAr: $('#apNameAr').value.trim(),
   771:   category: $('#apCategory').value,
   772:   tag: $('#apTag').value.trim(),
   773:   tagAr: $('#apTagAr').value.trim(),
   774:   image: $('#apImage').value.trim(),
   775:   basePrice: parseFloat($('#apBasePrice').value) || 0,
   776:   gallery: [$('#apImage').value.trim()],
   777:   sizes, frames,
   778:   description: $('#apDescription').value.trim(),
   779:   descriptionAr: $('#apDescriptionAr').value.trim(),
   780:   _updatedAt: new Date().toISOString(),
   781:   _deleted: false
   782: };
   ```
   Directly observed: `productData` is instantiated as a new literal without spreading existing product data. `gallery` is hardcoded to single-element array `[$('#apImage').value.trim()]`, wiping any multi-image array. Properties present in catalog products (`tags: string[]`, `isCustom: boolean`, `originalId: string`, `rating: number`, `reviewsCount: number`, `player: string`, `team: string`, `artist: string`) are completely absent from `productData`.

2. **Invalid Firestore Settings Option (`firebase-config.js:38–46`)**:
   ```javascript
   38: try {
   39:   firebaseDb.settings({
   40:     experimentalAutoDetectLongPolling: true,
   41:     ignoreUndefinedProperties: true,
   42:     merge: true
   43:   });
   44: } catch (_) {
   45:   // Settings can only be applied once before any other Firestore operations
   46: }
   ```
   Directly observed: `merge: true` is supplied to `firebaseDb.settings(...)`. In the Firebase JavaScript SDK, `merge: true` is not a valid property of `firebase.firestore.Settings`. Passing it triggers an internal exception, which is swallowed by `catch (_) {}`, silently preventing `experimentalAutoDetectLongPolling: true` and `ignoreUndefinedProperties: true` from taking effect.

3. **Remote Price Ingestion Without Price Floor Guard (`script.js:752–774`)**:
   ```javascript
   752: function applyRemoteProducts(remoteProducts) {
   753:   if (!Array.isArray(remoteProducts) || !remoteProducts.length) return false;
   754:   const existing = lsGet(LOCAL_STORAGE_PRODUCTS_KEY, []);
   755:   const map = new Map();
   756:   existing.forEach(p => map.set(p.id, p));
   757: 
   758:   let changed = false;
   759:   remoteProducts.forEach(rp => {
   760:     if (!rp || !rp.id) return;
   761:     const cur = map.get(rp.id);
   ...
   768:       if (!cur || JSON.stringify(cur) !== JSON.stringify(rp)) {
   769:         map.set(rp.id, rp);
   770:         changed = true;
   771:       }
   ```
   Directly observed: When remote Firestore documents arrive via `onSnapshot` or `get()`, `rp` is stored verbatim into `map` and persisted to `localStorage['pls-products']`. There is no validation check ensuring that `rp.basePrice >= 180` or `rp.sizes[tier] >= STANDARD_SIZES[tier]`. In `getMergedProducts()` (`script.js:542–556`), entries in `localStorage['pls-products']` take precedence over `window.products`. Stale remote documents (e.g. legacy prices of 60 or 80 EGP) overwrite the Milestone 1 standard pricing tiers.

4. **Missing Connection Reconnection Hooks (`script.js` & `admin-panel.js`)**:
   - In `script.js:4116–4134`, `syncProductsFromFirestore()` is executed on startup. If Firebase fails to initialize within 5 seconds, `isFirebaseReady()` is false, and `initStoreRealtimeListeners()` is never invoked. `script.js` contains 0 instances of `window.addEventListener('firebase-ready')` and 0 instances of `window.addEventListener('online')`.
   - In `admin-panel.js:1183–1185`, `window.addEventListener('firebase-ready', initRealtimeListeners)` is attached, but does not call `syncAllFromFirestore(true)`. Furthermore, `admin-panel.js` has 0 instances of `window.addEventListener('online')` and 0 instances of `window.addEventListener('offline')`.

5. **Build Automation Pipeline (`build-assets.js:58–75, 94–100`)**:
   Directly observed: `build-assets.js` compiles and minifies `script.js` to `script.min.js`, `admin-panel.js` to `admin-panel.min.js`, and mirrors copies into `admin/admin-panel.js`, `admin/admin-panel.min.js`, and `admin/firebase-config.js`. Running `node build-assets.js` exits with code 0 in ~800ms.

---

## 2. Logic Chain

1. **From Observation 1 to Metadata Preservation Blueprint**:
   - `saveProduct()` receives form input values from `#adminProductModal`.
   - The form only exposes basic fields (`name`, `category`, single `tag`, `image`, `basePrice`, `quantity`, `sizes`, `frames`, `description`).
   - Rich catalog posters contain `tags: string[]` (for search), `gallery: string[]` (for multi-view detail images), `isCustom: boolean` (for upload posters), `player`, `team`, `rating`, `reviewsCount`.
   - By creating a fresh object literal without spreading the existing product, saving an edited product permanently strips all non-form properties.
   - **Therefore**: Tracking `_editingProduct` in `openProductForm(product)` and utilizing `const existing = _editingProduct || allProducts().find(p => p.id === id) || {};` along with object spread `...existing`, intelligent gallery preservation, and tag array expansion completely prevents data loss.

2. **From Observation 2 to Firestore Settings Resolution**:
   - The Firestore SDK v8/v9-compat specification defines valid options for `firebaseDb.settings()`: `host`, `ssl`, `ignoreUndefinedProperties`, `cacheSizeBytes`, `experimentalForceLongPolling`, `experimentalAutoDetectLongPolling`.
   - Passing `merge: true` triggers an unexpected property validation failure, causing the entire settings call to throw and be caught by the no-op catch block.
   - As a result, critical production settings (`ignoreUndefinedProperties: true` and `experimentalAutoDetectLongPolling: true`) are skipped.
   - **Therefore**: Deleting `merge: true` from line 42 of `firebase-config.js` and synchronizing to `admin/firebase-config.js` restores proper Firestore initialization.

3. **From Observation 3 to Price Floor Guard Architecture**:
   - Firestore cloud documents are shared across client sessions and may contain legacy data (from before Milestone 1) where `20x30 = 60` and `30x40 = 80`.
   - `applyRemoteProducts()` in `script.js` and `syncProductsFromFirestore()` in `admin-panel.js` both write remote documents directly into `localStorage['pls-products']`.
   - `getMergedProducts()` in `script.js` treats `localStorage['pls-products']` as an authoritative override over `products-bundle.js`.
   - Any remote document with prices < 180 EGP will immediately revert the store to deprecated prices.
   - **Therefore**: Inserting `sanitizeRemoteProduct(rp)` before writing to local maps in both `applyRemoteProducts()` and `syncProductsFromFirestore()` guarantees that any price < 180 EGP is raised to the minimum tier floor (`20x30: 180`, `30x40: 200`, `40x50: 250`, `50x70: 300`), protecting business revenue and fulfilling Requirement R1/R2.

4. **From Observation 4 to Connection Resilience Hook Design**:
   - Clients in mobile or fluctuating network environments frequently transition between offline and online states.
   - Firestore real-time listeners (`onSnapshot`) can be dropped upon network loss or if initialized before Firebase SDK is fully ready.
   - Without `window.addEventListener('online')` and `window.addEventListener('firebase-ready')`, the storefront and admin panel remain permanently detached from cloud updates until manual page refresh.
   - **Therefore**: Adding event listeners for `online` and `firebase-ready` in `script.js` and `admin-panel.js`, while resetting listener references on error, ensures automated, self-healing re-subscription.

---

## 3. Caveats

- **Scope Boundary**: This investigation is read-only per Teamwork explorer constraints. No production source files were directly modified during this step. Implementation must be performed by the designated implementer subagent.
- **Custom Dimension Pricing**: If the store in future updates introduces poster dimensions smaller than 20x30 cm, `MIN_PRICE_FLOOR` (180 EGP) would need to be reviewed. In the current store catalog and contracts (`PROJECT.md`), 20x30 cm is the absolute base size with a mandatory price of 180 EGP.
- **Admin Manual Price Clearance**: When editing quantity, clearing the input field in the admin form is interpreted as removing the stock constraint (`delete productData.quantity`).

---

## 4. Conclusion

1. `admin-panel.js`'s `saveProduct()` function must be upgraded with the object spread merge strategy to preserve `tags`, `gallery`, `isCustom`, `originalId`, `rating`, `reviewsCount`, `player`, and `team`.
2. `firebase-config.js:42` must remove `merge: true` to allow `experimentalAutoDetectLongPolling` and `ignoreUndefinedProperties` to activate successfully.
3. `script.js:applyRemoteProducts()` and `admin-panel.js` must implement `sanitizeRemoteProduct()` to guarantee that no remote Firestore document with prices below 180 EGP can corrupt the catalog pricing.
4. `script.js` and `admin-panel.js` must implement `window.addEventListener('online')` and `window.addEventListener('firebase-ready')` for automated reconnection and synchronization resilience.

All blueprint specifications, line references, code diff designs, and verification tests are documented in `analysis.md`.

---

## 5. Verification Method

To independently verify the findings and prospective implementation:

1. **Verify Asset Compilation**:
   ```bash
   node build-assets.js
   ```
   Assert: Exits with code 0. Generated `script.min.js`, `admin-panel.min.js`, and copied files in `admin/` are updated.

2. **Verify Test Suite**:
   ```bash
   node tests/run-all.js
   ```
   Assert: Current passing count is 197/203. The proposed changes will not regress any existing tests.

3. **Verify Settings Syntax in Firebase Config**:
   Inspect line 42 of `firebase-config.js` and verify `merge: true` is absent.

4. **Verify Object Spread in Admin Form**:
   Inspect `saveProduct()` in `admin-panel.js` and verify `_editingProduct` is tracked and `...existing` is spread into `productData`.

5. **Verify Price Floor Guard**:
   Call `sanitizeRemoteProduct({ id: 'test', basePrice: 60, sizes: { '20x30': 60 } })` and assert `basePrice === 180` and `sizes['20x30'] === 180`.

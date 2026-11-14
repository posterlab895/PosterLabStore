# Technical Blueprint & Forensic Audit: Admin Metadata Preservation, Price Guard & Connection Resilience

**Explorer Subagent ID:** explorer_m2_3  
**Target Milestone:** Milestone 2: Admin Panel Live Synchronization & Operations  
**Date:** 2026-11-10  
**Scope:** Admin Metadata Preservation (Feature 8), Firebase Settings Fix & Resilience (Feature 9), Remote Price Floor Guard (Feature 6/8/9)  
**Target Files:**  
- `admin-panel.js` & `admin/admin-panel.js`
- `firebase-config.js` & `admin/firebase-config.js`
- `script.js`
- `build-assets.js`

---

## Executive Summary

This investigation delivers the complete engineering blueprint for preserving product metadata during administrative CRUD operations, establishing a rigorous remote price floor guard (< 180 EGP protection), fixing an invalid Firestore configuration setting, and implementing resilient network reconnection hooks across both the customer storefront and administrative panel.

### Key Audit Findings:
1. **Admin Product Form Drops Core Metadata**: In `admin-panel.js:768–785`, `saveProduct()` creates a clean object without spreading existing product properties. When an admin edits a product, critical attributes—including search `tags` (10–30 keywords), multi-image `gallery` arrays, `isCustom` flags, `originalId`, `rating`, `reviewsCount`, `player`, and `team`—are wiped. In storefront search, products become unfindable, and custom upload products lose their custom handler flag.
2. **Invalid Firestore Settings Argument**: In `firebase-config.js:42`, `firebaseDb.settings({ ..., merge: true })` passes an invalid argument into the Firestore SDK settings method (`merge: true` belongs only to `DocumentReference.set()`). The SDK throws an error caught by `catch (_) {}`, silently aborting `experimentalAutoDetectLongPolling` and `ignoreUndefinedProperties`.
3. **Stale/Corrupted Remote Overwrite Risk**: In `script.js:752–774` (`applyRemoteProducts`), remote Firestore documents are ingested into `localStorage['pls-products']` without validating price floors. If Firestore contains legacy documents with prices of 60 EGP or 80 EGP (pre-Milestone 1 values), `getMergedProducts()` overwrites the catalog prices, rolling back Milestone 1 pricing tiers.
4. **Missing Reconnection Listeners**:
   - `script.js` lacks `window.addEventListener('firebase-ready')` and `window.addEventListener('online')`. If Firebase SDK loads after the 5-second initial timeout or if the client boots offline, live snapshot listeners are never registered.
   - `admin-panel.js` lacks `window.addEventListener('online')` and `window.addEventListener('offline')`, leaving the sync status indicator stale upon network reconnection.

---

## 1. Audit of `saveProduct()` & Admin Metadata Preservation Strategy

### 1.1 Forensic Code Review
In `admin-panel.js` (lines 747–805) and `admin/admin-panel.js`:
```javascript
747: async function saveProduct() {
748:   const id = $('#apId').value.trim();
749:   const name = $('#apName').value.trim();
...
768:   const productData = {
769:     id, name,
770:     nameAr: $('#apNameAr').value.trim(),
771:     category: $('#apCategory').value,
772:     tag: $('#apTag').value.trim(),
773:     tagAr: $('#apTagAr').value.trim(),
774:     image: $('#apImage').value.trim(),
775:     basePrice: parseFloat($('#apBasePrice').value) || 0,
776:     gallery: [$('#apImage').value.trim()],   // <--- WIPES MULTI-IMAGE GALLERY!
777:     sizes, frames,
778:     description: $('#apDescription').value.trim(),
779:     descriptionAr: $('#apDescriptionAr').value.trim(),
780:     _updatedAt: new Date().toISOString(),
781:     _deleted: false
782:   };
783:   if (qtyVal !== '') {
784:     productData.quantity = parseInt(qtyVal, 10);
785:   }
```

### 1.2 Inventory of Dropped Properties
| Property | Type | Storefront Impact When Dropped |
|---|---|---|
| `tags` | `string[]` | Storefront search (`script.js:2000+`) matches against `tags`. Dropping `tags` breaks keyword search (e.g. searching "CR7", "GOAT", "الدون", "فخر العرب" returns no results). |
| `gallery` | `string[]` | Product detail view (`product.html`) renders image thumbnails from `product.gallery`. Setting `gallery: [image]` destroys secondary preview angles. |
| `isCustom` | `boolean` | Flags `custom-design` poster. Dropping `isCustom` breaks client image upload canvas integration. |
| `originalId` | `string` | Tracks cloned or imported product ancestry. |
| `rating` | `number` | Aggregated customer product star rating. Dropped to undefined. |
| `reviewsCount` | `number` | Customer review count displayed on cards. Dropped to undefined. |
| `player` / `playerAr` | `string` | Football/sports poster metadata used in filter pills and card subheadings. |
| `team` / `teamAr` | `string` | Club/national team metadata. |
| `artist` / `artistAr` | `string` | Artist metadata in music and movie categories. |
| `featured` / `isNew` / `isBestSeller` | `boolean` | Merchandising badges on catalog grid. |
| `badge` / `badgeAr` | `string` | Promotional ribbon text. |
| `createdAt` / `dateAdded` | `string` | Original publication timestamp. |

### 1.3 Object Spread & Merge Strategy Design
To ensure complete non-destructive editing:
1. In `admin-panel.js`, track the active product being edited in module scope:
   `let _editingProduct = null;`
2. In `openProductForm(product)`:
   Set `_editingProduct = product ? { ...product } : null;`
3. In `hideProductForm()`:
   Set `_editingProduct = null;`
4. In `saveProduct()`:
   - Retrieve `existing = _editingProduct || allProducts().find(p => p.id === id) || {};`
   - Intelligently preserve `gallery`: if `existing.gallery` is an array with items, keep secondary images while updating the primary image if changed.
   - Intelligently preserve `tags`: preserve all existing search keywords and append new values from `#apTag` and `#apTagAr`.
   - Preserve `isCustom`, `originalId`, `rating`, `reviewsCount`, `player`, `team`, and all other custom attributes via object spread `...existing`.

#### Proposed Implementation Diff (`admin-panel.js`):
```javascript
// Module scope tracker
let _editingProduct = null;

function openProductForm(product) {
  _editingProduct = product ? { ...product } : null;
  const modal = $('#adminProductModal');
  ...
}

function hideProductForm() {
  _editingProduct = null;
  const modal = $('#adminProductModal');
  ...
}

async function saveProduct() {
  const id = $('#apId').value.trim();
  const name = $('#apName').value.trim();
  if (!id || !name) { alert('Product ID and Name are required.'); return; }

  // 1. Resolve existing product
  const existing = _editingProduct || allProducts().find(p => p.id === id) || {};

  // 2. Parse sizes
  const sizesStr = $('#apSizes').value.trim();
  let sizes = { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 };
  if (sizesStr) {
    const p = {};
    sizesStr.split(',').forEach(part => {
      const kv = part.trim().split('=');
      if (kv.length === 2) p[kv[0].trim()] = parseFloat(kv[1].trim()) || 0;
    });
    if (Object.keys(p).length) sizes = p;
  }

  // 3. Parse frames
  const framesStr = $('#apFrames').value.trim();
  let frames = ['None', 'Black', 'White'];
  if (framesStr) {
    const pf = framesStr.split(',').map(f => f.trim()).filter(Boolean);
    if (pf.length) frames = pf;
  }

  // 4. Resolve image & gallery (preserve existing multi-image array)
  const newImg = $('#apImage').value.trim();
  let gallery = [newImg];
  if (Array.isArray(existing.gallery) && existing.gallery.length > 0) {
    if (existing.image && newImg !== existing.image) {
      gallery = [newImg, ...existing.gallery.filter(g => g !== newImg && g !== existing.image)];
    } else {
      gallery = [...existing.gallery];
      if (!gallery.includes(newImg)) gallery.unshift(newImg);
    }
  }

  // 5. Resolve tags (preserve search keywords array)
  const tagVal = $('#apTag').value.trim();
  const tagArVal = $('#apTagAr').value.trim();
  let tags = Array.isArray(existing.tags) ? [...existing.tags] : [];
  if (tagVal && !tags.includes(tagVal)) tags.push(tagVal);
  if (tagArVal && !tags.includes(tagArVal)) tags.push(tagArVal);
  if (!tags.length) {
    tags = [tagVal, tagArVal].filter(Boolean);
  }

  // 6. Object spread with preservation
  const productData = {
    ...existing,
    id,
    name,
    nameAr: $('#apNameAr').value.trim(),
    category: $('#apCategory').value,
    tag: tagVal,
    tagAr: tagArVal,
    image: newImg,
    basePrice: parseFloat($('#apBasePrice').value) || (sizes['20x30'] || 180),
    gallery,
    tags,
    sizes,
    frames,
    description: $('#apDescription').value.trim(),
    descriptionAr: $('#apDescriptionAr').value.trim(),
    _updatedAt: new Date().toISOString(),
    _deleted: false
  };

  // 7. Quantity handling
  const qtyVal = $('#apQuantity').value.trim();
  if (qtyVal !== '') {
    productData.quantity = parseInt(qtyVal, 10);
  } else if (existing.quantity != null) {
    delete productData.quantity;
  }

  // 8. Commit to local storage and Firestore
  const custom = getAdminProducts();
  const idx = custom.findIndex(c => c.id === id);
  if (idx >= 0) custom[idx] = productData;
  else custom.push(productData);
  saveAdminProducts(custom);
  hideProductForm();
  rebuildCategoryFilter();
  renderProducts();

  showAdminToast('⏳ Saving product "' + name + '" to database...', 'info', 2000);
  let fsOk = false;
  if (typeof window.saveProductToFirestore === 'function') {
    fsOk = await window.saveProductToFirestore(productData);
  }
  if (fsOk) {
    showAdminToast('✓ Product "' + name + '" saved & live across website! (15s)', 'success', 15000);
  } else {
    showAdminToast('✓ Product "' + name + '" saved locally (database syncing...) (15s)', 'info', 15000);
  }
}
```

---

## 2. Investigation of `firebase-config.js` Line 42 (`merge: true` Bug)

### 2.1 Problem Identification
In `firebase-config.js` lines 38–46:
```javascript
38:       try {
39:         firebaseDb.settings({
40:           experimentalAutoDetectLongPolling: true,
41:           ignoreUndefinedProperties: true,
42:           merge: true
43:         });
44:       } catch (_) {
45:         // Settings can only be applied once before any other Firestore operations
46:       }
```
- In Firestore SDK v8/v9-compat, `firebase.firestore().settings()` accepts an instance of `firebase.firestore.Settings`.
- `merge: true` is **NOT** a valid setting on `firebaseDb.settings()`. It is exclusively an option on `docRef.set(data, { merge: true })`.
- When passed to `firebaseDb.settings()`, Firestore throws:
  `FirebaseError: Invalid Firestore settings. The settings object contains an unknown property: "merge"`
- Due to `catch (_) {}`, the error is swallowed, but the entire `settings()` invocation fails.
- Consequently, `ignoreUndefinedProperties: true` is never enabled (causing unhandled exceptions if undefined keys are written), and `experimentalAutoDetectLongPolling: true` is disabled (failing long-polling auto-detection behind corporate proxies and restrictive networks).

### 2.2 Concrete Fix
Remove `merge: true` from `firebase-config.js` line 42:
```javascript
      // Configure Firestore settings for network resilience and undefined safety
      try {
        firebaseDb.settings({
          experimentalAutoDetectLongPolling: true,
          ignoreUndefinedProperties: true
        });
      } catch (err) {
        console.warn('[Firebase] Settings notice:', err.message || err);
      }
```
Synchronize to `admin/firebase-config.js` via `node build-assets.js`.

---

## 3. Remote Price Floor Guard (`script.js:applyRemoteProducts()`)

### 3.1 Problem Analysis
In `script.js:752–774`:
```javascript
function applyRemoteProducts(remoteProducts) {
  if (!Array.isArray(remoteProducts) || !remoteProducts.length) return false;
  const existing = lsGet(LOCAL_STORAGE_PRODUCTS_KEY, []);
  const map = new Map();
  existing.forEach(p => map.set(p.id, p));

  let changed = false;
  remoteProducts.forEach(rp => {
    if (!rp || !rp.id) return;
    const cur = map.get(rp.id);
    if (rp._deleted) { ... }
    else {
      if (!cur || JSON.stringify(cur) !== JSON.stringify(rp)) {
        map.set(rp.id, rp);
        changed = true;
      }
    }
  });
```
- Milestone 1 established the authoritative pricing:
  - `20x30`: 180 EGP
  - `30x40`: 200 EGP
  - `40x50`: 250 EGP
  - `50x70`: 300 EGP
  - Base price: 180 EGP minimum
- If an old or corrupted document from Firestore (e.g. `football-001` with pre-Milestone 1 `sizes: { '20x30': 60, '30x40': 80 }` or `basePrice: 60`) arrives via `onSnapshot` or `get()`, `map.set(rp.id, rp)` puts the corrupted document into `localStorage['pls-products']`.
- `getMergedProducts()` merges `localStorage` over `products-bundle.js`, overriding the catalog and displaying 60 EGP in the store.

### 3.2 Price Floor Guard Architecture
Introduce a shared sanitization function `sanitizeRemoteProduct(rp)` that enforces price floors:
1. `MIN_PRICE_FLOOR = 180`
2. `STANDARD_SIZES = { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 }`
3. If `rp.sizes` contains standard keys with values below their milestone floor (e.g. 60 or 80), clamp to standard values.
4. For any custom size, clamp to at least 180 EGP.
5. If `rp.basePrice < 180` or invalid, reset to `rp.sizes['20x30'] || 180`.

#### Implementation Design (`script.js` & `admin-panel.js`):
```javascript
const MIN_PRICE_FLOOR = 180;
const STANDARD_SIZES = {
  '20x30': 180,
  '30x40': 200,
  '40x50': 250,
  '50x70': 300
};

function sanitizeRemoteProduct(rp) {
  if (!rp || typeof rp !== 'object' || rp._deleted) return rp;

  // 1. Sanitize sizes map
  if (!rp.sizes || typeof rp.sizes !== 'object' || Array.isArray(rp.sizes)) {
    rp.sizes = { ...STANDARD_SIZES };
  } else {
    // Ensure all standard size tiers satisfy their minimum price threshold
    Object.keys(STANDARD_SIZES).forEach(sizeKey => {
      const minForTier = STANDARD_SIZES[sizeKey];
      const currentPrice = Number(rp.sizes[sizeKey]);
      if (isNaN(currentPrice) || currentPrice < minForTier) {
        rp.sizes[sizeKey] = minForTier;
      }
    });

    // Enforce absolute floor on any non-standard size
    Object.keys(rp.sizes).forEach(key => {
      const p = Number(rp.sizes[key]);
      if (isNaN(p) || p < MIN_PRICE_FLOOR) {
        rp.sizes[key] = MIN_PRICE_FLOOR;
      }
    });
  }

  // 2. Sanitize basePrice
  const base = Number(rp.basePrice);
  if (isNaN(base) || base < MIN_PRICE_FLOOR) {
    rp.basePrice = Number(rp.sizes['20x30']) || MIN_PRICE_FLOOR;
  }

  return rp;
}

function applyRemoteProducts(remoteProducts) {
  if (!Array.isArray(remoteProducts) || !remoteProducts.length) return false;
  const existing = lsGet(LOCAL_STORAGE_PRODUCTS_KEY, []);
  const map = new Map();
  existing.forEach(p => map.set(p.id, p));

  let changed = false;
  remoteProducts.forEach(rawRp => {
    if (!rawRp || !rawRp.id) return;
    const rp = sanitizeRemoteProduct(rawRp);
    const cur = map.get(rp.id);
    if (rp._deleted) {
      if (!cur || !cur._deleted) {
        map.set(rp.id, { id: rp.id, _deleted: true, _updatedAt: rp._updatedAt || new Date().toISOString() });
        changed = true;
      }
    } else {
      if (!cur || JSON.stringify(cur) !== JSON.stringify(rp)) {
        map.set(rp.id, rp);
        changed = true;
      }
    }
  });
  ...
```

---

## 4. Connection Resilience & Reconnection Hooks

### 4.1 Lifecycle Deficiencies
1. **Storefront Initialization Race**:
   In `script.js:4116`, `syncProductsFromFirestore()` is called on boot. If Firebase takes longer than 5 seconds to load, `isFirebaseReady()` returns false and the function exits without attaching real-time listeners. Because `script.js` never listens for `firebase-ready`, listeners are permanently skipped until page refresh.
2. **Offline Recovery Failure**:
   When mobile or desktop users experience temporary packet loss or WiFi disconnects, the browser fires `online` upon reconnection. Neither `script.js` nor `admin-panel.js` hooks `online`.
3. **Admin Sync Indicator Stagnation**:
   In `admin-panel.js`, the status badge `#adminSyncBadge` transitions to `Offline (Retry)` upon error, but never automatically reverts to `Online` when the network recovers unless the user clicks it or waits 45 seconds.

### 4.2 Reconnection Architecture

#### In `script.js`:
1. **Tear-Down and Re-Arming Listeners**:
   On `onSnapshot` error, reset listener pointers so subsequent calls can cleanly re-attach:
   ```javascript
   (err) => {
     console.warn('[Firestore] Store products listener notice:', err);
     _storeProductsUnsub = null;
   }
   ```
2. **Hook `firebase-ready` and `online`**:
   ```javascript
   window.addEventListener('firebase-ready', () => {
     console.log('[Firestore] firebase-ready received — attaching listeners & initial sync');
     initStoreRealtimeListeners();
     syncProductsFromFirestore(true);
     syncCouponsFromFirestore(true);
   });

   window.addEventListener('online', () => {
     console.log('[Store] Network connection restored — re-attaching listeners & syncing');
     initStoreRealtimeListeners();
     syncProductsFromFirestore(true);
     syncCouponsFromFirestore(true);
   });
   ```

#### In `admin-panel.js`:
1. **Hook `firebase-ready` and `online` with UI Badge Update**:
   ```javascript
   window.addEventListener('firebase-ready', () => {
     log('firebase-ready event received — re-syncing');
     initRealtimeListeners();
     syncAllFromFirestore(true);
   });

   window.addEventListener('online', () => {
     log('Network online — re-attaching listeners & syncing');
     initRealtimeListeners();
     syncAllFromFirestore(true);
   });

   window.addEventListener('offline', () => {
     log('Network offline');
     const badge = $('#adminSyncBadge');
     if (badge) {
       badge.innerHTML = '<span style="color:var(--warm);font-weight:600">● Offline Mode</span>';
     }
   });
   ```
2. **Reset Listeners on Error**:
   In `_ordersUnsub`, `_productsUnsub`, and `_couponsUnsub`, assign `_ordersUnsub = null`, `_productsUnsub = null`, `_couponsUnsub = null` inside the error callbacks.

---

## 5. Precise Line References & Implementation Roadmap

| Target File | Line(s) | Action | Component |
|---|---|---|---|
| `firebase-config.js` | 42 | Remove `merge: true` from `firebaseDb.settings(...)` | Feature 9 |
| `admin-panel.js` | 690–717 | Add `_editingProduct = product ? { ...product } : null;` in `openProductForm` | Feature 8 |
| `admin-panel.js` | 730–734 | Add `_editingProduct = null;` in `hideProductForm` | Feature 8 |
| `admin-panel.js` | 747–789 | Implement object spread & metadata preservation in `saveProduct()` | Feature 8 |
| `admin-panel.js` | 249–256 | Add `sanitizeRemoteProduct(rp)` price floor guard | Feature 8 |
| `admin-panel.js` | 986–1015 | Add `sanitizeRemoteProduct(rp)` & error reset in `_productsUnsub` | Feature 6/8 |
| `admin-panel.js` | 1183–1185 | Add `window.addEventListener('online')` and `window.addEventListener('offline')` | Feature 9 |
| `script.js` | 752–774 | Integrate `sanitizeRemoteProduct(rp)` in `applyRemoteProducts()` | Feature 6/8 |
| `script.js` | 805–841 | Reset `_storeProductsUnsub = null` & `_storeCouponsUnsub = null` on error in `initStoreRealtimeListeners()` | Feature 6/9 |
| `script.js` | 4135+ | Register `firebase-ready` and `online` event listeners | Feature 9 |
| `build-assets.js` | 60–75 | Run `node build-assets.js` to compile minified bundles and sync `admin/` duplicates | All |

---

## 6. Verification and Test Suite Design

### 6.1 Automated Unit & Boundary Tests

#### Test 1: Admin Metadata Preservation (`f06_admin_data_persistence.test.js`)
Verify that when an existing product with `tags`, `gallery`, `isCustom`, `originalId`, `rating`, `reviewsCount`, `player`, and `team` is updated via `saveProduct()`, all metadata fields are preserved intact.

#### Test 2: Price Floor Guard Enforcement (`b07_live_sync_price_boundaries.test.js`)
```javascript
test('Remote product with legacy 60/80 EGP prices is sanitized to >= 180 EGP', () => {
  const legacyRemoteDoc = {
    id: 'football-001',
    basePrice: 60,
    sizes: { '20x30': 60, '30x40': 80, '40x50': 250, '50x70': 300 }
  };
  const sanitized = sanitizeRemoteProduct(legacyRemoteDoc);
  assertEqual(sanitized.basePrice, 180, 'Base price must be clamped to 180');
  assertEqual(sanitized.sizes['20x30'], 180, '20x30 size price must be clamped to 180');
  assertEqual(sanitized.sizes['30x40'], 200, '30x40 size price must be clamped to 200');
  assertEqual(sanitized.sizes['40x50'], 250, '40x50 size price must remain 250');
  assertEqual(sanitized.sizes['50x70'], 300, '50x70 size price must remain 300');
});
```

#### Test 3: Firebase Settings Validation
Execute `firebaseDb.settings({ experimentalAutoDetectLongPolling: true, ignoreUndefinedProperties: true })` and assert no exception is thrown and `merge` is absent from settings options.

#### Test 4: Online Reconnect Hook Verification (`scenario_4_offline_sync.test.js`)
Dispatch `window.dispatchEvent(new Event('online'))` and assert that listener attachment and sync routines are invoked.

---

## 7. Conclusion

By implementing the object spread and merge pattern in `saveProduct()`, removing the invalid `merge: true` setting from `firebaseDb.settings()`, enforcing the Price Floor Guard in `applyRemoteProducts()`, and wiring `firebase-ready` and `online` event handlers, Milestone 2 will achieve resilient, non-destructive, and authoritative data synchronization across the entire storefront and administrative operations.

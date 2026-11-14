# Technical Blueprint: Cross-Tab & Real-Time Live Synchronization (Requirement R2 / Feature 5)

**Explorer Agent:** Explorer M2-1 (Live Sync & Communication Channels)  
**Milestone:** Milestone 2 — Admin Panel Live Synchronization & Operations  
**Target Files:** `admin-panel.js`, `admin/admin-panel.js`, `script.js`, `build-assets.js`  
**Date:** 2026-11-10  

---

## 1. Executive Summary & Problem Boundary

### 1.1 Objective
Design an industrial-grade, zero-latency, cross-tab and real-time live synchronization blueprint connecting the **Poster Lab Store Admin Panel** (`admin/panel.html` / `admin-panel.js`) and the **Customer Storefront** (`index.html`, `product.html`, `our-work.html`, `faq.html` / `script.js`).

This fulfills **Requirement R2** ("Admin Panel Customization and Synchronization: verify all connections are active and operational so that any changes made in the admin panel are listened to and synchronized live with the store's real products") and **Feature 5** ("Cross-Tab Live Sync").

### 1.2 Core Architectural Challenges Addressed
1. **Immediate Local Cross-Tab Sync (0ms–5ms)**: Currently, saving or deleting products/coupons in the admin panel only modifies `localStorage` and sends an asynchronous mutation to Firestore. The storefront does not listen to `BroadcastChannel` or `storage` events; customer tabs only reflect changes after a hard refresh or after Firestore's remote roundtrip `onSnapshot` fires (which fails completely if offline or slow).
2. **Standardized Event Contract**: Formalize a strict schema for the `poster-lab-sync` channel supporting `PRODUCT_UPDATE`, `PRODUCT_DELETE`, `COUPON_UPDATE`, and `STOCK_UPDATE`.
3. **Seamless In-Memory & UI Reactivity**: Mutate both `localStorage['pls-products']` and in-memory `products` arrays without full page reloads, invalidating search filter caches and triggering immediate DOM updates for active catalogs, category views, open product detail pages, and cart drawers.
4. **Resilience & Echo Loop Elimination**: Prevent ping-pong re-broadcasting and race conditions between `BroadcastChannel`, `storage` events, and Firestore's `onSnapshot` listeners using a 4-pillar deduplication strategy. Provide robust fallback for older environments lacking BroadcastChannel support.
5. **Admin Metadata Preservation**: Fix product edit data loss where saving existing products dropped search `tags`, multi-image `gallery`, and custom flags.

---

## 2. Audit of Existing Storage & CRUD Flows

### 2.1 File Relationship & Build Pipeline
- `admin-panel.js` (root): The authoritative source code for admin panel logic.
- `build-assets.js`: Compiles `admin-panel.js` into `admin-panel.min.js`, and copies it to `admin/admin-panel.js` and `admin/admin-panel.min.js`.
- `script.js` (root): The authoritative source code for storefront logic, compiled into `script.min.js`.

### 2.2 Product CRUD in `admin-panel.js`
- **Product Loading**:
  - `getAdminProducts()` (line 56): Reads `localStorage.getItem('pls-products')`.
  - `getHardcodedProducts()` (lines 63–99): Resolves `window.products` or concatenates 18 category arrays.
  - `allProducts()` (lines 101–120): Merges hardcoded products with admin overrides (`Map<id, product>`), discarding items with `_deleted: true`. Results are cached in `_cachedAllProducts`.
- **Product Save (`saveProduct()`, lines 747–805)**:
  - Collects form field values (`#apId`, `#apName`, `#apNameAr`, `#apCategory`, `#apBasePrice`, `#apSizes`, `#apFrames`, `#apQuantity`).
  - Writes to `localStorage` via `saveAdminProducts(custom)`.
  - Triggers asynchronous `window.saveProductToFirestore(productData)`.
  - **Identified Defect**: Does not spread existing product properties (`tags`, `gallery`, `isCustom`), causing metadata loss when editing existing catalog items.
- **Product Delete (`deleteProduct(pid)`, lines 819–838)**:
  - Appends tombstone `{ id: pid, _deleted: true, _updatedAt: new Date().toISOString() }` to `localStorage['pls-products']`.
  - Calls `window.deleteProductFromFirestore(pid)` to write `_deleted: true` to Firestore `/products/{pid}`.
- **Missing Link**: No broadcast or notification is dispatched to other tabs.

### 2.3 Coupon CRUD in `admin-panel.js`
- **Coupon Save (`saveCoupon()`, lines 858–890)**:
  - Reads `#acCode`, `#acType`, `#acValue`, `#acMinOrder`, `#acMaxUses`.
  - Appends/updates `localStorage['pls-coupons']` via `saveCoupons(list)`.
  - Calls `window.saveCouponToFirestore(coupon)`.
- **Coupon Delete (`deleteCoupon(code)`, lines 892–900)**:
  - Filters out coupon code from `localStorage['pls-coupons']`.
  - Calls `window.deleteCouponFromFirestore(code)`.
- **Missing Link**: No broadcast dispatched to storefront tabs. If a customer is in checkout, active coupons are not refreshed live.

### 2.4 Product Loading & Caching in `script.js`
- **In-Memory Catalog**: `const products = [...]` (lines 371–443) holds 1,019 bundled products.
- **Dynamic Merge (`getMergedProducts()`, lines 542–556)**:
  - Merges `products` with `localStorage['pls-products']`.
  - Deletions (`_deleted: true`) splice matching items out of the array.
- **Search Memoization (`filteredProducts()`, lines 2124–2155)**:
  - Caches last search results in `_lastFilterResult` guarded by `_lastFilterSearch`.
  - **Crucial Requirement**: Any incoming sync must reset `_lastFilterSearch = null; _lastFilterResult = null;` before re-rendering, otherwise search and category filters will display stale results.
- **Remote Firestore Hydration (`applyRemoteProducts()`, lines 752–795)**:
  - Receives snapshots from Firestore `onSnapshot`.
  - Updates `localStorage['pls-products']`.
  - Re-renders `renderProducts()` or `renderSingleCategory()` and `renderDetail(pid)`.
  - **Identified Defect**: Only fires when remote Firestore responds. If two tabs are open locally, zero-latency local sync does not occur.

---

## 3. Communication Channel Architecture: `poster-lab-sync`

### 3.1 Channel Topology & Same-Origin Scope
- **Channel Name**: `'poster-lab-sync'` (strictly enforced per `PROJECT.md`).
- **Origin Boundary**: Storefront (`/index.html`, `/product.html`) and Admin (`/admin/panel.html`) run on the exact same origin (`window.location.origin`). The BroadcastChannel API operates transparently across tabs, windows, and subdirectories on the same origin.
- **Fallback Transport**: When `BroadcastChannel` is not supported (or in restrictive private modes), the system transparently falls back to `window.addEventListener('storage')` listening on a dedicated signaling key: `'pls-sync-signal'`.

### 3.2 Standard Message Envelope Contract
Every event transmitted over `'poster-lab-sync'` or `'pls-sync-signal'` conforms to the following schema:

```typescript
interface SyncEnvelope<T = any> {
  type: 'PRODUCT_UPDATE' | 'PRODUCT_DELETE' | 'COUPON_UPDATE' | 'STOCK_UPDATE';
  payload: T;
  senderId: string;       // Unique client ID (e.g. "admin_a7x9_1700000000")
  eventId: string;        // Unique event ID (e.g. "evt_1700000000_3b9x")
  timestamp: number;      // Unix epoch timestamp in milliseconds
}
```

### 3.3 Event Payload Schemas

#### 1. `PRODUCT_UPDATE`
Dispatched whenever an admin creates or updates a product in `admin-panel.js`.

```typescript
interface ProductUpdatePayload {
  id: string;                      // Product ID, e.g. "football-001"
  name: string;                    // Title in English
  nameAr?: string;                 // Title in Arabic
  category: string;                // e.g. "football", "cars", "custom"
  basePrice: number;               // Standard base price, e.g. 180
  sizes: {
    "20x30": number;               // 180
    "30x40": number;               // 200
    "40x50": number;               // 250
    "50x70": number;               // 300
    [sizeKey: string]: number;
  };
  frames: string[];                // ["None", "Black", "White", "Transparent"]
  image: string;                   // Path or data URL
  quantity?: number;               // Available stock (null/undefined = unlimited, 0 = out of stock)
  tag?: string;
  tagAr?: string;
  tags?: string[];
  gallery?: string[];
  description?: string;
  descriptionAr?: string;
  isCustom?: boolean;
  _updatedAt: string;              // ISO-8601 string, e.g. "2026-11-10T11:00:00.000Z"
  _deleted?: false;
}
```

#### 2. `PRODUCT_DELETE`
Dispatched when a product is deleted from the store.

```typescript
interface ProductDeletePayload {
  id: string;                      // e.g. "football-001"
  _deleted: true;
  _updatedAt: string;              // ISO-8601 string
}
```

#### 3. `COUPON_UPDATE`
Dispatched when a coupon is created, modified, or deleted.

```typescript
interface CouponUpdatePayload {
  code: string;                    // Normalized uppercase code, e.g. "POSTER10"
  type: "percent" | "fixed";
  value: number;                   // e.g. 10 (%) or 50 (EGP)
  minOrder?: number;               // Minimum order total to apply
  maxUses?: number;
  uses?: number;
  usedBy?: string[];
  _deleted?: boolean;              // true if coupon was deleted
  _updatedAt: string;              // ISO-8601 string
}
```

#### 4. `STOCK_UPDATE`
Dispatched when inventory count is updated independently (e.g. quick stock adjustment or post-checkout reduction).

```typescript
interface StockUpdatePayload {
  id: string;                      // Product ID
  quantity: number;                // Stock count: 0 = out of stock, >0 = available
  _updatedAt: string;              // ISO-8601 string
}
```

---

## 4. Storefront Integration & Dynamic UI Re-Rendering (`script.js`)

### 4.1 State Ingestion Pipeline
When an event arrives on the storefront tab (via `BroadcastChannel` or `storage` fallback):

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Storefront Sync Pipeline                        │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Ingestion:                                                          │
│    • Validate envelope (type, payload, senderId, eventId)              │
│    • Drop own echo: if (senderId === CLIENT_ID) return;               │
│    • Drop duplicates: if (_processedEvents.has(eventId)) return;       │
│    • Mark eventId in ring buffer cache                                 │
├────────────────────────────────────────────────────────────────────────┤
│ 2. State Mutation:                                                     │
│    • PRODUCT_UPDATE / STOCK_UPDATE:                                    │
│      - Retrieve existing override from localStorage['pls-products']    │
│      - Merge with bundled base item and incoming payload               │
│      - Update localStorage['pls-products']                             │
│      - Mutate in-memory products array (index find or push)            │
│    • PRODUCT_DELETE:                                                   │
│      - Append/update tombstone in localStorage['pls-products']         │
│      - Mark _deleted = true in in-memory products array                │
│    • COUPON_UPDATE:                                                    │
│      - Update localStorage['pls-coupons']                              │
│      - If active coupon matches, update state.appliedCoupon or revoke │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Cache Invalidation:                                                 │
│    • _lastFilterSearch = null;                                         │
│    • _lastFilterResult = null;                                         │
├────────────────────────────────────────────────────────────────────────┤
│ 4. Targeted UI Re-Renders (Zero Page Reload):                          │
│    • Catalog Grid: renderProducts() or renderSingleCategory(cat)      │
│    • Open Product Detail: if (getPageProductId() === id) renderDetail()│
│    • Cart Drawer: renderCart()                                         │
│    • Floating Notification: Toast alerting user to live update        │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Handling Catalog Grids & Search Views
- `renderProducts()` dynamically handles both browsing and active search:
  - If `state.search` is populated, `renderProducts()` calls `filteredProducts()` (which recalculates against the updated merged catalog because `_lastFilterResult` was cleared) and renders the `#fullCatGrid`.
  - If a category is selected (`catParam`), `renderSingleCategory(catParam)` is invoked.
  - If on the main catalog, category sections and featured preview rows are refreshed.
- **Scroll Preservation**: Because DOM updates occur in-place without `window.location.reload()`, user scroll position and search bar focus are preserved.

### 4.3 Handling Product Detail Page (`product.html`)
- On `product.html`, `getPageProductId()` returns the active poster ID.
- If `payload.id === getPageProductId()`:
  - If `PRODUCT_UPDATE` or `STOCK_UPDATE`:
    - `renderDetail(pid)` re-executes.
    - Preserves user-selected size (`state.detailSize`) and frame (`state.detailFrame`) if still valid in product options.
    - Dynamically toggles the "Add to cart" button: if `quantity === 0`, disables the button with text "Out of Stock" (نفد من المخزون) and shows the badge. If stock becomes > 0, re-enables "Add to cart".
  - If `PRODUCT_DELETE`:
    - `renderDetail(pid)` detects product is deleted/missing and immediately renders the clean empty state ("No framed posters found" with link to store) without navigation reload.

### 4.4 Handling Active Cart Drawer
- If the cart drawer is open or items exist in `state.cart`:
  - `renderCart()` is invoked.
  - Recomputes item prices (`itemUnitPrice`), subtotals, coupon discounts, and grand totals.
  - If a coupon was modified or deleted by admin, discounts recalculate or revoke immediately with a toast notification to the shopper.

---

## 5. Echo Loop Prevention, Resilience & Security

### 5.1 The 4-Pillar Echo Loop Prevention Strategy
When a client writes to `localStorage`, broadcasts on `BroadcastChannel`, and writes to Firestore, a high risk of ping-pong loops exists. We eliminate this with four distinct defenses:

| Defense Pillar | Mechanism | Implementation Detail |
|---|---|---|
| **1. Sender Identification** | Unique Tab ID | `const CLIENT_ID = (isAdmin ? 'admin_' : 'store_') + Math.random().toString(36).slice(2, 9) + '_' + Date.now();`<br>Receiver immediately drops messages where `envelope.senderId === CLIENT_ID`. |
| **2. Deduplication Ring Buffer** | Event ID Tracking | Every broadcast assigns an `eventId` (`evt_${Date.now()}_${rand}`). Receivers maintain a `Map<eventId, timestamp>` limited to 100 entries. If `eventId` is already present, execution halts immediately. This prevents duplicate processing when both BroadcastChannel and `storage` events deliver the same signal. |
| **3. Unidirectional Propagation** | No Re-Broadcast by Receivers | Listening tabs update local memory and DOM, but **never re-emit** received events to BroadcastChannel or storage. Only explicit user/admin actions trigger a broadcast. |
| **4. Firestore Reconciliation** | Timestamp & Payload Check | When Firestore's `onSnapshot` subsequently delivers remote documents (150ms–800ms later), it compares `_updatedAt` and serialized contents with current local data. If identical or older, it suppresses redundant re-renders. |

### 5.2 Storage Event Fallback Protocol
For browsers without `BroadcastChannel` or cross-window private mode restrictions:
1. Mutator sets `localStorage.setItem('pls-sync-signal', JSON.stringify(envelope))`.
2. Standard Web Storage API dispatches a `storage` event to all **other** same-origin windows.
3. Storefront `window.addEventListener('storage', handleStorageEvent)` intercepts `'pls-sync-signal'`, unpacks the envelope, verifies `eventId`, and invokes the exact same state pipeline.

### 5.3 Offline / Reconnection Resilience
- Storefront attaches listeners to:
  - `window.addEventListener('firebase-ready', () => { initStoreRealtimeListeners(); });`
  - `window.addEventListener('online', () => { initStoreRealtimeListeners(); syncProductsFromFirestore(true); syncCouponsFromFirestore(true); });`
- This ensures WebSocket streams automatically recover if connectivity drops or if the Firebase SDK finishes initialization after initial DOM load.

---

## 6. Implementation Code Diffs

### 6.1 Changes to `admin-panel.js` (Root Source)

#### Diff 1: Initialize Channel & Broadcast Helpers
**Location**: `admin-panel.js`, immediately after line 21.

```javascript
<<<< CURRENT (Lines 18-24)
  const ORDERS_KEY   = 'pls-orders';
  const COUPONS_KEY  = 'pls-coupons';
  const PRODUCTS_KEY = 'pls-products';

  const $ = (s, p) => (p || document).querySelector(s);
  const $$ = (s, p) => (p || document).querySelectorAll(s);
====
>>>> PROPOSED BLUEPRINT
  const ORDERS_KEY   = 'pls-orders';
  const COUPONS_KEY  = 'pls-coupons';
  const PRODUCTS_KEY = 'pls-products';
  const SYNC_CHANNEL_NAME = 'poster-lab-sync';
  const SYNC_SIGNAL_KEY   = 'pls-sync-signal';
  const CLIENT_ID = 'admin_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now();

  const $ = (s, p) => (p || document).querySelector(s);
  const $$ = (s, p) => (p || document).querySelectorAll(s);

  // BroadcastChannel instance with graceful fallback
  let syncChannel = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    }
  } catch (bcErr) {
    if (console) console.warn('[Admin] BroadcastChannel not supported, using storage fallback:', bcErr);
  }

  // Deduplication cache for cross-admin sync
  const _processedSyncEvents = new Map();
  function recordSyncEvent(eventId) {
    _processedSyncEvents.set(eventId, Date.now());
    if (_processedSyncEvents.size > 100) {
      const oldestKey = _processedSyncEvents.keys().next().value;
      _processedSyncEvents.delete(oldestKey);
    }
  }

  function broadcastLiveSync(type, payload) {
    const event = {
      type,
      payload,
      senderId: CLIENT_ID,
      eventId: 'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      timestamp: Date.now()
    };
    recordSyncEvent(event.eventId);
    if (syncChannel) {
      try { syncChannel.postMessage(event); }
      catch (e) { err('BroadcastChannel postMessage error:', e); }
    }
    try {
      localStorage.setItem(SYNC_SIGNAL_KEY, JSON.stringify(event));
    } catch (_) {}
  }
<<<<
```

#### Diff 2: Dispatch Sync on Product Save & Preserve Metadata
**Location**: `admin-panel.js`, `saveProduct()` around lines 767–805.

```javascript
<<<< CURRENT (Lines 767-805)
    const qtyVal = $('#apQuantity').value.trim();
    const productData = {
      id, name,
      nameAr: $('#apNameAr').value.trim(),
      category: $('#apCategory').value,
      tag: $('#apTag').value.trim(),
      tagAr: $('#apTagAr').value.trim(),
      image: $('#apImage').value.trim(),
      basePrice: parseFloat($('#apBasePrice').value) || 0,
      gallery: [$('#apImage').value.trim()],
      sizes, frames,
      description: $('#apDescription').value.trim(),
      descriptionAr: $('#apDescriptionAr').value.trim(),
      _updatedAt: new Date().toISOString(),
      _deleted: false
    };
    if (qtyVal !== '') {
      productData.quantity = parseInt(qtyVal, 10);
    }
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
====
>>>> PROPOSED BLUEPRINT
    const qtyVal = $('#apQuantity').value.trim();
    const existing = allProducts().find(p => p.id === id);
    const productData = {
      ...(existing || {}),
      id, name,
      nameAr: $('#apNameAr').value.trim(),
      category: $('#apCategory').value,
      tag: $('#apTag').value.trim(),
      tagAr: $('#apTagAr').value.trim(),
      image: $('#apImage').value.trim(),
      basePrice: parseFloat($('#apBasePrice').value) || 0,
      gallery: (existing && Array.isArray(existing.gallery) && existing.gallery.length > 1)
        ? existing.gallery
        : [$('#apImage').value.trim()],
      sizes, frames,
      description: $('#apDescription').value.trim(),
      descriptionAr: $('#apDescriptionAr').value.trim(),
      _updatedAt: new Date().toISOString(),
      _deleted: false
    };
    if (qtyVal !== '') {
      productData.quantity = parseInt(qtyVal, 10);
    } else {
      delete productData.quantity;
    }
    const custom = getAdminProducts();
    const idx = custom.findIndex(c => c.id === id);
    if (idx >= 0) custom[idx] = productData;
    else custom.push(productData);
    saveAdminProducts(custom);

    // Live broadcast to storefront and other admin tabs
    broadcastLiveSync('PRODUCT_UPDATE', productData);
    if (productData.quantity !== undefined) {
      broadcastLiveSync('STOCK_UPDATE', { id: productData.id, quantity: productData.quantity, _updatedAt: productData._updatedAt });
    }

    hideProductForm();
    rebuildCategoryFilter();
    renderProducts();

    showAdminToast('⏳ Saving product "' + name + '" to database...', 'info', 2000);
    let fsOk = false;
<<<<
```

#### Diff 3: Dispatch Sync on Product Delete
**Location**: `admin-panel.js`, `deleteProduct()` around lines 819–838.

```javascript
<<<< CURRENT (Lines 820-827)
    if (!confirm('Delete "' + pid + '"? This will remove it from the website.')) return;
    const c = getAdminProducts();
    const without = c.filter(x => x.id !== pid);
    without.push({ id: pid, _deleted: true, _updatedAt: new Date().toISOString() });
    saveAdminProducts(without);
    rebuildCategoryFilter();
    renderProducts();
====
>>>> PROPOSED BLUEPRINT
    if (!confirm('Delete "' + pid + '"? This will remove it from the website.')) return;
    const updatedAt = new Date().toISOString();
    const c = getAdminProducts();
    const without = c.filter(x => x.id !== pid);
    without.push({ id: pid, _deleted: true, _updatedAt: updatedAt });
    saveAdminProducts(without);

    // Live broadcast product deletion
    broadcastLiveSync('PRODUCT_DELETE', { id: pid, _deleted: true, _updatedAt: updatedAt });

    rebuildCategoryFilter();
    renderProducts();
<<<<
```

#### Diff 4: Dispatch Sync on Coupon Save & Delete
**Location**: `admin-panel.js`, `saveCoupon()` and `deleteCoupon()` lines 874–900.

```javascript
<<<< CURRENT (Lines 874-899)
    if (existingIdx >= 0) list[existingIdx] = coupon;
    else list.push(coupon);
    saveCoupons(list);
    hideCouponForm();
    renderCoupons();

    showAdminToast('⏳ Saving coupon "' + code + '"...', 'info', 2000);
    let fsOk = false;
    if (typeof window.saveCouponToFirestore === 'function') {
      fsOk = await window.saveCouponToFirestore(coupon);
    }
    if (fsOk) {
      showAdminToast('✓ Coupon "' + code + '" saved & live across store! (15s)', 'success', 15000);
    } else {
      showAdminToast('✓ Coupon "' + code + '" saved locally! (15s)', 'info', 15000);
    }
  }

  async function deleteCoupon(code) {
    if (!confirm('Delete coupon "' + code + '"?')) return;
    saveCoupons(getCoupons().filter(x => x.code.toUpperCase() !== code.toUpperCase()));
    renderCoupons();
    if (typeof window.deleteCouponFromFirestore === 'function') {
      await window.deleteCouponFromFirestore(code);
    }
    showAdminToast('✓ Coupon "' + code + '" deleted! (15s)', 'info', 15000);
  }
====
>>>> PROPOSED BLUEPRINT
    if (existingIdx >= 0) list[existingIdx] = coupon;
    else list.push(coupon);
    saveCoupons(list);

    // Live broadcast coupon update
    broadcastLiveSync('COUPON_UPDATE', coupon);

    hideCouponForm();
    renderCoupons();

    showAdminToast('⏳ Saving coupon "' + code + '"...', 'info', 2000);
    let fsOk = false;
    if (typeof window.saveCouponToFirestore === 'function') {
      fsOk = await window.saveCouponToFirestore(coupon);
    }
    if (fsOk) {
      showAdminToast('✓ Coupon "' + code + '" saved & live across store! (15s)', 'success', 15000);
    } else {
      showAdminToast('✓ Coupon "' + code + '" saved locally! (15s)', 'info', 15000);
    }
  }

  async function deleteCoupon(code) {
    if (!confirm('Delete coupon "' + code + '"?')) return;
    const cUpper = code.toUpperCase();
    saveCoupons(getCoupons().filter(x => x.code.toUpperCase() !== cUpper));

    // Live broadcast coupon deletion
    broadcastLiveSync('COUPON_UPDATE', { code: cUpper, _deleted: true, _updatedAt: new Date().toISOString() });

    renderCoupons();
    if (typeof window.deleteCouponFromFirestore === 'function') {
      await window.deleteCouponFromFirestore(code);
    }
    showAdminToast('✓ Coupon "' + code + '" deleted! (15s)', 'info', 15000);
  }
<<<<
```

#### Diff 5: Admin Incoming Sync Listener (Cross-Admin Synchronization)
**Location**: `admin-panel.js`, in `init()` around line 1185.

```javascript
<<<< CURRENT (Lines 1183-1185)
      initRealtimeListeners();
      window.addEventListener('firebase-ready', initRealtimeListeners);
====
>>>> PROPOSED BLUEPRINT
      initRealtimeListeners();
      window.addEventListener('firebase-ready', initRealtimeListeners);

      // Listen for broadcasts from other admin tabs or storefront
      function handleAdminIncomingSync(evt) {
        if (!evt || !evt.type || evt.senderId === CLIENT_ID) return;
        if (_processedSyncEvents.has(evt.eventId)) return;
        recordSyncEvent(evt.eventId);

        if (evt.type === 'PRODUCT_UPDATE' || evt.type === 'PRODUCT_DELETE' || evt.type === 'STOCK_UPDATE') {
          invalidateProductsCache();
          rebuildCategoryFilter();
          if ($('#adminTabProducts') && !$('#adminTabProducts').hidden) renderProducts();
          if ($('#adminTabDashboard') && !$('#adminTabDashboard').hidden) renderDashboard();
        } else if (evt.type === 'COUPON_UPDATE') {
          if ($('#adminTabCoupons') && !$('#adminTabCoupons').hidden) renderCoupons();
        }
      }

      if (syncChannel) {
        syncChannel.onmessage = (e) => handleAdminIncomingSync(e.data);
      }
      window.addEventListener('storage', (e) => {
        if (e.key === SYNC_SIGNAL_KEY && e.newValue) {
          try { handleAdminIncomingSync(JSON.parse(e.newValue)); } catch (_) {}
        }
      });
<<<<
```

---

### 6.2 Changes to `script.js` (Storefront Source)

#### Diff 1: Declare Live Sync Keys & Client Context
**Location**: `script.js`, around line 500 (below `LOCAL_STORAGE_PRODUCTS_KEY`).

```javascript
<<<< CURRENT (Lines 498-502)
const LOCAL_STORAGE_REVIEWS_KEY = "pls-reviews";
const LOCAL_STORAGE_PRODUCTS_KEY = "pls-products";

function lsGet(key, fallback) {
====
>>>> PROPOSED BLUEPRINT
const LOCAL_STORAGE_REVIEWS_KEY = "pls-reviews";
const LOCAL_STORAGE_PRODUCTS_KEY = "pls-products";
const SYNC_CHANNEL_NAME = "poster-lab-sync";
const SYNC_SIGNAL_KEY = "pls-sync-signal";
const STORE_CLIENT_ID = "store_" + Math.random().toString(36).slice(2, 9) + "_" + Date.now();

const _processedSyncEvents = new Map();
function recordStoreSyncEvent(eventId) {
  _processedSyncEvents.set(eventId, Date.now());
  if (_processedSyncEvents.size > 100) {
    const oldestKey = _processedSyncEvents.keys().next().value;
    _processedSyncEvents.delete(oldestKey);
  }
}

function lsGet(key, fallback) {
<<<<
```

#### Diff 2: Dynamic Live State Ingestion & Re-Rendering Engine
**Location**: `script.js`, immediately after `applyRemoteProducts()` around line 796.

```javascript
<<<< CURRENT (Lines 794-797)
  return changed;
}

function initStoreRealtimeListeners() {
====
>>>> PROPOSED BLUEPRINT
  return changed;
}

function applyLiveProductUpdate(payload, isDelete = false) {
  if (!payload || !payload.id) return;
  const id = payload.id;
  const existingCustom = lsGet(LOCAL_STORAGE_PRODUCTS_KEY, []);
  const map = new Map();
  existingCustom.forEach(p => map.set(p.id, p));

  const baseProduct = products.find(p => p.id === id);
  const curInMap = map.get(id);
  const currentMerged = curInMap || baseProduct || {};

  if (isDelete || payload._deleted) {
    map.set(id, { id, _deleted: true, _updatedAt: payload._updatedAt || new Date().toISOString() });
    const inMemIdx = products.findIndex(p => p.id === id);
    if (inMemIdx >= 0) products[inMemIdx]._deleted = true;
  } else {
    const updated = {
      ...currentMerged,
      ...payload,
      _deleted: false,
      _updatedAt: payload._updatedAt || new Date().toISOString()
    };
    map.set(id, updated);
    const inMemIdx = products.findIndex(p => p.id === id);
    if (inMemIdx >= 0) {
      products[inMemIdx] = { ...products[inMemIdx], ...updated };
    } else {
      products.push(updated);
    }
  }

  lsSet(LOCAL_STORAGE_PRODUCTS_KEY, Array.from(map.values()));
  _lastFilterSearch = null;
  _lastFilterResult = null;

  // Selective Live UI Updates
  triggerLiveUIReRender(id);
}

function applyLiveStockUpdate(payload) {
  if (!payload || !payload.id || payload.quantity === undefined) return;
  applyLiveProductUpdate({ id: payload.id, quantity: payload.quantity, _updatedAt: payload._updatedAt });
}

function applyLiveCouponUpdate(coupon) {
  if (!coupon || !coupon.code) return;
  const code = coupon.code.toUpperCase();
  const existing = getCouponsData();
  const map = new Map();
  existing.forEach(c => map.set(c.code.toUpperCase(), c));

  if (coupon._deleted) {
    map.delete(code);
    if (state.appliedCoupon && state.appliedCoupon.code.toUpperCase() === code) {
      state.appliedCoupon = null;
      renderCart();
      const currentLang = state.lang || "en";
      showToast(currentLang === 'ar' ? 'تم إلغاء كود الخصم من قِبل الإدارة' : 'Coupon has been removed by admin', 'info');
    }
  } else {
    const current = map.get(code) || {};
    const updated = { ...current, ...coupon, code };
    map.set(code, updated);
    if (state.appliedCoupon && state.appliedCoupon.code.toUpperCase() === code) {
      state.appliedCoupon = updated;
      renderCart();
    }
  }
  saveCouponsData(Array.from(map.values()));
}

function triggerLiveUIReRender(affectedProductId) {
  // 1. Catalog Grid & Search View
  if (typeof productGrid !== 'undefined' && productGrid) {
    const currentCat = new URLSearchParams(window.location.search).get("cat") || catParam;
    if (currentCat) renderSingleCategory(currentCat);
    else renderProducts();
  }

  // 2. Open Product Detail Page
  const pid = typeof getPageProductId === 'function' ? getPageProductId() : null;
  if (pid && (!affectedProductId || pid === affectedProductId)) {
    renderDetail(pid);
  }

  // 3. Cart Drawer Total & Stock Verification
  if (typeof renderCart === 'function') {
    renderCart();
  }
}

function initLiveSyncChannel() {
  let bc = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
    }
  } catch (err) {
    console.warn('[Sync] BroadcastChannel init error, falling back to storage:', err);
  }

  function handleIncomingEnvelope(envelope) {
    if (!envelope || !envelope.type || envelope.senderId === STORE_CLIENT_ID) return;
    if (_processedSyncEvents.has(envelope.eventId)) return;
    recordStoreSyncEvent(envelope.eventId);

    switch (envelope.type) {
      case 'PRODUCT_UPDATE':
        applyLiveProductUpdate(envelope.payload, false);
        break;
      case 'PRODUCT_DELETE':
        applyLiveProductUpdate(envelope.payload, true);
        break;
      case 'STOCK_UPDATE':
        applyLiveStockUpdate(envelope.payload);
        break;
      case 'COUPON_UPDATE':
        applyLiveCouponUpdate(envelope.payload);
        break;
    }
  }

  if (bc) {
    bc.onmessage = (e) => handleIncomingEnvelope(e.data);
  }

  // Fallback / Cross-Tab Storage Event
  window.addEventListener('storage', (e) => {
    if (e.key === SYNC_SIGNAL_KEY && e.newValue) {
      try { handleIncomingEnvelope(JSON.parse(e.newValue)); } catch (_) {}
    } else if (e.key === LOCAL_STORAGE_PRODUCTS_KEY) {
      _lastFilterSearch = null;
      _lastFilterResult = null;
      triggerLiveUIReRender();
    } else if (e.key === LOCAL_STORAGE_COUPONS_KEY) {
      if (typeof renderCart === 'function') renderCart();
    }
  });

  // Reconnection resilience hooks
  window.addEventListener('firebase-ready', () => {
    initStoreRealtimeListeners();
  });
  window.addEventListener('online', () => {
    initStoreRealtimeListeners();
    syncProductsFromFirestore(true);
    syncCouponsFromFirestore(true);
  });
}

function initStoreRealtimeListeners() {
<<<<
```

#### Diff 3: Initialize Live Sync at Storefront Bootstrap
**Location**: `script.js`, around line 4135 (inside bootstrap IIFE).

```javascript
<<<< CURRENT (Lines 4133-4136)
  });
  syncCouponsFromFirestore();

  // FAQ accordion: close others when one opens
====
>>>> PROPOSED BLUEPRINT
  });
  syncCouponsFromFirestore();
  initLiveSyncChannel();

  // FAQ accordion: close others when one opens
<<<<
```

---

## 7. Verification & Testing Strategy

### 7.1 Automated Unit / Stress Test Specification
An automated validation suite (`test_m2_live_sync.js`) can execute directly via Node.js:
1. **BroadcastChannel Handshake Verification**:
   - Create two instances: `adminBc = new BroadcastChannel('poster-lab-sync')` and `storeBc = new BroadcastChannel('poster-lab-sync')`.
   - Dispatch `PRODUCT_UPDATE` from `adminBc`.
   - Verify `storeBc` receives message with matching `eventId` and payload within 10ms.
2. **Echo Suppression Verification**:
   - Verify `adminBc.onmessage` does NOT trigger on its own transmitted message.
   - Dispatch event with `senderId: STORE_CLIENT_ID` to store handler; verify it is immediately ignored.
3. **Storage Fallback Verification**:
   - Simulate an environment without BroadcastChannel.
   - Fire a synthetic storage event on `window` with `key: 'pls-sync-signal'`.
   - Verify `applyLiveProductUpdate` is triggered and `pls-products` updates.
4. **Stock Tracking & Zero-State UI Check**:
   - Send `STOCK_UPDATE` with `{ id: "football-001", quantity: 0 }`.
   - Verify `getProduct("football-001").quantity === 0`.
   - Send `STOCK_UPDATE` with `{ id: "football-001", quantity: 15 }`.
   - Verify `getProduct("football-001").quantity === 15`.
5. **Coupon Revocation Live Check**:
   - Simulate active cart coupon `POSTER10`.
   - Send `COUPON_UPDATE` with `{ code: "POSTER10", _deleted: true }`.
   - Verify `state.appliedCoupon` is cleared and totals recalculate.

### 7.2 Manual Multi-Tab Browser Verification Steps
| Step | Action | Expected Storefront Result | Acceptance Criterion |
|---|---|---|---|
| **1. Multi-Tab Setup** | Open `index.html` in Tab 1 and `admin/panel.html` in Tab 2 side-by-side. | Both tabs render with 0 console errors. | Clean start |
| **2. Live Title/Price Edit** | In Tab 2, edit product `football-001`: Change Name to `"Al Ahly Champions Wall"` and Base Price to `250`. Click "Save Product". | Tab 1 updates the poster card title and price label **instantaneously** (< 50ms) without page reload. | Zero-latency sync |
| **3. Live Stock to 0** | In Tab 2, edit `football-001`, set `Quantity available` to `0`, click "Save Product". | Tab 1 displays the `"Out of Stock"` badge on `football-001` and disables quick-add. | Stock sync |
| **4. Open PDP Sync** | In Tab 1, navigate to `product.html?id=football-001`. In Tab 2, change stock to `12`. | Tab 1 PDP immediately replaces "Out of Stock" with the active "Add to Cart" button. | PDP live update |
| **5. Live Product Delete** | In Tab 2, delete product `football-001`. | Tab 1 PDP immediately transitions to "No framed posters found" empty state without page reload. | Instant delete sync |
| **6. Live Coupon Addition** | In Tab 2, create coupon `SAVE20` (20% off). In Tab 1, open cart drawer and apply `SAVE20`. | Discount applies immediately. | Live coupon availability |

---

## 8. Summary Table of Sync Contracts

| Event Type | Initiator | Channel / Fallback | Payload Key Data | Target Store Reaction |
|---|---|---|---|---|
| `PRODUCT_UPDATE` | Admin Panel | `poster-lab-sync` / `pls-sync-signal` | Full Product object | Merges into `pls-products` & `products`, clears search memoization, re-renders catalog & detail |
| `PRODUCT_DELETE` | Admin Panel | `poster-lab-sync` / `pls-sync-signal` | `{ id, _deleted: true }` | Sets tombstone in `pls-products`, removes card or shows empty state on detail |
| `STOCK_UPDATE` | Admin Panel | `poster-lab-sync` / `pls-sync-signal` | `{ id, quantity }` | Updates quantity in state, toggles Out-of-Stock badge & Add-to-Cart disable status |
| `COUPON_UPDATE` | Admin Panel | `poster-lab-sync` / `pls-sync-signal` | `{ code, type, value, _deleted }` | Updates `pls-coupons`, updates or revokes active cart discounts and recomputes cart totals |


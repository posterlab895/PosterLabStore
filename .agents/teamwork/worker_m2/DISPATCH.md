## 2026-11-10T11:18:38Z
You are Worker M2 (Admin Panel Live Synchronization & Operations) for Poster Lab Store.

Your working directory: d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\worker_m2\
Authoritative user request file (MANDATORY — read first): d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\ORIGINAL_REQUEST.md
Project architecture and contracts: d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\PROJECT.md

Explorer Investigation Blueprints (read thoroughly before editing any files):
- Live Sync & BroadcastChannel Blueprint: d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\explorer_m2_1\analysis.md
- Stock Tracking & Quantity Enforcement Blueprint: d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\explorer_m2_2\analysis.md
- Metadata Preservation, Price Guard & Connection Resilience: d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\explorer_m2_3\analysis.md

MANDATORY INTEGRITY WARNING:
> DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Ownership:
You have exclusive write ownership of:
1. `admin-panel.js` (and mirror `admin/admin-panel.js`)
2. `admin/panel.html`
3. `firebase-config.js` (and mirror `admin/firebase-config.js`)
4. `script.js`
5. `styles.css`

Scope of Work (Requirement R2, Features 5, 6, 7, 8, 9):
1. **Live Synchronization (`BroadcastChannel('poster-lab-sync')` & `storage` events)**:
   - In `admin-panel.js` (and `admin/admin-panel.js`):
     * Initialize `BroadcastChannel('poster-lab-sync')` with a random tab `senderId`.
     * In `saveProduct()`: broadcast `{ type: 'PRODUCT_UPDATE', payload: productData, senderId, eventId, timestamp }` over `poster-lab-sync` and update `localStorage['pls-sync-signal']` as fallback. If quantity was modified, also broadcast `STOCK_UPDATE`.
     * In `deleteProduct()`: broadcast `{ type: 'PRODUCT_DELETE', payload: { id: pid }, senderId, eventId, timestamp }`.
     * In `saveCoupon()` / `deleteCoupon()`: broadcast `{ type: 'COUPON_UPDATE', payload, senderId, eventId, timestamp }`.
   - In `script.js`:
     * Initialize `BroadcastChannel('poster-lab-sync')` and `window.addEventListener('storage', ...)`.
     * Deduplication: ignore messages where `senderId === localSenderId`, maintain an `eventId` ring buffer to prevent duplicate execution or echo loops.
     * On `PRODUCT_UPDATE`: sanitize price floor with `sanitizeRemoteProduct(payload)`, update `localStorage['pls-products']` and in-memory `products` catalog array, invalidate search memoization (`_lastFilterSearch = null; _lastFilterResult = null;`), and trigger targeted in-place re-renders: `renderProducts()` / `renderSingleCategory(cat)`, `renderDetail(pid)` if open, and `renderCart()` if open. No full page reloads!
     * On `PRODUCT_DELETE`: mark product deleted in local storage & memory, remove card from DOM.
     * On `COUPON_UPDATE`: update `localStorage['pls-coupons']`.
     * On `STOCK_UPDATE`: update product quantity in local state, update badge/button states.

2. **Stock Tracking & Quantity Enforcement (`product.quantity`)**:
   - In `admin/panel.html`:
     * Line 169: Change placeholder on `#apQuantity` from `"0 = unlimited"` to `"e.g. 10 (0 = out of stock, leave empty for unlimited)"`.
   - In `admin-panel.js`:
     * Add Stock column to `#productsTable` in `renderProductsTable()`.
     * In `saveProduct()`: sanitize quantity: `const qtyVal = $('#apQuantity').value.trim(); if (qtyVal !== '') productData.quantity = Math.max(0, parseInt(qtyVal, 10)); else delete productData.quantity;`.
   - In `script.js`:
     * Implement `isProductOutOfStock(product)`: returns `true` if `typeof product.quantity === 'number' && product.quantity <= 0`.
     * Implement `getProductStock(product)`: returns numeric quantity or `Infinity`.
     * In catalog cards (`renderProducts()` and `catCardHtml()`): if out of stock, render `<span class="badge out-of-stock">${t('outOfStock') || 'Out of Stock'}</span>` and disable or hide quick-add button.
     * In detail view (`renderDetail()`): ensure `#addToCartBtn` ID exists on the button. If out of stock, render `<span class="detail-stock-badge">${t('outOfStock') || 'Out of Stock'}</span>`, set `addToCartBtn.disabled = true;`, and set text to `t('outOfStock') || 'Out of Stock'`.
     * In `addToCart(productId, size, frame, count)`: validate stock before adding! If `isProductOutOfStock(product)`, abort addition and show toast `t('itemOutOfStock') || 'This item is currently out of stock'`.
     * In `renderCart()` and `updateQuantity()`: cap quantity at available stock, flag zero-stock items.
     * In `handleCheckout()`: abort checkout if any cart item is out of stock.
   - In `styles.css`:
     * Add clean styles for `.badge.out-of-stock`, `.out-of-stock-badge`, `.detail-stock-badge`, `.detail-add:disabled`, and `#addToCartBtn:disabled` (gray background, cursor not-allowed, no hover transform).

3. **Admin Metadata Preservation**:
   - In `saveProduct()` in `admin-panel.js`:
     * Find `existing = allProducts().find(p => p.id === id) || {};`.
     * Spread `...existing` into `productData` before assigning form fields, preserving `tags`, `gallery` (if image didn't change or if existing gallery has multiple items), `isCustom`, `originalId`, `rating`, `reviewsCount`.

4. **Connection Resilience & Firebase Config**:
   - In `firebase-config.js` (and `admin/firebase-config.js`):
     * Line 42: Remove `merge: true` from `firebaseDb.settings(...)`.
   - In `script.js:applyRemoteProducts()`:
     * Add `sanitizeRemoteProduct(rp)` price floor guard: ensure `rp.basePrice >= 180` and `rp.sizes['20x30'] >= 180`, etc., so stale remote documents can never downgrade prices.
   - Add reconnection event listeners for `window.addEventListener('online')` and `window.addEventListener('firebase-ready')` in both `script.js` and `admin-panel.js`.

5. **Build & Test Verification**:
   - Run `node build-assets.js` to compile `script.min.js`, `admin-panel.min.js`, and synchronize copies to `admin/`.
   - Run:
     `node tests/e2e/tier1-features/f06_admin_to_store_price_sync.test.js`
     `node tests/e2e/tier1-features/f07_admin_to_store_delete_sync.test.js`
     `node tests/e2e/tier1-features/f08_admin_to_store_stock_sync.test.js`
     `node tests/e2e/tier2-boundaries/b06_live_sync_price_boundaries.test.js`
     `node tests/e2e/tier2-boundaries/b07_live_sync_delete_boundaries.test.js`
     `node tests/e2e/tier2-boundaries/b08_live_sync_stock_boundaries.test.js`
     `node tests/run-all.js`
   - Document commands and full test output in `handoff.md`.

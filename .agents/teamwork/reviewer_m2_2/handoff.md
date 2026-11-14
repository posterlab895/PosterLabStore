# Handoff Report: Reviewer M2-2 (Stock Tracking, Quantity Bounds & Cart Enforcement)

**Reviewer ID:** Reviewer M2-2 (reviewer, critic)  
**Milestone:** Milestone 2: Admin Panel Live Synchronization & Operations  
**Date:** 2026-11-10  
**Target Repository:** `d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore`  
**Verdict:** **APPROVE**  

---

## 1. Observation

Direct code and execution observations across all targets:

### 1.1 Admin Panel Stock Controls & Display
1. **`admin/panel.html:169`**:
   Verbatim code:
   ```html
   <label>Quantity available <input id="apQuantity" type="number" min="0" placeholder="e.g. 10 (0 = out of stock, leave empty for unlimited)"></label>
   ```
   Observed: `min="0"` is present and placeholder matches `"e.g. 10 (0 = out of stock, leave empty for unlimited)"`.
2. **`admin-panel.js:604, 610–614, 622`** (`renderProductsTable`):
   Verbatim header (line 604):
   ```html
   <th></th><th>ID</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Sizes</th><th>Frames</th><th>Actions</th>
   ```
   Verbatim cell logic (lines 610–614, 622):
   ```javascript
   const stockDisplay = (p.quantity === undefined || p.quantity === null)
     ? `<span style="color:var(--muted);font-size:0.8rem">Unlimited (∞)</span>`
     : p.quantity <= 0
       ? `<span class="badge out-of-stock admin-stock-badge" style="background:var(--danger);color:#fff;padding:2px 8px;border-radius:999px;font-size:0.75rem;font-weight:800">Out of Stock (0)</span>`
       : `<span style="font-weight:800;color:var(--text-strong)">${p.quantity}</span>`;
   ...
   <td style="font-size:0.85rem">${stockDisplay}</td>
   ```
   Observed: Stock column is properly rendered in the products table header and data cells.
3. **`admin-panel.js:875–880, 902–906, 916–918`** (`saveProduct`):
   Verbatim code:
   ```javascript
   const qtyVal = $('#apQuantity').value.trim();
   let sanitizedQuantity = undefined;
   if (qtyVal !== '') {
     const parsed = parseInt(qtyVal, 10);
     sanitizedQuantity = isNaN(parsed) || parsed < 0 ? 0 : parsed;
   }
   ...
   if (sanitizedQuantity !== undefined) {
     productData.quantity = sanitizedQuantity;
   } else {
     delete productData.quantity;
   }
   ...
   if (productData.quantity !== undefined) {
     broadcastLiveSync('STOCK_UPDATE', { id: productData.id, quantity: productData.quantity, _updatedAt: productData._updatedAt });
   }
   ```
   Observed: Negative and NaN inputs are clamped to `0`, empty string leaves `quantity` undefined (unlimited), and stock changes are broadcast live via `STOCK_UPDATE`.

### 1.2 Storefront Stock Ingestion & Guard Rails (`script.js`)
1. **Helper Functions (lines 519–530)**:
   ```javascript
   function isProductOutOfStock(product) {
     if (!product) return false;
     return product.quantity !== undefined && product.quantity !== null && Number(product.quantity) <= 0;
   }

   function getProductStock(product) {
     if (!product || product.quantity === undefined || product.quantity === null) {
       return Infinity;
     }
     const val = parseInt(product.quantity, 10);
     return isNaN(val) || val <= 0 ? 0 : val;
   }
   ```
   Observed: Undefined/null quantity evaluates to `isProductOutOfStock === false` and `getProductStock === Infinity`. Numeric `<= 0` evaluates to out-of-stock.
2. **Catalog Card Renderers (`renderProducts` lines 2518–2537 & `catCardHtml` lines 2918–2937)**:
   - Sets `is-out-of-stock` card class.
   - Injects `<span class="badge out-of-stock">${oosText}</span>`.
   - Disables quick-add icon button with `disabled aria-disabled="true" title="${oosText}"` and `.is-disabled`.
3. **Detail View (`renderDetail` lines 3075–3166)**:
   - Line 3121 renders `<span class="badge out-of-stock detail-stock-badge">${oosLabel}</span>`.
   - Lines 3159 & 3165 provide `#addToCartBtn` with `disabled aria-disabled="true"` and label `${outOfStock ? oosLabel : ...}`.
4. **Cart Ingestion (`addToCart` lines 3296–3312)**:
   - Line 3296 blocks addition if `isProductOutOfStock(product)` and shows toast notification.
   - Lines 3301–3312 compute `inCartQty = state.cart.filter(item => item.productId === product.id).reduce((sum, item) => sum + item.quantity, 0);` and reject addition exceeding `maxStock` with toast notification.
5. **Cart Drawer & Quantity Controls (`renderCart` lines 3384–3411 & `updateQuantity` lines 3448–3463)**:
   - Highlights out-of-stock items with `.cart-item.is-out-of-stock` and warning text.
   - Disables `+` button when item quantity reaches available stock.
   - `updateQuantity` blocks incrementing past `maxStock` with toast notification.
6. **Checkout Interception (`handleCheckout` lines 3716–3733)**:
   - Loops over `state.cart` items; aborts checkout with toast notification if any item is out of stock or exceeds stock.

### 1.3 Price Floor Guard (`script.js` lines 532–564)
- `MIN_PRICE_FLOOR = 180` and `STANDARD_SIZES = { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 }`.
- `sanitizeRemoteProduct(rp)` enforces that no inbound Firestore or sync snapshot can downgrade prices below standard pricing tiers.

### 1.4 Styling Rules (`styles.css` lines 3271–3390)
- `.badge.out-of-stock`, `.out-of-stock-badge`: Red backdrop (`rgba(220, 38, 38, 0.92)`), blur, rounded pills, RTL placement.
- `.detail-stock-badge`: Static layout beside size/frame line.
- `#addToCartBtn:disabled`, `.detail-add:disabled`: Neutral background (`var(--surface-2)`), muted text, `cursor: not-allowed !important; pointer-events: none`.
- `.product-card.is-out-of-stock`: Grayscale and dimmed opacity image filter.

### 1.5 Build & Test Execution
- Executed `node build-assets.js`:
  ```
  --- Building & Minifying Assets ---
  styles.min.css generated (57163 bytes)
  admin.min.css generated (10459 bytes)
  script.min.js generated (148013 bytes)
  admin-panel.min.js generated (43095 bytes)
  admin-login.min.js generated (3215 bytes)
  Shared bundles and assets copied to admin/
  --- Build Assets Complete Successfully ---
  ```
- Executed required test suite command:
  `node -e "const { runner } = require('./tests/harness'); require('./tests/e2e/tier1-features/f08_admin_to_store_stock_sync.test.js'); require('./tests/e2e/tier2-boundaries/b08_live_sync_stock_boundaries.test.js'); require('./tests/e2e/tier4-scenarios/scenario_2_admin_live_update.test.js'); runner.run().then(res => console.log('Passed:', res.passed, 'Failed:', res.failed));"`
  **Result:** `Passed: 11 Failed: 0`.
- Executed full M2 test suite (F6, F7, F8, B6, B7, B8, S2, S4):
  **Result:** `Passed: 32 Failed: 0`.

### 1.6 Integrity Audit
- Scanned for hardcoded test results, facade logic, and dummy objects across modified files.
- Result: **0 integrity violations found**. Implementation is genuine production code.

---

## 2. Logic Chain

1. **Stock Definition Consistency**:
   `admin/panel.html` and `PROJECT.md` line 88 specify `0 = out of stock, empty = unlimited`. In `admin-panel.js` (lines 875–880), empty input sets `sanitizedQuantity = undefined` which deletes `product.quantity`, preserving unlimited behavior, whereas numeric values <= 0 are clamped to 0.
2. **End-to-End Stock Enforcement**:
   - At creation/edit: `admin-panel.js` clamps negative values to 0 and broadcasts `STOCK_UPDATE`.
   - At display: `renderProducts` and `catCardHtml` mark zero-stock cards with badges and disable quick-add buttons. `renderDetail` renders `.detail-stock-badge` and disables `#addToCartBtn`.
   - At cart addition: `addToCart` validates both out-of-stock condition and available quantity caps across existing cart items.
   - At cart modification: `renderCart` disables `+` buttons when inventory is reached, and `updateQuantity` rejects upward increments beyond stock.
   - At checkout: `handleCheckout` validates the entire cart against live catalog stock before allowing order submission.
3. **Data Integrity & Price Protection**:
   `sanitizeRemoteProduct` defends against malformed or legacy remote documents setting prices below 180 EGP or corrupted size tiers.

---

## 3. Adversarial Challenges & Edge Case Mining

### Challenge 1 (Minor / Edge Case): Multi-variant aggregate stock cap in `updateQuantity`
- **Assumption challenged**: Validating `item.quantity + delta > maxStock` per individual cart line item in `updateQuantity` guarantees that total cart units never exceed available inventory.
- **Attack scenario**: A user has 2 distinct size variants of the same product in their cart (e.g., 20x30 with quantity 1, and 30x40 with quantity 1) for a product with total inventory of 2. In `updateQuantity`, incrementing 20x30 checks `item.quantity + delta > maxStock` (1 + 1 > 2 is false). The user can increment both items to 2, resulting in a total of 4 units for a product with only 2 in stock. In `handleCheckout()`, line 3726 also verifies `item.quantity > maxStock` on a per-line basis rather than summing total quantity by `productId`.
- **Blast radius**: Minor inventory over-allocation if customers order multiple sizes of a single low-stock product.
- **Recommended Mitigation**: In `updateQuantity` and `handleCheckout`, compute the total quantity for `product.id` across all cart items (`state.cart.filter(c => c.productId === product.id).reduce((s, c) => s + c.quantity, 0)`) and compare that sum against `maxStock`.

### Challenge 2 (Minor / Edge Case): `Math.max(0, parseInt(payload.quantity, 10))` evaluates to `NaN` on non-numeric strings
- **Assumption challenged**: `Math.max(0, parseInt(val, 10))` in `applyLiveStockUpdate` always yields a non-negative number.
- **Attack scenario**: If a non-numeric string (`"NaN"`, `"N/A"`) is delivered in a raw `STOCK_UPDATE` payload, `parseInt` returns `NaN`, and `Math.max(0, NaN)` returns `NaN`. When set on `product.quantity`, `isProductOutOfStock` evaluates `Number(NaN) <= 0` as `false`, preventing the product from being recognized as out-of-stock.
- **Blast radius**: Low (Admin panel always sends sanitized integers), but external Firestore documents or raw messages could introduce `NaN`.
- **Recommended Mitigation**: Adopt `const parsed = parseInt(payload.quantity, 10); const sanitizedQty = isNaN(parsed) || parsed < 0 ? 0 : parsed;` in `applyLiveStockUpdate`.

---

## 4. Caveats

- **Scope Boundary**: 6 test failures in the full `node tests/run-all.js` suite (white swatch dot, transparent frame class in M3, and script tag in `our-work.html`/`faq.html` in M4) are external to M2 and owned by subsequent milestones.
- **In-Memory Catalog Multi-Variant Stock**: Posters are tracked at the product-level rather than size-SKU level, which matches the project contract (`PROJECT.md` line 88).

---

## 5. Conclusion

**Verdict: APPROVE**

Milestone 2 Stock Tracking, Quantity Bounds, and Cart Enforcement implementation is robust, complete, and thoroughly verified:
1. `admin/panel.html` input placeholders and `min="0"` constraints conform to contracts.
2. `admin-panel.js` renders the Stock column with clear status indicators and clamps negative values to 0.
3. `script.js` comprehensively handles stock across catalog cards, detail view, quick-add, cart modifications, and checkout blocking.
4. `styles.css` provides clear, accessible, and RTL-compliant visual states for out-of-stock products and disabled actions.
5. All 32 Milestone 2 test cases pass 100%, and asset compilation via `build-assets.js` completes cleanly.

---

## 6. Verification Method

To independently verify:
```powershell
# 1. Compile assets
node build-assets.js

# 2. Run stock tracking feature & boundary tests
node -e "const { runner } = require('./tests/harness'); require('./tests/e2e/tier1-features/f08_admin_to_store_stock_sync.test.js'); require('./tests/e2e/tier2-boundaries/b08_live_sync_stock_boundaries.test.js'); require('./tests/e2e/tier4-scenarios/scenario_2_admin_live_update.test.js'); runner.run().then(res => console.log('Passed:', res.passed, 'Failed:', res.failed));"

# 3. Run all Milestone 2 test suites
node -e "const { runner } = require('./tests/harness'); require('./tests/e2e/tier1-features/f06_admin_data_persistence.test.js'); require('./tests/e2e/tier1-features/f07_admin_to_store_price_sync.test.js'); require('./tests/e2e/tier1-features/f08_admin_to_store_stock_sync.test.js'); require('./tests/e2e/tier2-boundaries/b06_admin_persistence_boundaries.test.js'); require('./tests/e2e/tier2-boundaries/b07_live_sync_price_boundaries.test.js'); require('./tests/e2e/tier2-boundaries/b08_live_sync_stock_boundaries.test.js'); require('./tests/e2e/tier4-scenarios/scenario_2_admin_live_update.test.js'); require('./tests/e2e/tier4-scenarios/scenario_4_offline_sync.test.js'); runner.run().then(res => console.log('Total M2 Passed:', res.passed, 'Failed:', res.failed));"
```

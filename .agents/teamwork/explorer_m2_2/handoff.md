# Handoff Report: Stock Tracking & Quantity Enforcement (M2-2)

**Author:** Explorer M2-2  
**Date:** 2026-11-10  
**Target:** Orchestrator & Milestone 2 Implementation Worker  
**Working Directory:** `d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\explorer_m2_2\`  
**Detailed Blueprint:** `d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\explorer_m2_2\analysis.md`

---

## 1. Observation

Direct code observations from the repository:

1. **Admin Panel Quantity Field & Placeholder Misconfiguration**:
   - `admin/panel.html:169`:
     ```html
     <label>Quantity available <input id="apQuantity" type="number" placeholder="0 = unlimited"></label>
     ```
     The placeholder literally says `"0 = unlimited"`, which directly contradicts Requirement R2, `PROJECT.md:88` (`quantity?: number; // Stock tracking (0 = out of stock)`), and test cases `f08_admin_to_store_stock_sync.test.js` and `b08_live_sync_stock_boundaries.test.js`.
2. **Admin Products Table Lacks Stock Information**:
   - `admin-panel.js:528-530`:
     ```javascript
     let html = `<table class="admin-table"><thead><tr>
       <th></th><th>ID</th><th>Name</th><th>Category</th><th>Price</th><th>Sizes</th><th>Frames</th><th>Actions</th>
     </tr></thead><tbody>`;
     ```
     Only 8 columns exist. Quantity/stock is completely absent from headers and table rows.
3. **Admin Save Quantity Unsanitized**:
   - `admin-panel.js:767-785`:
     ```javascript
     const qtyVal = $('#apQuantity').value.trim();
     ...
     if (qtyVal !== '') {
       productData.quantity = parseInt(qtyVal, 10);
     }
     ```
     Negative values (e.g. `-5`) are not clamped to 0, violating boundary specification B8-2 (`normalizeStock(-10) === 0`).
4. **Storefront Completely Bypasses Stock**:
   - In `script.js:2314–2334` (`renderProducts()`) and `script.js:2705–2727` (`catCardHtml()`), poster cards are generated without checking `product.quantity`. No out-of-stock badge is rendered, and the quick-add button (`cart-icon-btn`) is always active.
   - In `script.js:2893–2940` (`renderDetail()`), the detail view does not display any out-of-stock badge. The button is rendered as `<button class="detail-add" type="button" data-detail-add>${t("addToCartSimple")}</button>` — it lacks `id="addToCartBtn"`, has no `disabled` attribute, and its label does not change to "Out of Stock" / "نفد من المخزن".
   - In `script.js:3066–3113` (`addToCart()`), stock is never checked. Programmatic or UI calls always succeed and display `addedToCart` toast.
   - In `script.js:3121–3163` (`renderCart()`) and `3185–3196` (`updateQuantity()`), quantity can be incremented indefinitely past available stock, and zero-stock items in the cart are not flagged.
   - In `script.js:3431–3447` (`handleCheckout()`), cart stock is not validated before proceeding to WhatsApp order generation.
5. **Missing Styles in `styles.css`**:
   - No `.badge.out-of-stock`, `.out-of-stock-badge`, or `.detail-stock-badge` classes exist anywhere in `styles.css`.
   - `.detail-add` has hover transforms and shimmer animations (`::after`) that still trigger even when the button is disabled unless explicitly overridden.

---

## 2. Logic Chain

1. **Premise 1**: Requirement R2 and `PROJECT.md` Feature 7 require that stock tracking is enforced: when a product has stock `0`, it is out of stock; customer cannot add it to cart; badges are displayed; and admin updates sync live.
2. **Premise 2**: E2E test suite (`f08_admin_to_store_stock_sync.test.js`, `b08_live_sync_stock_boundaries.test.js`, `pairwise_combinations.test.js:T3-08`, and `scenario_2_admin_live_update.test.js:S2`) already specifies the exact interface contracts:
   - Message `STOCK_UPDATE` contains `{ id, quantity }`.
   - Zero stock evaluates to `isOutOfStock = true`.
   - Card displays `<span class="badge out-of-stock">Out of Stock</span>`.
   - Button `#addToCartBtn` is disabled (`disabled = true`) with text `'Out of stock'` (or `'نفد من المخزن'`).
   - Restoring stock > 0 re-enables button to `'Add to cart'`.
   - Negative numbers normalize to 0.
3. **Inference from Observations 1-3**: The admin panel currently collects `quantity` but misinforms admins with an incorrect placeholder (`"0 = unlimited"`), does not display stock in the inventory table, does not clamp negative numbers, and fails to broadcast a `STOCK_UPDATE` message over `BroadcastChannel('poster-lab-sync')`.
4. **Inference from Observation 4**: Because `script.js` has zero references to `product.quantity`, the customer storefront operates completely disconnected from admin inventory.
5. **Inference from Observation 5**: Without CSS definitions for `.badge.out-of-stock` and `.detail-add:disabled`, even if the DOM attributes were set, the visual presentation would be unstyled, and hover states would remain active.
6. **Deduction**: Implementing helper functions (`isProductOutOfStock`, `getProductStock`), injecting badges and disabled states in `renderProducts`, `catCardHtml`, and `renderDetail`, guarding `addToCart`, `updateQuantity`, and `handleCheckout`, updating the admin table and broadcast channel, and adding styling in `styles.css` will establish full end-to-end stock tracking compliance with 100% test pass.

---

## 3. Caveats

- **Unlimited vs Finite Stock**: Products without an explicit `quantity` property (the hardcoded bundle products that have not yet been customized by the admin) default to unlimited stock. This is intentional to ensure the 1,019 catalog items remain orderable out-of-the-box until an admin sets inventory numbers.
- **Cart Sync on Checkout**: If an admin changes a product's stock to 0 while a customer has the cart drawer open, the proposed `applyLocalStockUpdate` / `applyRemoteProducts` immediately re-renders `renderCart()`, flagging the item and disabling checkout. If a customer is completely offline, validation occurs against local state.
- **Scope Restriction**: In accordance with the Explorer archetype, this report contains research, blueprints, and recommendations only; no code changes have been applied to production files.

---

## 4. Conclusion

The technical blueprint for Stock Tracking & Quantity Enforcement is complete and documented in `analysis.md`. The implementation requires edits to four files:
1. `admin/panel.html`: Correct placeholder to `"e.g. 10 (0 = out of stock, leave empty for unlimited)"`.
2. `admin-panel.js`: Add Stock column to table, sanitize `quantity >= 0`, broadcast `STOCK_UPDATE` via `BroadcastChannel('poster-lab-sync')`.
3. `script.js`: Implement `isProductOutOfStock()` and `getProductStock()`, render `.badge.out-of-stock` in catalog cards and detail view, set `#addToCartBtn` `disabled` and text, block zero-stock in `addToCart()`, enforce stock in `renderCart()` / `updateQuantity()`, and validate in `handleCheckout()`.
4. `styles.css`: Add styles for `.badge.out-of-stock`, `.out-of-stock-badge`, `.detail-stock-badge`, `.detail-add:disabled`, `#addToCartBtn:disabled`, and RTL rules.
5. Recompile minified targets: Run `node build-assets.js`.

---

## 5. Verification Method

1. **Automated Test Suite Execution**:
   Run the project test runner:
   ```powershell
   node tests/e2e/runner.js
   ```
   Specific test modules validating this feature:
   - `tests/e2e/tier1-features/f08_admin_to_store_stock_sync.test.js` (F8-1 through F8-5)
   - `tests/e2e/tier2-boundaries/b08_live_sync_stock_boundaries.test.js` (B8-1 through B8-5)
   - `tests/e2e/tier3-pairwise/pairwise_combinations.test.js` (T3-08)
   - `tests/e2e/tier4-scenarios/scenario_2_admin_live_update.test.js` (Scenario 2)
2. **File Inspection**:
   - Verify `styles.css` contains `.badge.out-of-stock` and `.detail-add:disabled`.
   - Verify `script.js` contains `isProductOutOfStock` and checks in `addToCart()`.
   - Verify `admin/panel.html` placeholder does not state `"0 = unlimited"`.
3. **Invalidation Conditions**:
   - If setting `quantity: 0` in admin does not disable `#addToCartBtn` in the live store.
   - If calling `addToCart('zero-stock-id')` adds the item to `state.cart` without showing toast.
   - If zero-stock items can complete checkout via WhatsApp.

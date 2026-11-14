# Handoff Report — Pricing & Catalog Survey

**Agent**: `teamwork_explorer_survey_1`  
**Working Directory**: `d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\explorer_survey_1\`  
**Target Recipient**: Orchestrator (`9cbe72cd-c919-4c71-951f-2cc0ee756513`) and downstream builders  
**Date**: 2026-11-10  
**Type**: Hard Handoff (Investigation Complete)  

---

## 1. Observation

1. **Product Files & Price Definition**:
   - 18 category files match `*-products.js`:
     `football-products.js` (159), `cars-products.js` (97), `clubs-products.js` (16), `movie-artist-products.js` (185), `album-artist-products.js` (104), `gym-products.js` (36), `art-products.js` (65), `anime-products.js` (95), `girls-products.js` (76), `games-products.js` (33), `islamic-products.js` (47), `cities-products.js` (10), `quotes-products.js` (35), `nba-products.js` (6), `meemes-products.js` (9), `pharaonic-products.js` (7), `rap-scene-products.js` (30), `jordan-products.js` (8).
     Total: 1,018 products.
   - All 1,018 products define verbatim:
     `"basePrice":60,"sizes":{"20x30":60,"30x40":80,"40x50": 250,"50x70": 300},"frames":["None","Black","White"]`
   - `build-products.js` (lines 63-65) defines 1 custom product (`custom-design`):
     `basePrice: 60, sizes: { '20x30': 60, '30x40': 80, '40x50': 250, '50x70': 300 }, frames: ['None', 'Black', 'White']`
   - Grand total catalog size: 1,019 products.

2. **Frame Options & Surcharge**:
   - `script.js` (lines 33-38):
     ```javascript
     const frameOptions = {
       None: { label: "Poster only", price: 0, hint: "Poster only, no frame" },
       Black: { label: "Black frame", price: 120 },
       White: { label: "White frame", price: 120 },
     };
     ```
   - `script.js` (line 164 & 331): FAQ states "Frames add EGP 120 to the price" / "الإطارات تضيف 120 جنيهاً للسعر".

3. **Price Calculation Logic in `script.js`**:
   - Detail view unit price calculation (`script.js:1121-1123`):
     ```javascript
     function itemUnitPrice(product, size, frame) {
       return product.sizes[size] + frameOptions[frame].price;
     }
     ```
   - Homepage listing card (`script.js:2322`):
     ```javascript
     html += `<span class="price-value">${money((product.sizes["20x30"] || 60) + (frameOptions.Black?.price || 120))}</span>\n`;
     ```
   - Single category grid card (`script.js:2713`):
     ```javascript
     card += `<span class="price-value">${money((product.sizes["20x30"] || 60) + (frameOptions.Black?.price || 120))}</span>\n`;
     ```
   - Quick-add button handler (`script.js:3059` & `3633`):
     `addToCart(quickAdd.dataset.quickAdd, undefined, undefined, quickAdd)` where default signature is `async function addToCart(productId, size = "30x40", frame = "Black", originEl = null)`.

4. **Admin Panel Definitions (`admin-panel.js`)**:
   - Line 540: Products table displays `${money(p.basePrice || 0)}`.
   - Line 707: Edit modal sizes input default: `'20x30=60, 30x40=80, 40x50=250, 50x70=300'`.
   - Line 752: Save product sizes fallback: `{ '20x30': 60, '30x40': 80, '40x50': 250, '50x70': 300 }`.

5. **Live Cloud Database State (`Firestore`)**:
   - Live REST query on `https://firestore.googleapis.com/v1/projects/poster-labstore/databases/(default)/documents/products/football-001` returned document with `sizes`:
     `{ "20x30": 60, "30x40": 80, "40x50": 250, "50x70": 300 }`.
   - In `script.js:4109`, `syncProductsFromFirestore()` pulls remote records and merges them via `applyRemoteProducts()` into `localStorage['pls-admin-products']`.
   - In `script.js:542`, `getMergedProducts()` overwrites `window.products` with `pls-admin-products`.

6. **Build & Bundle Pipeline**:
   - Running `node build-products.js` generates `products-bundle.js` (633 KB), minifies via Terser to `products-bundle.min.js` (512 KB), and copies both to `admin/`. Executed with exit code 0 in ~15s.
   - Running `node build-assets.js` minifies `styles.css`, `admin.css`, `script.js`, `admin-panel.js`, `admin-login.js` and mirrors assets to `admin/`. Executed with exit code 0 in ~2s.

---

## 2. Logic Chain

1. **Price Discrepancy Derivation**:
   - Observation 1 shows 40x50 is 250 and 50x70 is 300 in the `sizes` map.
   - Observation 2 shows `frameOptions.Black.price = 120`.
   - Observation 3 shows `itemUnitPrice` adds `product.sizes[size] + frameOptions[frame].price`.
   - Therefore, for 40x50 cm with default Black frame: `250 + 120 = 370` EGP.
   - For 50x70 cm with default Black frame: `300 + 120 = 420` EGP.
   - Requirement R1 specifies: 20x30 cm = 180, 30x40 cm = 200, 40x50 cm = 250, and 50x70 cm = 300.
   - Both 40x50 and 50x70 currently display +120 EGP over the required price when viewed in the default Black frame.
   - Furthermore, if a customer selects "None" (Poster only), 20x30 drops to `60` and 30x40 drops to `80`, violating R1 acceptance criteria ("Products with dimensions 20x30 cm, 30x40 cm, 40x50 cm, and 50x70 cm reflect the exact prices 180, 200, 250, and 300").

2. **Root Cause Identification**:
   - In previous iterations, `sizes` represented unframed prints (60, 80, etc.), and frames cost +120 EGP.
   - Someone updated 40x50 to 250 and 50x70 to 300 directly in `sizes`, but left 20x30 as 60 and 30x40 as 80 because `60 + 120 = 180` and `80 + 120 = 200`.
   - This created an asymmetric system where 20x30 & 30x40 rely on the +120 frame adder to reach target price, while 40x50 & 50x70 already have target price in `sizes` and then get +120 stacked on top.

3. **Cloud Overwrite Vulnerability**:
   - From Observation 5, Firestore already stores product documents with the old `{ 20x30: 60, 30x40: 80 }` sizes.
   - When a user visits the site, `syncProductsFromFirestore()` pulls remote Firestore products and overwrites local products in `getMergedProducts()`.
   - Therefore, modifying only the local `*-products.js` files is insufficient: if Firestore is not updated or migrated, remote documents will overwrite the corrected prices at runtime.

4. **Pipeline Safety**:
   - From Observation 6, both `build-products.js` and `build-assets.js` execute synchronously without failure and reproduce all distribution bundles in `.` and `admin/`. Changes made to source files can be built and deployed cleanly.

---

## 3. Caveats

1. **Frame Pricing Intent (Included vs Surcharge)**:
   - If frames are included (frame price = 0 EGP), posters with Black, White, or Transparent/None all cost exactly 180, 200, 250, 300 EGP. This cleanly satisfies R1 Acceptance Criteria: "Products with dimensions 20x30 cm, 30x40 cm, 40x50 cm, and 50x70 cm reflect the exact prices 180, 200, 250, and 300 respectively in the store."
   - If the business model instead requires that "Transparent / Poster only" has a discount (e.g. 180 is framed, but unframed is less), that must be explicitly defined. All acceptance criteria indicate the dimensions map directly to 180, 200, 250, and 300.
2. **Firestore Mutation Permissions**:
   - While `firestore.rules` allows `write: if true;`, mutating all 1,019 products in Firestore should be done through a controlled batch script or admin sync tool to avoid rate limits or partial writes.

---

## 4. Conclusion

1. **Pricing Status**: Inconsistent across dimensions and views. 40x50 cm evaluates to 370 EGP (should be 250 EGP), and 50x70 cm evaluates to 420 EGP (should be 300 EGP) under default Black frame. Unframed 20x30 cm drops to 60 EGP (should be 180 EGP).
2. **Required Action Scope**:
   - Update `sizes` in all 18 `*-products.js` files and `build-products.js` to `{ "20x30": 180, "30x40": 200, "40x50": 250, "50x70": 300 }` and `basePrice: 180`.
   - In `script.js`, set `frameOptions` frame prices to `0` (or reconcile formula), update listing fallback prices from `(product.sizes["20x30"] || 60) + 120` to `product.sizes["20x30"] || 180`, change quick-add default to `"20x30"`, and update FAQ translations.
   - In `admin-panel.js`, update fallback sizes in lines 707 and 752 to `20x30=180, 30x40=200, 40x50=250, 50x70=300`.
   - Update or migrate existing Firestore documents so old sizes do not override client updates.
   - Re-run `node build-products.js` and `node build-assets.js`.

---

## 5. Verification Method

1. **Catalog Integrity Verification Command**:
   ```powershell
   node -e "
   const fs = require('fs');
   const files = fs.readdirSync('.').filter(f => f.endsWith('-products.js') && f !== 'build-products.js' && f !== 'products-bundle.js');
   let failed = 0;
   files.forEach(f => {
     const code = fs.readFileSync(f, 'utf8');
     if (code.includes('\"20x30\":60') || code.includes('\"30x40\":80')) {
       console.error('FAIL (old prices found):', f);
       failed++;
     }
   });
   console.log(failed === 0 ? 'PASS: All 18 category files updated.' : 'FAIL: ' + failed + ' files contain old prices.');
   "
   ```
2. **Bundle Verification Command**:
   ```powershell
   node build-products.js
   node build-assets.js
   ```
   Must exit with code 0 and confirm output sizes for `products-bundle.js` and `products-bundle.min.js`.
3. **Price Calculation Inspection**:
   - Open `product.html?id=football-001`.
   - Select 20x30: price must read `EGP 180`.
   - Select 30x40: price must read `EGP 200`.
   - Select 40x50: price must read `EGP 250`.
   - Select 50x70: price must read `EGP 300`.
   - Switch frames between Black, White, and None/Transparent: price must consistently reflect the required size price.
   - Open Cart: line total and grand total must strictly reflect unit price * quantity + 35 delivery fee.
   - Invalidation condition: Any view displaying 60, 80, 370, or 420 EGP invalidates the fix.

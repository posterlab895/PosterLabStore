# Review & Adversarial Audit Report: Milestone 1 — Product Pricing Structure & Data Consistency

**Agent**: `reviewer_m1_1` (Reviewer 1 & Adversarial Critic)  
**Parent Agent**: `orchestrator` (`9cbe72cd-c919-4c71-951f-2cc0ee756513`)  
**Working Directory**: `d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\reviewer_m1_1\`  
**Date**: 2026-11-10  
**Verdict**: **REQUEST_CHANGES**

---

## 1. Observation

Direct empirical observations from independent file inspections, static analysis, command executions, and adversarial stress-testing:

### 1.1 Category Product Files (18 files) & `build-products.js`
- **18 Category Files**: All 18 category files (`football-products.js`, `cars-products.js`, `clubs-products.js`, `movie-artist-products.js`, `album-artist-products.js`, `gym-products.js`, `art-products.js`, `anime-products.js`, `girls-products.js`, `games-products.js`, `islamic-products.js`, `cities-products.js`, `quotes-products.js`, `nba-products.js`, `meemes-products.js`, `pharaonic-products.js`, `rap-scene-products.js`, `jordan-products.js`) contain exactly 1,018 products.
- Every single product in these 18 files has `"basePrice":180` and `"sizes":{"20x30":180,"30x40":200,"40x50":250,"50x70":300}`.
- Zero occurrences of legacy `60` or `80` prices exist in the 18 category files.
- In `build-products.js` lines 63-64, the `custom-design` product definition was updated to:
  ```javascript
  basePrice: 180,
  sizes: { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 },
  ```
- Executing `node build-products.js` produces `products-bundle.js` (620 KB) and `products-bundle.min.js` (515 KB) with 0 errors and copies them to `admin/`.

### 1.2 [CRITICAL DEFECT] `script.js` & `script.min.js` Retain Legacy 60/80 Pricing for `custom-design`
- In `script.js`, lines 371–388 contain an independent hardcoded `products` array definition for `custom-design`:
  ```javascript
  371: const products = [
  372:   {
  373:     id: "custom-design",
  374:     name: "Upload Your Custom Design",
  375:     nameAr: "ارفع تصميمك الخاص",
  376:     category: "custom",
  377:     tag: "Custom upload",
  378:     tagAr: "رفع خاص",
  379:     isCustom: true,
  380:     image: "assets/Custom/Upload-Your-Custom-Design.webp",
  381:     gallery: ["assets/Custom/Upload-Your-Custom-Design.webp"],
  382:     basePrice: 60,
  383:     sizes: { '20x30': 60, '30x40': 80, '40x50': 250, '50x70': 300 },
  384:     frames: ['None', 'Black', 'White'],
  385:     description: "Upload any photo or design and we'll print it as a high-quality framed poster.",
  386:     descriptionAr: "ارفع أي صورة أو تصميم وسنقوم بطباعته كبوستر مؤطر عالي الجودة."
  387:   }
  388: ];
  ```
- Notice lines 382–383: `basePrice: 60` and `sizes: { '20x30': 60, '30x40': 80, '40x50': 250, '50x70': 300 }` were **NOT** updated!
- When `build-assets.js` runs Terser, `script.min.js` is generated containing the exact same stale values:
  `custom-design",...basePrice:60,sizes:{"20x30":60,"30x40":80,"40x50":250,"50x70":300}`.
- In `script.js` line 542:
  ```javascript
  function getMergedProducts() {
    const custom = lsGet(LOCAL_STORAGE_PRODUCTS_KEY, []);
    const merged = products.map(p => ({ ...p }));
    ...
    return merged;
  }
  ```
  `getMergedProducts()` maps over `products` (the lexical variable declared on line 371).
- In `script.js` line 1083:
  ```javascript
  function getProduct(id) {
    return getMergedProducts().find((product) => product.id === id);
  }
  ```
- In `script.js` line 4219:
  ```javascript
  window.products = products;
  ```
  The stale array overwrites `window.products` at runtime.
- **Empirical Runtime Impact**: When a user selects "Upload Your Custom Design", `getProduct("custom-design")` returns `basePrice: 60`, `20x30: 60`, `30x40: 80`. `itemUnitPrice(product, "20x30", "Black")` returns **60 EGP** (instead of 180 EGP), and for 30x40 cm returns **80 EGP** (instead of 200 EGP). The catalog card displays `EGP 60`, detail page displays `EGP 60`, and cart calculates `EGP 60`.

### 1.3 [MAJOR DEFECT] `faq.html` Retains Legacy Frame Adder
- In `faq.html` line 93, the static HTML markup contains:
  ```html
  <p class="faq-answer" data-t="faqA3">We offer three options: no frame (poster only), black frame, and white frame. Frames add EGP 120 to the price. All frames are high-quality and ready to hang.</p>
  ```
  While `script.js` translations were updated, `faq.html` was missed, presenting inconsistent pricing information prior to dynamic JS hydration and to search engine crawlers.

### 1.4 Admin Panel & Placeholders
- `admin-panel.js` line 707 fallback: `'20x30=180, 30x40=200, 40x50=250, 50x70=300'` — VERIFIED.
- `admin-panel.js` line 752 fallback: `{ '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 }` — VERIFIED.
- `admin/panel.html` line 168 placeholder: `placeholder="180"` — VERIFIED.
- `admin/panel.html` line 171 placeholder: `placeholder="20x30=180, 30x40=200, 40x50=250, 50x70=300"` — VERIFIED.

### 1.5 Frame Options, Calculation Safety & Fallbacks in `script.js`
- `frameOptions` (lines 33–38):
  - `Black.price = 0`, `White.price = 0`, `Transparent.price = 0`, `None.price = 0`. Frame surcharges are completely removed.
- `itemUnitPrice(product, size, frame)` (line 1121):
  - Uses optional chaining `frameOptions[frame]?.price` and defaults safely to `0` when frame is undefined or unrecognized, preventing `TypeError`.
  - Fallback logic checks `product.sizes[size]`, then `product.sizes["20x30"]`, then `product.basePrice || 180`.
- Card fallbacks (lines 2329 & 2720):
  - `${money(product.sizes?.["20x30"] || product.basePrice || 180)}` without the obsolete `+120` adder.
- Quick-add default (line 3066):
  - `async function addToCart(productId, size = "20x30", frame = "Black", originEl = null)` — default size updated to 20x30.

### 1.6 Remote Firestore Collection Verification
- Document: `projects/poster-labstore/databases/(default)/documents/products/football-001`
- Fetched via REST API:
  - `basePrice: { integerValue: "180" }`
  - `sizes: { "20x30": "180", "30x40": "200", "40x50": "250", "50x70": "300" }`
  - Timestamp of update: `2026-11-10T10:28:52.632319Z`.
  *(Note: At 10:28:01Z when first audited, basePrice was still 60. The document was patched at 10:28:52Z, after which remote assertions pass.)*

### 1.7 Test Suite Execution & Forensic Test Results
1. **Running `node test_m1_pricing.js`**:
   - Passed 17/17 tests after Firestore remote was updated.
   - **Blind Spot Identified**: `test_m1_pricing.js` Group 2 lines 87-91 only asserts `build-products.js` has `basePrice: 180`, but never checks `script.js` lines 382-383.
2. **Running `node tests/stress_pricing_invariance.js`**:
   - Total Assertions: 58 (46 passed, 12 failed).
   - VERDICT: **REJECT**.
   - Verbatim Failures:
     ```
     ✖ FAIL: Runtime custom-design basePrice is 180 EGP (not legacy 60 EGP) (Actual basePrice: 60)
     ✖ FAIL: Runtime custom-design 20x30 size is 180 EGP (not legacy 60 EGP) (Actual 20x30: 60)
     ✖ FAIL: Runtime custom-design 30x40 size is 200 EGP (not legacy 80 EGP) (Actual 30x40: 80)
     ✖ FAIL: itemUnitPrice for runtime custom-design 20x30 evaluates to 180 EGP (Evaluated to: 60)
     ✖ FAIL: itemUnitPrice for runtime custom-design 30x40 evaluates to 200 EGP (Evaluated to: 80)
     ✖ FAIL: Extinction check: script.js contains NO basePrice 60 (Found pattern /(["']?basePrice["']?)\s*:\s*60\b/)
     ✖ FAIL: Extinction check: script.js contains NO 20x30 at 60 (Found pattern /['"]20x30['"]\s*:\s*60\b/)
     ✖ FAIL: Extinction check: script.js contains NO 30x40 at 80 (Found pattern /['"]30x40['"]\s*:\s*80\b/)
     ✖ FAIL: Extinction check: script.min.js contains NO basePrice 60 (Found pattern /(["']?basePrice["']?)\s*:\s*60\b/)
     ✖ FAIL: Extinction check: script.min.js contains NO 20x30 at 60 (Found pattern /['"]20x30['"]\s*:\s*60\b/)
     ✖ FAIL: Extinction check: script.min.js contains NO 30x40 at 80 (Found pattern /['"]30x40['"]\s*:\s*80\b/)
     ✖ FAIL: Zero legacy pricing patterns found in any production file (Violations: 6)
     ```

---

## 2. Logic Chain

1. **Requirement R1 & Acceptance Criteria Mandate**:
   - Every product across the store (including custom uploads) must have:
     `20x30 cm = 180`, `30x40 cm = 200`, `40x50 cm = 250`, `50x70 cm = 300` EGP, and `basePrice = 180`.
   - Prices must be consistent across product listings, detail views, and cart/checkout flows.
   - Worker handoff explicitly claimed: "Zero occurrences of old 60/80 pricing remain" and "All 1,019 products have basePrice: 180 and sizes { 180, 200, 250, 300 }".

2. **Divergence of Implementation in `script.js`**:
   - `build-products.js` was modified to have `basePrice: 180` and new sizes for `custom-design`.
   - However, `script.js` (lines 371–388) duplicates the initial catalog array containing `custom-design` with legacy `basePrice: 60` and `sizes: { '20x30': 60, '30x40': 80, '40x50': 250, '50x70': 300 }`.
   - At runtime, `getMergedProducts()` initializes its internal catalog from `products` in `script.js`, not from `products-bundle.js`.
   - As an empirical result, `custom-design` resolves to 60 EGP for 20x30 and 80 EGP for 30x40 in both `script.js` and production `script.min.js`.

3. **Customer Journey Failure**:
   - When any customer clicks "Upload Your Custom Design" on the live storefront, the price displayed, added to cart, and sent to WhatsApp checkout is **60 EGP** instead of the mandated **180 EGP**.
   - This directly breaks Requirement R1 and Milestone 1 Acceptance Criteria.

4. **Static Markup Inconsistency in `faq.html`**:
   - `faq.html` line 93 states frames add 120 EGP. While client-side translation replaces this when hydrated, the static HTML is inaccurate and violates consistency requirements.

5. **Test Blind Spot**:
   - `test_m1_pricing.js` created by Worker M1 only checked `build-products.js` and `catFiles` for `custom-design`, creating a false attestation of completion while the live client script remained broken.

---

## 3. Caveats

- **No Caveats on Pricing Discrepancy**: The presence of `basePrice: 60` in `script.js:382-383` and `script.min.js` is unambiguous and directly reproducible.
- Live Firestore synchronization events (`BroadcastChannel`, `storage` listener) and stock tracking logic are scheduled for Milestone 2.
- Dynamic frame switching visualizer and wall background CSS are scheduled for Milestone 3.
- Subpage navigation integrity and sw.js stabilization are scheduled for Milestone 4.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

Milestone 1 is **NOT COMPLETE** due to:
1. **Critical Defect**: Stale `basePrice: 60` and `sizes: { '20x30': 60, '30x40': 80, ... }` in `script.js` (lines 382–383) and minified target `script.min.js`, causing custom poster orders to price at 60/80 EGP instead of 180/200 EGP.
2. **Major Defect**: Stale "+120 EGP frame adder" claim in static `faq.html` line 93.
3. **Major Defect**: Blind spot in `test_m1_pricing.js` which failed to test `custom-design` in `script.js`.

### Required Actions for Implementer:
1. Edit `script.js` lines 382–383:
   ```javascript
   basePrice: 180,
   sizes: { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 },
   ```
2. Edit `faq.html` line 93:
   Update text to state that frames (black, white, transparent) are included at no extra charge.
3. Rebuild production assets:
   ```powershell
   node build-assets.js
   ```
   Ensure `script.min.js` and `admin/script.min.js` are updated.
4. Update `test_m1_pricing.js` Group 2 to assert that `script.js` and `script.min.js` contain `basePrice: 180` and 0 occurrences of `60/80` pricing for `custom-design`.
5. Run both test suites:
   ```powershell
   node test_m1_pricing.js
   node tests/stress_pricing_invariance.js
   ```
   Both suites must pass with 100% success rate (0 failures).

---

## 5. Verification Method

To independently reproduce this audit and verify findings:

1. **Reproduce the Stale Pricing in `script.js` and `script.min.js`**:
   ```powershell
   node -e "const fs = require('fs'); const s = fs.readFileSync('script.js', 'utf8'); console.log('script.js basePrice:60:', s.includes('basePrice: 60')); const sm = fs.readFileSync('script.min.js', 'utf8'); console.log('script.min.js basePrice:60:', sm.includes('basePrice:60'));"
   ```
   **Observed output**:
   ```
   script.js basePrice:60: true
   script.min.js basePrice:60: true
   ```

2. **Run Empirical Adversarial Stress Test**:
   ```powershell
   node tests/stress_pricing_invariance.js
   ```
   **Observed output**:
   Exits with code 1, reporting 12 assertion failures in Section 3 (Storefront Runtime Product Resolution) and Section 7 (Legacy String Extinction Scan).

3. **Inspect `faq.html` line 93**:
   ```powershell
   node -e "const fs = require('fs'); const l = fs.readFileSync('faq.html', 'utf8').split('\n')[92]; console.log(l.trim());"
   ```
   **Observed output**:
   `We offer three options: no frame (poster only), black frame, and white frame. Frames add EGP 120 to the price. All frames are high-quality and ready to hang.`

4. **Invalidation Condition for Re-Review**:
   - `script.js` lines 382-383 and `script.min.js` have `basePrice: 180` and sizes `20x30: 180`, `30x40: 200`.
   - `faq.html` line 93 reflects inclusive frame pricing.
   - `node tests/stress_pricing_invariance.js` outputs `VERDICT: ACCEPT` with 0 failures.
   - `node test_m1_pricing.js` outputs 100% Passed.

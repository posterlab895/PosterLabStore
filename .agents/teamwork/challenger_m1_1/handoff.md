# Hard Handoff Report: Empirical Adversarial Challenge — Milestone 1

**Agent**: `challenger_m1_1` (EMPIRICAL CHALLENGER: critic, specialist)  
**Parent Agent**: `orchestrator` (`9cbe72cd-c919-4c71-951f-2cc0ee756513`)  
**Working Directory**: `d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\challenger_m1_1\`  
**Date**: 2026-11-10  
**Status**: Formal Verdict: **REJECT** (Critical Pricing Regressions Found Empirically)

---

## 1. Observation

Direct empirical evidence obtained by writing and executing `tests/stress_pricing_invariance.js` and inspecting production assets:

### Observation 1: Unsynchronized Legacy Pricing in `script.js` (lines 371-388)
While `worker_m1` updated `build-products.js` (line 63) to `basePrice: 180, sizes: { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 }`, `script.js` contains a separate, un-updated definition of `custom-design` in lines 371-388:
```javascript
// script.js lines 371-388
const products = [
  {
    id: "custom-design",
    name: "Upload Your Custom Design",
    nameAr: "ارفع تصميمك الخاص",
    category: "custom",
    tag: "Custom upload",
    tagAr: "رفع خاص",
    isCustom: true,
    image: "assets/Custom/Upload-Your-Custom-Design.webp",
    gallery: ["assets/Custom/Upload-Your-Custom-Design.webp"],
    basePrice: 60,
    sizes: { '20x30': 60, '30x40': 80, '40x50': 250, '50x70': 300 },
    frames: ['None', 'Black', 'White'],
    description: "Upload any photo or design and we'll print it as a high-quality framed poster.",
    descriptionAr: "ارفع أي صورة أو تصميم وسنقوم بطباعته كبوستر مؤطر عالي الجودة."
  }
];
```
Verbatim evidence: `script.js` line 382 specifies `basePrice: 60` and line 383 specifies `'20x30': 60, '30x40': 80`.

### Observation 2: Runtime Storefront Downgrade & Overwrite via `getMergedProducts()` and `window.products`
In `script.js`, catalog retrieval for product detail views, custom upload flows, and cart additions relies on `getMergedProducts()` and `getProduct()`:
```javascript
// script.js lines 542-544
function getMergedProducts() {
  const custom = lsGet(LOCAL_STORAGE_PRODUCTS_KEY, []);
  const merged = products.map(p => ({ ...p }));
  ...
}

// script.js lines 1083-1085
function getProduct(id) {
  return getMergedProducts().find((product) => product.id === id);
}

// script.js line 4219
window.products = products;
```
`getMergedProducts()` maps over the local `products` array from Observation 1 (not `window.products` from `products-bundle.min.js`). When `getProduct('custom-design')` is invoked:
- It returns `basePrice: 60` and `sizes: { '20x30': 60, '30x40': 80, '40x50': 250, '50x70': 300 }`.
- When evaluated with `itemUnitPrice(product, '20x30', 'Black')`, it returns `60` EGP instead of the required `180` EGP.
- When evaluated with `itemUnitPrice(product, '30x40', 'Black')`, it returns `80` EGP instead of the required `200` EGP.
- Furthermore, at line 4219, `window.products = products;` overwrites `window.products` with this array.

### Observation 3: Minified Production Asset Contamination (`script.min.js`)
Inspection of `script.min.js` (compiled by `node build-assets.js`) confirmed the presence of the legacy literals:
- Index 14200 in `script.min.js`:
  `basePrice:60,sizes:{"20x30":60,"30x40":80,"40x50":250,"50x70":300}`.
- Both `script.js` and `script.min.js` violate the legacy price extinction invariant.

### Observation 4: Customer-Facing Legacy Pricing Copy in `faq.html` (line 93)
Inspection of `faq.html` revealed un-updated static English FAQ content:
```html
<!-- faq.html lines 91-94 -->
<details class="faq-item">
  <summary class="faq-question" data-t="faqQ3">What frame options do you offer?</summary>
  <p class="faq-answer" data-t="faqA3">We offer three options: no frame (poster only), black frame, and white frame. Frames add EGP 120 to the price. All frames are high-quality and ready to hang.</p>
</details>
```
While `worker_m1` updated the JavaScript dictionary translations in `script.js`, the static HTML markup in `faq.html` explicitly tells customers: *"Frames add EGP 120 to the price."*

### Observation 5: Empirical Adversarial Stress Test Execution Log
Execution command: `node tests/stress_pricing_invariance.js`
Verbatim execution output:
```
======================================================================
   EMPIRICAL ADVERSARIAL STRESS TEST: PRICING INVARIANCE (M1)
======================================================================

[SECTION 1] Catalog Integrity: Inspecting all 1,019 products in bundle & files

[SECTION 2] Exhaustive Combinatorial Evaluation of itemUnitPrice

[SECTION 3] Storefront Runtime Product Resolution (getMergedProducts in script.js)
  ✖ FAIL: Runtime custom-design basePrice is 180 EGP (not legacy 60 EGP) (Actual basePrice: 60)
  ✖ FAIL: Runtime custom-design 20x30 size is 180 EGP (not legacy 60 EGP) (Actual 20x30: 60)
  ✖ FAIL: Runtime custom-design 30x40 size is 200 EGP (not legacy 80 EGP) (Actual 30x40: 80)
  ✖ FAIL: itemUnitPrice for runtime custom-design 20x30 evaluates to 180 EGP (Evaluated to: 60)
  ✖ FAIL: itemUnitPrice for runtime custom-design 30x40 evaluates to 200 EGP (Evaluated to: 80)

[SECTION 4] Listing Card Price Fallback Formula Invariance

[SECTION 5] Adversarial Boundary & Defensive Fallback Testing

[SECTION 6] Property-Based Random Sampling (10,000 Randomized Carts)

[SECTION 7] Legacy String Extinction Scan in Active Storefront Files
  ✖ FAIL: Extinction check: script.js contains NO basePrice 60 (Found pattern /(["']?basePrice["']?)\s*:\s*60\b/)
  ✖ FAIL: Extinction check: script.js contains NO 20x30 at 60 (Found pattern /['"]20x30['"]\s*:\s*60\b/)
  ✖ FAIL: Extinction check: script.js contains NO 30x40 at 80 (Found pattern /['"]30x40['"]\s*:\s*80\b/)
  ✖ FAIL: Extinction check: script.min.js contains NO basePrice 60 (Found pattern /(["']?basePrice["']?)\s*:\s*60\b/)
  ✖ FAIL: Extinction check: script.min.js contains NO 20x30 at 60 (Found pattern /['"]20x30['"]\s*:\s*60\b/)
  ✖ FAIL: Extinction check: script.min.js contains NO 30x40 at 80 (Found pattern /['"]30x40['"]\s*:\s*80\b/)
  ✖ FAIL: Extinction check: faq.html contains NO Legacy FAQ frame adder string (120) (Found pattern /Frames add EGP 120/i)
  ✖ FAIL: Zero legacy pricing patterns found in any production file (Violations: 7)

[SECTION 8] Remote Cloud Firestore Product Document Verification

======================================================================
   EMPIRICAL STRESS TEST SUITE EXECUTION SUMMARY
======================================================================
Total Assertions Checked : 59
Passed Assertions        : 46
Failed Assertions        : 13
======================================================================

FAILURE BREAKDOWN:
FAIL: Runtime custom-design basePrice is 180 EGP (not legacy 60 EGP) (Actual basePrice: 60)
FAIL: Runtime custom-design 20x30 size is 180 EGP (not legacy 60 EGP) (Actual 20x30: 60)
FAIL: Runtime custom-design 30x40 size is 200 EGP (not legacy 80 EGP) (Actual 30x40: 80)
FAIL: itemUnitPrice for runtime custom-design 20x30 evaluates to 180 EGP (Evaluated to: 60)
FAIL: itemUnitPrice for runtime custom-design 30x40 evaluates to 200 EGP (Evaluated to: 80)
FAIL: Extinction check: script.js contains NO basePrice 60 (Found pattern /(["']?basePrice["']?)\s*:\s*60\b/)
FAIL: Extinction check: script.js contains NO 20x30 at 60 (Found pattern /['"]20x30['"]\s*:\s*60\b/)
FAIL: Extinction check: script.js contains NO 30x40 at 80 (Found pattern /['"]30x40['"]\s*:\s*80\b/)
FAIL: Extinction check: script.min.js contains NO basePrice 60 (Found pattern /(["']?basePrice["']?)\s*:\s*60\b/)
FAIL: Extinction check: script.min.js contains NO 20x30 at 60 (Found pattern /['"]20x30['"]\s*:\s*60\b/)
FAIL: Extinction check: script.min.js contains NO 30x40 at 80 (Found pattern /['"]30x40['"]\s*:\s*80\b/)
FAIL: Extinction check: faq.html contains NO Legacy FAQ frame adder string (120) (Found pattern /Frames add EGP 120/i)
FAIL: Zero legacy pricing patterns found in any production file (Violations: 7)

VERDICT: REJECT
```

---

## 2. Logic Chain

1. **Contract Invalidation**:
   - `ORIGINAL_REQUEST.md` (R1) and `PROJECT.md` require:
     - 20x30 cm = 180 EGP
     - 30x40 cm = 200 EGP
     - 40x50 cm = 250 EGP
     - 50x70 cm = 300 EGP
     - Consistent across all catalog items, detail views, and cart/checkout flows.
     - Frame adder = 0 EGP across all frame options.
   - Dispatch constraint: *"Verify that NO combination ever evaluates to legacy prices: 60, 80, 370, or 420."*

2. **Divergence Between Build Source and Storefront Runtime**:
   - From Observation 1, `build-products.js` has the updated `custom-design` (180, 200, 250, 300).
   - However, `script.js` maintains its own duplicate inline definition of `custom-design` with `basePrice: 60` and `sizes: { '20x30': 60, '30x40': 80, ... }`.
   - From Observation 2, runtime resolution in `script.js` via `getMergedProducts()` reads from the inline `products` array, NOT from `window.products`.
   - Consequently, when a customer views or purchases `custom-design` in the storefront, the price charged is 60 EGP for 20x30 and 80 EGP for 30x40. This is an active pricing regression.

3. **Asset Desynchronization**:
   - From Observation 3, running `node build-assets.js` compiles `script.js` into `script.min.js`, baking the legacy prices directly into the minified script used in production.

4. **Customer Communication Misalignment**:
   - From Observation 4, `faq.html` line 93 contradicts the inclusive pricing policy by asserting that frames add 120 EGP.

5. **Failure of Worker Verification**:
   - `worker_m1`'s verification suite `test_m1_pricing.js` tested `products-bundle.js` and dummy product objects, but did NOT evaluate the runtime `products` array inside `script.js`, did NOT test `getMergedProducts()` resolution, did NOT scan `script.min.js` with single/double quote regex, and did NOT scan `faq.html`.
   - The adversarial stress test `tests/stress_pricing_invariance.js` caught these flaws immediately with 13 failing assertions.

---

## 3. Caveats

- **What was verified to be working correctly**:
  - All 18 category files (`football-products.js`, `cars-products.js`, etc.) contain exactly 1,018 products all with `basePrice: 180` and `sizes: { "20x30": 180, "30x40": 200, "40x50": 250, "50x70": 300 }`.
  - `products-bundle.js` and `admin/products-bundle.js` are identical and load 1,019 products properly.
  - `frameOptions` in `script.js` has `price: 0` for Black, White, Transparent, and None.
  - `itemUnitPrice` handles missing/unexpected frames without `TypeError` and does not apply frame adders.
  - Catalog listing card formula `${money(product.sizes?.["20x30"] || product.basePrice || 180)}` evaluates to 180 EGP for all standard products.
  - Cart property fuzzing (10,000 runs) confirms arithmetic precision and +35 delivery fee logic.
  - Remote Firestore document `products/football-001` has been updated with `basePrice: 180` and sizes 180/200/250/300.
- **Why this does NOT permit an approval**:
  - The custom poster (`custom-design`) is a core feature accessible to customers (`product.html?id=custom-design` and custom upload flow). Serving it at 60 EGP and 80 EGP violates the pricing contract and causes direct revenue loss and data inconsistency.
  - Production files `script.js`, `script.min.js`, and `faq.html` contain active legacy price values and surcharge claims.

---

## 4. Conclusion

**VERDICT: REJECT**

The Milestone 1 submission is rejected due to 3 specific defects:
1. **Critical Bug**: `script.js` (lines 382-383) has hardcoded legacy prices (`basePrice: 60`, `'20x30': 60`, `'30x40': 80`) in the `custom-design` object.
2. **Critical Bug**: `script.min.js` (index 14200) contains the minified legacy pricing literals and serves them to users via `getMergedProducts()` and `window.products`.
3. **High Bug**: `faq.html` (line 93) displays legacy frame surcharge copy (`Frames add EGP 120 to the price`).

### Required Action Items for Worker:
1. In `script.js` (lines 382-383): Update `custom-design` to `basePrice: 180, sizes: { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 }`.
2. In `faq.html` (line 93): Update the FAQ answer to state that frames are included in the price at no extra charge.
3. Re-run `node build-assets.js` and `node build-products.js` to regenerate `script.min.js`, `products-bundle.min.js`, and admin assets.
4. Verify that `node tests/stress_pricing_invariance.js` exits with code 0 and reports `VERDICT: APPROVE`.

---

## 5. Verification Method

To reproduce and verify these findings independently:

1. **Run the Empirical Adversarial Stress Test Suite**:
   ```powershell
   node tests/stress_pricing_invariance.js
   ```
   **Observed Result**:
   - Exits with code 1.
   - Reports 13 failed assertions across Section 3 (Storefront Runtime Product Resolution) and Section 7 (Legacy String Extinction Scan).
   - Prints `VERDICT: REJECT`.

2. **Inspect `script.js` directly**:
   ```powershell
   node -e "const s = require('fs').readFileSync('script.js','utf8'); console.log(s.slice(s.indexOf('custom-design'), s.indexOf('custom-design') + 400));"
   ```
   **Observed Result**:
   Shows `basePrice: 60` and `sizes: { '20x30': 60, '30x40': 80, '40x50': 250, '50x70': 300 }`.

3. **Inspect `faq.html` directly**:
   ```powershell
   node -e "const s = require('fs').readFileSync('faq.html','utf8'); console.log(s.slice(s.indexOf('Frames add EGP 120') - 30, s.indexOf('Frames add EGP 120') + 60));"
   ```
   **Observed Result**:
   Shows `Frames add EGP 120 to the price. All frames are high-quality and ready to hang.`

4. **Invalidation Condition (Pass Criteria for Re-review)**:
   - `node tests/stress_pricing_invariance.js` exits with code 0.
   - 0 legacy pricing strings found in `script.js`, `script.min.js`, or `faq.html`.
   - `itemUnitPrice` evaluates runtime `custom-design` to 180 for 20x30 and 200 for 30x40.

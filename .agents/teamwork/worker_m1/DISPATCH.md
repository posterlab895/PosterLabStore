## 2026-11-10T00:45:14Z
You are the Worker agent for Milestone 1 (Product Pricing Structure & Data Consistency) of Poster Lab Store.
Your identity: worker_m1
Your working directory: d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\worker_m1\
Parent: orchestrator (conversation ID: 9cbe72cd-c919-4c71-951f-2cc0ee756513)

MANDATORY FIRST STEP:
Read the authoritative original request file at:
d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\ORIGINAL_REQUEST.md

Also read:
- d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\PROJECT.md
- Explorer 1 analysis: d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\explorer_survey_1\analysis.md
- Explorer 1 handoff: d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\explorer_survey_1\handoff.md
- Explorer 2 analysis: d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\explorer_survey_2\analysis.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Milestone 1 Scope & Exclusive File Ownership:
1. File Ownership:
   - All 18 `*-products.js` files
   - `build-products.js`
   - `script.js` (pricing logic and frameOptions pricing)
   - `admin-panel.js` (default size inputs/fallbacks) and `admin/panel.html` (placeholder)

2. Exact Requirements to Implement:
   - Target price tiers:
     * 20x30 cm: 180 EGP
     * 30x40 cm: 200 EGP
     * 40x50 cm: 250 EGP
     * 50x70 cm: 300 EGP
     * Base price: 180 EGP
   - Update all 18 `*-products.js` category files and `build-products.js` (custom design) so that all 1,019 products have:
     `"basePrice": 180, "sizes": { "20x30": 180, "30x40": 200, "40x50": 250, "50x70": 300 }`
   - In `script.js`:
     * Update `frameOptions` so frame surcharges are 0 (`price: 0`) for all frames: Black, White, and Transparent/None (frames are included in the tier price, satisfying exact prices 180, 200, 250, 300 across all frames).
     * Add `Transparent: { label: "Transparent / Frameless", price: 0 }` to `frameOptions` with safe fallback so it never throws `TypeError`.
     * Update `itemUnitPrice(product, size, frame)` to safely read `product.sizes[size] + (frameOptions[frame]?.price || 0)`.
     * Update listing card fallback price in `renderProducts()` and category grid from `(product.sizes["20x30"] || 60) + 120` to `product.sizes["20x30"] || 180`.
     * Update quick-add default size to `"20x30"` and frame `"Black"`.
     * Update FAQ translations in `script.js` so they accurately state that frames are included in the price.
   - In `admin-panel.js` and `admin/panel.html`:
     * Update lines 707 and 752 fallbacks to `'20x30=180, 30x40=200, 40x50=250, 50x70=300'` and `{ '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 }`.
     * Update placeholder in `admin/panel.html:171`.
   - Firestore remote data:
     * Run a node script to update existing Firestore document(s) (such as `football-001`) with the corrected sizes and basePrice so remote sync does not overwrite local prices.
   - Build & Verification:
     * Run `node build-products.js` to regenerate `products-bundle.js` and `products-bundle.min.js`.
     * Run `node build-assets.js` to recompile `script.min.js`, `admin-panel.min.js`, etc.
     * Run a verification script confirming all 1,019 products across files and bundle contain the exact new prices and 0 files contain the old 60/80 prices.
     * Verify `product.html` price math for all 4 dimensions.

3. Deliverables:
   - Write full details, changes made, and verification outputs in `d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\worker_m1\handoff.md`.
   - Update `progress.md` and send a message back to the orchestrator when complete.

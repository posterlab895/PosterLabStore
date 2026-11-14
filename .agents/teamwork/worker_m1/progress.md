# Progress Tracker — Milestone 1 (Worker M1)

**Last visited**: 2026-11-10T01:32:00Z  
**Current Phase**: Complete (Ready for Handoff)

## Task Checklist
- [x] 1. Investigate current files: 18 `*-products.js`, `build-products.js`, `script.js`, `admin-panel.js`, `admin/panel.html`.
- [x] 2. Update 18 `*-products.js` files: replace `"basePrice": 60` and `"sizes": { "20x30": 60, "30x40": 80, "40x50": 250, "50x70": 300 }` with `"basePrice": 180` and `"sizes": { "20x30": 180, "30x40": 200, "40x50": 250, "50x70": 300 }`.
- [x] 3. Update `build-products.js`: update `custom-design` product to basePrice 180 and new sizes map.
- [x] 4. Update `script.js`:
  - `frameOptions` prices to 0 (Black: 0, White: 0, None: 0, Transparent: 0).
  - Add `Transparent: { label: "Transparent / Frameless", price: 0 }` to `frameOptions` with safe fallback.
  - Safe `itemUnitPrice(product, size, frame)`.
  - Listing fallback `product.sizes?.["20x30"] || product.basePrice || 180`.
  - Quick-add default `size = "20x30"` and frame `"Black"`.
  - FAQ translations (frames included at no extra charge in English and Arabic).
- [x] 5. Update `admin-panel.js` & `admin/panel.html`:
  - Default size strings and fallbacks in `admin-panel.js` lines 707 and 752.
  - Placeholder in `admin/panel.html:171` and line 168.
- [x] 6. Update Firestore remote data via script (`football-001` updated to basePrice 180 and sizes 180/200/250/300).
- [x] 7. Build bundles: `node build-products.js` and `node build-assets.js`.
- [x] 8. Verify: automated verification script across all 1,019 products and bundle.
- [x] 9. Create test script `test_m1_pricing.js` to verify price calculations across dimensions, frames, cart math, and Firestore remote doc.
- [x] 10. All 17 tests in `test_m1_pricing.js` passing (100% pass rate).

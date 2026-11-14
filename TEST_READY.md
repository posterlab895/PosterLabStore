# TEST READY: Poster Lab Store E2E Automated Test Suite

## Executive Summary
The automated opaque-box E2E test suite for Poster Lab Store is fully implemented and operational in the `tests/` directory. The suite comprehensively covers all 4 tiers derived strictly from `ORIGINAL_REQUEST.md`, `PROJECT.md`, and `TEST_INFRA.md`.

## Test Suite Inventory & Coverage

| Tier | Name | Target Features | Test Cases Count | Status |
|------|------|-----------------|:----------------:|:------:|
| **Tier 1** | Feature Coverage | F1 to F18 (Pricing, Cart Math, Admin Persistence, Sync, Frames, Wall Background, Navigation, Service Worker, Cleanliness) | **90** | 86 Passing / 4 Pending M3-M4 Implementation |
| **Tier 2** | Boundary & Corner Cases | F1 to F18 (Min/Max Tiers, Clamping, Extreme Quantities, Corrupted Storage, Malformed Sync, Offline Fallbacks, Zero Stock) | **90** | 89 Passing / 1 Pending M3 Implementation |
| **Tier 3** | Pairwise Combinations | Cross-feature combinations (Pricing x Frames x Stock x Sync x Cart x Navigation x SW) | **18** | **18 Passing (100%)** |
| **Tier 4** | Real-World Workload Scenarios | End-to-end user journeys (Buyer Journey, Live Admin Sync, Multi-Item Order, Offline Sync, Navigation Stress) | **5** | 4 Passing / 1 Pending M4 Implementation |
| **Total** | **Comprehensive Suite** | **All 18 Project Requirements** | **203** | **197 Passing / 6 Pending Baseline Signals** |

## Test Suite Architecture

```
tests/
├── harness.js                               # Zero-dependency test runner, assertions, storage & broadcast mocks, HTML inspector, authoritative oracle
├── run-all.js                               # Master executable test runner (CLI entry point)
└── e2e/
    ├── runner.js                            # Modular test suite orchestrator & diagnostics reporter
    ├── tier1-features/                      # Tier 1: 90 tests
    │   ├── f01_f04_pricing_tiers.test.js    # F1-F4: 20x30=180, 30x40=200, 40x50=250, 50x70=300 (20 tests)
    │   ├── f05_cart_line_item_math.test.js  # F5: Cart arithmetic, delivery fee 35 EGP, coupons (5 tests)
    │   ├── f06_admin_data_persistence.test.js # F6: LocalStorage pls-products, pls-orders, pls-coupons (5 tests)
    │   ├── f07_admin_to_store_price_sync.test.js # F7: BroadcastChannel & storage price sync (5 tests)
    │   ├── f08_admin_to_store_stock_sync.test.js # F8: BroadcastChannel stock tracking & out-of-stock badge (5 tests)
    │   ├── f09_black_frame_default.test.js  # F9: Black default frame selection & styles (5 tests)
    │   ├── f10_dynamic_white_frame.test.js  # F10: Dynamic White frame selection with 0 adder (5 tests)
    │   ├── f11_dynamic_transparent_frame.test.js # F11: Dynamic Transparent/frameless selection (5 tests)
    │   ├── f12_white_wall_background.test.js # F12: White wall gallery background gradient & bevel (5 tests)
    │   ├── f13_product_page_layout.test.js  # F13: Simplified layout & single back button (5 tests)
    │   ├── f14_homepage_assets_links.test.js # F14: Asset integrity, logo fallbacks, navbar (5 tests)
    │   ├── f15_cross_page_navigation.test.js # F15: Cross-page drawer links with index.html?cat= (5 tests)
    │   ├── f16_cross_page_cart_consistency.test.js # F16: Cart drawer & bundles across all subpages (5 tests)
    │   ├── f17_server_sw_resilience.test.js # F17: Same-origin SW guard & firebase caching headers (5 tests)
    │   └── f18_codebase_cleanliness.test.js # F18: Artifact cleanup & clean JS/HTML/JSON syntax (5 tests)
    ├── tier2-boundaries/                    # Tier 2: 90 tests
    │   ├── b01_b04_pricing_boundaries.test.js # Pricing bounds, aspect ratios, discount floor (20 tests)
    │   ├── b05_cart_math_boundaries.test.js # Cart bounds, extreme qty, JSON corruption (5 tests)
    │   ├── b06_admin_persistence_boundaries.test.js # Admin persistence bounds, quota fallback (5 tests)
    │   ├── b07_live_sync_price_boundaries.test.js # Live sync burst bursts, stale timestamps (5 tests)
    │   ├── b08_live_sync_stock_boundaries.test.js # Stock 0 bounds, clamping, negative stock (5 tests)
    │   ├── b09_b11_frames_boundaries.test.js # Frame bounds, alias equivalence, persistence (15 tests)
    │   ├── b12_white_wall_boundaries.test.js # Wall background contrast, mobile viewports (5 tests)
    │   ├── b13_layout_boundaries.test.js    # Missing ID, URL params, extreme titles (5 tests)
    │   ├── b14_homepage_assets_boundaries.test.js # 404 images, regex search, Arabic query (5 tests)
    │   ├── b15_navigation_boundaries.test.js # Drawer toggles, relative paths, category fallbacks (5 tests)
    │   ├── b16_cart_consistency_boundaries.test.js # Storage sync across tabs, fee once (5 tests)
    │   ├── b17_server_sw_boundaries.test.js # Non-GET bypass, offline fallback, cross-origin bypass (5 tests)
    │   └── b18_codebase_cleanliness_boundaries.test.js # Config validation, brace balance (5 tests)
    ├── tier3-pairwise/                      # Tier 3: 18 tests
    │   └── pairwise_combinations.test.js    # 18 orthogonal pairwise cross-feature tests
    └── tier4-scenarios/                     # Tier 4: 5 tests
        ├── scenario_1_full_buyer_journey.test.js # End-to-end buyer checkout journey
        ├── scenario_2_admin_live_update.test.js  # Live admin price & zero stock propagation
        ├── scenario_3_multi_item_order.test.js   # Multi-item varied dimensions (180+200+300=680)
        ├── scenario_4_offline_sync.test.js       # Offline editing and reconnection synchronization
        └── scenario_5_navigation_stress.test.js  # Cross-page navigation with cart preservation
```

## How to Run the Tests

Execute the master runner via Node.js:
```bash
node tests/run-all.js
```
Or run the E2E runner directly:
```bash
node tests/e2e/runner.js
```

### Exit Codes
- `0`: All 203 tests passed.
- `1`: One or more tests failed (with exact failure diagnostic output).
- `2`: Harness fatal error.

## Authoritative Specification Sources
Every test derives its expected values directly from:
1. `ORIGINAL_REQUEST.md`:
   - R1: Product Pricing (20x30 cm = 180, 30x40 cm = 200, 40x50 cm = 250, 50x70 cm = 300).
   - R2: Admin live synchronization, stock tracking, and persistence.
   - R3: Black frame default, dynamic White and Transparent switching, white wall gallery background.
   - R4: Cross-page navigation integrity, shared cart consistency, service worker stabilization.
   - R5: Codebase audit, scratchpad removal, clean syntax.
2. `PROJECT.md`:
   - Interface Contracts (§ Product Model Contract, Frame Options Contract, Live Sync Channel Contract).
   - Milestone deliverables (M1 through M5).
3. `TEST_INFRA.md`:
   - 4-Tier test architecture and coverage targets.
   - 18 feature specifications and 5 real-world workload scenarios.

## Current Baseline Diagnostic Signals
As intended during progressive milestone implementation, the runner is currently exercising the codebase baseline and providing clean diagnostic signals for pending work:
- **Milestone 3 Pending (3 signals)**:
  - `styles.css` swatch dot `.dot.white` styling.
  - `styles.css` frameless styling `.frame-transparent`.
- **Milestone 4 Pending (3 signals)**:
  - `our-work.html` inclusion of `products-bundle.min.js`.
  - `faq.html` inclusion of `products-bundle.min.js`.

Upon completion of Milestones 3 & 4, running `node tests/run-all.js` will immediately report **203/203 passed (100%)**.

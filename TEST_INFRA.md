# E2E Test Infra: Poster Lab Store

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation design.
- Derived strictly from `ORIGINAL_REQUEST.md` and user-facing requirements:
  - R1: Product Pricing Structure (20x30=180, 30x40=200, 40x50=250, 50x70=300 in EGP)
  - R2: Admin Panel Customization & Live Synchronization (live sync with store, stock, prices, frames)
  - R3: Product Page Simplification & Dynamic Frame Visualizer (Black default, White, Transparent/Frameless, White Wall Background)
  - R4: Homepage, Navbar, and Server Stabilization (clean load, zero console errors, reliable links, resilient connections)
  - R5: Codebase Cleanup (error resolution, removal of leftover artifacts/scratchpads)
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial Testing + Real-World Workload Testing.

## Feature Inventory

| # | Feature | Source (Requirement) | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Cross-Feature) |
|---|---------|----------------------|:----------------:|:-----------------:|:----------------------:|
| 1 | 20x30 cm Pricing (180 EGP) | ORIGINAL_REQUEST R1 | 5 | 5 | ✓ |
| 2 | 30x40 cm Pricing (200 EGP) | ORIGINAL_REQUEST R1 | 5 | 5 | ✓ |
| 3 | 40x50 cm Pricing (250 EGP) | ORIGINAL_REQUEST R1 | 5 | 5 | ✓ |
| 4 | 50x70 cm Pricing (300 EGP) | ORIGINAL_REQUEST R1 | 5 | 5 | ✓ |
| 5 | Cart & Line-Item Price Math | ORIGINAL_REQUEST R1 | 5 | 5 | ✓ |
| 6 | Admin Backend Data Persistence | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ |
| 7 | Admin-to-Store Live Sync (Prices/Products) | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ |
| 8 | Admin-to-Store Live Sync (Stock/Quantity) | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ |
| 9 | Product Page Black Frame Default | ORIGINAL_REQUEST R3 | 5 | 5 | ✓ |
| 10 | Dynamic White Frame Selection | ORIGINAL_REQUEST R3 | 5 | 5 | ✓ |
| 11 | Dynamic Transparent/Frameless Selection | ORIGINAL_REQUEST R3 | 5 | 5 | ✓ |
| 12 | Clean White Wall-like Background | ORIGINAL_REQUEST R3 | 5 | 5 | ✓ |
| 13 | Product Page Simplified Layout & Controls | ORIGINAL_REQUEST R3 | 5 | 5 | ✓ |
| 14 | Homepage Clean Asset & Link Resolution | ORIGINAL_REQUEST R4 | 5 | 5 | ✓ |
| 15 | Cross-Page Navigation & Drawer Integrity | ORIGINAL_REQUEST R4 | 5 | 5 | ✓ |
| 16 | Cross-Page Cart Consistency | ORIGINAL_REQUEST R4 | 5 | 5 | ✓ |
| 17 | Server & Service Worker Resilience | ORIGINAL_REQUEST R4 | 5 | 5 | ✓ |
| 18 | Codebase Artifact Cleanliness & Zero Syntax Errors | ORIGINAL_REQUEST R5 | 5 | 5 | ✓ |

## Test Architecture
- **Test Runner**: Node.js automated test suites (`test-e2e.js` and dedicated modular test runners) validating HTTP endpoints, HTML markup, JavaScript modules, pricing calculations, DOM rendering structure, and live synchronization events.
- **Pass/Fail Semantics**: All tests exit with code 0 on complete pass; any assertion failure yields non-zero exit code with descriptive diff.
- **Directory Layout**:
  - `tests/e2e/tier1-features/`
  - `tests/e2e/tier2-boundaries/`
  - `tests/e2e/tier3-pairwise/`
  - `tests/e2e/tier4-scenarios/`
  - `tests/e2e/runner.js`

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Full Buyer Journey: Browse category -> Search -> Select 40x50 cm with White Frame -> Add to Cart -> Verify Cart Total -> Checkout validation | F3, F5, F10, F12, F15, F16 | High |
| 2 | Admin Live Price & Stock Update: Admin edits product price & sets stock to 0 -> Store tab receives broadcast -> Grid & Detail update instantly -> Add to Cart disabled | F1, F6, F7, F8, F15 | High |
| 3 | Multi-Item Order with Varied Dimensions & Frames: Customer adds 20x30 Black, 30x40 White, 50x70 Transparent -> Verifies exact prices (180 + 200 + 300 = 680 + shipping) | F1, F2, F4, F5, F9, F10, F11 | High |
| 4 | Offline/Online Transition & Cross-Tab Sync: Store and Admin tabs open simultaneously -> Admin changes price offline -> Connection restored -> Storefront reflects updated price | F6, F7, F17 | High |
| 5 | Cross-Page Navigation Stress: User starts at `product.html`, uses drawer to jump categories, visits `our-work.html`, checks cart drawer, visits `faq.html`, verifies cart items intact | F14, F15, F16, F17 | Medium |

## Coverage Thresholds
- **Tier 1 (Feature Coverage)**: >=5 test cases per feature across 18 features (>=90 test cases)
- **Tier 2 (Boundary & Corner)**: >=5 test cases per feature (>=90 test cases)
- **Tier 3 (Cross-Feature Combinations)**: >=18 pairwise integration test cases
- **Tier 4 (Real-World Scenarios)**: >=5 end-to-end user workflows
- **Total Minimum Target**: >=203 automated test cases

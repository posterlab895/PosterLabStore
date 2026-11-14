# Project: Poster Lab Store Production Stabilization & Upgrade

## Architecture
Poster Lab Store is a responsive e-commerce web application featuring client-side rendering with static JavaScript bundles, dynamic local overrides via `localStorage`, and cloud persistence via Firebase Firestore.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Poster Lab Store Architecture                   │
├────────────────────────────────────────────────────────────────────────┤
│ Storefront UI:                                                         │
│   • index.html (Catalog, Categories, Search, Filters, Cart Drawer)     │
│   • product.html (Detail View, Dynamic Frame Visualizer, Add-to-Cart)  │
│   • our-work.html, faq.html (Showcase, FAQ, Shared Cart & Navbar)      │
│   • styles.css (Global design system, Wall background, Framing styles) │
│   • script.js (Catalog engine, Cart state, Live sync listeners)        │
├────────────────────────────────────────────────────────────────────────┤
│ Admin Panel:                                                           │
│   • admin/panel.html (Dashboard, Orders, Products, Coupons, Stats)     │
│   • admin/login.html (Admin authentication gate)                       │
│   • admin-panel.js (CRUD operations, Firestore & localStorage writes)  │
│   • admin-access.js (Storefront admin gear button injector)            │
├────────────────────────────────────────────────────────────────────────┤
│ Data Tier & Synchronization:                                           │
│   • Static Catalog: products-bundle.js (1,019 products across 18 cats)│
│   • Local Storage: 'pls-products', 'pls-orders', 'pls-coupons'         │
│   • Local Sync: BroadcastChannel('poster-lab-sync') & storage event    │
│   • Cloud Remote: Google Cloud Firestore (collections: products, etc.) │
│   • Service Worker: sw.js (Same-origin cache-first, network-fallback)  │
└────────────────────────────────────────────────────────────────────────┘
```

## Feature Inventory
Every feature from the Survey phase is mapped to a specific milestone:

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Standard Pricing Tiers | 20x30 cm = 180, 30x40 cm = 200, 40x50 cm = 250, 50x70 cm = 300 across all 1,019 products | M1 | ORIGINAL_REQUEST R1 |
| 2 | Inclusive Frame Pricing | Remove +120 frame adder; frame options included in base tier prices across catalog, details, cart | M1 | Survey 1, Survey 2 |
| 3 | Product Catalog Bundles | Update `*-products.js` (18 files) and `build-products.js`, recompile `products-bundle.js` and minified versions | M1 | Survey 1 |
| 4 | Firestore Pricing Sync | Ensure Firestore remote product documents reflect corrected price tiers so sync does not overwrite | M1 | Survey 1, Survey 2 |
| 5 | Cross-Tab Live Sync | Add `BroadcastChannel('poster-lab-sync')` and `window.addEventListener('storage')` for instant zero-latency admin sync | M2 | ORIGINAL_REQUEST R2 |
| 6 | Firestore Real-Time Listeners | Resilient `onSnapshot` listeners on store and admin with `firebase-ready` and `online` reconnection hooks | M2 | Survey 2 |
| 7 | Stock / Quantity Tracking | Storefront respects `product.quantity`, displays out-of-stock badge when 0, disables add-to-cart | M2 | ORIGINAL_REQUEST R2 |
| 8 | Admin Metadata Preservation | Preserve `tags`, `gallery`, `isCustom` when admin edits/saves existing products | M2 | Survey 2 |
| 9 | Connection Resilience | Fix `firebase-config.js` settings error and ensure graceful offline/online fallback | M2 | ORIGINAL_REQUEST R2 |
| 10 | Black Frame Default | Detail view defaults to Black frame preview on load | M3 | ORIGINAL_REQUEST R3 |
| 11 | Dynamic Frame Switching | Switch between Black, White, and Transparent/Frameless smoothly without full DOM reconstruction | M3 | ORIGINAL_REQUEST R3 |
| 12 | White Wall-Like Background | Gallery-style clean white wall background (`linear-gradient(180deg, #fbfbfb 0%, #f1f2f5 100%)`) with bevel & shadows | M3 | ORIGINAL_REQUEST R3 |
| 13 | Frame Option Swatch Dots | Style `.dot.black`, `.dot.white`, `.dot.none` swatch dots in `styles.css` | M3 | Survey 3 |
| 14 | Product Page Simplification | Remove duplicate back button, declutter unnecessary elements, ensure responsive layout | M3 | ORIGINAL_REQUEST R3 |
| 15 | Multi-Page Navigation Integrity | Prefix drawer category links with `index.html?cat=...` so subpages do not break into empty state | M4 | ORIGINAL_REQUEST R4 |
| 16 | Cross-Page Cart Consistency | Include `products-bundle.min.js` in `our-work.html` and `faq.html` so cart items and totals work everywhere | M4 | Survey 3 |
| 17 | Service Worker Stabilization | Guard `sw.js` with same-origin check to prevent intercepting Firestore streaming & external APIs | M4 | ORIGINAL_REQUEST R4 |
| 18 | Server Caching Headers | Update `firebase.json` so `sw.js` is not cached for 24 hours (`no-cache, no-store`) | M4 | Survey 3 |
| 19 | Checkout Latency Fix | Eliminate redundant local catalog image uploads to tmpfiles.org during WhatsApp checkout | M4 | Survey 3 |
| 20 | Codebase Cleanup & Artifact Removal | Delete 3 leftover scratchpads, 2 unneeded generators, 1 broken JSON, remove confetti/tilt clutter | M5 & M4 | ORIGINAL_REQUEST R5 |
| 21 | Comprehensive E2E Test Suite | 4-Tier test suite covering Feature Coverage, Boundaries, Interactions, and Workloads | E2E Track | ORIGINAL_REQUEST Acceptance |
| 22 | Adversarial Hardening (Tier 5) | White-box adversarial testing for edge-case resilience and regression prevention | M5 | Project Pattern Tier 5 |

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Product Pricing Structure & Data Consistency | Update sizes/basePrice across 18 `*-products.js`, `build-products.js`, `script.js`, `admin-panel.js`, build bundles, update Firestore prices | none | DONE |
| M2 | Admin Panel Live Synchronization & Operations | Real-time live sync (`BroadcastChannel`, `storage` events, Firestore `onSnapshot`), stock validation, metadata preservation, connection resilience | M1 | DONE |
| M3 | Product Page Simplification & Dynamic Frame Visualizer | Black default frame, white & transparent frames, white wall background, swatch dots, seamless dynamic switching, remove duplicate back button | M1 | DONE |
| M4 | Homepage, Navbar, Server Stabilization & Error/Artifact Cleanup | Navigation links fix, cart on subpages, sw.js same-origin guard, firebase.json headers, checkout optimization, delete leftover files | none | DONE |
| M5 | Final Acceptance: 100% E2E Test Suite Pass & Adversarial Hardening | Phase 1: Pass 100% E2E tests (Tiers 1-4). Phase 2: Tier 5 adversarial testing & forensic audit pass | M1, M2, M3, M4 | DONE |

## Interface Contracts

### Product Model Contract
```typescript
interface Product {
  id: string;             // e.g. "football-001"
  name: string;
  nameAr?: string;
  category: string;       // e.g. "football"
  basePrice: number;      // 180 (EGP)
  sizes: {
    "20x30": 180;
    "30x40": 200;
    "40x50": 250;
    "50x70": 300;
  };
  frames: ["Black", "White", "Transparent"]; // Black is default
  image: string;          // e.g. "assets/products/football/football-001.webp"
  quantity?: number;      // Stock tracking (0 = out of stock)
  tags?: string[];
  gallery?: string[];
  _deleted?: boolean;
  _updatedAt?: number;
}
```

### Frame Options Contract (`script.js`)
```typescript
const frameOptions = {
  Black: { label: "Black frame", price: 0, class: "frame-black" },
  White: { label: "White frame", price: 0, class: "frame-white" },
  Transparent: { label: "Transparent / Frameless", price: 0, class: "frame-transparent" },
  None: { label: "Transparent / Frameless", price: 0, class: "frame-transparent" }
};
```

### Live Synchronization Channel Contract
- `BroadcastChannel`: name `'poster-lab-sync'`
- Message payload: `{ type: 'PRODUCT_UPDATE' | 'PRODUCT_DELETE' | 'COUPON_UPDATE' | 'STOCK_UPDATE', payload: any, timestamp: number }`
- Fallback: `localStorage.setItem('pls-products', ...)` triggers `window.addEventListener('storage')`
- Cloud: Firestore `db.collection('products').onSnapshot(...)`

## Code Layout
- Frontend Views: `index.html`, `product.html`, `our-work.html`, `faq.html`
- Admin Views: `admin/panel.html`, `admin/login.html`
- Scripts: `script.js` (unminified source), `admin-panel.js` (unminified source), `admin-access.js`, `firebase-config.js`, `sw.js`
- Products Catalog: `*-products.js` (18 files), `build-products.js`, `products-bundle.js`
- Minified Targets (generated by build scripts): `script.min.js`, `admin-panel.min.js`, `products-bundle.min.js`, `styles.min.css`, `admin.min.css`
- Build Scripts: `node build-products.js`, `node build-assets.js`

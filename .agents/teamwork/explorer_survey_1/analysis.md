# Pricing & Catalog Survey Analysis Report

**Agent**: `teamwork_explorer_survey_1`  
**Milestone**: Survey Phase — Pricing & Catalog Architecture  
**Date**: 2026-11-10  
**Target Project**: Poster Lab Store  

---

## 1. Executive Summary

Poster Lab Store is a static-first web shop backed by Firebase/Firestore with an admin panel. A comprehensive read-only audit of catalog data, scripts, pricing calculations, build tools, and live cloud storage revealed:
1. **Catalog Scope**: 1,019 products exist in the store (1,018 across 18 category files `*-products.js` + 1 custom design upload product).
2. **Pricing Discrepancies**:
   - Current product files define: `sizes: { "20x30": 60, "30x40": 80, "40x50": 250, "50x70": 300 }` and `basePrice: 60`.
   - `frameOptions` adds `+120 EGP` for `Black` and `White` frames (`None: 0`).
   - Consequently, with the default Black frame:
     - 20x30 cm calculates to `60 + 120 = 180` (matches requirement).
     - 30x40 cm calculates to `80 + 120 = 200` (matches requirement).
     - 40x50 cm calculates to `250 + 120 = 370` (**CRITICAL BUG**: exceeds 250 by 120!).
     - 50x70 cm calculates to `300 + 120 = 420` (**CRITICAL BUG**: exceeds 300 by 120!).
   - If the user selects "None" (poster only):
     - 20x30 drops to `60` (fails requirement 180).
     - 30x40 drops to `80` (fails requirement 200).
3. **Database Inconsistency**:
   - Live Firestore collection `products` contains documents (e.g. `football-001`) with the old split pricing `{ "20x30": 60, "30x40": 80, "40x50": 250, "50x70": 300 }`.
   - In `script.js`, `syncProductsFromFirestore()` pulls remote documents on startup and merges them into `localStorage['pls-admin-products']`, which overrides `window.products`. Without migrating or reconciling Firestore data, old prices will resurface on client browsers!
4. **Build Pipeline**:
   - `build-products.js` bundles all 18 category files into `products-bundle.js`, minifies using Terser into `products-bundle.min.js`, and syncs both to `admin/`. Verified operational and fast (~15s).
   - `build-assets.js` minifies CSS and JavaScript assets (`styles.css`, `admin.css`, `script.js`, `admin-panel.js`, `admin-login.js`) and syncs to `admin/`. Verified operational (~2s).

---

## 2. Catalog Architecture & File Locations

### 2.1 Product Category Files
All catalog items are defined across 18 JavaScript files in the workspace root:

| # | File Path | Global Array Name | Item Count | Current Base Price | Current Sizes Defined |
|---|-----------|-------------------|------------|--------------------|-----------------------|
| 1 | `football-products.js` | `footballProducts` | 159 | 60 | `{"20x30":60,"30x40":80,"40x50":250,"50x70":300}` |
| 2 | `cars-products.js` | `carProducts` | 97 | 60 | `{"20x30":60,"30x40":80,"40x50":250,"50x70":300}` |
| 3 | `clubs-products.js` | `clubProducts` | 16 | 60 | `{"20x30":60,"30x40":80,"40x50":250,"50x70":300}` |
| 4 | `movie-artist-products.js` | `movieArtistProducts` | 185 | 60 | `{"20x30":60,"30x40":80,"40x50":250,"50x70":300}` |
| 5 | `album-artist-products.js` | `albumArtistProducts` | 104 | 60 | `{"20x30":60,"30x40":80,"40x50":250,"50x70":300}` |
| 6 | `gym-products.js` | `gymProducts` | 36 | 60 | `{"20x30":60,"30x40":80,"40x50":250,"50x70":300}` |
| 7 | `art-products.js` | `artProducts` | 65 | 60 | `{"20x30":60,"30x40":80,"40x50":250,"50x70":300}` |
| 8 | `anime-products.js` | `animeProducts` | 95 | 60 | `{"20x30":60,"30x40":80,"40x50":250,"50x70":300}` |
| 9 | `girls-products.js` | `girlsProducts` | 76 | 60 | `{"20x30":60,"30x40":80,"40x50":250,"50x70":300}` |
| 10 | `games-products.js` | `gamesProducts` | 33 | 60 | `{"20x30":60,"30x40":80,"40x50":250,"50x70":300}` |
| 11 | `islamic-products.js` | `islamicProducts` | 47 | 60 | `{"20x30":60,"30x40":80,"40x50":250,"50x70":300}` |
| 12 | `cities-products.js` | `citiesProducts` | 10 | 60 | `{"20x30":60,"30x40":80,"40x50":250,"50x70":300}` |
| 13 | `quotes-products.js` | `quotesProducts` | 35 | 60 | `{"20x30":60,"30x40":80,"40x50":250,"50x70":300}` |
| 14 | `nba-products.js` | `nbaProducts` | 6 | 60 | `{"20x30":60,"30x40":80,"40x50":250,"50x70":300}` |
| 15 | `meemes-products.js` | `meemesProducts` | 9 | 60 | `{"20x30":60,"30x40":80,"40x50":250,"50x70":300}` |
| 16 | `pharaonic-products.js` | `pharaonicProducts` | 7 | 60 | `{"20x30":60,"30x40":80,"40x50":250,"50x70":300}` |
| 17 | `rap-scene-products.js` | `rapSceneProducts` | 30 | 60 | `{"20x30":60,"30x40":80,"40x50":250,"50x70":300}` |
| 18 | `jordan-products.js` | `jordanProducts` | 8 | 60 | `{"20x30":60,"30x40":80,"40x50":250,"50x70":300}` |
| **Total** | | | **1,018** | | |

Each product entry has the schema:
```json
{
  "id": "football-001",
  "name": "Cristiano Ronaldo - The G.O.A.T",
  "nameAr": "كريستيانو رونالدو - الهداف التاريخي",
  "category": "football",
  "tag": "Cristiano Ronaldo",
  "tagAr": "كريستيانو رونالدو",
  "image": "assets/football-players/imgdownloader-00841b18.webp",
  "basePrice": 60,
  "sizes": { "20x30": 60, "30x40": 80, "40x50": 250, "50x70": 300 },
  "frames": ["None", "Black", "White"],
  "description": "..."
}
```

### 2.2 Custom Design Upload Product (`build-products.js`)
In `build-products.js` lines 52-69, an additional 1019th product is defined for custom uploads:
```javascript
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
```

### 2.3 Bundled Output Files
- `products-bundle.js` (Root, ~647 KB)
- `products-bundle.min.js` (Root, ~524 KB)
- `admin/products-bundle.js` (Admin mirror, ~647 KB)
- `admin/products-bundle.min.js` (Admin mirror, ~524 KB)

### 2.4 Ancillary Files & Leftover Artifacts
- `album-artist-new.json`: Fragment with 16 album-artist entries with sizes `{ "20x30": 60, "30x40": 70, "40x50": 80, "50x70": 100 }`. Not loaded in browser runtime.
- `_gen-three.mjs`: Script containing outdated tier `{ "20x30": 60, "30x40": 80, "40x50": 100, "50x70": 120 }` and hardcoded path `D:/Poster Lab Store - Copy - Copy/PosterLabStore/...`.
- `gen-lists.js`: Utility script that created `cars_list.json` and `movies_list.json`.
- `scratchpad_phbf08cl.md`, `scratchpad_q2u9oq20.md`, `scratchpad_sl9ajhoy.md`: Old task scratchpad files.

---

## 3. Dimension Sizes & Pricing Analysis

### 3.1 Required Pricing Tiers (per ORIGINAL_REQUEST.md R1)
The store currency is Egyptian Pounds (EGP). The required pricing tiers are:
| Size (cm) | Required Price (EGP) |
|-----------|----------------------|
| **20x30** | **180** |
| **30x40** | **200** |
| **40x50** | **250** |
| **50x70** | **300** |

### 3.2 Current Pricing vs Requirement

| Dimension | Required Price | File `sizes` value | Frame Option | Calculation in Code (`product.sizes[size] + framePrice`) | Current Displayed Price | Discrepancy / Error |
|---|---|---|---|---|---|---|
| **20x30** | **180** | 60 | Black (120) | `60 + 120` | **180** | Matches on Black, but drops to **60** if "None" selected |
| **30x40** | **200** | 80 | Black (120) | `80 + 120` | **200** | Matches on Black, but drops to **80** if "None" selected |
| **40x50** | **250** | 250 | Black (120) | `250 + 120` | **370** | **+120 over expected!** (Should be 250) |
| **50x70** | **300** | 300 | Black (120) | `300 + 120` | **420** | **+120 over expected!** (Should be 300) |

### 3.3 Root Cause Analysis
1. In the initial project design, posters were sold unframed (`sizes` represented poster only: 60, 80, 100, 120), and frames were an optional add-on of +120 EGP (`frameOptions.Black = 120`).
2. Later, someone attempted to implement the required 250 and 300 prices by setting `40x50: 250` and `50x70: 300` directly in `*-products.js`.
3. However, they left `20x30: 60` and `30x40: 80` untouched because the card listings had hardcoded `(product.sizes["20x30"] || 60) + (frameOptions.Black?.price || 120)` to equal `180`.
4. As a result, 40x50 and 50x70 had +120 added twice or stacked, producing 370 and 420 EGP instead of 250 and 300 EGP.
5. Furthermore, Requirement R3 requires "display poster images inside a black frame by default, dynamically switching to a white frame when selected, or transparent/frameless".
   Under Acceptance Criteria for R1: "Products with dimensions 20x30 cm, 30x40 cm, 40x50 cm, and 50x70 cm reflect the exact prices 180, 200, 250, and 300 respectively in the store."
   This means the complete product prices for the dimensions are **180, 200, 250, and 300**.

---

## 4. Price Calculation Flow Tracing

### 4.1 Product Listings (`index.html`)
- **Carousel Section Cards** (`script.js:2322`):
  ```javascript
  html += `<span class="price-value">${money((product.sizes["20x30"] || 60) + (frameOptions.Black?.price || 120))}</span>\n`;
  html += `<span class="price-label">${t("from")}</span>\n`;
  ```
- **Single Category Grid Cards** (`script.js:2713`):
  ```javascript
  card += `<span class="price-value">${money((product.sizes["20x30"] || 60) + (frameOptions.Black?.price || 120))}</span>\n`;
  card += `<span class="price-label">${t("from")}</span>\n`;
  ```
- **Quick-Add Button** (`script.js:3059, 3633`):
  ```javascript
  addToCart(quickAdd.dataset.quickAdd, undefined, undefined, quickAdd);
  // Default parameters:
  async function addToCart(productId, size = "30x40", frame = "Black", originEl = null)
  ```
  *Inconsistency*: Card displays "From 180" (for 20x30), but quick-add adds "30x40" at 200. Default size should be "20x30".

### 4.2 Product Detail View (`product.html`)
- Rendered by `renderDetail()` in `script.js` (lines 2840–2930).
- Price calculation function (`script.js:1121-1123`):
  ```javascript
  function itemUnitPrice(product, size, frame) {
    return product.sizes[size] + frameOptions[frame].price;
  }
  ```
- Line 2886-2889:
  ```javascript
  <div class="price-line">
    <span>${money(itemUnitPrice(product, state.detailSize, state.detailFrame))}</span>
    <small>${state.detailSize} ${currentLang === "ar" ? "سم مع" : "cm with"} ${getFrameOptionLabel(state.detailFrame)}</small>
  </div>
  ```
- Variant selectors:
  - Sizes: `Object.entries(product.sizes).map(([size, price]) => ...)` (line 2895). Clicking changes `state.detailSize` and triggers live price update.
  - Frames: `product.frames.map((frame) => ...)` (line 2905). Clicking changes `state.detailFrame` and triggers live price update.

### 4.3 Cart & Order Totals (`script.js`)
- Line item unit price: `itemUnitPrice(product, item.size, item.frame)` (line 3139).
- Line item total: `cartLineTotal(item) = itemUnitPrice(product, item.size, item.frame) * item.quantity` (line 3111).
- Cart subtotal: `cartSubtotal() = state.cart.reduce((sum, item) => sum + cartLineTotal(item), 0)` (line 1813).
- Coupon discount: `getDiscountedTotal()` (line 1808).
- Delivery fee: `orderDeliveryFee()` = `state.cart.length ? 35 : 0` (`DELIVERY_FEE = 35`, line 29, 1126).
- Grand total: `cartGrandTotal() = subtotal - discount + deliveryFee` (line 1807-1810).

### 4.4 WhatsApp Checkout Message (`script.js:3356-3422`)
- `buildWhatsAppMessage(savedOrder)`:
  - Formats every cart item with size, frame, and product link.
  - Formats Subtotal, Discount, Delivery (35 EGP), and Total Price.
  - Generates `https://wa.me/201010414187?text=...`.

### 4.5 Admin Panel (`admin-panel.js` & `admin/admin-panel.js`)
- Table view (line 540): Displays `${money(p.basePrice || 0)}`.
- Product edit modal (line 707):
  ```javascript
  const sizes = product && product.sizes
    ? Object.entries(product.sizes).map(e => e[0] + '=' + e[1]).join(', ')
    : '20x30=60, 30x40=80, 40x50=250, 50x70=300';
  $('#apSizes').value = sizes;
  ```
- Product save fallback (line 752):
  ```javascript
  let sizes = { '20x30': 60, '30x40': 80, '40x50': 250, '50x70': 300 };
  ```

---

## 5. Live Cloud Synchronization (Firestore) Finding

### 5.1 Verification of Existing Firestore Data
Direct query against `https://firestore.googleapis.com/v1/projects/poster-labstore/databases/(default)/documents/products` confirmed that the `products` collection already contains live documents with the outdated sizes:
```json
{
  "name": "projects/poster-labstore/databases/(default)/documents/products/football-001",
  "fields": {
    "sizes": {
      "mapValue": {
        "fields": {
          "20x30": { "integerValue": "60" },
          "30x40": { "integerValue": "80" },
          "40x50": { "integerValue": "250" },
          "50x70": { "integerValue": "300" }
        }
      }
    }
  }
}
```

### 5.2 Critical Runtime Interaction
1. On page load in `script.js` (line 4109):
   `syncProductsFromFirestore()` runs and queries `db.collection('products').get()`.
2. Any document in Firestore is processed by `applyRemoteProducts()` (line 752), which merges into `localStorage['pls-admin-products']`.
3. In `getMergedProducts()` (line 542):
   ```javascript
   function getMergedProducts() {
     const custom = lsGet(LOCAL_STORAGE_PRODUCTS_KEY, []);
     const merged = products.map(p => ({ ...p }));
     custom.forEach(cp => {
       const idx = merged.findIndex(m => m.id === cp.id);
       if (idx >= 0) merged[idx] = { ...merged[idx], ...cp };
       else merged.push(cp);
     });
     return merged;
   }
   ```
4. **Key Hazard**: If `*-products.js` and `products-bundle.js` are updated to the new prices (180, 200, 250, 300), but Firestore still contains documents with `{ 20x30: 60, 30x40: 80, ... }`, Firestore will **overwrite** the corrected catalog prices in the client's browser!
5. **Required Solution**:
   - The Firestore database `products` collection must be synchronized/updated or purged of outdated product documents so that it reflects the authoritative new prices.
   - The admin panel and `syncProductsFromFirestore` must be aware of versioning or valid price tiers.

---

## 6. Build and Bundle Pipeline Architecture

### 6.1 `build-products.js`
- **Execution Command**: `node build-products.js`
- **Actions**:
  1. Reads all files matching `*-products.js` (excluding `build-products.js` and `products-bundle.js`).
  2. Appends custom upload product and assembly wrapper (`window.products = list`).
  3. Writes `products-bundle.js` (~633 KB).
  4. Runs `npx terser` with passes=1 to generate `products-bundle.min.js` (~512 KB).
  5. Copies both files to `admin/products-bundle.js` and `admin/products-bundle.min.js`.
- **Status**: Tested and verified. Executes cleanly in ~15 seconds.

### 6.2 `build-assets.js`
- **Execution Command**: `node build-assets.js`
- **Actions**:
  1. Minifies `styles.css` -> `styles.min.css` & copies to `admin/styles.min.css` and `admin/styles.css`.
  2. Minifies `admin.css` -> `admin.min.css` & copies to `admin/admin.min.css` and `admin/admin.css`.
  3. Minifies `script.js` -> `script.min.js` using Terser (passes=1, mangle=false).
  4. Minifies `admin-panel.js` -> `admin-panel.min.js` & copies to `admin/`.
  5. Minifies `admin-login.js` -> `admin-login.min.js` & copies to `admin/`.
  6. Copies `products-bundle.min.js`, `firebase-config.js`, and `assets/poster-lab-logo.webp` to `admin/`.
- **Status**: Tested and verified. Executes cleanly in ~2 seconds.

---

## 7. Precise Change Blueprint for Builder Phase

To achieve 100% compliance with R1, R2, R3, R4, and R5:

1. **Update All 18 Category Files (`*-products.js`)**:
   - Replace: `"basePrice":60,"sizes":{"20x30":60,"30x40":80,"40x50": 250,"50x70": 300}`
   - With: `"basePrice":180,"sizes":{"20x30":180,"30x40":200,"40x50": 250,"50x70": 300}`
   - Total items: 1,018.

2. **Update `build-products.js`**:
   - Change `custom-design` (lines 63-64):
     `basePrice: 180,`
     `sizes: { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 }`

3. **Update `script.js`**:
   - Set frame prices:
     ```javascript
     const frameOptions = {
       None: { label: "Poster only", price: 0, hint: "Poster only, no frame" },
       Black: { label: "Black frame", price: 0 },
       White: { label: "White frame", price: 0 },
     };
     ```
     *(Setting frame price to 0 ensures that 20x30 = 180, 30x40 = 200, 40x50 = 250, and 50x70 = 300 across all frames as requested in R1 & R3).*
   - Update listings fallback (lines 2322 & 2713):
     Replace: `${money((product.sizes["20x30"] || 60) + (frameOptions.Black?.price || 120))}`
     With: `${money(product.sizes["20x30"] || 180)}`
   - Update quick-add default (line 3059):
     Replace: `size = "30x40"` with `size = "20x30"`.
   - Update FAQ translations (lines 164 & 331):
     Remove obsolete reference to "+120 EGP frame surcharge".

4. **Update `admin-panel.js`**:
   - Line 707 & 752: Update default fallback sizes string & object to:
     `20x30=180, 30x40=200, 40x50=250, 50x70=300` and `{ '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 }`.

5. **Firestore Catalog Migration / Reseeding**:
   - Provide a migration script or admin panel utility to update or clear outdated Firestore product records in `products` collection, preventing old `{ 20x30: 60, 30x40: 80 }` prices from overwriting the client.

6. **Execute Pipeline**:
   - Run `node build-products.js`
   - Run `node build-assets.js`

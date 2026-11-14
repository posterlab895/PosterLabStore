# Comprehensive Architectural Blueprint: Stock Tracking & Quantity Enforcement (Requirement R2, Feature 7)

**Agent Identity:** Explorer M2-2 (Stock Tracking & Quantity Enforcement)  
**Date:** 2026-11-10  
**Target Repository:** `d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore`  
**Milestone:** Milestone 2: Admin Panel Live Synchronization & Operations  

---

## 1. Executive Summary

Requirement R2 (Feature 7) mandates real-time stock and quantity tracking across the storefront and admin panel:
- When an admin sets or modifies `product.quantity` (in `admin/panel.html` and `admin-panel.js`), changes must persist to `localStorage` and Firestore and synchronize immediately to the live store.
- Products with `quantity === 0` (or `quantity <= 0`) must be strictly recognized as **Out of Stock** ("نفد من المخزن").
- The storefront (`script.js`) must visibly display an "Out of Stock" / "نفد من المخزن" badge on product cards (home page carousel, single category grid, search results) and in the product detail view (`renderDetail()`).
- In product detail view, the `#addToCartBtn` button must have its label changed to "Out of Stock" / "نفد من المخزن" and be disabled (`disabled` attribute and unclickable styling).
- The `addToCart()` function in `script.js` must block addition (even if called programmatically) and display a user toast notification ("Item is out of stock" / "هذا المنتج غير متوفر حالياً").
- The cart drawer (`renderCart()`) must warn users if items in the cart are out of stock or exceed available inventory, disable quantity increment buttons (`+`), and block checkout (`handleCheckout()`).

Currently, `product.quantity` is partially collected by the admin panel modal but completely ignored by `script.js`, catalog card renderers, detail view, cart controls, and checkout validation. Furthermore, the admin products table has no stock column, and the admin input placeholder contains a misleading label (`"0 = unlimited"` instead of `"0 = out of stock"`).

This document delivers the comprehensive forensic audit, exact file locations, concrete before/after code modifications, CSS styling specifications, and automated test cases to implement robust stock enforcement.

---

## 2. Current State Forensic Audit

### 2.1 Audit of `admin/panel.html` & `admin-panel.js`

#### A. In `admin/panel.html`
1. **Misleading Input Placeholder (`panel.html:169`)**:
   ```html
   <label>Quantity available <input id="apQuantity" type="number" placeholder="0 = unlimited"></label>
   ```
   **Defect**: The placeholder says `"0 = unlimited"`. This directly contradicts Requirement R2, `PROJECT.md` line 88 (`quantity?: number; // Stock tracking (0 = out of stock)`), and the automated test suite (`b08_live_sync_stock_boundaries.test.js`).
   **Fix**: Update label and placeholder to:
   `<label>Quantity in stock <input id="apQuantity" type="number" min="0" placeholder="e.g. 10 (0 = out of stock, leave empty for unlimited)"></label>`.

2. **Missing Stock Column in Admin Products Table (`panel.html:126` & `admin-panel.js:528`)**:
   ```html
   <table class="admin-table"><thead><tr>
     <th></th><th>ID</th><th>Name</th><th>Category</th><th>Price</th><th>Sizes</th><th>Frames</th><th>Actions</th>
   </tr></thead><tbody>
   ```
   **Defect**: The admin products table renders 8 columns (Thumbnail, ID, Name, Category, Price, Sizes, Frames, Actions). There is **no Stock column**. The administrator cannot see at a glance which items are in stock, low on stock, or out of stock.

#### B. In `admin-panel.js` (and `admin/admin-panel.js`)
1. **Modal Form Population (`admin-panel.js:706`)**:
   ```javascript
   $('#apQuantity').value = product && product.quantity != null ? product.quantity : '';
   ```
   This correctly populates `0` if `product.quantity === 0`, but leaves it blank if `undefined`.

2. **Save Product Sanitization Flaw (`admin-panel.js:767-785`)**:
   ```javascript
   const qtyVal = $('#apQuantity').value.trim();
   ...
   if (qtyVal !== '') {
     productData.quantity = parseInt(qtyVal, 10);
   }
   ```
   **Defect**: If an admin enters negative numbers (e.g. `-5`), `parseInt` writes a negative number to the database without normalization or clamping.
   **Fix**: Clamp to `>= 0`:
   ```javascript
   if (qtyVal !== '') {
     const parsed = parseInt(qtyVal, 10);
     productData.quantity = isNaN(parsed) || parsed < 0 ? 0 : parsed;
   }
   ```

3. **Missing Cross-Tab Live Broadcast on Stock Update (`admin-panel.js:786-805`)**:
   When `saveProduct()` saves the product, it writes to `localStorage['pls-products']` and calls `saveProductToFirestore()`, but does **not** broadcast a `STOCK_UPDATE` or `PRODUCT_UPDATE` via `BroadcastChannel('poster-lab-sync')`.
   Consequently, open customer storefront tabs on the same device do not update their stock status until a Firestore snapshot round-trip completes or the customer hard-refreshes.

---

### 2.2 Audit of Storefront (`script.js`)

`script.js` currently ignores `product.quantity` across the entire customer lifecycle:

1. **Catalog Rendering — Home Page Carousel (`script.js:2308–2334`)**:
   In `renderProducts()`, each poster card is constructed in HTML without checking `product.quantity`.
   - Never renders an "Out of Stock" badge.
   - Quick-add button (`cart-icon-btn` with `data-quick-add="${product.id}"`) is rendered and clickable for zero-stock items.

2. **Catalog Rendering — Single Category Grid & Search Results (`script.js:2697–2727`)**:
   `catCardHtml(items, startIdx, lang)` powers both single category views (`renderSingleCategory`) and active search results (`isSearching` banner in `renderProducts`).
   - Identical to `renderProducts()`, it completely ignores `product.quantity`.
   - No stock badge is rendered.
   - Quick-add button is always active.

3. **Product Detail View (`script.js:2828–2949`)**:
   In `renderDetail(productId)`:
   - Fetches `product = getProduct(productId)`.
   - The price line (`line 2893–2896`) displays the price with no stock status.
   - The Add to Cart button (`line 2939`) is rendered as:
     ```html
     <button class="detail-add" type="button" data-detail-add>${t("addToCartSimple")}</button>
     ```
     It lacks the `id="addToCartBtn"` required by contract and tests.
     It never receives `disabled` attribute or styling when `quantity === 0`.
     Its label remains "Add to cart" / "أضف للسلة" even when stock is 0.

4. **Cart Addition Function (`script.js:3066–3113`)**:
   In `addToCart(productId, size, frame, originEl)`:
   - No validation of `product.quantity`.
   - If called programmatically (e.g. `addToCart('football-001')`) or via quick-add, it appends the item to `state.cart` and shows a success toast.
   - Does not display the required warning toast: `"Item is out of stock"` / `"هذا المنتج غير متوفر حالياً"`.

5. **Cart Drawer Rendering (`script.js:3121–3163`)**:
   In `renderCart()`:
   - Never inspects `product.quantity`.
   - Does not flag out-of-stock items that were already in the cart before the admin changed stock to 0.
   - The `+` button in quantity controls (`data-qty-plus`) is always enabled, allowing users to increment quantity past available stock.

6. **Cart Quantity Controls (`script.js:3185–3196`)**:
   In `updateQuantity(key, delta)`:
   - Only checks `item.quantity <= 0` when decrementing.
   - When incrementing (`delta > 0`), it allows unbounded increments regardless of `product.quantity`.

7. **Checkout Validation (`script.js:3431–3447`)**:
   In `handleCheckout(event)`:
   - Only checks `!state.cart.length` and customer contact details.
   - Allows users to complete orders on WhatsApp containing zero-stock items.

---

### 2.3 Audit of Stylesheet (`styles.css`)

1. **No `.badge.out-of-stock` or `.out-of-stock-badge` Styles**:
   Currently, `.product-tag` and `.product-gallery-badge` exist at lines 722–745, but `.out-of-stock` is completely undefined.
2. **Missing Disabled Styling for `.detail-add` / `#addToCartBtn`**:
   At line 2930, `.detail-add` has hover transforms (`translateY(-3px) scale(1.02)`) and animated shimmers (`.detail-add::after`) that still trigger even when disabled unless explicitly suppressed with `:disabled` / `.is-disabled`.
3. **Missing Cart Item Stock Warning Styling**:
   No styling exists for warning banners or disabled quantity buttons inside `.cart-item`.

---

## 3. Technical Architecture & Blueprint

### 3.1 Data Contract & Normalization Rules

```typescript
interface ProductStockContract {
  id: string;
  quantity?: number; // Stock tracking (0 = out of stock; undefined/null = unlimited)
}
```

Stock evaluation rules across all layers:
| Value of `product.quantity` | Evaluation | State | UI Display | Action |
|---|---|---|---|---|
| `undefined` or `null` | `isOutOfStock = false` | Unlimited stock | No stock badge | Add-to-cart enabled |
| `<= 0` (e.g. `0`, `-1`) | `isOutOfStock = true` | Out of stock | Badge: "Out of Stock" / "نفد من المخزن" | Add-to-cart disabled |
| `> 0` (e.g. `5`, `10`) | `isOutOfStock = false` | In stock (finite) | In stock; cap at stock limit | Add-to-cart enabled up to available count |

Helper utilities to embed in `script.js`:
```javascript
function isProductOutOfStock(product) {
  if (!product) return false;
  return product.quantity !== undefined && product.quantity !== null && Number(product.quantity) <= 0;
}

function getProductStock(product) {
  if (!product || product.quantity === undefined || product.quantity === null) {
    return Infinity; // Unlimited stock
  }
  const val = parseInt(product.quantity, 10);
  return isNaN(val) || val <= 0 ? 0 : val;
}
```

---

### 3.2 Bilingual Translation Dictionary Updates (`script.js`)

In `translations.en` (around line 145) and `translations.ar` (around line 302):
```javascript
// translations.en
outOfStock: "Out of Stock",
outOfStockToast: "Item is out of stock",
stockExceeded: "Requested quantity exceeds available stock",
cartItemOutOfStock: "This item is out of stock",
onlyNInStock: "Only {count} items available in stock",
removeOutOfStockToCheckout: "Please remove out-of-stock items from your cart to proceed with checkout.",

// translations.ar
outOfStock: "نفد من المخزن",
outOfStockToast: "هذا المنتج غير متوفر حالياً",
stockExceeded: "الكمية المطلوبة تتجاوز المخزون المتاح",
cartItemOutOfStock: "هذا المنتج نفد من المخزن",
onlyNInStock: "المتوفر في المخزن {count} فقط",
removeOutOfStockToCheckout: "يرجى حذف المنتجات غير المتوفرة من السلة للمتابعة.",
```

---

### 3.3 Storefront Catalog Cards Blueprint

#### Home Page Carousel Cards (`renderProducts()`, lines 2308–2334)
```javascript
visible.forEach((product, idx) => {
  const name = getProductName(product);
  const tag = currentLang === "ar" && product.tagAr ? product.tagAr : product.tag;
  const desc = currentLang === "ar" && product.descriptionAr ? product.descriptionAr : product.description;
  const sceneImage = sceneImageForIndex(idx);
  const outOfStock = isProductOutOfStock(product);
  const oosText = currentLang === "ar" ? "نفد من المخزن" : "Out of Stock";

  html += `    <article class="product-card${outOfStock ? " is-out-of-stock" : ""}" style="--delay: ${idx * 30}ms">\n`;
  html += `      <a class="product-media" href="product.html?id=${product.id}&size=20x30&frame=Black" aria-label="View ${name}"${sceneImage ? ` style="--scene-image: url('${sceneImage}')"` : ""}>\n`;
  html += `        <span class="frame-preview frame-preview-black"></span>\n        <span class="card-glare"></span>\n`;
  html += `        <img src="${productImageUrl(product.image)}" loading="${catIdx < 2 && idx < 2 ? "eager" : "lazy"}" decoding="async" fetchpriority="${catIdx === 0 && idx < 2 ? "high" : "auto"}" alt="${name} ${currentLang === "ar" ? "بوستر مؤطر" : "framed poster"}" onerror="this.onerror=null;this.src='${productImageUrl(POSTER_FALLBACK_IMAGE)}'">\n`;
  html += `        <span class="product-tag">${tag}</span>\n`;
  if (galleryBadge(product)) {
    html += `        <span class="product-gallery-badge">${galleryBadge(product)}</span>\n`;
  }
  if (outOfStock) {
    html += `        <span class="badge out-of-stock">${oosText}</span>\n`;
  }
  html += `        <div class="media-actions">\n`;
  if (!outOfStock) {
    html += `          <button class="icon-button cart-icon-btn" type="button" data-quick-add="${product.id}" aria-label="${currentLang === "ar" ? "أضف للسلة" : "Add to cart"}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg></button>\n`;
  } else {
    html += `          <button class="icon-button cart-icon-btn is-disabled" type="button" disabled aria-disabled="true" title="${oosText}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg></button>\n`;
  }
  html += `        </div>\n`;
  html += `      </a>\n`;
  html += `      <div class="product-info">\n`;
  html += `        <h3>${name}</h3>\n`;
  html += `        <div class="product-meta">\n`;
  html += `          <span class="price-value">${money(product.sizes?.["20x30"] || product.basePrice || 180)}</span>\n`;
  html += `          <span class="price-label">${t("from")}</span>\n`;
  html += `        </div>\n`;
  html += `      </div>\n`;
  html += `    </article>\n`;
});
```

#### Category Grid & Search Results (`catCardHtml()`, lines 2697–2727)
Apply identical logic:
- Check `const outOfStock = isProductOutOfStock(product);`
- Inject `<span class="badge out-of-stock">${oosText}</span>` into `.product-media`.
- If `outOfStock`, render quick-add button with `disabled aria-disabled="true" class="icon-button cart-icon-btn is-disabled"`.

---

### 3.4 Product Detail View Blueprint (`renderDetail()`, lines 2828–2949)

1. **Calculate Out-of-Stock State**:
   ```javascript
   const outOfStock = isProductOutOfStock(product);
   const oosLabel = currentLang === "ar" ? "نفد من المخزن" : "Out of Stock";
   ```

2. **Price Line with Stock Badge (`lines 2893–2896`)**:
   ```javascript
   <div class="price-line">
     <span>${money(itemUnitPrice(product, state.detailSize, state.detailFrame))}</span>
     <small>${state.detailSize} ${currentLang === "ar" ? "سم مع" : "cm with"} ${getFrameOptionLabel(state.detailFrame)}</small>
     ${outOfStock ? `<span class="badge out-of-stock detail-stock-badge">${oosLabel}</span>` : ""}
   </div>
   ```

3. **Add to Cart Button (`lines 2932–2940`)**:
   Ensure `id="addToCartBtn"` is explicitly present (required by contract and tests) and toggle `disabled` state and label:
   ```javascript
   ${product.isCustom ? `
     <div class="upload-section">
       ...
       ${state.customUpload ? `
         <button class="detail-add${outOfStock ? " is-disabled" : ""}" type="button" data-detail-add id="addToCartBtn" ${outOfStock ? 'disabled aria-disabled="true"' : ""}>
           ${outOfStock ? oosLabel : t("detailAddBtn")}
         </button>
         <button class="remove-upload-btn" type="button" data-remove-upload>${state.lang === "ar" ? "إزالة التصميم" : "Remove design"}</button>
       ` : ""}
     </div>
     <p class="custom-upload-note">${currentLang === "ar" ? "ارفع التصميم، ثم أضف البوستر إلى السلة." : "Upload your design, then add the poster to the cart."}</p>
   ` : `
     <button class="detail-add${outOfStock ? " is-disabled" : ""}" type="button" data-detail-add id="addToCartBtn" ${outOfStock ? 'disabled aria-disabled="true"' : ""}>
       ${outOfStock ? oosLabel : t("addToCartSimple")}
     </button>
   `}
   ```

---

### 3.5 Strict Programmatic Stock Enforcement in `addToCart()` (`script.js:3066`)

```javascript
async function addToCart(productId, size = "20x30", frame = "Black", originEl = null) {
  const product = getProduct(productId);
  if (!product) return;

  // 1. Strict zero-stock block
  if (isProductOutOfStock(product)) {
    showToast(state.lang === "ar" ? "هذا المنتج غير متوفر حالياً" : "Item is out of stock");
    return;
  }

  // 2. Finite inventory limit check
  const maxStock = getProductStock(product);
  if (maxStock !== Infinity) {
    const inCartQty = state.cart
      .filter((item) => item.productId === product.id)
      .reduce((sum, item) => sum + item.quantity, 0);
    if (inCartQty >= maxStock) {
      showToast(state.lang === "ar"
        ? `عذراً، أقصى كمية متوفرة في المخزن هي ${maxStock}`
        : `Sorry, only ${maxStock} items available in stock`);
      return;
    }
  }

  // 3. Custom upload verification
  if (product.isCustom && !state.customUpload) {
    renderDetail(product.id);
    showToast(t("pleaseUploadAlert"));
    return;
  }
  ...
```

---

### 3.6 Cart Drawer Enforcement (`renderCart()`, `updateQuantity()`, `handleCheckout()`)

#### A. In `renderCart()` (`script.js:3135–3155`):
```javascript
cartItems.innerHTML = state.cart.map((item) => {
  const product = getProduct(item.productId);
  if (!product) return "";
  const name = getProductName(product);
  const isOutOfStock = isProductOutOfStock(product);
  const maxStock = getProductStock(product);
  const isExceeded = maxStock !== Infinity && item.quantity > maxStock;
  const disablePlus = isOutOfStock || (maxStock !== Infinity && item.quantity >= maxStock);

  return `
    <article class="cart-item${isOutOfStock ? " is-out-of-stock" : ""}">
      <img src="${displayImageForItem(product, item)}" alt="${name}" onerror="this.onerror=null;this.src='${productImageUrl(POSTER_FALLBACK_IMAGE)}'">
      <div>
        <h3>${name}</h3>
        <p>${item.size} ${currentLang === "ar" ? "سم" : "cm"} / ${getFrameOptionLabel(item.frame)}</p>
        ${item.upload ? `<p>${currentLang === "ar" ? "الملف المرفوع:" : "Uploaded:"} ${item.upload.name}</p>` : ""}
        <p>${money(itemUnitPrice(product, item.size, item.frame))} ${t("cartEach")}</p>
        ${isOutOfStock ? `
          <p class="cart-stock-warning out-of-stock-text" style="color:var(--danger);font-weight:700;font-size:0.8rem;margin:4px 0">
            ⚠️ ${currentLang === "ar" ? "هذا المنتج نفد من المخزن" : "This item is out of stock"}
          </p>
        ` : isExceeded ? `
          <p class="cart-stock-warning" style="color:var(--warm);font-weight:700;font-size:0.8rem;margin:4px 0">
            ⚠️ ${currentLang === "ar" ? `المتوفر في المخزن ${maxStock} فقط` : `Only ${maxStock} available in stock`}
          </p>
        ` : ""}
      </div>
      <div class="quantity-controls" aria-label="Quantity controls">
        <button type="button" data-qty-minus="${item.key}">-</button>
        <strong>${item.quantity}</strong>
        <button type="button" data-qty-plus="${item.key}" ${disablePlus ? 'disabled aria-disabled="true"' : ""}>+</button>
      </div>
    </article>
  `;
}).join("") + ...
```

#### B. In `updateQuantity(key, delta)` (`script.js:3185–3196`):
```javascript
async function updateQuantity(key, delta) {
  const item = state.cart.find((cartItem) => cartItem.key === key);
  if (!item) return;

  if (delta > 0) {
    const product = getProduct(item.productId);
    if (product) {
      if (isProductOutOfStock(product)) {
        showToast(state.lang === "ar" ? "هذا المنتج غير متوفر حالياً" : "Item is out of stock");
        return;
      }
      const maxStock = getProductStock(product);
      if (maxStock !== Infinity && item.quantity + delta > maxStock) {
        showToast(state.lang === "ar"
          ? `الكمية المتاحة في المخزن هي ${maxStock} فقط`
          : `Only ${maxStock} available in stock`);
        return;
      }
    }
  }

  item.quantity += delta;
  if (item.quantity <= 0) {
    state.cart = state.cart.filter((cartItem) => cartItem.key !== key);
    await deleteImageFromDB(key);
  }
  hideConfirmation();
  saveCart();
  renderCart();
}
```

#### C. In `handleCheckout(event)` (`script.js:3431–3447`):
```javascript
function handleCheckout(event) {
  event.preventDefault();
  if (!state.cart.length) {
    showToast(t("confAddFirstAlert"));
    return;
  }

  // Pre-checkout stock verification
  for (const item of state.cart) {
    const product = getProduct(item.productId);
    if (product) {
      if (isProductOutOfStock(product)) {
        showToast(state.lang === "ar"
          ? `المنتج "${getProductName(product)}" نفد من المخزن، يرجى حذفه من السلة للمتابعة`
          : `"${getProductName(product)}" is out of stock. Please remove it from cart to continue.`);
        return;
      }
      const maxStock = getProductStock(product);
      if (maxStock !== Infinity && item.quantity > maxStock) {
        showToast(state.lang === "ar"
          ? `الكمية المطلوبة من "${getProductName(product)}" (${item.quantity}) تتجاوز المخزون (${maxStock})`
          : `Quantity for "${getProductName(product)}" (${item.quantity}) exceeds available stock (${maxStock})`);
        return;
      }
    }
  }

  const couponInput = document.querySelector("[data-coupon-input]");
  ...
```

---

### 3.7 Admin Panel Inventory UI Upgrades (`admin-panel.js` & `panel.html`)

1. **Table Header & Row Rendering (`admin-panel.js:528–548`)**:
   Add a `Stock` column header and display cell:
   ```javascript
   let html = `<table class="admin-table"><thead><tr>
     <th></th><th>ID</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Sizes</th><th>Frames</th><th>Actions</th>
   </tr></thead><tbody>`;

   html += pageItems.map(p => {
     ...
     const stockDisplay = (p.quantity === undefined || p.quantity === null)
       ? `<span style="color:var(--muted);font-size:0.8rem">Unlimited (∞)</span>`
       : p.quantity <= 0
         ? `<span class="badge out-of-stock admin-stock-badge" style="background:var(--danger);color:#fff;padding:2px 8px;border-radius:999px;font-size:0.75rem;font-weight:800">Out of Stock (0)</span>`
         : `<span style="font-weight:800;color:var(--text-strong)">${p.quantity}</span>`;

     return `<tr>
       ...
       <td style="font-weight:700">${money(p.basePrice || 0)}</td>
       <td>${stockDisplay}</td>
       <td style="font-size:0.8rem">${Object.keys(p.sizes || {}).join(', ')}</td>
       ...
     </tr>`;
   }).join('');
   ```

2. **Save Product Normalization & Broadcast (`admin-panel.js:767–805`)**:
   ```javascript
   const qtyVal = $('#apQuantity').value.trim();
   let sanitizedQuantity = undefined;
   if (qtyVal !== '') {
     const parsed = parseInt(qtyVal, 10);
     sanitizedQuantity = isNaN(parsed) || parsed < 0 ? 0 : parsed;
   }

   const productData = {
     ...existingProduct, // Preserve tags, gallery, isCustom (Feature 8)
     id, name,
     nameAr: $('#apNameAr').value.trim(),
     category: $('#apCategory').value,
     tag: $('#apTag').value.trim(),
     tagAr: $('#apTagAr').value.trim(),
     image: $('#apImage').value.trim(),
     basePrice: parseFloat($('#apBasePrice').value) || 0,
     sizes, frames,
     description: $('#apDescription').value.trim(),
     descriptionAr: $('#apDescriptionAr').value.trim(),
     _updatedAt: new Date().toISOString(),
     _deleted: false
   };
   if (sanitizedQuantity !== undefined) {
     productData.quantity = sanitizedQuantity;
   } else {
     delete productData.quantity;
   }

   // Broadcast live stock & product update to all store tabs
   if (typeof BroadcastChannel !== 'undefined') {
     try {
       const syncChannel = new BroadcastChannel('poster-lab-sync');
       syncChannel.postMessage({
         type: 'PRODUCT_UPDATE',
         payload: productData,
         timestamp: Date.now()
       });
       if (productData.quantity !== undefined) {
         syncChannel.postMessage({
           type: 'STOCK_UPDATE',
           payload: { id: productData.id, quantity: productData.quantity },
           timestamp: Date.now()
         });
       }
       syncChannel.close();
     } catch (_) {}
   }
   ```

---

## 4. CSS Design Blueprint (`styles.css`)

Add to `styles.css` (and recompile via `node build-assets.js`):

```css
/* ═════════════════════════════════════════════════════════════════════
   STOCK TRACKING & OUT-OF-STOCK BADGE STYLING (M2 Feature 7)
   ═════════════════════════════════════════════════════════════════════ */

/* ── Out-of-Stock Badges ── */
.badge.out-of-stock,
.out-of-stock-badge {
  position: absolute;
  z-index: 5;
  top: 12px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 11px;
  border-radius: 999px;
  background: rgba(220, 38, 38, 0.92);
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  box-shadow: 0 4px 14px rgba(220, 38, 38, 0.35);
  pointer-events: none;
  animation: fade-in 200ms ease both;
}

[dir="rtl"] .badge.out-of-stock,
[dir="rtl"] .out-of-stock-badge {
  right: auto;
  left: 12px;
}

/* Detail page stock badge */
.detail-stock-badge {
  position: static !important;
  display: inline-flex !important;
  vertical-align: middle;
  margin-inline-start: 10px;
  padding: 4px 10px;
  font-size: 0.76rem;
  box-shadow: none;
}

/* Out-of-Stock Product Card Visual Demarcation */
.product-card.is-out-of-stock .product-media img {
  opacity: 0.75;
  filter: grayscale(35%) contrast(92%);
}

.product-card.is-out-of-stock:hover .product-media img {
  transform: scale(1.01);
}

/* Disabled Quick-Add Cart Icon */
.media-actions .icon-button.is-disabled,
.media-actions .icon-button:disabled {
  background: rgba(0, 0, 0, 0.3) !important;
  color: rgba(255, 255, 255, 0.4) !important;
  cursor: not-allowed !important;
  pointer-events: none;
  transform: none !important;
  box-shadow: none !important;
}

/* Add-to-Cart Button Disabled State in Detail View */
.detail-add:disabled,
.detail-add.is-disabled,
#addToCartBtn:disabled {
  background: var(--surface-2) !important;
  color: var(--muted) !important;
  border: 1px solid var(--line) !important;
  cursor: not-allowed !important;
  opacity: 0.7 !important;
  transform: none !important;
  box-shadow: none !important;
  pointer-events: none;
}

.detail-add:disabled::after,
.detail-add.is-disabled::after,
#addToCartBtn:disabled::after {
  display: none !important;
}

/* Cart Item Out of Stock Indication */
.cart-item.is-out-of-stock {
  border-left: 3px solid var(--danger);
  padding-left: 8px;
}
[dir="rtl"] .cart-item.is-out-of-stock {
  border-left: none;
  border-right: 3px solid var(--danger);
  padding-left: 0;
  padding-right: 8px;
}

.cart-item .quantity-controls button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}

/* Responsive adjustment for small mobile screens */
@media (max-width: 640px) {
  .badge.out-of-stock,
  .out-of-stock-badge {
    top: 7px;
    right: 7px;
    padding: 3px 7px;
    font-size: 0.58rem;
  }
  [dir="rtl"] .badge.out-of-stock,
  [dir="rtl"] .out-of-stock-badge {
    right: auto;
    left: 7px;
  }
}
```

---

## 5. Verification & Automated Test Matrix

The test suite in `tests/e2e/runner.js` already includes rigorous tests for stock tracking:

| Test File | Test ID | Description | Assertion Criteria |
|---|---|---|---|
| `tests/e2e/tier1-features/f08_admin_to_store_stock_sync.test.js` | `F8-1` | Transmit `STOCK_UPDATE` | `type === 'STOCK_UPDATE'`, payload has `id` and `quantity: 0` |
| `tests/e2e/tier1-features/f08_admin_to_store_stock_sync.test.js` | `F8-2` | Quantity 0 is out-of-stock | `quantity !== undefined && quantity <= 0` evaluates to true |
| `tests/e2e/tier1-features/f08_admin_to_store_stock_sync.test.js` | `F8-3` | Add to Cart disabled when stock 0 | `addToCartBtn.disabled === true` and `text === 'Out of stock'` |
| `tests/e2e/tier1-features/f08_admin_to_store_stock_sync.test.js` | `F8-4` | Catalog grid badge | Returns `<span class="badge out-of-stock">Out of Stock</span>` |
| `tests/e2e/tier1-features/f08_admin_to_store_stock_sync.test.js` | `F8-5` | Restoring stock > 0 | `addToCartBtn.disabled === false` and `text === 'Add to cart'` |
| `tests/e2e/tier2-boundaries/b08_live_sync_stock_boundaries.test.js` | `B8-1` | Exact stock 0 boundary | `canAddToCart(0) === false` |
| `tests/e2e/tier2-boundaries/b08_live_sync_stock_boundaries.test.js` | `B8-2` | Negative stock clamped | `normalizeStock(-10) === 0` |
| `tests/e2e/tier2-boundaries/b08_live_sync_stock_boundaries.test.js` | `B8-3` | Stock 1 boundary allows 1 purchase | Deduct 1 succeeds; subsequent purchase fails |
| `tests/e2e/tier2-boundaries/b08_live_sync_stock_boundaries.test.js` | `B8-4` | Out-of-stock sync during checkout | `validateCartStock` reports `isValid: false` |
| `tests/e2e/tier2-boundaries/b08_live_sync_stock_boundaries.test.js` | `B8-5` | Button flips from 0 to 5 | Re-enables button to 'Add to cart' |
| `tests/e2e/tier3-pairwise/pairwise_combinations.test.js` | `T3-08` | Stock 0 x Detail View | Button text is 'Out of stock' and cart item marked unavailable |
| `tests/e2e/tier4-scenarios/scenario_2_admin_live_update.test.js` | `S2` | Live price & stock 0 update | Detail view disables button and shows 'Out of Stock' badge |

All 12 of these automated tests run directly via `node tests/e2e/runner.js`.

---

## 6. Implementation Action Plan for Worker

1. **Modify `admin/panel.html`**:
   - Line 169: Update placeholder to `"e.g. 10 (0 = out of stock, leave empty for unlimited)"`.
2. **Modify `admin-panel.js`**:
   - Line 528: Add `<th>Stock</th>` to product table header.
   - Line 540: Add `<td>${stockDisplay}</td>` to product table rows.
   - Line 767: Sanitize and clamp `quantity`: `isNaN(parsed) || parsed < 0 ? 0 : parsed`.
   - Line 786: Dispatch BroadcastChannel `STOCK_UPDATE` and `PRODUCT_UPDATE`.
3. **Modify `script.js`**:
   - Add `isProductOutOfStock` and `getProductStock` helper functions.
   - Add translation dictionary keys for English and Arabic.
   - In `renderProducts()` and `catCardHtml()`, inject `.badge.out-of-stock` and disable quick-add button for zero-stock items.
   - In `renderDetail()`, add `id="addToCartBtn"`, toggle label to "Out of Stock" / "نفد من المخزن", add `disabled` attribute, and inject `.badge.out-of-stock.detail-stock-badge`.
   - In `addToCart()`, enforce zero-stock check, block addition, and show user toast.
   - In `renderCart()`, show stock warning and disable `+` button when item quantity reaches stock.
   - In `updateQuantity()`, guard `+` against available stock.
   - In `handleCheckout()`, validate cart stock before allowing order submission.
   - In `applyRemoteProducts()` and live sync listener, re-render cart drawer alongside catalog and detail views.
4. **Modify `styles.css`**:
   - Add CSS rules for `.badge.out-of-stock`, `.out-of-stock-badge`, `.detail-stock-badge`, `.detail-add:disabled`, `#addToCartBtn:disabled`, and RTL rules.
5. **Recompile Minified Targets**:
   - Run `node build-assets.js` to compile `script.min.js`, `admin-panel.min.js`, `styles.min.css`, and copy to `admin/`.
6. **Execute Test Suite**:
   - Run `node tests/e2e/runner.js` to verify zero regressions.

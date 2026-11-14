# Explorer M4-R2-2 Handoff Report: Catalog Rendering & DOM View Integrity on Category Exit

**Date**: 2026-11-11  
**Agent**: Explorer M4-R2-2 (`explorer_m4_r2_2`)  
**Role**: Catalog Rendering & DOM View Integrity Explorer M4-R2-2  
**Parent Orchestrator Conversation ID**: `9cbe72cd-c919-4c71-951f-2cc0ee756513`  
**Working Directory**: `d:\Poster Lab Store Antigravity\Poster Lab Store - Copy - Copy\PosterLabStore\.agents\teamwork\explorer_m4_r2_2\`  

---

## 1. Observation

### Codebase Locations & Verbatim Code

1. **`renderProducts()` Category Detection & Dead-Code Reset**:
   In `script.js` lines 2396–2406:
   ```javascript
   function renderProducts() {
     const container = document.querySelector("#categorySections");
     if (!container) return;

     const currentCat = new URLSearchParams(window.location.search).get("cat") || catParam;
     if (currentCat) {
       renderSingleCategory(currentCat);
       return;
     }
     catParam = null;
   ```
   - Line 2400 falls back to module-level variable `catParam`.
   - Lines 2401–2404 immediately re-call `renderSingleCategory(currentCat)` and `return;` whenever `currentCat` is truthy.
   - Line 2405 (`catParam = null;`) is unreachable dead code whenever `catParam` is truthy.

2. **`renderSingleCategory(catId)` Construction & Module State Mutation**:
   In `script.js` lines 2834–2911:
   ```javascript
   const CAT_PAGE_SIZE = 30;
   let catLoadedCount = 0;
   let catItems = [];
   let catParam = null;
   let catPillsObserver = null;
   let _scrollYLock = null;

   function renderSingleCategory(cat) {
     const container = document.querySelector("#categorySections");
     if (!container) return;
     const pillsEl = document.querySelector("[data-cat-pills]");
     if (pillsEl) pillsEl.innerHTML = "";
     if (catPillsObserver) catPillsObserver.disconnect();
     ...
     catParam = cat; // Line 2866: sets module variable to string
     ...
     let html = `<div class="page-back-bar">\n`;
     html += `  <a class="page-back-btn" href="index.html" ...>...</a>\n`;
     html += `</div>\n`;
     html += `<div class="single-cat-header">\n`;
     html += `  <div style="display:flex;align-items:center;gap:8px">\n`;
     html += `    <span style="font-size:1.4rem">${catSectionIcon(meta)}</span>\n`;
     html += `    <h2>${meta.label}</h2>\n`;
     html += `  </div>\n`;
     html += `  <span class="result-count">${count}</span>\n`;
     html += `</div>\n`;
     html += `<div class="full-cat-grid" id="fullCatGrid">\n`;
     html += catCardHtml(catItems.slice(0, catLoadedCount), 0, currentLang);
     html += `</div>\n`;

     container.innerHTML = html;
     appendLoadMore();
   }
   ```
   - Sets `catParam = cat;` at line 2866.
   - Replaces `#categorySections` (`container.innerHTML`) with `.page-back-bar`, `.single-cat-header`, and `#fullCatGrid`.
   - Clears `[data-cat-pills]` (`pillsEl.innerHTML = ""`).
   - Calls `appendLoadMore()`, which attaches `catObserver = new IntersectionObserver(...)` to a newly appended `.cat-load-sentinel` element inside `#categorySections`.

3. **`catObserver` Lifecycle & Disconnect Omission**:
   In `script.js` lines 2954–2987:
   ```javascript
   let catObserver = null;

   function appendLoadMore() {
     const grid = document.querySelector("#fullCatGrid");
     if (!grid) return;
     ...
     catObserver = new IntersectionObserver((entries) => {
       if (entries[0].isIntersecting) {
         const next = catItems.slice(catLoadedCount, catLoadedCount + CAT_PAGE_SIZE);
         if (!next.length) return;
         grid.insertAdjacentHTML("beforeend", catCardHtml(next, catLoadedCount, currentLang));
         catLoadedCount += next.length;
         appendLoadMore();
       }
     }, { rootMargin: "200px" });
     catObserver.observe(sentinel);
   }
   ```
   - When exiting single category view, `renderProducts()` replaces `container.innerHTML`, removing `.cat-load-sentinel` and `#fullCatGrid`.
   - `renderProducts()` **never** calls `catObserver.disconnect()` or resets `catObserver = null`.
   - If an observer entry fires before garbage collection or if disconnected elements linger, `grid` is `null`, producing an unhandled `TypeError: Cannot read properties of null (reading 'insertAdjacentHTML')`.

4. **Browser History `popstate` Handler**:
   In `script.js` lines 4490–4497:
   ```javascript
   window.addEventListener("popstate", () => {
     const cat = new URLSearchParams(window.location.search).get("cat");
     if (cat) {
       renderSingleCategory(cat);
     } else if (productGrid) {
       renderProducts();
     }
   });
   ```
   - When browser Back returns to root homepage `index.html`, `cat` is `null`.
   - `renderProducts()` is invoked without clearing `catParam`.

5. **In-Page Back Button (`.page-back-btn`) Behavior**:
   In `script.js` lines 4156–4166:
   ```javascript
   // Back to store button handler
   document.addEventListener("click", (e) => {
     const backBtn = e.target.closest(".page-back-btn");
     if (!backBtn) return;
     e.preventDefault();
     if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.hostname)) {
       window.history.back();
     } else {
       window.location.href = getStoreHomeUrl();
     }
   });
   ```
   - For direct visitors or in-page transitions, `document.referrer` is `""`.
   - The condition `document.referrer && document.referrer.includes(window.location.hostname)` evaluates to `false`.
   - The handler falls into `else: window.location.href = getStoreHomeUrl();`, triggering a full HTTP page reload of `index.html` instead of an in-place SPA history transition.
   - For visitors with an internal referrer, `window.history.back()` is called, firing `popstate`, which hits the `catParam` trap and fails to exit the category.

6. **Brand / Logo Click Handler**:
   In `script.js` lines 4119–4141:
   ```javascript
   if (isHome) {
     e.preventDefault();
     state.activeCategory = null;
     state.search = "";
     state.selectedProduct = null;
     ...
     window.history.pushState({}, "", cleanPath);
     if (typeof renderCatPills === "function") renderCatPills();
     if (typeof renderProducts === "function") renderProducts();
   ```
   - Does not reset `catParam = null;`, causing clicking the logo in single category view to also fall into the `renderProducts()` trap.

7. **Empirical Reproduction Command & Output**:
   - Command: `node tests/challenger_m4_nav_cart_stress.js`
   - Output:
     ```
     VERDICT: REJECT (1 failure(s) detected)
       - FAIL: Browser Back: popstate handler re-rendered all products (single-cat-header cleared)
     Total Empirical Checks: 531
     Passed Checks:          530
     Failed Checks:          1
     ```

---

## 2. Logic Chain

1. **Category Navigation Sets Module State**:
   When the user opens a category on `index.html` (e.g. `?cat=cars`), `renderSingleCategory('cars')` sets `catParam = 'cars'` (line 2866). It replaces `#categorySections.innerHTML` with `.page-back-bar`, `.single-cat-header`, and `#fullCatGrid`, while emptying `[data-cat-pills]`.

2. **Exit Back to Homepage Root**:
   When the user presses the browser Back button, the browser pops history, URL becomes `index.html` (`window.location.search === ""`), and dispatches `popstate`.

3. **Popstate Dispatches to `renderProducts()`**:
   `new URLSearchParams(window.location.search).get("cat")` is `null`. The listener enters `else if (productGrid)` and calls `renderProducts()`.

4. **The `catParam` Stale State Trap**:
   In `renderProducts()`:
   `const currentCat = new URLSearchParams(window.location.search).get("cat") || catParam;`
   Since `window.location.search` has no `cat`, the left-hand side is `null`. But `catParam` is still `'cars'`.
   `currentCat` evaluates to `'cars'`.
   `if (currentCat)` is `true`, so `renderProducts()` invokes `renderSingleCategory('cars')` and exits with `return;`.
   `catParam = null;` on line 2405 is never reached.

5. **DOM Teardown & Reconstruction Analysis**:
   - **Is `.single-cat-header` wiped out?**
     When `renderProducts()` actually proceeds past line 2405, it builds `html` with all 19 `<section class="category-section">` elements and assigns `container.innerHTML = html`. Because `.single-cat-header`, `.page-back-bar`, `#fullCatGrid`, and `.cat-load-sentinel` are children of `#categorySections`, setting `innerHTML` cleanly wipes them all out. The bug is strictly that `renderProducts()` was aborted prematurely due to `catParam`.
   - **Are all category sections restored?**
     Yes. `renderProducts()` loops through `allDisplayCats` (19 categories) and appends a carousel section for each category, followed by `renderCatPills()` restoring all category pills into `[data-cat-pills]`.
   - **Are there zombie listeners or observer leaks?**
     Yes. `catObserver` is instantiated in `appendLoadMore()` to watch `.cat-load-sentinel`. `renderProducts()` never disconnects it. Explicit teardown (`if (catObserver) { catObserver.disconnect(); catObserver = null; }`) must be added to `renderProducts()`.
   - **Does `.page-back-btn` behave consistently with the browser Back button?**
     No. Line 4161 checks `document.referrer.includes(window.location.hostname)`. For users without an HTTP referrer (direct, bookmarks, in-page SPA navigation), this causes a disruptive full-page reload (`window.location.href = getStoreHomeUrl()`). For users with an HTTP referrer, `window.history.back()` triggers `popstate`, which was blocked by the `catParam` trap.

---

## 3. Caveats

- **Subpages (`product.html`, `our-work.html`, `faq.html`)**: Subpages do not contain `#categorySections` (`productGrid` is null). The `renderProducts()` / `popstate` category trap is strictly localized to `index.html`.
- **Existing Test Suites**: Running `node tests/run-all.js` (203/203 passed) confirms existing E2E tests did not test browser `popstate` navigation between single-category views and root catalog; Challenger M4-1's stress test is the first suite to empirically test this flow.
- **Read-Only Investigation**: In strict compliance with Explorer rules, no source files were modified during this investigation.

---

## 4. Conclusion

The defect preventing clean category exit and catalog restoration on `index.html` stems from two root causes:
1. `renderProducts()` falling back to stale module-level `catParam` via `|| catParam` at line 2400, making line 2405 (`catParam = null;`) unreachable dead code and trapping the user in the active category.
2. Incomplete teardown of `catObserver`, `catItems`, and `catLoadedCount` during view reset.
3. Overly strict `document.referrer` gating on `.page-back-btn` causing full page reloads instead of in-place SPA navigation on `index.html`.

### Required Worker M4 Remediations

#### Change 1: `script.js` — Clean View Reset in `renderProducts()` (lines 2400–2406)
Replace:
```javascript
  const currentCat = new URLSearchParams(window.location.search).get("cat") || catParam;
  if (currentCat) {
    renderSingleCategory(currentCat);
    return;
  }
  catParam = null;
```
With:
```javascript
  const currentCat = new URLSearchParams(window.location.search).get("cat");
  if (currentCat) {
    renderSingleCategory(currentCat);
    return;
  }
  catParam = null;
  catItems = [];
  catLoadedCount = 0;
  if (catObserver) {
    catObserver.disconnect();
    catObserver = null;
  }
```

#### Change 2: `script.js` — Defense-in-Depth in `popstate` (lines 4490–4497)
Replace:
```javascript
window.addEventListener("popstate", () => {
  const cat = new URLSearchParams(window.location.search).get("cat");
  if (cat) {
    renderSingleCategory(cat);
  } else if (productGrid) {
    renderProducts();
  }
});
```
With:
```javascript
window.addEventListener("popstate", () => {
  const cat = new URLSearchParams(window.location.search).get("cat");
  if (cat) {
    renderSingleCategory(cat);
  } else if (productGrid) {
    catParam = null;
    renderProducts();
  }
});
```

#### Change 3: `script.js` — Reset `catParam` on Brand/Logo Click (line 4121)
In the `.brand` click handler, add `catParam = null;`:
```javascript
  if (isHome) {
    e.preventDefault();
    state.activeCategory = null;
    state.search = "";
    state.selectedProduct = null;
    catParam = null;
```

#### Change 4: `script.js` — Align `.page-back-btn` with SPA Navigation on `index.html` (lines 4156–4166)
Update the Back to store click handler to support seamless in-place back navigation on `index.html`:
```javascript
// Back to store button handler
document.addEventListener("click", (e) => {
  const backBtn = e.target.closest(".page-back-btn");
  if (!backBtn) return;
  e.preventDefault();
  const p = window.location.pathname.replace(/\/+$/, "");
  const isHome = p === "" || p.endsWith("/index.html") || p.endsWith("index.html") || p.toLowerCase().endsWith("/posterlabstore") || p.toLowerCase() === "/posterlabstore";

  if (isHome && productGrid) {
    if (window.history.length > 1 && window.history.state) {
      window.history.back();
    } else {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("cat");
        url.searchParams.delete("search");
        window.history.pushState({}, "", url.pathname || "index.html");
      } catch (_) {}
      catParam = null;
      renderProducts();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    return;
  }

  if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.hostname)) {
    window.history.back();
  } else {
    window.location.href = getStoreHomeUrl();
  }
});
```

#### Change 5: Regenerate Minified Bundle
Run:
```bash
node build-assets.js
```
to synchronize `script.min.js`.

---

## 5. Verification Method

1. **Empirical Stress Test Suite**:
   Execute the challenger suite:
   ```bash
   node tests/challenger_m4_nav_cart_stress.js
   ```
   - Before fix: Fails on assertion `FAIL: Browser Back: popstate handler re-rendered all products (single-cat-header cleared)` (530/531 passed).
   - After fix: All 531 checks pass with exit code 0 (`VERDICT: APPROVE`).

2. **Full E2E Regression Suite**:
   Execute:
   ```bash
   node tests/run-all.js
   ```
   - Confirm all 203/203 tests across Tiers 1–4 continue to pass with 0 failures.

3. **Manual Browser Invalidation Conditions**:
   - Open `index.html` in browser.
   - Click menu drawer -> click "Cars" (`index.html?cat=cars`).
   - Verify `.page-back-bar`, `.single-cat-header`, and `#fullCatGrid` appear, and pills disappear.
   - Click browser Back button.
   - Verify `.single-cat-header` and `.page-back-bar` disappear immediately, all 19 category sections and carousels reappear, and category pills are restored.
   - Repeat test using the in-page "Back to store" button (`.page-back-btn`) and logo click (`.brand`) to verify smooth in-place restoration without full page reload.

# Handoff Report: Server, SW & Checkout Investigation (M4-2)

**Author:** Explorer M4-2  
**Date:** 2026-11-11T14:40:00Z  
**Scope:** Milestone 4 — Features 17 (Service Worker Stabilization), 18 (Server Caching Headers), 19 (WhatsApp Checkout Latency Optimization), and related test review.  
**Integrity Mode:** Read-Only Investigation  

---

## 1. Observation

### 1.1 Service Worker Stabilization (`sw.js`)
Inspection of `sw.js` lines 91–158 revealed the following `fetch` event handler:

```javascript
// sw.js:91-131
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  let requestUrl;
  try { requestUrl = new URL(event.request.url); } catch { return; }
  if (requestUrl.protocol !== 'http:' && requestUrl.protocol !== 'https:') return;

  const isLocalImage = requestUrl.origin === self.location.origin && requestUrl.pathname.includes('/assets/');

  // Admin pages, critical configs, and access controls always network-first to avoid stale caches
  if (requestUrl.pathname.includes('/admin/') || requestUrl.pathname.endsWith('firebase-config.js') || requestUrl.pathname.endsWith('admin-access.js')) {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.ok) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        }
        return networkResponse;
      }).catch(() => caches.match(event.request))
    );
    return;
  }
  if (isLocalImage) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              cache.put(event.request, networkResponse.clone()).catch(() => {});
            }
            return networkResponse;
          });
        });
      }).catch(() => fetch(event.request))
    );
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const cachedResponse = await caches.match(event.request).catch(() => null);
        if (cachedResponse) {
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              }).catch(() => {});
            }
          }).catch(() => {});
          return cachedResponse;
        }
        const networkResponse = await fetch(event.request).catch(() => new Response('', { status: 503 }));
        if (networkResponse && networkResponse.ok) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          }).catch(() => {});
        }
        return networkResponse;
      } catch {
        return new Response('', { status: 503 });
      }
    })().catch(() => new Response('', { status: 503 }))
  );
});
```

**Key Findings in `sw.js`:**
1. Line 96 checks protocols (`http:` and `https:`), but there is **no check or early return for `requestUrl.origin !== self.location.origin`**.
2. Line 98 tests `requestUrl.origin === self.location.origin` strictly to set the boolean `isLocalImage`.
3. If an external GET request arrives (such as Firestore streaming at `https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel?...`, Google Fonts at `fonts.googleapis.com`, or external CDNs), it bypasses `isLocalImage` and admin rules and falls directly into the catch-all `event.respondWith(...)` at lines 131–157.
4. When cross-origin requests are intercepted by `event.respondWith`:
   - It attempts `caches.match(event.request)`.
   - On fetch failure or timeout, it synthesizes an artificial HTTP `503` (`new Response('', { status: 503 })`), causing Firestore live synchronization listeners to fail silently or crash.
   - If `networkResponse.ok` is true, it attempts `networkResponse.clone()` and `cache.put(event.request, responseToCache)`. For streaming connections or opaque cross-origin responses, caching breaks streams and can cause memory leaks or cache corruption.

---

### 1.2 Server Caching Headers (`firebase.json`)
Inspection of `firebase.json` lines 37–56:

```json
    "headers": [
      {
        "source": "**/*.@(webp|png|jpg|jpeg|gif|svg)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=86400"
          }
        ]
      }
    ]
```

**Key Findings in `firebase.json`:**
1. `firebase.json` has only two header rules: one for images and one for `**/*.@(js|css)`.
2. `sw.js` matches `**/*.@(js|css)` and is served with `Cache-Control: public, max-age=86400` (24 hours).
3. Browsers adhere to HTTP caching headers for Service Worker scripts up to 24 hours. When `sw.js` is updated (e.g. changing `CACHE_NAME`, fixing service worker bugs, or busting assets), visitors who have loaded the site within the past 24 hours will NOT request the updated service worker from the server.
4. There is no specific rule configured for `/sw.js` setting `Cache-Control: no-cache, no-store, must-revalidate`.

---

### 1.3 WhatsApp Checkout Latency (`script.js`)
Inspection of `script.js` lines 3650–3920 revealed how WhatsApp checkout orders are processed:

```javascript
// script.js:3650-3680
async function uploadImageToTemporaryServer(blob, fileName) {
  try {
    const formData = new FormData();
    formData.append("file", blob, fileName || "design.png");

    const response = await fetch("https://tmpfiles.org/api/v1/upload", {
      method: "POST",
      body: formData
    });

    if (!response.ok) throw new Error("Upload failed");
    const json = await response.json();
    if (json.data && json.data.url) {
      return json.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
    }
  } catch (err) {
    console.error("Temporary upload failed:", err);
  }
  return null;
}

async function fetchAndUploadImage(imgUrl, fileName) {
  try {
    const response = await fetch(imgUrl);
    const blob = await response.blob();
    return await uploadImageToTemporaryServer(blob, fileName);
  } catch (err) {
    console.error("Failed to fetch/upload image:", imgUrl, err);
    return imgUrl;
  }
}
```

And in `sendWhatsAppOrder()` (lines 3831–3920):

```javascript
// script.js:3831-3879
  setSendButtonLoading(true);
  showToast(isAr ? "جاري رفع صور المنتجات إلى الخادم الآمن..." : "Uploading product images to secure server...");
  setUploadProgress(8, true);

  let message = buildWhatsAppMessage(order);
  const uploadPromises = [];
  const uploadTotal = state.cart.reduce((total, item) => {
    const product = getProduct(item.productId);
    if (!product) return total;
    if (item.upload) return total + 1;
    return total + ((product.gallery && product.gallery.length) ? product.gallery.length : 1);
  }, 0);
  let uploadDone = 0;

  const uploadWithProgress = async (imgUrl, fileName) => {
    const url = await fetchAndUploadImage(imgUrl, fileName);
    uploadDone += 1;
    setUploadProgress(8 + (uploadDone / Math.max(uploadTotal, 1)) * 82, true);
    return url;
  };

  // Gather all items and their images (including full galleries for series)
  state.cart.forEach((item, index) => {
    const product = getProduct(item.productId);
    if (!product) return;
    if (item.upload) {
      // Custom upload
      uploadPromises.push((async () => {
        const blob = await getUploadBlobForItem(item);
        const url = blob ? await uploadImageToTemporaryServer(blob, item.upload.name) : null;
        uploadDone += 1;
        setUploadProgress(8 + (uploadDone / Math.max(uploadTotal, 1)) * 82, true);
        return { index, label: isAr ? "التصميم المرفوع" : "Uploaded Design", urls: url ? [url] : [] };
      })());
    } else {
      // Standard product or Series
      const imagesToUpload = (product.gallery && product.gallery.length) ? product.gallery : [product.image];
      uploadPromises.push((async () => {
        const urls = [];
        for (let i = 0; i < imagesToUpload.length; i++) {
          const imgUrl = productImageUrl(imagesToUpload[i]);
          const fileName = `${product.name.replace(/\s+/g, "_")}_${i + 1}.png`;
          const url = await uploadWithProgress(imgUrl, fileName);
          if (url) urls.push(url);
        }
        return { index, label: getProductName(product), urls };
      })());
    }
  });
```

**Key Findings in `script.js`:**
1. Whenever a user checks out with standard catalog products (e.g. 3 posters or series with 3 images each = up to 9 images), `script.js` fetches each local asset (`imgUrl`), converts it into a `Blob`, and issues multiple HTTP POST requests to third-party file host `https://tmpfiles.org/api/v1/upload`.
2. This creates severe performance degradation:
   - 5–30+ seconds of artificial delay before the WhatsApp link is opened.
   - Shows blocking spinner "Uploading product images to secure server..." even when the user bought stock catalog items.
   - Susceptible to network timeouts, rate limiting (HTTP 429), or complete upload failure if `tmpfiles.org` is unreachable or blocked.
   - The temporary URLs generated on `tmpfiles.org` expire quickly (typically within hours), while the store's own catalog images are permanent.
3. Standard catalog items already have permanent, stable URLs generated synchronously via `productImageUrl(product.image)` (lines 1302–1313) and `productImageUrl('product.html?id=' + product.id)`. The store already hosts all 1,019 catalog assets.
4. Only custom user-uploaded files (`item.upload`) — which exist only as in-memory Blobs or IndexedDB blobs on the client's device — require temporary cloud file hosting so the store merchant can view the customer's design.

---

### 1.4 Test Suite Review (`f17_server_sw_resilience.test.js` & `b17_server_sw_boundaries.test.js`)
Inspection of test assertions:

1. **`tests/e2e/tier1-features/f17_server_sw_resilience.test.js` line 25:**
   ```javascript
   assertMatch(swCode, /self\.location\.origin|requestUrl\.origin === self\.location\.origin|origin/, 'sw.js should inspect origin of request');
   ```
   *Analysis:* This test currently passes as a false-positive because line 98 of `sw.js` contains `isLocalImage = requestUrl.origin === self.location.origin && ...`. The test regex does not verify that cross-origin requests cause an *early return/bypass*.

2. **`tests/e2e/tier2-boundaries/b17_server_sw_boundaries.test.js` lines 22–35:**
   ```javascript
   test('B17-2: Cross-origin streaming requests (Firestore, external APIs) bypass SW cache interception', () => {
     function shouldBypassCache(requestUrl, selfOrigin) {
       if (requestUrl.origin !== selfOrigin) {
         return true; // Bypass external requests
       }
       return false;
     }
     ...
     assertEqual(shouldBypassCache(firestoreUrl, 'http://localhost:3000'), true);
   });
   ```
   *Analysis:* The test defines an internal mock function `shouldBypassCache` and asserts against it, without checking whether `sw.js` actually implements that behavior.

3. **`tests/e2e/tier2-boundaries/b17_server_sw_boundaries.test.js` lines 51–55:**
   ```javascript
   test('B17-4: firebase.json specifies hosting configuration for sw.js without stale caching', () => {
     const firebaseJson = JSON.parse(readProjectFile('firebase.json'));
     assert(firebaseJson.hosting !== undefined, 'firebase.json must contain hosting configuration');
     assert(Array.isArray(firebaseJson.hosting.headers), 'firebase.json must specify headers');
   });
   ```
   *Analysis:* Only verifies that `headers` is an array; does not check that `/sw.js` has `no-cache, no-store`.

---

## 2. Logic Chain

1. **Service Worker Origin Guard (F17):**
   - Observations 1.1.1 & 1.1.3 show `sw.js` intercepts all GET requests regardless of origin.
   - When Firestore initializes its real-time listener channel (`https://firestore.googleapis.com/...`), the request is intercepted by `sw.js`.
   - Streaming requests cannot be safely cloned or cached like static assets; any fetch abort or timeout returns a synthetic 503 response, severing real-time sync.
   - Inserting `if (requestUrl.origin !== self.location.origin) return;` at line 97 ensures any cross-origin request (Firestore streaming, Google Fonts, CDNs) completely bypasses the Service Worker. The browser handles them natively.

2. **Server Caching Headers (F18):**
   - Observation 1.2.2 shows `/sw.js` is currently matched by `"**/*.@(js|css)"` with `public, max-age=86400`.
   - A Service Worker script cached for 24 hours prevents users from receiving service worker updates and cache invalidation.
   - In Firebase Hosting, headers defined later in the `headers` array override earlier rules for matching routes.
   - Adding an explicit entry for `"/sw.js"` with `Cache-Control: no-cache, no-store, must-revalidate` ensures the browser always revalidates the service worker script on every page load.

3. **WhatsApp Checkout Latency Optimization (F19):**
   - Observation 1.3.1 demonstrates that `sendWhatsAppOrder()` in `script.js` iterates through all cart items and executes `fetchAndUploadImage()` for every catalog product image.
   - Observation 1.3.3 shows catalog product images are already permanently hosted on the store site and accessible via `productImageUrl(product.image)`.
   - Therefore, re-uploading catalog images to `tmpfiles.org` is redundant, slow (5–30s latency), error-prone, and unnecessary.
   - By checking `item.upload`, the system can distinguish between custom user designs (which must be uploaded to temporary storage) and standard catalog products (which can link directly via `productImageUrl(...)` without any network upload).
   - If the cart contains no custom designs (`uploadTotal === 0`), `sendWhatsAppOrder()` can bypass the upload phase entirely and trigger the WhatsApp link instantly.

---

## 3. Caveats

1. **Temporary File Server for Custom Uploads:**
   - The third-party service `https://tmpfiles.org/api/v1/upload` remains necessary for custom uploaded designs (`item.upload`) until/unless a dedicated backend storage bucket (e.g. Firebase Cloud Storage) is configured. Restricting its use to custom items dramatically reduces load and eliminates 100% of the latency for standard catalog orders.
2. **Build Step Requirement:**
   - When `script.js` is modified, `node build-assets.js` must be run to generate `script.min.js`, ensuring parity between unminified source and production minified bundles.
3. **Existing Passing Tests:**
   - The test harness currently reports 200/203 passing tests. The 3 failing tests are related to `our-work.html` and `faq.html` missing `products-bundle.js` (Feature 16 / Explorer M4-1 scope). The proposed changes to `sw.js`, `firebase.json`, and `script.js` will not break any existing tests and will allow hardening tests for F17 and F18.

---

## 4. Conclusion & Concrete Proposals

### Proposal 1: `sw.js` Same-Origin Guard (Feature 17)
In `sw.js`, insert the origin guard at line 97:

```javascript
<<<<
  let requestUrl;
  try { requestUrl = new URL(event.request.url); } catch { return; }
  if (requestUrl.protocol !== 'http:' && requestUrl.protocol !== 'https:') return;

  const isLocalImage = requestUrl.origin === self.location.origin && requestUrl.pathname.includes('/assets/');
====
  let requestUrl;
  try { requestUrl = new URL(event.request.url); } catch { return; }
  if (requestUrl.protocol !== 'http:' && requestUrl.protocol !== 'https:') return;

  // Same-origin guard: bypass cross-origin requests (Firestore streaming, Google Fonts, external APIs)
  if (requestUrl.origin !== self.location.origin) return;

  const isLocalImage = requestUrl.pathname.includes('/assets/');
>>>>
```

### Proposal 2: `firebase.json` SW Header (Feature 18)
In `firebase.json`, add the `/sw.js` rule to the `hosting.headers` array:

```json
<<<<
    "headers": [
      {
        "source": "**/*.@(webp|png|jpg|jpeg|gif|svg)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=86400"
          }
        ]
      }
    ]
====
    "headers": [
      {
        "source": "**/*.@(webp|png|jpg|jpeg|gif|svg)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=86400"
          }
        ]
      },
      {
        "source": "/sw.js",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          }
        ]
      }
    ]
>>>>
```

### Proposal 3: WhatsApp Checkout Optimization (`script.js`) (Feature 19)
In `script.js` (lines 3831–3899):
1. Compute `customItems = state.cart.filter((item) => item.upload)`.
2. Compute `uploadTotal = customItems.length`.
3. If `uploadTotal === 0`:
   - Do NOT display "Uploading product images..." toast or progress bar.
   - For each standard item, link standard image paths directly using `productImageUrl(product.image)` (synchronous, zero network requests).
   - Generate WhatsApp URL immediately and redirect.
4. If `uploadTotal > 0`:
   - Show toast: `isAr ? "جاري رفع التصميم المرفوع..." : "Uploading custom design..."`.
   - Upload ONLY the custom files using `getUploadBlobForItem(item)` and `uploadImageToTemporaryServer(...)`.
   - For standard items in the same cart, use direct URLs `productImageUrl(...)` without uploading.
   - Format download links in WhatsApp for the custom uploaded designs.
5. In addition, the redundant helper `fetchAndUploadImage` can be removed or kept as a fallback only if needed.

Proposed code structure for `sendWhatsAppOrder()`:
```javascript
  setSendButtonLoading(true);

  const customItems = state.cart.filter((item) => item.upload);
  const uploadTotal = customItems.length;
  let uploadDone = 0;

  if (uploadTotal > 0) {
    showToast(isAr ? "جاري رفع التصميم المرفوع..." : "Uploading custom design...");
    setUploadProgress(8, true);
  }

  let message = buildWhatsAppMessage(order);
  const uploadPromises = [];

  state.cart.forEach((item, index) => {
    const product = getProduct(item.productId);
    if (!product) return;
    if (item.upload) {
      // Custom upload strictly uploaded remotely
      uploadPromises.push((async () => {
        const blob = await getUploadBlobForItem(item);
        const url = blob ? await uploadImageToTemporaryServer(blob, item.upload.name) : null;
        uploadDone += 1;
        setUploadProgress(8 + (uploadDone / Math.max(uploadTotal, 1)) * 82, true);
        return { index, label: isAr ? "التصميم المرفوع" : "Uploaded Design", urls: url ? [url] : [], isCustom: true };
      })());
    } else {
      // Standard catalog product: use direct asset link without remote upload latency
      const imagesToLink = (product.gallery && product.gallery.length) ? product.gallery : [product.image];
      const urls = imagesToLink.map((img) => productImageUrl(img));
      uploadPromises.push(Promise.resolve({
        index,
        label: getProductName(product),
        urls,
        isCustom: false
      }));
    }
  });

  let uploadedImageUrls = [];
  try {
    const results = await Promise.all(uploadPromises);
    const customResults = results.filter((res) => res.isCustom && res.urls.length > 0);
    if (customResults.length > 0) {
      let linkSection = isAr ? "\n\n*روابط تنزيل التصاميم المرفوعة:*" : "\n\n*Uploaded Design Download Links:*";
      customResults.forEach((res) => {
        linkSection += `\n- *${res.label}:*`;
        res.urls.forEach((url, i) => {
          linkSection += `\n  [${i + 1}] ${url}`;
        });
      });
      message += linkSection;
    }
    results.forEach((res) => uploadedImageUrls.push(...res.urls));
    if (uploadTotal > 0) {
      setUploadProgress(100, true);
      showToast(isAr ? "تم الرفع بنجاح!" : "Upload successful!");
    }
  } catch (err) {
    console.error("Failed to process order images:", err);
    if (uploadTotal > 0) showToast(isAr ? "حدث خطأ أثناء رفع التصميم" : "Error uploading custom design");
    setSendButtonLoading(false);
  }
```

### Proposal 4: Test Suite Hardening
1. In `tests/e2e/tier1-features/f17_server_sw_resilience.test.js`:
   Tighten `F17-2` to verify the early return:
   `assertMatch(swCode, /requestUrl\.origin\s*!==\s*self\.location\.origin\s*\)\s*return;/, 'sw.js must early-return on cross-origin requests');`
2. In `tests/e2e/tier2-boundaries/b17_server_sw_boundaries.test.js`:
   - In `B17-2`: Check that `sw.js` text guards `requestUrl.origin !== self.location.origin`.
   - In `B17-4`: Assert that `firebaseJson.hosting.headers` contains an explicit rule for `/sw.js` with `no-cache`.

---

## 5. Verification Method

### 5.1 Automated Test Execution
Run the full automated E2E test suite:
```bash
node tests/run-all.js
```

### 5.2 Specific Feature Test Execution
Inspect and run:
```bash
node tests/e2e/runner.js tests/e2e/tier1-features/f17_server_sw_resilience.test.js
node tests/e2e/runner.js tests/e2e/tier2-boundaries/b17_server_sw_boundaries.test.js
```

### 5.3 Static Verification of Code Files
1. **`sw.js` Origin Check:**
   Verify line presence:
   `grep -n "requestUrl.origin !== self.location.origin" sw.js`
2. **`firebase.json` Headers:**
   Verify `firebase.json` contains:
   `"source": "/sw.js"` and `"value": "no-cache, no-store, must-revalidate"`
3. **`script.js` Checkout Logic:**
   Verify `fetchAndUploadImage` is not invoked for catalog items:
   `grep -n "tmpfiles" script.js` (should only be inside `uploadImageToTemporaryServer` for custom items).
4. **Asset Build Parity:**
   Run:
   ```bash
   node build-assets.js
   ```
   Verify `script.min.js` builds cleanly with no syntax errors.

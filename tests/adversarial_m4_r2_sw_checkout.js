/**
 * tests/adversarial_m4_r2_sw_checkout.js
 * 
 * Empirical Adversarial Challenger Test Suite
 * Milestone 4 Remediation: Service Worker Boundary Conditions & Checkout Resilience
 * Challenger M4-R2-2
 * 
 * Authoritative Directives:
 * 1. External API calls (Google Fonts, Firebase, Cloudinary, Analytics) bypassing SW cache.
 * 2. Non-GET requests passing through cleanly (POST, PUT, DELETE, PATCH, OPTIONS, HEAD).
 * 3. Catalog product checkout bypassing base64/blob image upload (0ms upload latency).
 * 4. Custom uploaded design triggering proper remote upload pipeline and tracking progress.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const failureDetails = [];

function check(label, condition, extra = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  [PASS] ${label}`);
  } else {
    failedChecks++;
    const errMsg = `FAIL: ${label}${extra ? ' -> ' + extra : ''}`;
    failureDetails.push(errMsg);
    console.error(`  [FAIL] ${errMsg}`);
  }
}

console.log('======================================================================');
console.log(' CHALLENGER M4-R2-2: SW BOUNDARY & CHECKOUT LATENCY EMPIRICAL CHALLENGE');
console.log('======================================================================\n');

// -----------------------------------------------------------------------------
// Service Worker Test Sandbox Setup
// -----------------------------------------------------------------------------
function setupServiceWorkerEnvironment(customOrigin = 'https://posterlabstore.web.app') {
  const swCode = fs.readFileSync(path.join(ROOT_DIR, 'sw.js'), 'utf8');
  const listeners = {};
  const mockCacheStore = new Map();

  const mockCache = {
    match: async (req) => {
      const url = typeof req === 'string' ? req : req.url;
      return mockCacheStore.get(url) || null;
    },
    put: async (req, res) => {
      const url = typeof req === 'string' ? req : req.url;
      mockCacheStore.set(url, res);
    },
    delete: async (req) => {
      const url = typeof req === 'string' ? req : req.url;
      return mockCacheStore.delete(url);
    }
  };

  const mockCaches = {
    open: async () => mockCache,
    match: async (req) => mockCache.match(req),
    delete: async () => true,
    keys: async () => ['poster-lab-store-v40', 'poster-lab-images-v2']
  };

  const mockSelf = {
    location: {
      origin: customOrigin,
      href: `${customOrigin}/sw.js`
    },
    addEventListener: (type, fn) => {
      listeners[type] = listeners[type] || [];
      listeners[type].push(fn);
    },
    clients: {
      claim: async () => {}
    },
    skipWaiting: async () => {}
  };

  class MockResponse {
    constructor(body = '', init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.ok = this.status >= 200 && this.status < 300;
      this.headers = init.headers || {};
    }
    clone() {
      return new MockResponse(this.body, { status: this.status, headers: this.headers });
    }
  }

  const mockFetch = async () => new MockResponse('mock response content', { status: 200 });

  const sandbox = {
    self: mockSelf,
    caches: mockCaches,
    fetch: mockFetch,
    Response: MockResponse,
    Request: class MockRequest {
      constructor(input, init = {}) {
        this.url = typeof input === 'string' ? input : input.url;
        this.method = init.method || (typeof input === 'object' && input.method) || 'GET';
        this.headers = init.headers || {};
      }
    },
    URL: URL,
    console: { log: () => {}, warn: () => {}, error: () => {}, info: () => {} },
    Promise: Promise,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout
  };

  const script = new vm.Script(swCode, { filename: 'sw.js' });
  const context = vm.createContext(sandbox);
  script.runInContext(context);

  const fetchListener = listeners['fetch'] && listeners['fetch'][0];
  if (!fetchListener) throw new Error('Failed to register fetch listener in sw.js');

  return {
    fetchListener,
    origin: customOrigin,
    sandbox
  };
}

class MockFetchEvent {
  constructor(url, method = 'GET') {
    this.request = { url, method };
    this.respondedWith = false;
    this.responsePromise = null;
  }
  respondWith(promise) {
    this.respondedWith = true;
    this.responsePromise = promise;
  }
}

// -----------------------------------------------------------------------------
// Checkout Test Harness
// -----------------------------------------------------------------------------
function setupCheckoutHarness(simulateNetworkFailure = false) {
  const scriptContent = fs.readFileSync(path.join(ROOT_DIR, 'script.js'), 'utf8');

  let remoteUploadCalls = 0;
  const uploadedPayloads = [];
  const toastLog = [];
  const progressLog = [];
  const firestoreUpdates = [];
  let sendButtonLoading = false;
  let dispatchedWhatsAppUrl = '';

  const mockCatalog = {
    'football-001': {
      id: 'football-001',
      name: 'Cristiano Ronaldo - The G.O.A.T',
      nameAr: 'بوستر رونالدو',
      basePrice: 180,
      sizes: { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 },
      frames: ['Black', 'White', 'Transparent'],
      image: 'assets/products/football/football-001.webp',
      gallery: ['assets/products/football/football-001.webp']
    },
    'cars-001': {
      id: 'cars-001',
      name: 'Ferrari 288 GTO - Rosso Corsa',
      nameAr: 'بوستر فيراري',
      basePrice: 180,
      sizes: { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 },
      frames: ['Black', 'White', 'Transparent'],
      image: 'assets/products/cars/cars-001.webp'
    },
    'custom-item-1': {
      id: 'custom-item-1',
      name: 'Custom User Art',
      nameAr: 'تصميم مخصص',
      basePrice: 200,
      sizes: { '30x40': 200 },
      frames: ['Black'],
      image: 'assets/custom.webp'
    }
  };

  const mockState = {
    cart: [],
    lang: 'en',
    user: { email: 'customer@test.com' },
    appliedCoupon: null
  };

  const mockFormData = {
    customerName: 'Karim Hassan',
    customerPhone: '01099887766',
    customerAddress: '15 El Nozha St, Heliopolis',
    paymentMethod: 'Instapay',
    orderNote: 'Urgent delivery'
  };

  const mockUploadImage = async (blob, fileName) => {
    remoteUploadCalls++;
    if (simulateNetworkFailure) {
      throw new Error('503 Service Unavailable: Remote Upload Server Down');
    }
    const uploadedUrl = `https://tmpfiles.org/dl/123987/${fileName || 'user_design.png'}`;
    uploadedPayloads.push({ fileName, uploadedUrl });
    return uploadedUrl;
  };

  const sandbox = {
    state: mockState,
    confirmationSummary: {
      querySelector: (sel) => {
        if (sel === '.order-id-display') return null;
        if (sel === 'strong') return { insertAdjacentHTML: () => {} };
        return null;
      }
    },
    WHATSAPP_NUMBER: '201090927525',
    t: (key) => key,
    showToast: (msg) => toastLog.push(msg),
    readCheckoutForm: () => mockFormData,
    createOrder: (fd) => ({
      id: `ORD-TEST-${Date.now()}`,
      customerName: fd.customerName,
      customerPhone: fd.customerPhone,
      customerAddress: fd.customerAddress,
      paymentMethod: fd.paymentMethod,
      items: [...mockState.cart],
      total: 360,
      subtotal: 360,
      createdAt: new Date().toISOString()
    }),
    setSendButtonLoading: (loading) => { sendButtonLoading = loading; },
    setUploadProgress: (pct, visible) => progressLog.push({ pct, visible }),
    buildWhatsAppMessage: (order) => `Order #${order.id}\nCustomer: ${order.customerName}\nPhone: ${order.customerPhone}`,
    getProduct: (id) => mockCatalog[id] || null,
    getProductName: (p) => p.name,
    productImageUrl: (img) => `https://posterlabstore.web.app/${img}`,
    getUploadBlobForItem: async (item) => ({ size: 2048, type: 'image/png' }),
    uploadImageToTemporaryServer: mockUploadImage,
    updateOrderInFirestore: (id, data) => { firestoreUpdates.push({ id, data }); },
    saveSession: () => {},
    getUsers: () => [],
    saveUsers: () => {},
    resetCartAfterOrder: () => { mockState.cart = []; },
    updatePendingOrdersBadge: () => {},
    document: {
      querySelector: (sel) => {
        if (sel === '#confirmationSummary') return sandbox.confirmationSummary;
        return null;
      },
      createElement: (tag) => ({
        tagName: tag.toUpperCase(),
        href: '',
        target: '',
        rel: '',
        click: function() { dispatchedWhatsAppUrl = this.href; }
      }),
      body: { appendChild: () => {}, removeChild: () => {} },
      hidden: false
    },
    window: {
      location: { href: '' },
      requestAnimationFrame: (cb) => cb(),
      setTimeout: (cb) => { cb(); return 1; }
    },
    setTimeout: (cb, ms) => setTimeout(cb, ms),
    clearTimeout: (id) => clearTimeout(id),
    encodeURIComponent: encodeURIComponent,
    Promise: Promise,
    Date: Date,
    Math: Math,
    console: { log: () => {}, warn: () => {}, error: () => {}, info: () => {} }
  };

  const matchFn = scriptContent.match(/async\s+function\s+sendWhatsAppOrder\s*\(\)\s*\{[\s\S]*?\n\}/);
  if (!matchFn) throw new Error('Could not find sendWhatsAppOrder in script.js');

  const fnScript = new vm.Script(`
    ${matchFn[0]}
    this.sendWhatsAppOrder = sendWhatsAppOrder;
  `);

  const ctx = vm.createContext(sandbox);
  fnScript.runInContext(ctx);

  return {
    sendWhatsAppOrder: sandbox.sendWhatsAppOrder,
    state: mockState,
    getRemoteUploadCalls: () => remoteUploadCalls,
    getUploadedPayloads: () => uploadedPayloads,
    getToastLog: () => toastLog,
    getProgressLog: () => progressLog,
    getSendButtonLoading: () => sendButtonLoading,
    getDispatchedWhatsAppUrl: () => dispatchedWhatsAppUrl,
    getFirestoreUpdates: () => firestoreUpdates
  };
}

// -----------------------------------------------------------------------------
// EXECUTE STRESS SUITE
// -----------------------------------------------------------------------------
async function runEmpiricalStressSuite() {
  const sw = setupServiceWorkerEnvironment('https://posterlabstore.web.app');

  // ===========================================================================
  // TEST GROUP 1: External API Calls Bypassing Service Worker Cache
  // ===========================================================================
  console.log('--- TEST GROUP 1: External API Calls Bypassing SW Cache ---');

  // 1.1 Google Fonts
  const googleFontUrls = [
    'https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap',
    'https://fonts.googleapis.com/css?family=Open+Sans',
    'https://fonts.gstatic.com/s/cairo/v28/SLXVc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hNA-a-qU.woff2',
    'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
  ];
  for (const url of googleFontUrls) {
    const ev = new MockFetchEvent(url, 'GET');
    sw.fetchListener(ev);
    check(`Google Fonts request bypasses SW (${url.split('?')[0].slice(0, 45)}...)`, ev.respondedWith === false);
  }

  // 1.2 Firebase & Google Cloud APIs
  const firebaseUrls = [
    'https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel?VER=8&gsessionid=test',
    'https://firestore.googleapis.com/v1/projects/posterlabstore/databases/(default)/documents/products',
    'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyFakeKey',
    'https://securetoken.googleapis.com/v1/token?key=AIzaSyFakeKey',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js'
  ];
  for (const url of firebaseUrls) {
    const ev = new MockFetchEvent(url, 'GET');
    sw.fetchListener(ev);
    check(`Firebase request bypasses SW (${url.slice(0, 48)}...)`, ev.respondedWith === false);
  }

  // 1.3 Cloudinary Image & API Endpoints
  const cloudinaryUrls = [
    'https://api.cloudinary.com/v1_1/posterlab/image/upload',
    'https://api.cloudinary.com/v1_1/posterlab/resources/image',
    'https://res.cloudinary.com/posterlab/image/upload/v1634567890/poster-1.jpg',
    'https://res.cloudinary.com/posterlab/image/upload/w_500,c_scale/custom_print.png'
  ];
  for (const url of cloudinaryUrls) {
    const ev = new MockFetchEvent(url, 'GET');
    sw.fetchListener(ev);
    check(`Cloudinary request bypasses SW (${url.slice(0, 48)}...)`, ev.respondedWith === false);
  }

  // 1.4 Analytics, CDN, and Third-Party Trackers
  const analyticsUrls = [
    'https://www.google-analytics.com/g/collect?v=2&tid=G-TEST123',
    'https://region1.google-analytics.com/g/collect?v=2&tid=G-TEST123',
    'https://stats.g.doubleclick.net/r/collect',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    'https://tmpfiles.org/api/v1/upload'
  ];
  for (const url of analyticsUrls) {
    const ev = new MockFetchEvent(url, 'GET');
    sw.fetchListener(ev);
    check(`Analytics/CDN request bypasses SW (${url.slice(0, 48)}...)`, ev.respondedWith === false);
  }

  // 1.5 Hostile Cross-Origin Spoofing & Subdomain Bypasses
  const hostileUrls = [
    'https://posterlabstore.web.app.malicious.com/assets/logo.png',
    'https://attacker-posterlabstore.web.app/fake.js',
    'https://subdomain.posterlabstore.web.app/sw.js',
    'http://posterlabstore.web.app/index.html', // Scheme difference
    'https://posterlabstore.web.app:8443/styles.min.css' // Port difference
  ];
  for (const url of hostileUrls) {
    const ev = new MockFetchEvent(url, 'GET');
    sw.fetchListener(ev);
    check(`Hostile/different origin bypasses SW (${url.slice(0, 48)}...)`, ev.respondedWith === false);
  }


  // ===========================================================================
  // TEST GROUP 2: Non-GET HTTP Methods Passing Through Cleanly
  // ===========================================================================
  console.log('\n--- TEST GROUP 2: Non-GET HTTP Methods Passing Through Cleanly ---');

  const httpMethods = ['POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];

  // Test both same-origin and cross-origin for each method
  for (const method of httpMethods) {
    // Same-origin non-GET
    const sameOriginEv = new MockFetchEvent('https://posterlabstore.web.app/api/orders', method);
    sw.fetchListener(sameOriginEv);
    check(`Same-origin ${method} request passes through cleanly without SW interception`, sameOriginEv.respondedWith === false);

    // Cross-origin non-GET (e.g. Cloudinary / tmpfiles upload)
    const crossOriginEv = new MockFetchEvent('https://api.cloudinary.com/v1_1/demo/image/upload', method);
    sw.fetchListener(crossOriginEv);
    check(`Cross-origin ${method} request passes through cleanly without SW interception`, crossOriginEv.respondedWith === false);
  }


  // ===========================================================================
  // TEST GROUP 3: Catalog Product Checkout Latency (0ms Base64/Blob Upload)
  // ===========================================================================
  console.log('\n--- TEST GROUP 3: Catalog Product Checkout Latency Benchmark ---');

  const harnessCatalog = setupCheckoutHarness();
  harnessCatalog.state.cart = [
    { productId: 'football-001', size: '20x30', frame: 'Black', quantity: 1 },
    { productId: 'cars-001', size: '30x40', frame: 'White', quantity: 2 }
  ];

  const tStart = process.hrtime.bigint();
  await harnessCatalog.sendWhatsAppOrder();
  const tEnd = process.hrtime.bigint();
  const catalogLatencyMs = Number(tEnd - tStart) / 1e6;

  check('Catalog checkout performs ZERO remote uploads (0 calls)', harnessCatalog.getRemoteUploadCalls() === 0);
  check('Catalog checkout bypasses progress bar updates completely', harnessCatalog.getProgressLog().length === 0);
  check('Catalog checkout never emits "Uploading custom design..." toast', !harnessCatalog.getToastLog().some(t => t.includes('Uploading custom design')));
  check(`Catalog checkout latency is instantaneous (${catalogLatencyMs.toFixed(3)} ms < 10 ms)`, catalogLatencyMs < 10);
  check('Catalog checkout dispatches WhatsApp URL', harnessCatalog.getDispatchedWhatsAppUrl().includes('wa.me/201090927525'));
  
  const catalogMsg = decodeURIComponent(harnessCatalog.getDispatchedWhatsAppUrl());
  check('Catalog checkout message does NOT include custom upload download section', !catalogMsg.includes('Uploaded Design Download Links'));

  // Verify Firestore update records direct static asset URLs without remote re-upload
  const catalogUpdates = harnessCatalog.getFirestoreUpdates();
  check('Catalog checkout updates Firestore with imageUrls', catalogUpdates.length > 0 && Array.isArray(catalogUpdates[0].data.imageUrls));
  const recordedUrls = catalogUpdates[0]?.data?.imageUrls || [];
  check('Recorded catalog imageUrls contains direct asset link (football-001)', recordedUrls.includes('https://posterlabstore.web.app/assets/products/football/football-001.webp'));
  check('Recorded catalog imageUrls contains direct asset link (cars-001)', recordedUrls.includes('https://posterlabstore.web.app/assets/products/cars/cars-001.webp'));


  // ===========================================================================
  // TEST GROUP 4: Custom Uploaded Design Pipeline & Error Handling
  // ===========================================================================
  console.log('\n--- TEST GROUP 4: Custom Upload Design Pipeline & Error Handling ---');

  // 4.1 Pure custom order
  const harnessCustom = setupCheckoutHarness();
  harnessCustom.state.cart = [
    { productId: 'custom-item-1', size: '30x40', frame: 'Black', quantity: 1, upload: { name: 'my_special_art.png' } }
  ];

  await harnessCustom.sendWhatsAppOrder();
  check('Custom order invokes remote upload pipeline (1 upload)', harnessCustom.getRemoteUploadCalls() === 1);
  check('Custom order shows "Uploading custom design..." toast', harnessCustom.getToastLog().some(t => t.includes('Uploading custom design')));
  check('Custom order emits upload progress updates', harnessCustom.getProgressLog().length > 0);
  check('Custom order reaches 100% progress', harnessCustom.getProgressLog().some(p => p.pct === 100));
  check('Custom order displays "Upload successful!" toast', harnessCustom.getToastLog().some(t => t.includes('Upload successful!')));

  const customMsg = decodeURIComponent(harnessCustom.getDispatchedWhatsAppUrl());
  check('Custom order WhatsApp message includes "Uploaded Design Download Links"', customMsg.includes('Uploaded Design Download Links'));
  check('Custom order WhatsApp message includes remote temporary/cloud download URL', customMsg.includes('https://tmpfiles.org/dl/123987/my_special_art.png'));

  // 4.2 Mixed cart order (Catalog + Custom)
  const harnessMixed = setupCheckoutHarness();
  harnessMixed.state.cart = [
    { productId: 'football-001', size: '20x30', frame: 'Black', quantity: 1 }, // Catalog (zero upload)
    { productId: 'custom-item-1', size: '30x40', frame: 'White', quantity: 1, upload: { name: 'portrait_1.png' } }, // Custom (1 upload)
    { productId: 'cars-001', size: '40x50', frame: 'Transparent', quantity: 1 }, // Catalog (zero upload)
    { productId: 'custom-item-1', size: '50x70', frame: 'Black', quantity: 1, upload: { name: 'portrait_2.png' } } // Custom (1 upload)
  ];

  await harnessMixed.sendWhatsAppOrder();
  check('Mixed cart uploads ONLY the 2 custom designs (zero redundant catalog uploads)', harnessMixed.getRemoteUploadCalls() === 2);
  const mixedUpdates = harnessMixed.getFirestoreUpdates();
  const mixedImageUrls = mixedUpdates[0]?.data?.imageUrls || [];
  check('Mixed cart records catalog asset URL in Firestore', mixedImageUrls.includes('https://posterlabstore.web.app/assets/products/football/football-001.webp'));
  const mixedMsg = decodeURIComponent(harnessMixed.getDispatchedWhatsAppUrl());
  check('Mixed cart includes download link for portrait_1.png', mixedMsg.includes('portrait_1.png'));
  check('Mixed cart includes download link for portrait_2.png', mixedMsg.includes('portrait_2.png'));

  // 4.3 Network upload failure resilience
  const harnessError = setupCheckoutHarness(true); // Network failure simulated
  harnessError.state.cart = [
    { productId: 'custom-item-1', size: '30x40', frame: 'Black', quantity: 1, upload: { name: 'failed_art.png' } }
  ];

  await harnessError.sendWhatsAppOrder();
  check('Network failure displays "Error uploading custom design" toast', harnessError.getToastLog().some(t => t.includes('Error uploading custom design')));
  check('Network failure gracefully resets send button loading state back to false', harnessError.getSendButtonLoading() === false);


  // ===========================================================================
  // SUMMARY & VERDICT
  // ===========================================================================
  console.log('\n======================================================================');
  console.log(` EMPIRICAL CHALLENGE SUMMARY: ${passedChecks}/${totalChecks} PASSED (${failedChecks} FAILED)`);
  console.log('======================================================================');

  if (failedChecks === 0) {
    console.log('\nCHALLENGER M4-R2-2 VERDICT: APPROVE');
    process.exit(0);
  } else {
    console.log('\nCHALLENGER M4-R2-2 VERDICT: REJECT');
    process.exit(1);
  }
}

runEmpiricalStressSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

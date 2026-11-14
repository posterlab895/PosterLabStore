/**
 * tests/challenger_m4_sw_checkout_stress.js
 * 
 * Empirical Adversarial Challenger Test Suite
 * Milestone 4: Homepage, Navbar, Server Stabilization & Error/Artifact Cleanup
 * Challenger M4-2: SW Origin & Checkout Latency Challenger
 * 
 * Authoritative Inputs:
 * - ORIGINAL_REQUEST.md: Requirements R4 & R5
 * - PROJECT.md: Milestone 4, Features 17, 18, 19, 20
 * - Worker Handoff: .agents/teamwork/worker_m4/handoff.md
 * 
 * Challenge Vectors:
 * 1. Service Worker Origin Isolation Stress (Feature 17):
 *    - Simulate the service worker fetch event with 120+ varied URLs:
 *      * Cross-origin APIs: Firestore streaming/channels, Google Fonts, CDNs, gstatic.
 *      * Cross-origin streaming / long-poll connections.
 *      * Cross-origin phishing/subdomain origin variations & port mismatches.
 *      * Non-HTTP(S) protocols and non-GET HTTP methods.
 *      * Same-origin assets: /index.html, /styles.min.css, /script.min.js, /assets/..., /admin/...
 *    - Verify that all cross-origin requests immediately exit the event listener without calling event.respondWith().
 *    - Verify that same-origin requests are properly intercepted and routed to network-first or cache-first strategies.
 * 2. Server Caching Headers Validation (Feature 18):
 *    - Programmatically parse firebase.json.
 *    - Assert hosting.headers contains explicit rule matching source: "/sw.js".
 *    - Assert rule specifies Cache-Control: "no-cache, no-store, must-revalidate".
 *    - Assert rule is evaluated before any blanket static asset rules.
 * 3. WhatsApp Checkout Latency Benchmark (Feature 19):
 *    - Benchmark and evaluate sendWhatsAppOrder() in script.js and script.min.js:
 *      * Catalog-only order: uploadTotal === 0, 0 calls to tmpfiles.org, 0 ms upload latency, clean product image URLs.
 *      * Mixed order (catalog + custom upload): ONLY custom upload items are uploaded, zero redundant catalog uploads.
 *      * Custom-only order: all custom items uploaded.
 *      * Network error resilience during upload.
 * 4. Codebase Cleanup & Invariance Scan (Feature 20):
 *    - Verify 6 obsolete files are completely absent: scratchpad_phbf08cl.md, scratchpad_q2u9oq20.md,
 *      scratchpad_sl9ajhoy.md, _gen-three.mjs, gen-lists.js, album-artist-new.json.
 *    - AST and regex scan across all JS/CSS/HTML files for deleted unrequested functions
 *      (spawnConfetti, animateFlyToCart, initCardTiltEffects) verifying zero leftover orphaned calls.
 * 5. Production Minified Asset Parity:
 *    - Verify script.min.js and styles.min.css adhere to all Feature 17-20 requirements.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');

// -----------------------------------------------------------------------------
// Test Metrics & Reporting Tracker
// -----------------------------------------------------------------------------
let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;
const failureDetails = [];

function check(label, condition, extra = '') {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  [PASS] ${label}`);
  } else {
    failedAssertions++;
    const errMsg = `FAIL: ${label}${extra ? ' -> ' + extra : ''}`;
    failureDetails.push(errMsg);
    console.error(`  [FAIL] ${errMsg}`);
  }
}

console.log('======================================================================');
console.log(' CHALLENGER M4-2: SW ORIGIN ISOLATION & CHECKOUT LATENCY EMPIRICAL STRESS');
console.log('======================================================================\n');

// -----------------------------------------------------------------------------
// Helper: Service Worker Mock Environment
// -----------------------------------------------------------------------------
function setupServiceWorkerEnvironment() {
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
    open: async (name) => mockCache,
    match: async (req) => mockCache.match(req),
    delete: async (name) => true,
    keys: async () => ['posterlab-cache-v1', 'posterlab-images-v1']
  };

  const defaultOrigin = 'https://posterlabstore.web.app';

  const mockSelf = {
    location: {
      origin: defaultOrigin,
      href: `${defaultOrigin}/sw.js`
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

  const mockFetch = async (req) => {
    return new MockResponse('mock response content', { status: 200 });
  };

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
    console: {
      log: () => {},
      warn: () => {},
      error: () => {},
      info: () => {}
    },
    Promise: Promise,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout
  };

  const script = new vm.Script(swCode, { filename: 'sw.js' });
  const context = vm.createContext(sandbox);
  script.runInContext(context);

  const fetchListener = listeners['fetch'] && listeners['fetch'][0];
  if (!fetchListener) {
    throw new Error('Failed to register fetch listener in sw.js');
  }

  return {
    fetchListener,
    defaultOrigin,
    sandbox
  };
}

class MockFetchEvent {
  constructor(url, method = 'GET') {
    this.request = {
      url: url,
      method: method
    };
    this.respondedWith = false;
    this.responsePromise = null;
  }
  respondWith(promise) {
    this.respondedWith = true;
    this.responsePromise = promise;
  }
}

// -----------------------------------------------------------------------------
// Helper: Checkout Test Harness
// -----------------------------------------------------------------------------
function createCheckoutTestHarness(shouldFailUpload = false) {
  const scriptContent = fs.readFileSync(path.join(ROOT_DIR, 'script.js'), 'utf8');

  let remoteUploadCalls = 0;
  const uploadedUrls = [];
  const toastHistory = [];
  const progressHistory = [];
  let sendButtonLoadingState = false;
  let clickedUrl = '';

  const mockProductCatalog = {
    'football-001': {
      id: 'football-001',
      name: 'Messi World Cup Poster',
      nameAr: 'بوستر ميسي كأس العالم',
      category: 'football',
      basePrice: 180,
      sizes: { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 },
      frames: ['Black', 'White', 'Transparent'],
      image: 'assets/products/football/football-001.webp',
      gallery: ['assets/products/football/football-001.webp', 'assets/products/football/football-001-alt.webp']
    },
    'cars-001': {
      id: 'cars-001',
      name: 'Porsche 911 GT3 Poster',
      nameAr: 'بوستر بورش 911',
      category: 'cars',
      basePrice: 180,
      sizes: { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 },
      frames: ['Black', 'White', 'Transparent'],
      image: 'assets/products/cars/cars-001.webp'
    },
    'movies-001': {
      id: 'movies-001',
      name: 'Interstellar Movie Poster',
      nameAr: 'بوستر فيلم انترستيلر',
      category: 'movies',
      basePrice: 180,
      sizes: { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 },
      frames: ['Black', 'White', 'Transparent'],
      image: 'assets/products/movies/movies-001.webp'
    },
    'custom-001': {
      id: 'custom-001',
      name: 'Custom User Poster',
      nameAr: 'بوستر مخصص',
      category: 'custom',
      basePrice: 200,
      sizes: { '30x40': 200 },
      frames: ['White'],
      image: 'assets/custom.webp'
    },
    'custom-002': {
      id: 'custom-002',
      name: 'Custom User Poster 2',
      nameAr: 'بوستر مخصص 2',
      category: 'custom',
      basePrice: 300,
      sizes: { '50x70': 300 },
      frames: ['Transparent'],
      image: 'assets/custom.webp'
    }
  };

  const mockConfirmationSummary = {
    querySelector: (sel) => {
      if (sel === '.order-id-display') return null;
      if (sel === 'strong') return { insertAdjacentHTML: () => {} };
      return null;
    }
  };

  const mockFormData = {
    customerName: 'Ahmad Mohsen',
    customerPhone: '01012345678',
    customerAddress: '5 Abbas El Akkad, Nasr City, Cairo',
    paymentMethod: 'Vodafone Cash',
    notes: 'Please pack carefully'
  };

  const mockState = {
    cart: [],
    lang: 'en',
    user: { email: 'ahmad@example.com', deliveryAddress: '' },
    search: '',
    detailFrame: 'Black',
    detailSize: '20x30'
  };

  const mockUploadImageToTemporaryServer = async (blob, filename) => {
    remoteUploadCalls++;
    if (shouldFailUpload) {
      throw new Error('500 Internal Server Error (Simulated Network Outage)');
    }
    const fakeRemoteUrl = `https://tmpfiles.org/dl/998877/${filename || 'custom_upload.jpg'}`;
    uploadedUrls.push(fakeRemoteUrl);
    return fakeRemoteUrl;
  };

  const mockShowToast = (msg) => {
    toastHistory.push(msg);
  };

  const mockSetUploadProgress = (pct, visible) => {
    progressHistory.push({ pct, visible });
  };

  const mockSetSendButtonLoading = (loading) => {
    sendButtonLoadingState = loading;
  };

  const mockReadCheckoutForm = () => mockFormData;

  const mockCreateOrder = (formData) => ({
    id: `ORD-${Date.now()}`,
    customerName: formData.customerName,
    customerPhone: formData.customerPhone,
    customerAddress: formData.customerAddress,
    paymentMethod: formData.paymentMethod,
    items: [...mockState.cart],
    total: 360,
    subtotal: 360,
    shipping: 0,
    createdAt: new Date().toISOString()
  });

  const mockBuildWhatsAppMessage = (order) => {
    return `*Poster Lab Store - Order #${order.id}*\nCustomer: ${order.customerName}\nPhone: ${order.customerPhone}`;
  };

  const mockGetProduct = (id) => mockProductCatalog[id] || null;
  const mockGetProductName = (prod) => prod.name;
  const mockProductImageUrl = (img) => `https://posterlabstore.web.app/${img}`;
  const mockGetUploadBlobForItem = async (item) => ({ size: 1024, type: 'image/jpeg' });
  const mockUpdateOrderInFirestore = (id, data) => {};
  const mockSaveSession = (user) => {};
  const mockGetUsers = () => [];
  const mockSaveUsers = (users) => {};
  const mockResetCartAfterOrder = () => { mockState.cart = []; };
  const mockUpdatePendingOrdersBadge = () => {};

  const mockDocument = {
    querySelector: (sel) => {
      if (sel === '#confirmationSummary') return mockConfirmationSummary;
      return null;
    },
    createElement: (tag) => {
      return {
        tagName: tag.toUpperCase(),
        href: '',
        target: '',
        rel: '',
        click: function() { clickedUrl = this.href; }
      };
    },
    body: {
      appendChild: () => {},
      removeChild: () => {}
    },
    hidden: false
  };

  const mockWindow = {
    location: { href: '' },
    requestAnimationFrame: (cb) => cb(),
    setTimeout: (cb) => { cb(); return 1; }
  };

  const sandbox = {
    state: mockState,
    confirmationSummary: mockConfirmationSummary,
    WHATSAPP_NUMBER: '201000000000',
    t: (key) => key,
    showToast: mockShowToast,
    readCheckoutForm: mockReadCheckoutForm,
    createOrder: mockCreateOrder,
    setSendButtonLoading: mockSetSendButtonLoading,
    setUploadProgress: mockSetUploadProgress,
    buildWhatsAppMessage: mockBuildWhatsAppMessage,
    getProduct: mockGetProduct,
    getProductName: mockGetProductName,
    productImageUrl: mockProductImageUrl,
    getUploadBlobForItem: mockGetUploadBlobForItem,
    uploadImageToTemporaryServer: mockUploadImageToTemporaryServer,
    updateOrderInFirestore: mockUpdateOrderInFirestore,
    saveSession: mockSaveSession,
    getUsers: mockGetUsers,
    saveUsers: mockSaveUsers,
    resetCartAfterOrder: mockResetCartAfterOrder,
    updatePendingOrdersBadge: mockUpdatePendingOrdersBadge,
    document: mockDocument,
    window: mockWindow,
    setTimeout: (cb, ms) => setTimeout(cb, ms),
    clearTimeout: (id) => clearTimeout(id),
    encodeURIComponent: encodeURIComponent,
    Promise: Promise,
    Date: Date,
    Math: Math,
    console: {
      log: () => {},
      warn: () => {},
      error: () => {},
      info: () => {}
    }
  };

  const matchFn = scriptContent.match(/async\s+function\s+sendWhatsAppOrder\s*\(\)\s*\{[\s\S]*?\n\}/);
  if (!matchFn) {
    throw new Error('Could not find sendWhatsAppOrder in script.js');
  }

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
    getToastHistory: () => toastHistory,
    getProgressHistory: () => progressHistory,
    getClickedUrl: () => clickedUrl,
    getSendButtonLoadingState: () => sendButtonLoadingState,
    resetSpies: () => {
      remoteUploadCalls = 0;
      uploadedUrls.length = 0;
      toastHistory.length = 0;
      progressHistory.length = 0;
      clickedUrl = '';
    }
  };
}

// -----------------------------------------------------------------------------
// MAIN TEST SUITE RUNNER
// -----------------------------------------------------------------------------
async function runAllStressTests() {
  // ===========================================================================
  // VECTOR 1: Service Worker Origin Isolation Stress (Feature 17)
  // ===========================================================================
  console.log('--- VECTOR 1: Service Worker Origin Isolation & Fetch Routing Stress ---');

  const swEnv = setupServiceWorkerEnvironment();
  check('1.0 sw.js fetch listener successfully registered', typeof swEnv.fetchListener === 'function');

  // 1.1 Generate 124 cross-origin test cases across varied protocols, domains, streaming endpoints, and query variants
  const crossOriginUrls = [
    // Firestore realtime listening / streaming channels
    'https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel?gsessionid=aBcDeF123&VER=8&RID=rpc&AID=456&t=1',
    'https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel?gsessionid=testSession&VER=8&RID=4481&AID=0&t=2',
    'https://firestore.googleapis.com/google.firestore.v1.Firestore/Write/channel?gsessionid=xyz&VER=8',
    'https://firestore.googleapis.com/v1/projects/posterlabstore/databases/(default)/documents/products',
    'https://firestore.googleapis.com/v1/projects/posterlabstore/databases/(default)/documents/orders?pageSize=10',
    'https://firestore.googleapis.com/v1/projects/posterlabstore/databases/(default)/documents/products/football-001',
    'https://firestore.googleapis.com/v1/projects/posterlabstore/databases/(default)/documents:commit',
    'https://firestore.googleapis.com/v1/projects/posterlabstore/databases/(default)/documents:batchGet',

    // Google Fonts APIs & Font assets
    'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://fonts.gstatic.com/s/cairo/v28/SLXVc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hNA-a-qU.woff2',
    'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2',
    'https://fonts.gstatic.com/s/cairo/v28/SLXVc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hNA-a-qU.woff',
    'https://fonts.gstatic.com/s/cairo/v28/SLXVc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hNA-a-qU.ttf',

    // CDNs and third-party scripts
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/fonts/bootstrap-icons.woff2?8d200481aa7f02a2d81e6a85e3694aa0',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/fonts/bootstrap-icons.woff?8d200481aa7f02a2d81e6a85e3694aa0',
    'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js',
    'https://unpkg.com/lucide@latest/dist/umd/lucide.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    'https://code.jquery.com/jquery-3.7.1.min.js',

    // Google Static / Firebase SDKs
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js',
    'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',

    // Checkout and messaging services
    'https://tmpfiles.org/api/v1/upload',
    'https://tmpfiles.org/dl/123456/custom_design.png',
    'https://api.whatsapp.com/send?phone=201000000000&text=hello',
    'https://wa.me/201000000000?text=order',
    'https://web.whatsapp.com/send?phone=201000000000',

    // Analytics, ads, and telemetry
    'https://www.google-analytics.com/g/collect?v=2&tid=G-12345',
    'https://region1.google-analytics.com/g/collect?v=2',
    'https://stats.g.doubleclick.net/r/collect',

    // Origin confusion / spoofing / hostile domains
    'https://posterlabstore.web.app.attacker.com/sw.js',
    'https://attacker-posterlabstore.web.app/fake.html',
    'https://posterlabstore.web.app.malicious-phishing.org/index.html',
    'https://subdomain.posterlabstore.web.app/api/data',
    'https://admin.posterlabstore.web.app/dashboard',
    'https://otherorigin.com/posterlabstore.web.app/index.html',
    'https://evil.com/sw.js',
    'https://example.org/asset.jpg',
    'https://localhost:8443/api',

    // Protocol & Port variations of the exact same hostname
    'http://posterlabstore.web.app/assets/logo.png', // HTTP vs HTTPS (different origin!)
    'http://posterlabstore.web.app/',
    'https://posterlabstore.web.app:8080/assets/logo.png', // Different port (different origin!)
    'https://posterlabstore.web.app:8443/sw.js',
    'https://posterlabstore.web.app:4430/index.html'
  ];

  for (let i = 1; i <= 75; i++) {
    const host = (i % 3 === 0) ? 'firestore.googleapis.com' :
                 (i % 3 === 1) ? 'fonts.gstatic.com' : 'cdn.jsdelivr.net';
    crossOriginUrls.push(`https://${host}/resource/path_${i}.json?token=tok_${i}&ts=${Date.now()}#hash_${i}`);
  }

  check(`1.1 Generated ${crossOriginUrls.length} cross-origin test cases (>= 100 required)`, crossOriginUrls.length >= 100);

  let crossOriginBypassFailures = 0;
  let crossOriginExceptions = 0;

  for (const url of crossOriginUrls) {
    const event = new MockFetchEvent(url, 'GET');
    try {
      swEnv.fetchListener(event);
      if (event.respondedWith) {
        crossOriginBypassFailures++;
        console.error(`    [LEAK] Cross-origin URL called respondWith: ${url}`);
      }
    } catch (err) {
      crossOriginExceptions++;
      console.error(`    [EXCEPTION] Exception on URL ${url}: ${err.message}`);
    }
  }

  check('1.2.1 100% of cross-origin requests bypass sw.js without calling event.respondWith()', crossOriginBypassFailures === 0, `Failures: ${crossOriginBypassFailures}`);
  check('1.2.2 Zero unhandled exceptions during cross-origin fetch simulation', crossOriginExceptions === 0, `Exceptions: ${crossOriginExceptions}`);

  // 1.3 Non-GET HTTP Methods must immediately bypass
  const nonGetMethods = ['POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
  let nonGetBypassFailures = 0;
  for (const method of nonGetMethods) {
    const sameOriginUrl = `${swEnv.defaultOrigin}/api/resource`;
    const event = new MockFetchEvent(sameOriginUrl, method);
    swEnv.fetchListener(event);
    if (event.respondedWith) {
      nonGetBypassFailures++;
    }
  }
  check('1.3 All non-GET HTTP methods (POST, PUT, DELETE, PATCH, OPTIONS, HEAD) bypass sw.js', nonGetBypassFailures === 0);

  // 1.4 Non-HTTP(S) Protocols must immediately bypass
  const nonHttpUrls = [
    'chrome-extension://abcdefghijklmnop/main.js',
    'moz-extension://12345678-1234-1234-1234-123456789abc/page.html',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'blob:https://posterlabstore.web.app/d9f1090c-6029-4d69-b5a8-48b598b0f340',
    'about:blank',
    'javascript:alert(1)',
    'file:///C:/Users/test/index.html'
  ];
  let nonHttpFailures = 0;
  for (const url of nonHttpUrls) {
    const event = new MockFetchEvent(url, 'GET');
    try {
      swEnv.fetchListener(event);
      if (event.respondedWith) {
        nonHttpFailures++;
      }
    } catch (err) {
      nonHttpFailures++;
    }
  }
  check('1.4 Non-HTTP(S) protocols (chrome-extension, data, blob, file, javascript) bypass sw.js', nonHttpFailures === 0);

  // 1.5 Malformed URLs stress test (sw.js try/catch URL constructor)
  const malformedUrls = [
    'http://[::1',
    'https://',
    'http//invalid-url',
    'not_a_valid_url',
    '://missing-protocol'
  ];
  let malformedExceptions = 0;
  for (const url of malformedUrls) {
    const event = new MockFetchEvent(url, 'GET');
    try {
      swEnv.fetchListener(event);
      if (event.respondedWith) {
        malformedExceptions++;
      }
    } catch (err) {
      malformedExceptions++;
    }
  }
  check('1.5 Malformed URLs gracefully exit without throwing uncaught exceptions or calling respondWith', malformedExceptions === 0);

  // 1.6 Same-Origin Requests: Interception & Routing Integrity
  const adminUrls = [
    `${swEnv.defaultOrigin}/admin/panel.html`,
    `${swEnv.defaultOrigin}/admin/login.html`,
    `${swEnv.defaultOrigin}/firebase-config.js`,
    `${swEnv.defaultOrigin}/admin-access.js`
  ];

  let adminIntercepted = 0;
  for (const url of adminUrls) {
    const event = new MockFetchEvent(url, 'GET');
    swEnv.fetchListener(event);
    if (event.respondedWith && event.responsePromise) {
      adminIntercepted++;
    }
  }
  check('1.6.1 Admin and sensitive configs (/admin/, firebase-config.js, admin-access.js) are intercepted for network-first handling', adminIntercepted === adminUrls.length);

  const localImageUrls = [
    `${swEnv.defaultOrigin}/assets/products/football/football-001.webp`,
    `${swEnv.defaultOrigin}/assets/products/cars/car-002.webp`,
    `${swEnv.defaultOrigin}/assets/logo.png`,
    `${swEnv.defaultOrigin}/assets/icons/cart.svg`
  ];

  let imagesIntercepted = 0;
  for (const url of localImageUrls) {
    const event = new MockFetchEvent(url, 'GET');
    swEnv.fetchListener(event);
    if (event.respondedWith && event.responsePromise) {
      imagesIntercepted++;
    }
  }
  check('1.6.2 Local image assets (/assets/...) are intercepted for cache-first handling', imagesIntercepted === localImageUrls.length);

  const storefrontUrls = [
    `${swEnv.defaultOrigin}/index.html`,
    `${swEnv.defaultOrigin}/product.html`,
    `${swEnv.defaultOrigin}/our-work.html`,
    `${swEnv.defaultOrigin}/faq.html`,
    `${swEnv.defaultOrigin}/script.min.js`,
    `${swEnv.defaultOrigin}/styles.min.css`,
    `${swEnv.defaultOrigin}/products-bundle.min.js`
  ];

  let storefrontIntercepted = 0;
  for (const url of storefrontUrls) {
    const event = new MockFetchEvent(url, 'GET');
    swEnv.fetchListener(event);
    if (event.respondedWith && event.responsePromise) {
      storefrontIntercepted++;
    }
  }
  check('1.6.3 Core storefront pages and bundles are intercepted for offline resilience', storefrontIntercepted === storefrontUrls.length);

  // 1.7 Dynamic Origin Portability Stress
  function testDynamicOrigin(customOrigin) {
    const swCode = fs.readFileSync(path.join(ROOT_DIR, 'sw.js'), 'utf8');
    const listeners = {};
    const mockSelf = {
      location: { origin: customOrigin, href: `${customOrigin}/sw.js` },
      addEventListener: (type, fn) => { listeners[type] = listeners[type] || []; listeners[type].push(fn); },
      clients: { claim: async () => {} }
    };
    const sandbox = {
      self: mockSelf,
      caches: { match: async () => null, open: async () => ({ match: async () => null, put: async () => {} }) },
      fetch: async () => new MockResponse('ok'),
      Response: class MockResponse { constructor() { this.ok = true; } },
      URL: URL,
      Promise: Promise
    };
    vm.runInNewContext(swCode, sandbox);
    const fn = listeners['fetch'][0];

    const evSame = new MockFetchEvent(`${customOrigin}/index.html`, 'GET');
    fn(evSame);

    const evExternal = new MockFetchEvent('https://posterlabstore.web.app/index.html', 'GET');
    fn(evExternal);

    return evSame.respondedWith === true && evExternal.respondedWith === false;
  }

  check('1.7 sw.js dynamically binds to self.location.origin (e.g. localhost:5000 / custom domains)', testDynamicOrigin('http://localhost:5000'));


  // ===========================================================================
  // VECTOR 2: Server Caching Headers Validation (Feature 18)
  // ===========================================================================
  console.log('\n--- VECTOR 2: Server Caching Headers Validation (Feature 18) ---');

  const firebaseJsonPath = path.join(ROOT_DIR, 'firebase.json');
  check('2.0 firebase.json file exists on disk', fs.existsSync(firebaseJsonPath));

  let fbConfig = null;
  let fbParseSuccess = true;
  try {
    fbConfig = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));
  } catch (err) {
    fbParseSuccess = false;
  }
  check('2.1 firebase.json is valid, parseable JSON', fbParseSuccess && fbConfig !== null);

  const hosting = fbConfig && fbConfig.hosting;
  check('2.2 firebase.json contains hosting configuration block', hosting && typeof hosting === 'object');

  const headers = hosting && Array.isArray(hosting.headers) ? hosting.headers : [];
  check('2.3 hosting configuration contains headers array', headers.length > 0);

  const swRuleIndex = headers.findIndex(h => h.source === '/sw.js');
  check('2.4 hosting.headers contains explicit rule matching source: "/sw.js"', swRuleIndex !== -1, `Found index: ${swRuleIndex}`);

  const swRule = swRuleIndex !== -1 ? headers[swRuleIndex] : null;
  const swHeaders = swRule && Array.isArray(swRule.headers) ? swRule.headers : [];

  const cacheControlHeader = swHeaders.find(h => (h.key || '').toLowerCase() === 'cache-control');
  check('2.5 /sw.js rule specifies Cache-Control header', !!cacheControlHeader);

  const cacheControlVal = cacheControlHeader ? cacheControlHeader.value : '';
  check('2.6.1 Cache-Control includes no-cache', cacheControlVal.includes('no-cache'), `Actual: "${cacheControlVal}"`);
  check('2.6.2 Cache-Control includes no-store', cacheControlVal.includes('no-store'), `Actual: "${cacheControlVal}"`);
  check('2.6.3 Cache-Control includes must-revalidate', cacheControlVal.includes('must-revalidate'), `Actual: "${cacheControlVal}"`);
  check('2.6.4 Cache-Control exact value equals "no-cache, no-store, must-revalidate"', cacheControlVal.trim() === 'no-cache, no-store, must-revalidate');

  const blanketJsCssIndex = headers.findIndex(h => h.source === '**/*.@(js|css)' || h.source === '**/*.js');
  check('2.7.1 Blanket JS/CSS rule (**/*.@(js|css)) exists in headers', blanketJsCssIndex !== -1);
  check('2.7.2 /sw.js rule is evaluated before blanket static asset rule (**/*.@(js|css))', swRuleIndex < blanketJsCssIndex, `swIndex: ${swRuleIndex}, blanketIndex: ${blanketJsCssIndex}`);

  const imgRuleIndex = headers.findIndex(h => h.source && (h.source.includes('webp') || h.source.includes('png')));
  check('2.7.3 Static image caching rule exists in headers', imgRuleIndex !== -1);

  const ignoreList = hosting && Array.isArray(hosting.ignore) ? hosting.ignore : [];
  const swIgnored = ignoreList.some(ig => ig === 'sw.js' || ig === '/sw.js' || ig === '**/sw.js');
  check('2.8 sw.js is NOT ignored in hosting.ignore (must be deployable)', !swIgnored);


  // ===========================================================================
  // VECTOR 3: WhatsApp Checkout Latency Benchmark (Feature 19)
  // ===========================================================================
  console.log('\n--- VECTOR 3: WhatsApp Checkout Latency Benchmark (Feature 19) ---');

  // 3.1 Benchmark Pure Catalog Order Checkout (0 custom uploads)
  const harness1 = createCheckoutTestHarness();
  harness1.state.cart = [
    { productId: 'football-001', size: '20x30', frame: 'Black', quantity: 2 },
    { productId: 'cars-001', size: '30x40', frame: 'White', quantity: 1 },
    { productId: 'movies-001', size: '50x70', frame: 'Transparent', quantity: 1 }
  ];

  const t0 = process.hrtime.bigint();
  await harness1.sendWhatsAppOrder();
  const t1 = process.hrtime.bigint();
  const durationMs = Number(t1 - t0) / 1e6;

  check('3.1.1 Pure catalog order initiates ZERO remote uploads to tmpfiles.org', harness1.getRemoteUploadCalls() === 0, `Calls: ${harness1.getRemoteUploadCalls()}`);
  check('3.1.2 Pure catalog order bypasses upload progress bars completely', harness1.getProgressHistory().length === 0, `Progress events: ${harness1.getProgressHistory().length}`);
  check('3.1.3 Pure catalog order never displays "Uploading custom design..." toast', !harness1.getToastHistory().some(t => t.includes('Uploading custom design') || t.includes('جاري رفع التصميم')));
  check('3.1.4 WhatsApp redirect URL is generated and contains target phone number', harness1.getClickedUrl().includes('wa.me/201000000000'));
  check(`3.1.5 Pure catalog order checkout latency is instantaneous (${durationMs.toFixed(3)} ms < 15 ms)`, durationMs < 15);

  const pureCatalogMsg = decodeURIComponent(harness1.getClickedUrl());
  check('3.1.6 Pure catalog order message excludes custom upload download link section', !pureCatalogMsg.includes('Uploaded Design Download Links') && !pureCatalogMsg.includes('روابط تنزيل التصاميم المرفوعة'));

  // 3.2 Benchmark Mixed Order Checkout (Catalog + Custom Upload)
  const harness2 = createCheckoutTestHarness();
  harness2.state.cart = [
    { productId: 'football-001', size: '20x30', frame: 'Black', quantity: 1 }, // Catalog
    { productId: 'custom-001', size: '30x40', frame: 'White', quantity: 1, upload: { name: 'wedding_photo.jpg' } }, // Custom Upload
    { productId: 'cars-001', size: '40x50', frame: 'Black', quantity: 1 }, // Catalog
    { productId: 'custom-002', size: '50x70', frame: 'Transparent', quantity: 1, upload: { name: 'family_portrait.png' } } // Custom Upload
  ];

  await harness2.sendWhatsAppOrder();

  check('3.2.1 Mixed order uploads ONLY the 2 custom user files (zero redundant catalog uploads)', harness2.getRemoteUploadCalls() === 2, `Actual calls: ${harness2.getRemoteUploadCalls()}`);
  check('3.2.2 Mixed order shows progress updates for custom items', harness2.getProgressHistory().length > 0);
  check('3.2.3 Mixed order shows upload start toast for custom design', harness2.getToastHistory().some(t => t.includes('Uploading custom design') || t.includes('جاري رفع التصميم')));
  check('3.2.4 Mixed order shows "Upload successful!" on completion', harness2.getToastHistory().some(t => t.includes('Upload successful!') || t.includes('تم الرفع بنجاح!')));

  const mixedMsg = decodeURIComponent(harness2.getClickedUrl());
  check('3.2.5 WhatsApp message contains "Uploaded Design Download Links" section for custom items', mixedMsg.includes('Uploaded Design Download Links') || mixedMsg.includes('روابط تنزيل التصاميم المرفوعة'));
  check('3.2.6 WhatsApp message links custom upload remote URL', mixedMsg.includes('https://tmpfiles.org/dl/998877/'));

  // 3.3 Benchmark Pure Custom Upload Order (3 custom uploads)
  const harness3 = createCheckoutTestHarness();
  harness3.state.cart = [
    { productId: 'custom-001', size: '30x40', frame: 'White', quantity: 1, upload: { name: 'art_1.jpg' } },
    { productId: 'custom-002', size: '50x70', frame: 'Transparent', quantity: 1, upload: { name: 'art_2.png' } },
    { productId: 'custom-001', size: '20x30', frame: 'Black', quantity: 1, upload: { name: 'art_3.webp' } }
  ];

  await harness3.sendWhatsAppOrder();
  check('3.3.1 Pure custom upload order uploads all 3 user designs', harness3.getRemoteUploadCalls() === 3, `Actual calls: ${harness3.getRemoteUploadCalls()}`);
  check('3.3.2 Progress bar reaches 100% on completion', harness3.getProgressHistory().some(p => p.pct === 100));

  // 3.4 Empty Cart Corner Case
  const harness4 = createCheckoutTestHarness();
  harness4.state.cart = [];
  await harness4.sendWhatsAppOrder();

  check('3.4.1 Empty cart immediately aborts checkout with toast notification', harness4.getToastHistory().some(t => t === 'confAddFirstAlert'));
  check('3.4.2 Empty cart triggers zero remote upload calls', harness4.getRemoteUploadCalls() === 0);
  check('3.4.3 Empty cart does not dispatch WhatsApp redirection', harness4.getClickedUrl() === '');

  // 3.5 Remote Upload Server Error Resilience
  const harnessError = createCheckoutTestHarness(true); // Fails upload
  harnessError.state.cart = [
    { productId: 'custom-001', size: '30x40', frame: 'White', quantity: 1, upload: { name: 'error_art.jpg' } }
  ];
  await harnessError.sendWhatsAppOrder();

  check('3.5.1 Network error during custom upload displays error toast', harnessError.getToastHistory().some(t => t.includes('Error uploading custom design') || t.includes('حدث خطأ أثناء رفع التصميم')));
  check('3.5.2 Network error resets send button loading state back to false', harnessError.getSendButtonLoadingState() === false);


  // ===========================================================================
  // VECTOR 4: Codebase Cleanup & Invariance Scan (Feature 20)
  // ===========================================================================
  console.log('\n--- VECTOR 4: Codebase Cleanup & Invariance Scan (Feature 20) ---');

  // 4.1 Verify complete absence of 6 obsolete files
  const obsoleteFiles = [
    'scratchpad_phbf08cl.md',
    'scratchpad_q2u9oq20.md',
    'scratchpad_sl9ajhoy.md',
    '_gen-three.mjs',
    'gen-lists.js',
    'album-artist-new.json'
  ];

  for (const file of obsoleteFiles) {
    const fullPath = path.join(ROOT_DIR, file);
    const exists = fs.existsSync(fullPath);
    check(`4.1 Obsolete file "${file}" is permanently absent from repository root`, !exists, exists ? `Found at: ${fullPath}` : '');
  }

  // 4.2 AST Syntax Validation across ALL JS files in repository
  function getAllFiles(dir, exts, excludeDirs = ['.git', '.agents', 'node_modules']) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const item of list) {
      if (excludeDirs.includes(item)) continue;
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        results = results.concat(getAllFiles(full, exts, excludeDirs));
      } else {
        const ext = path.extname(item).toLowerCase();
        if (exts.includes(ext)) {
          results.push(full);
        }
      }
    }
    return results;
  }

  const jsFiles = getAllFiles(ROOT_DIR, ['.js', '.mjs']);
  check(`4.2.0 Discovered ${jsFiles.length} JavaScript files for AST syntax validation`, jsFiles.length > 20);

  let astSyntaxErrors = 0;
  for (const f of jsFiles) {
    const relPath = path.relative(ROOT_DIR, f);
    const code = fs.readFileSync(f, 'utf8');
    try {
      new vm.Script(code, { filename: relPath });
    } catch (err) {
      astSyntaxErrors++;
      console.error(`    [SYNTAX ERROR] in ${relPath}: ${err.message}`);
    }
  }
  check('4.2.1 100% of repository JavaScript files parse cleanly with ZERO syntax errors', astSyntaxErrors === 0, `Syntax errors: ${astSyntaxErrors}`);

  // 4.3 Orphaned Function Scan (spawnConfetti, animateFlyToCart, initCardTiltEffects)
  const forbiddenTokens = ['spawnConfetti', 'animateFlyToCart', 'initCardTiltEffects'];
  const allSourceFiles = getAllFiles(ROOT_DIR, ['.js', '.mjs', '.css', '.html']);

  let orphanedReferences = 0;
  const orphanDetails = [];

  for (const f of allSourceFiles) {
    // Exclude test suite assertions referencing the tokens
    const relPath = path.relative(ROOT_DIR, f);
    if (relPath.startsWith('tests' + path.sep)) continue;

    const content = fs.readFileSync(f, 'utf8');
    for (const token of forbiddenTokens) {
      if (content.includes(token)) {
        orphanedReferences++;
        orphanDetails.push(`${relPath}: references forbidden token "${token}"`);
      }
    }
  }

  if (orphanDetails.length > 0) {
    orphanDetails.forEach(d => console.error(`    [ORPHAN] ${d}`));
  }

  check('4.3 Zero orphaned references to deleted functions (spawnConfetti, animateFlyToCart, initCardTiltEffects) in production code', orphanedReferences === 0, `Found: ${orphanedReferences}`);

  // 4.4 Pruned CSS Animation Rules Scan
  const cssContent = fs.readFileSync(path.join(ROOT_DIR, 'styles.css'), 'utf8');
  const minCssContent = fs.readFileSync(path.join(ROOT_DIR, 'styles.min.css'), 'utf8');

  check('4.4.1 styles.css has removed .card-glare effect rule', !cssContent.includes('.card-glare'));
  check('4.4.2 styles.css has removed .fly-to-cart-clone rule', !cssContent.includes('.fly-to-cart-clone'));
  check('4.4.3 styles.css has removed .confetti-container rule', !cssContent.includes('.confetti-container'));
  check('4.4.4 styles.min.css has removed .card-glare effect rule', !minCssContent.includes('.card-glare'));
  check('4.4.5 styles.min.css has removed .fly-to-cart-clone rule', !minCssContent.includes('.fly-to-cart-clone'));
  check('4.4.6 styles.min.css has removed .confetti-container rule', !minCssContent.includes('.confetti-container'));


  // ===========================================================================
  // VECTOR 5: Production Asset Parity & Consistency
  // ===========================================================================
  console.log('\n--- VECTOR 5: Production Asset Parity & Consistency ---');

  const scriptMin = fs.readFileSync(path.join(ROOT_DIR, 'script.min.js'), 'utf8');

  check('5.1 script.min.js includes collection drawer category fix ("index.html?cat=")', scriptMin.includes('index.html?cat='));
  check('5.2 script.min.js includes checkout uploadTotal bypass logic', scriptMin.includes('uploadTotal') && scriptMin.includes('item.upload'));
  check('5.3 script.min.js contains zero references to spawnConfetti or initCardTiltEffects', !scriptMin.includes('spawnConfetti') && !scriptMin.includes('initCardTiltEffects'));

  // Subpage bundle injection parity (Feature 16 check)
  const ourWorkHtml = fs.readFileSync(path.join(ROOT_DIR, 'our-work.html'), 'utf8');
  const faqHtml = fs.readFileSync(path.join(ROOT_DIR, 'faq.html'), 'utf8');

  check('5.4.1 our-work.html includes products-bundle.min.js script tag', ourWorkHtml.includes('products-bundle.min.js'));
  check('5.4.2 our-work.html includes preload link for products-bundle.min.js', ourWorkHtml.includes('rel="preload"') && ourWorkHtml.includes('href="products-bundle.min.js"'));
  check('5.4.3 faq.html includes products-bundle.min.js script tag', faqHtml.includes('products-bundle.min.js'));
  check('5.4.4 faq.html includes preload link for products-bundle.min.js', faqHtml.includes('rel="preload"') && faqHtml.includes('href="products-bundle.min.js"'));


  // ===========================================================================
  // SUMMARY & VERDICT
  // ===========================================================================
  console.log('\n======================================================================');
  console.log(` EMPIRICAL CHALLENGE SUITE SUMMARY: ${passedAssertions}/${totalAssertions} ASSERTIONS PASSED`);
  console.log('======================================================================');

  if (failureDetails.length > 0) {
    console.log(`\nFailures (${failedAssertions}):`);
    failureDetails.forEach(f => console.log(`  - ${f}`));
  }

  const verdict = failedAssertions === 0 ? 'APPROVE' : 'REJECT';
  console.log(`\nCHALLENGER M4-2 FINAL VERDICT: ${verdict}`);

  process.exit(failedAssertions === 0 ? 0 : 1);
}

runAllStressTests().catch(err => {
  console.error('\n[FATAL ERROR IN HARNESS]:', err);
  process.exit(1);
});

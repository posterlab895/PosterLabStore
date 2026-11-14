/**
 * tests/challenger_m2_sync_stress.js
 * 
 * Empirical Adversarial Challenger Test Suite
 * Milestone 2: Admin Panel Live Synchronization & Operations
 * 
 * Authoritative Contracts:
 * - ORIGINAL_REQUEST.md: R2 (Admin Panel Customization and Synchronization)
 * - PROJECT.md: Features 5, 6, 7, 8, 9 (BroadcastChannel, storage event, stock, metadata, resilience)
 * 
 * Challenge Vectors:
 * 1. Echo Loop & Ping-Pong Resilience (STORE_CLIENT_ID / CLIENT_ID drops, duplicate eventId, 100-entry ring buffer bounded FIFO eviction)
 * 2. Rapid Concurrent In-Place Re-renders (100 rapid events in 50ms, _lastFilterSearch / _lastFilterResult cache resets, DOM stability)
 * 3. Storage Fallback Synchronization (BroadcastChannel unavailable, pls-sync-signal storage event, malformed JSON protection)
 * 4. Coupon Update Live Application (Live discount update, live deletion / active coupon revocation, cart recalculation)
 * 5. Bi-directional Admin-to-Storefront Integration (Admin save/delete broadcasting to Storefront)
 * 6. Adversarial Edge Cases & Fuzzing (Stock update custom size preservation audit, malformed payloads, NaN/negative quantities)
 * 7. Production Minified Distribution Parity (script.min.js and admin-panel.min.js)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const failures = [];

function check(name, condition, extra = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  [PASS] ${name}`);
  } else {
    failedChecks++;
    const msg = `FAIL: ${name}${extra ? ' -> ' + extra : ''}`;
    failures.push(msg);
    console.error(`  [FAIL] ${msg}`);
  }
}

console.log('======================================================================');
console.log(' CHALLENGER M2-1: EMPIRICAL LIVE SYNC & RING BUFFER ADVERSARIAL SUITE');
console.log('======================================================================\n');

// -----------------------------------------------------------------------------
// Hub for multi-tab communication simulation
// -----------------------------------------------------------------------------
class TestBroadcastHub {
  constructor() {
    this.channels = new Map();
  }

  createChannel(name) {
    if (!this.channels.has(name)) {
      this.channels.set(name, new Set());
    }
    const channelSet = this.channels.get(name);

    class SimulatedBroadcastChannel {
      constructor() {
        this.name = name;
        this.onmessage = null;
        this.listeners = [];
        this.closed = false;
        channelSet.add(this);
      }

      postMessage(data) {
        if (this.closed) throw new Error('BroadcastChannel is closed');
        for (const peer of channelSet) {
          if (peer !== this && !peer.closed) {
            const event = { data };
            if (typeof peer.onmessage === 'function') {
              try { peer.onmessage(event); } catch (err) { console.error('Hub onmessage error:', err); }
            }
            for (const l of peer.listeners) {
              try { l(event); } catch (err) { console.error('Hub listener error:', err); }
            }
          }
        }
      }

      addEventListener(type, listener) {
        if (type === 'message') this.listeners.push(listener);
      }

      removeEventListener(type, listener) {
        if (type === 'message') {
          this.listeners = this.listeners.filter(l => l !== listener);
        }
      }

      close() {
        this.closed = true;
        channelSet.delete(this);
      }
    }

    return new SimulatedBroadcastChannel();
  }
}

// -----------------------------------------------------------------------------
// VM Environment Factory
// -----------------------------------------------------------------------------
function makeDomElement(tagName = 'div') {
  const el = {
    tagName: tagName.toUpperCase(),
    addEventListener: () => {},
    removeEventListener: () => {},
    classList: {
      _classes: new Set(),
      add(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove(...cls) { cls.forEach(c => this._classes.delete(c)); },
      toggle(c) { if (this._classes.has(c)) { this._classes.delete(c); return false; } else { this._classes.add(c); return true; } },
      contains(c) { return this._classes.has(c); }
    },
    textContent: '',
    innerHTML: '',
    value: '',
    style: {},
    setAttribute(k, v) { this[k] = String(v); },
    getAttribute(k) { return this[k] !== undefined ? this[k] : null; },
    appendChild(c) { el.children.push(c); return c; },
    removeChild(c) { el.children = el.children.filter(x => x !== c); },
    remove() {},
    closest() { return null; },
    children: [],
    hidden: false,
    dataset: {},
    toDataURL: () => 'data:image/webp;base64,mock'
  };
  el.querySelector = () => makeDomElement();
  el.querySelectorAll = () => [];
  el.getElementById = () => makeDomElement();
  return el;
}

function createStorefrontEnv(options = {}) {
  const {
    bundleFile = 'products-bundle.js',
    scriptFile = 'script.js',
    sharedHub = null,
    enableBroadcastChannel = true,
    isDetailView = false,
    initialStorage = {}
  } = options;

  const storage = { ...initialStorage };
  const windowListeners = {};
  let lastReloadCall = false;

  const storageProxy = {
    getItem: (k) => storage[k] !== undefined ? storage[k] : null,
    setItem: (k, v) => {
      const oldVal = storage[k] !== undefined ? storage[k] : null;
      const newVal = String(v);
      storage[k] = newVal;
      // Trigger local storage listeners if simulated
      const ev = { key: k, oldValue: oldVal, newValue: newVal, storageArea: storageProxy };
      if (windowListeners['storage']) {
        windowListeners['storage'].forEach(fn => { try { fn(ev); } catch (_) {} });
      }
    },
    removeItem: (k) => {
      const oldVal = storage[k] !== undefined ? storage[k] : null;
      delete storage[k];
      const ev = { key: k, oldValue: oldVal, newValue: null, storageArea: storageProxy };
      if (windowListeners['storage']) {
        windowListeners['storage'].forEach(fn => { try { fn(ev); } catch (_) {} });
      }
    },
    clear: () => {
      Object.keys(storage).forEach(k => delete storage[k]);
      const ev = { key: null, oldValue: null, newValue: null, storageArea: storageProxy };
      if (windowListeners['storage']) {
        windowListeners['storage'].forEach(fn => { try { fn(ev); } catch (_) {} });
      }
    },
    _raw: storage
  };

  const productGridEl = isDetailView ? null : makeDomElement('div');
  const productDetailEl = makeDomElement('div');
  const cartItemsEl = makeDomElement('div');
  const cartTotalEl = makeDomElement('div');
  const cartCountEl = makeDomElement('span');
  const toastContainerEl = makeDomElement('div');

  const doc = {
    documentElement: { dataset: {}, style: {} },
    head: makeDomElement('head'),
    body: makeDomElement('body'),
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: (sel) => {
      if (sel === '#categorySections') return productGridEl;
      if (sel === '#productDetail') return productDetailEl;
      if (sel === '#cartItems') return cartItemsEl;
      if (sel === '#cartTotal') return cartTotalEl;
      if (sel === '[data-cart-count]') return cartCountEl;
      if (sel === '.toast-notification') return toastContainerEl;
      return makeDomElement();
    },
    querySelectorAll: (sel) => [],
    getElementById: (id) => {
      if (id === 'categorySections') return productGridEl;
      if (id === 'productDetail') return productDetailEl;
      if (id === 'cartItems') return cartItemsEl;
      if (id === 'cartTotal') return cartTotalEl;
      return makeDomElement();
    },
    createElement: makeDomElement,
    readyState: 'complete',
    title: 'Poster Lab Store'
  };

  const sandbox = {
    console: {
      log: () => {},
      warn: () => {},
      error: () => {},
      info: () => {}
    },
    setTimeout: (cb) => { if (typeof cb === 'function') cb(); return 1; },
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    Intl, Math, Date, Array, Object, String, Number, Map, Set, RegExp, JSON, Promise,
    encodeURIComponent, decodeURIComponent, parseFloat, parseInt, URL, URLSearchParams
  };

  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.window.innerWidth = 1200;
  sandbox.window.innerHeight = 800;
  sandbox.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  sandbox.window.requestAnimationFrame = (cb) => { if (typeof cb === 'function') cb(); };
  sandbox.window.addEventListener = (t, fn) => { (windowListeners[t] = windowListeners[t] || []).push(fn); };
  sandbox.window.removeEventListener = (t, fn) => {
    if (windowListeners[t]) windowListeners[t] = windowListeners[t].filter(f => f !== fn);
  };
  sandbox.window.location = {
    href: isDetailView ? 'http://localhost/product.html?id=football-001' : 'http://localhost/index.html',
    pathname: isDetailView ? '/product.html' : '/index.html',
    search: isDetailView ? '?id=football-001' : '',
    reload: () => { lastReloadCall = true; }
  };
  sandbox.window.history = { pushState: () => {}, replaceState: () => {} };
  sandbox.window.dispatchEvent = (ev) => {
    if (ev && windowListeners[ev.type]) {
      windowListeners[ev.type].forEach(fn => { try { fn(ev); } catch (_) {} });
    }
  };

  sandbox.localStorage = storageProxy;
  sandbox.sessionStorage = storageProxy;
  sandbox.document = doc;
  sandbox.indexedDB = { open: () => ({ onsuccess: null, onerror: null }) };
  sandbox.navigator = { userAgent: 'node', language: 'en' };

  let activeBcInstance = null;
  if (enableBroadcastChannel) {
    sandbox.BroadcastChannel = function(channelName) {
      if (sharedHub) {
        activeBcInstance = sharedHub.createChannel(channelName);
      } else {
        this.name = channelName;
        this.postMessage = () => {};
        this.onmessage = null;
        this.listeners = [];
        this.close = () => {};
        activeBcInstance = this;
      }
      return activeBcInstance;
    };
  } else {
    sandbox.BroadcastChannel = undefined;
  }

  // Firebase stubs to isolate testing to live client synchronization
  sandbox.initFirebase = () => {};
  sandbox.isFirebaseReady = () => false;
  sandbox.ensureFirebaseReady = async () => false;
  sandbox.getFirebaseDb = () => null;
  sandbox.getFirebaseAuth = () => null;

  vm.createContext(sandbox);

  if (bundleFile) {
    const bundleSrc = fs.readFileSync(path.join(ROOT_DIR, bundleFile), 'utf8');
    vm.runInContext(bundleSrc, sandbox);
  }

  if (scriptFile) {
    const scriptSrc = fs.readFileSync(path.join(ROOT_DIR, scriptFile), 'utf8');
    vm.runInContext(scriptSrc, sandbox);
  }

  return {
    sandbox,
    eval: (code) => vm.runInContext(code, sandbox),
    storage: storageProxy,
    windowListeners,
    getBroadcastChannel: () => activeBcInstance,
    didReload: () => lastReloadCall,
    dom: {
      productGrid: productGridEl,
      productDetail: productDetailEl,
      cartItems: cartItemsEl,
      cartTotal: cartTotalEl,
      cartCount: cartCountEl,
      toast: toastContainerEl
    }
  };
}

function createAdminEnv(options = {}) {
  const {
    adminFile = 'admin-panel.js',
    bundleFile = 'products-bundle.js',
    sharedHub = null,
    initialStorage = {}
  } = options;

  const storage = {
    'pls-admin-session': 'true',
    'pls-admin-email': 'posterlab895@gmail.com',
    ...initialStorage
  };
  const windowListeners = {};

  const storageProxy = {
    getItem: (k) => storage[k] !== undefined ? storage[k] : null,
    setItem: (k, v) => {
      const oldVal = storage[k] !== undefined ? storage[k] : null;
      const newVal = String(v);
      storage[k] = newVal;
      const ev = { key: k, oldValue: oldVal, newValue: newVal, storageArea: storageProxy };
      if (windowListeners['storage']) {
        windowListeners['storage'].forEach(fn => { try { fn(ev); } catch (_) {} });
      }
    },
    removeItem: (k) => {
      const oldVal = storage[k] !== undefined ? storage[k] : null;
      delete storage[k];
      const ev = { key: k, oldValue: oldVal, newValue: null, storageArea: storageProxy };
      if (windowListeners['storage']) {
        windowListeners['storage'].forEach(fn => { try { fn(ev); } catch (_) {} });
      }
    },
    clear: () => {
      Object.keys(storage).forEach(k => delete storage[k]);
      const ev = { key: null, oldValue: null, newValue: null, storageArea: storageProxy };
      if (windowListeners['storage']) {
        windowListeners['storage'].forEach(fn => { try { fn(ev); } catch (_) {} });
      }
    },
    _raw: storage
  };

  const appEl = makeDomElement('div');
  const tableEl = makeDomElement('table');
  const modalEl = makeDomElement('div');

  const doc = {
    documentElement: { dataset: {}, style: {} },
    head: makeDomElement('head'),
    body: makeDomElement('body'),
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: (sel) => {
      if (sel === '#adminApp') return appEl;
      if (sel === '#productsTable') return tableEl;
      if (sel === '#adminProductModal') return modalEl;
      return makeDomElement();
    },
    querySelectorAll: () => [],
    getElementById: (id) => makeDomElement(),
    createElement: makeDomElement,
    readyState: 'complete'
  };

  const sandbox = {
    console: { log: () => {}, warn: () => {}, error: () => {}, info: () => {} },
    setTimeout: (cb) => { if (typeof cb === 'function') cb(); return 1; },
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    Intl, Math, Date, Array, Object, String, Number, Map, Set, RegExp, JSON, Promise,
    encodeURIComponent, decodeURIComponent, parseFloat, parseInt, URL, URLSearchParams
  };

  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  sandbox.window.requestAnimationFrame = (cb) => { if (typeof cb === 'function') cb(); };
  sandbox.window.addEventListener = (t, fn) => { (windowListeners[t] = windowListeners[t] || []).push(fn); };
  sandbox.window.removeEventListener = () => {};
  sandbox.window.location = {
    href: 'http://localhost/admin/panel.html',
    pathname: '/admin/panel.html',
    search: '',
    replace: () => {}
  };
  sandbox.window.dispatchEvent = (ev) => {
    if (ev && windowListeners[ev.type]) {
      windowListeners[ev.type].forEach(fn => { try { fn(ev); } catch (_) {} });
    }
  };

  sandbox.localStorage = storageProxy;
  sandbox.sessionStorage = storageProxy;
  sandbox.document = doc;
  sandbox.indexedDB = { open: () => ({ onsuccess: null, onerror: null }) };
  sandbox.navigator = { userAgent: 'node', language: 'en' };

  let activeBcInstance = null;
  sandbox.BroadcastChannel = function(channelName) {
    if (sharedHub) {
      activeBcInstance = sharedHub.createChannel(channelName);
    } else {
      this.name = channelName;
      this.postMessage = () => {};
      this.onmessage = null;
      this.listeners = [];
      this.close = () => {};
      activeBcInstance = this;
    }
    return activeBcInstance;
  };

  sandbox.initFirebase = () => {};
  sandbox.isFirebaseReady = () => false;
  sandbox.ensureFirebaseReady = async () => false;
  sandbox.getFirebaseDb = () => null;

  vm.createContext(sandbox);

  if (bundleFile) {
    const bundleSrc = fs.readFileSync(path.join(ROOT_DIR, bundleFile), 'utf8');
    vm.runInContext(bundleSrc, sandbox);
  }

  if (adminFile) {
    const adminSrc = fs.readFileSync(path.join(ROOT_DIR, adminFile), 'utf8');
    vm.runInContext(adminSrc, sandbox);
  }

  return {
    sandbox,
    eval: (code) => vm.runInContext(code, sandbox),
    storage: storageProxy,
    windowListeners,
    getBroadcastChannel: () => activeBcInstance
  };
}

// =============================================================================
// TEST SUITE 1: Echo Loop & Ping-Pong Resilience
// =============================================================================
console.log('[TEST SUITE 1] Echo Loop & Ping-Pong Resilience');

{
  const env = createStorefrontEnv();
  const bc = env.getBroadcastChannel();
  const storeClientId = env.eval('STORE_CLIENT_ID');
  
  check('1.1 Storefront initializes unique STORE_CLIENT_ID string', typeof storeClientId === 'string' && storeClientId.startsWith('store_'), `Got: ${storeClientId}`);

  // Test 1.1: Self-echo dropping
  const originalName = env.eval('getProduct("football-001")').name;
  bc.onmessage({
    data: {
      type: 'PRODUCT_UPDATE',
      payload: { id: 'football-001', name: 'ECHO_SHOULD_BE_DROPPED' },
      eventId: 'evt_echo_test_1',
      senderId: storeClientId // Identical senderId as client
    }
  });

  const nameAfterEcho = env.eval('getProduct("football-001")').name;
  check('1.2 Self-echo message with senderId === STORE_CLIENT_ID is dropped immediately', nameAfterEcho === originalName, `Expected: ${originalName}, Got: ${nameAfterEcho}`);
  check('1.3 Self-echo eventId is not recorded into ring buffer', !env.eval('_processedSyncEvents.has("evt_echo_test_1")'));

  // Test 1.2: Sequential duplicate eventId deduplication
  bc.onmessage({
    data: {
      type: 'PRODUCT_UPDATE',
      payload: { id: 'football-001', name: 'Ronaldo Legitimate Update' },
      eventId: 'evt_dup_test_1',
      senderId: 'remote_admin_999'
    }
  });

  const nameAfterFirst = env.eval('getProduct("football-001")').name;
  check('1.4 First arrival of eventId evt_dup_test_1 is accepted and applied', nameAfterFirst === 'Ronaldo Legitimate Update');
  check('1.5 Ring buffer records eventId evt_dup_test_1', env.eval('_processedSyncEvents.has("evt_dup_test_1")'));

  // Send duplicate eventId with different payload
  bc.onmessage({
    data: {
      type: 'PRODUCT_UPDATE',
      payload: { id: 'football-001', name: 'DUPLICATE_SHOULD_BE_IGNORED' },
      eventId: 'evt_dup_test_1', // Duplicate eventId
      senderId: 'remote_admin_999'
    }
  });

  const nameAfterDuplicate = env.eval('getProduct("football-001")').name;
  check('1.6 Duplicate eventId is dropped without mutating product state', nameAfterDuplicate === 'Ronaldo Legitimate Update');

  // Test 1.3: Ring buffer 100-entry bounded size & FIFO eviction
  const initialBufferSize = env.eval('_processedSyncEvents.size');
  for (let i = 0; i < 150; i++) {
    bc.onmessage({
      data: {
        type: 'PRODUCT_UPDATE',
        payload: { id: 'football-001', name: `Ronaldo Batch ${i}` },
        eventId: `evt_blast_${i}`,
        senderId: 'remote_admin_blast'
      }
    });
  }

  const finalBufferSize = env.eval('_processedSyncEvents.size');
  check('1.7 Ring buffer size never exceeds 100 entries after blasting 150 events', finalBufferSize === 100, `Got size: ${finalBufferSize}`);
  check('1.8 Oldest event evt_blast_0 was evicted from ring buffer', !env.eval('_processedSyncEvents.has("evt_blast_0")'));
  check('1.9 49th event evt_blast_49 was evicted from ring buffer', !env.eval('_processedSyncEvents.has("evt_blast_49")'));
  check('1.10 50th event evt_blast_50 is still retained in ring buffer', env.eval('_processedSyncEvents.has("evt_blast_50")'));
  check('1.11 Latest event evt_blast_149 is retained in ring buffer', env.eval('_processedSyncEvents.has("evt_blast_149")'));

  // Test 1.4: Re-sending evicted key vs retained key
  bc.onmessage({
    data: {
      type: 'PRODUCT_UPDATE',
      payload: { id: 'football-001', name: 'Ronaldo Reapplied Evicted Key' },
      eventId: 'evt_blast_0', // Was evicted
      senderId: 'remote_admin_blast'
    }
  });
  check('1.12 Re-sending evicted key (evt_blast_0) is processed because it aged out', env.eval('getProduct("football-001")').name === 'Ronaldo Reapplied Evicted Key');

  bc.onmessage({
    data: {
      type: 'PRODUCT_UPDATE',
      payload: { id: 'football-001', name: 'Ronaldo Reapplied Retained Key' },
      eventId: 'evt_blast_149', // Still retained
      senderId: 'remote_admin_blast'
    }
  });
  check('1.13 Re-sending retained key (evt_blast_149) is dropped as duplicate', env.eval('getProduct("football-001")').name === 'Ronaldo Reapplied Evicted Key');
}

// =============================================================================
// TEST SUITE 2: Rapid Concurrent In-Place Re-renders & Search Cache
// =============================================================================
console.log('\n[TEST SUITE 2] Rapid Concurrent In-Place Re-renders & Search Cache');

{
  const env = createStorefrontEnv();
  const bc = env.getBroadcastChannel();

  // Test 2.1: Cache invalidation verification on product detail view (where productGrid is null)
  const detailEnv = createStorefrontEnv({ isDetailView: true });
  const detailBc = detailEnv.getBroadcastChannel();
  detailEnv.eval('_lastFilterSearch = "stale_query"; _lastFilterResult = [{ id: "stale" }];');
  check('2.1 Stale search cache pre-seeded on detail page', detailEnv.eval('_lastFilterSearch') === 'stale_query');

  detailBc.onmessage({
    data: {
      type: 'PRODUCT_UPDATE',
      payload: { id: 'football-001', name: 'Ronaldo Detail Inval Test' },
      eventId: 'evt_detail_inval_1',
      senderId: 'remote_admin'
    }
  });

  check('2.2 triggerLiveUIReRender resets _lastFilterSearch to null', detailEnv.eval('_lastFilterSearch') === null);
  check('2.3 triggerLiveUIReRender resets _lastFilterResult to null', detailEnv.eval('_lastFilterResult') === null);

  // Test 2.2: Active catalog grid search cache eviction and rebuild
  env.eval('state.search = "Ronaldo"; filteredProducts();');
  const cachedSearch = env.eval('_lastFilterSearch');
  const cachedResultBefore = env.eval('_lastFilterResult');
  check('2.4 Active search cache _lastFilterSearch is populated on catalog grid', cachedSearch === 'ronaldo');
  check('2.5 Active search cache _lastFilterResult is populated array', Array.isArray(cachedResultBefore) && cachedResultBefore.length > 0);

  // Send live mutation while search is active on catalog grid
  bc.onmessage({
    data: {
      type: 'PRODUCT_UPDATE',
      payload: { id: 'football-001', name: 'Ronaldo Active Search Updated' },
      eventId: 'evt_cache_inval_active',
      senderId: 'remote_admin'
    }
  });

  const cachedResultAfter = env.eval('_lastFilterResult');
  check('2.6 Old search result cache was invalidated and replaced with fresh instance', cachedResultAfter !== cachedResultBefore);
  check('2.7 Fresh search result cache immediately contains updated product name', cachedResultAfter.some(p => p.name === 'Ronaldo Active Search Updated'));

  // Test 2.3: 50 Rapid concurrent events burst workload
  let exceptionCount = 0;
  const startBurst = Date.now();
  const targetIds = ['football-001', 'football-002', 'cars-001', 'anime-001', 'art-001'];

  for (let i = 0; i < 50; i++) {
    const targetId = targetIds[i % targetIds.length];
    const eventType = i % 3 === 0 ? 'PRODUCT_UPDATE' : (i % 3 === 1 ? 'STOCK_UPDATE' : 'PRODUCT_DELETE');
    let payload;
    if (eventType === 'PRODUCT_UPDATE') {
      payload = { id: targetId, name: `Mutated Title ${i}`, basePrice: 180 + (i % 4) * 20 };
    } else if (eventType === 'STOCK_UPDATE') {
      payload = { id: targetId, quantity: i % 2 === 0 ? 0 : 15 };
    } else {
      payload = { id: targetId, _deleted: (i % 6 === 2) };
    }

    try {
      bc.onmessage({
        data: {
          type: eventType,
          payload,
          eventId: `evt_burst_${i}_${Date.now()}`,
          senderId: 'rapid_stress_producer'
        }
      });
    } catch (err) {
      exceptionCount++;
      console.error('Exception during burst at i=' + i, err);
    }
  }

  const burstDuration = Date.now() - startBurst;
  check('2.8 50 Rapid concurrent events execute with 0 unhandled exceptions', exceptionCount === 0);
  check('2.9 Page did not perform full reload (location.reload was not invoked)', env.didReload() === false);
  check('2.10 50 event burst completed within acceptable processing window', burstDuration < 5000, `Duration: ${burstDuration}ms`);
}

// =============================================================================
// TEST SUITE 3: Storage Fallback Synchronization
// =============================================================================
console.log('\n[TEST SUITE 3] Storage Fallback Synchronization');

{
  // Test 3.1: Environment where BroadcastChannel is undefined
  const fallbackEnv = createStorefrontEnv({ enableBroadcastChannel: false });
  check('3.1 Storefront initializes cleanly without BroadcastChannel', fallbackEnv.sandbox.BroadcastChannel === undefined);

  // Test 3.2: Storage signal event dispatching via window.dispatchEvent
  const fallbackEvent = {
    type: 'PRODUCT_UPDATE',
    payload: { id: 'cars-001', name: 'Porsche GT3 Fallback Live Sync', basePrice: 180 },
    eventId: 'evt_storage_fallback_1',
    senderId: 'admin_storage_peer'
  };

  const initialCarName = fallbackEnv.eval('getProduct("cars-001")').name;
  fallbackEnv.sandbox.window.dispatchEvent({
    type: 'storage',
    key: 'pls-sync-signal',
    newValue: JSON.stringify(fallbackEvent)
  });

  const updatedCarName = fallbackEnv.eval('getProduct("cars-001")').name;
  check('3.2 Storage fallback signal correctly ingests PRODUCT_UPDATE', updatedCarName === 'Porsche GT3 Fallback Live Sync', `Got: ${updatedCarName}`);

  // Test 3.3: Storage fallback STOCK_UPDATE
  fallbackEnv.sandbox.window.dispatchEvent({
    type: 'storage',
    key: 'pls-sync-signal',
    newValue: JSON.stringify({
      type: 'STOCK_UPDATE',
      payload: { id: 'cars-001', quantity: 0 },
      eventId: 'evt_storage_stock_1',
      senderId: 'admin_storage_peer'
    })
  });
  check('3.3 Storage fallback signal correctly ingests STOCK_UPDATE (quantity=0)', fallbackEnv.eval('getProduct("cars-001")').quantity === 0);
  check('3.4 isProductOutOfStock recognizes 0 quantity from storage fallback', fallbackEnv.eval('isProductOutOfStock(getProduct("cars-001"))') === true);

  // Test 3.4: Storage fallback PRODUCT_DELETE
  fallbackEnv.sandbox.window.dispatchEvent({
    type: 'storage',
    key: 'pls-sync-signal',
    newValue: JSON.stringify({
      type: 'PRODUCT_DELETE',
      payload: { id: 'cars-001' },
      eventId: 'evt_storage_delete_1',
      senderId: 'admin_storage_peer'
    })
  });
  // getProduct('cars-001') returns undefined because it was removed from active catalog!
  const deletedProd = fallbackEnv.eval('getProduct("cars-001")');
  check('3.5 Storage fallback signal correctly ingests PRODUCT_DELETE (item removed from active catalog)', deletedProd === undefined);
  const rawProducts = fallbackEnv.eval('products.find(p => p.id === "cars-001")');
  check('3.6 Static products array marks _deleted: true', rawProducts && rawProducts._deleted === true);

  // Test 3.5: Malformed JSON resilience in storage event
  let malformedThrew = false;
  try {
    fallbackEnv.sandbox.window.dispatchEvent({
      type: 'storage',
      key: 'pls-sync-signal',
      newValue: '{bad_json:true,broken'
    });
  } catch (err) {
    malformedThrew = true;
  }
  check('3.6 Corrupted JSON in pls-sync-signal storage event does not crash storefront', malformedThrew === false);

  // Test 3.6: Direct pls-products storage mutation triggers live UI re-render
  fallbackEnv.eval('state.search = "porsche"; filteredProducts();');
  const cacheBeforeStorage = fallbackEnv.eval('_lastFilterResult');
  check('3.7 Search cache set prior to direct pls-products storage event', fallbackEnv.eval('_lastFilterSearch') === 'porsche');

  fallbackEnv.sandbox.window.dispatchEvent({
    type: 'storage',
    key: 'pls-products',
    newValue: JSON.stringify([])
  });
  const cacheAfterStorage = fallbackEnv.eval('_lastFilterResult');
  check('3.8 Direct pls-products storage event invalidates old cache instance and rebuilds', cacheAfterStorage !== cacheBeforeStorage);
}

// =============================================================================
// TEST SUITE 4: Coupon Update Live Application
// =============================================================================
console.log('\n[TEST SUITE 4] Coupon Update Live Application');

{
  const initialCoupons = [
    { code: 'SAVE20', discount: 20, active: true, minSubtotal: 0 },
    { code: 'FLAT50', discount: 50, active: true, minSubtotal: 0 }
  ];

  const env = createStorefrontEnv({
    initialStorage: {
      'pls-coupons': JSON.stringify(initialCoupons)
    }
  });
  const bc = env.getBroadcastChannel();

  // Establish cart state with an applied coupon
  env.eval(`
    state.cart = [
      { productId: 'football-001', size: '20x30', frame: 'Black', quantity: 2, price: 180 }
    ];
    state.appliedCoupon = { code: 'SAVE20', discount: 20 };
    renderCart();
  `);

  const initialApplied = env.eval('state.appliedCoupon');
  check('4.1 Cart initialized with active applied coupon SAVE20 (20%)', initialApplied && initialApplied.discount === 20);

  // Test 4.1: Live coupon update (Admin increases discount to 35%)
  bc.onmessage({
    data: {
      type: 'COUPON_UPDATE',
      payload: { code: 'SAVE20', discount: 35, active: true },
      eventId: 'evt_coupon_upd_1',
      senderId: 'admin_discounts'
    }
  });

  const updatedCoupon = env.eval('state.appliedCoupon');
  check('4.2 Live COUPON_UPDATE modifies state.appliedCoupon discount to 35%', updatedCoupon && updatedCoupon.discount === 35, `Got: ${updatedCoupon?.discount}`);

  const storedCoupons = env.eval('getCouponsData()');
  const storedSave20 = storedCoupons.find(c => c.code === 'SAVE20');
  check('4.3 Storage pls-coupons is synchronized with new 35% discount', storedSave20 && storedSave20.discount === 35);

  // Test 4.2: Live coupon deletion (Admin deletes active coupon)
  bc.onmessage({
    data: {
      type: 'COUPON_UPDATE',
      payload: { code: 'SAVE20', _deleted: true },
      eventId: 'evt_coupon_del_1',
      senderId: 'admin_discounts'
    }
  });

  const appliedAfterDelete = env.eval('state.appliedCoupon');
  check('4.4 Deleted coupon is revoked from state.appliedCoupon (becomes null)', appliedAfterDelete === null);

  const storedAfterDelete = env.eval('getCouponsData()');
  check('4.5 Deleted coupon is removed from persistent coupon data', !storedAfterDelete.some(c => c.code === 'SAVE20'));

  // Test 4.3: Unapplied coupon update does not disturb cart state
  bc.onmessage({
    data: {
      type: 'COUPON_UPDATE',
      payload: { code: 'FLAT50', discount: 60 },
      eventId: 'evt_coupon_unapplied_1',
      senderId: 'admin_discounts'
    }
  });
  check('4.6 Unapplied coupon update modifies persistent coupon without setting appliedCoupon', env.eval('state.appliedCoupon') === null);
  const flat50 = env.eval('getCouponsData()').find(c => c.code === 'FLAT50');
  check('4.7 Unapplied coupon FLAT50 discount updated to 60%', flat50 && flat50.discount === 60);
}

// =============================================================================
// TEST SUITE 5: Bi-directional Admin-Storefront Live Roundtrip
// =============================================================================
console.log('\n[TEST SUITE 5] Bi-directional Admin-Storefront Live Roundtrip');

{
  const sharedHub = new TestBroadcastHub();
  const storeEnv = createStorefrontEnv({ sharedHub });
  const adminEnv = createAdminEnv({ sharedHub });

  const adminBc = adminEnv.getBroadcastChannel();
  const storeBc = storeEnv.getBroadcastChannel();

  check('5.1 Storefront BroadcastChannel created via shared hub', !!storeBc);
  check('5.2 Admin Panel BroadcastChannel created via shared hub', !!adminBc);

  // Admin sends live update through broadcastLiveSync
  // Simulate admin broadcasting PRODUCT_UPDATE
  const adminProduct = {
    id: 'football-001',
    name: 'Ronaldo Inter-Tab Live Synced',
    basePrice: 180,
    sizes: { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 },
    quantity: 12,
    _updatedAt: new Date().toISOString()
  };

  adminBc.postMessage({
    type: 'PRODUCT_UPDATE',
    payload: adminProduct,
    eventId: 'evt_roundtrip_1',
    senderId: 'admin_active_tab'
  });

  const storeProduct = storeEnv.eval('getProduct("football-001")');
  check('5.3 Storefront received live PRODUCT_UPDATE from Admin tab', storeProduct.name === 'Ronaldo Inter-Tab Live Synced');
  check('5.4 Storefront received quantity from Admin tab', storeProduct.quantity === 12);

  // Admin broadcasts coupon
  adminBc.postMessage({
    type: 'COUPON_UPDATE',
    payload: { code: 'ROUNDTRIP10', discount: 10, active: true },
    eventId: 'evt_roundtrip_coupon_1',
    senderId: 'admin_active_tab'
  });

  const storeCoupons = storeEnv.eval('getCouponsData()');
  check('5.5 Storefront received live COUPON_UPDATE from Admin tab', storeCoupons.some(c => c.code === 'ROUNDTRIP10'));
}

// =============================================================================
// TEST SUITE 6: Adversarial Edge Cases & Empirical Defect Discovery
// =============================================================================
console.log('\n[TEST SUITE 6] Adversarial Edge Cases & Empirical Defect Discovery');

{
  const env = createStorefrontEnv();
  const bc = env.getBroadcastChannel();

  // Test 6.1: Empirical Investigation — Does STOCK_UPDATE clobber custom tier sizes?
  // Setup: Product with custom non-standard tier prices (e.g. 30x40 = 260 EGP)
  bc.onmessage({
    data: {
      type: 'PRODUCT_UPDATE',
      payload: {
        id: 'football-001',
        name: 'Ronaldo Custom Tiers',
        basePrice: 180,
        sizes: { '20x30': 180, '30x40': 260, '40x50': 320, '50x70': 400 }
      },
      eventId: 'evt_custom_sizes_1',
      senderId: 'admin_peer'
    }
  });

  const custom30x40BeforeStock = env.eval('getProduct("football-001").sizes["30x40"]');
  check('6.1 Custom sizes successfully established (30x40 = 260 EGP)', custom30x40BeforeStock === 260);

  // Now admin sends STOCK_UPDATE for football-001
  bc.onmessage({
    data: {
      type: 'STOCK_UPDATE',
      payload: {
        id: 'football-001',
        quantity: 8
      },
      eventId: 'evt_stock_custom_sizes_2',
      senderId: 'admin_peer'
    }
  });

  const custom30x40AfterStock = env.eval('getProduct("football-001").sizes["30x40"]');
  const stockQtyAfter = env.eval('getProduct("football-001").quantity');

  // EMPIRICAL OBSERVATION:
  // applyLiveStockUpdate calls applyLiveProductUpdate with only { id, quantity, _updatedAt }.
  // applyLiveProductUpdate calls sanitizeRemoteProduct(payload).
  // sanitizeRemoteProduct attaches STANDARD_SIZES because payload.sizes is undefined.
  // Then { ...currentMerged, ...sanitized } overwrites 30x40: 260 with standard 200!
  const hasCustomSizeClobberDefect = (custom30x40AfterStock === 200 && custom30x40BeforeStock === 260);
  console.log(`    [Empirical Discovery] Custom size 30x40 before STOCK_UPDATE: ${custom30x40BeforeStock}, after: ${custom30x40AfterStock}`);
  check('6.2 [VULNERABILITY] STOCK_UPDATE clobbers custom tier sizes back to standard defaults', hasCustomSizeClobberDefect, 'Empirical defect confirmed in sanitizeRemoteProduct / applyLiveStockUpdate interaction');

  // Test 6.2: Malformed payload fuzzing (null, undefined, invalid types)
  const malformedPayloads = [
    null,
    undefined,
    {},
    { id: null },
    { id: undefined },
    { id: '' },
    { id: 'football-001', quantity: 'not_a_number' },
    { id: 'football-001', quantity: -9999 },
    { id: 'football-001', basePrice: -50 }
  ];

  let fuzzCrashCount = 0;
  malformedPayloads.forEach((pl, idx) => {
    try {
      bc.onmessage({
        data: {
          type: 'PRODUCT_UPDATE',
          payload: pl,
          eventId: `evt_fuzz_${idx}`,
          senderId: 'fuzz_tester'
        }
      });
      bc.onmessage({
        data: {
          type: 'STOCK_UPDATE',
          payload: pl,
          eventId: `evt_fuzz_stock_${idx}`,
          senderId: 'fuzz_tester'
        }
      });
    } catch (e) {
      fuzzCrashCount++;
      console.error(`Fuzz crash at payload ${idx}:`, e);
    }
  });

  check('6.3 System survives malformed payload fuzzing with 0 uncaught crashes', fuzzCrashCount === 0);

  // Test 6.3: Negative stock handling
  bc.onmessage({
    data: {
      type: 'STOCK_UPDATE',
      payload: { id: 'football-001', quantity: -50 },
      eventId: 'evt_neg_stock_1',
      senderId: 'admin_peer'
    }
  });
  const negStockProduct = env.eval('getProduct("football-001")');
  check('6.4 Negative stock is clamped to 0 by Math.max(0, parseInt(qty))', negStockProduct.quantity === 0);
  check('6.5 isProductOutOfStock recognizes clamped 0 stock as out of stock', env.eval('isProductOutOfStock(getProduct("football-001"))') === true);

  // Test 6.4: NaN stock handling inconsistency check
  // If quantity is 'invalid_string'
  bc.onmessage({
    data: {
      type: 'STOCK_UPDATE',
      payload: { id: 'football-001', quantity: 'invalid_qty' },
      eventId: 'evt_nan_stock_1',
      senderId: 'admin_peer'
    }
  });
  const nanProduct = env.eval('getProduct("football-001")');
  // Math.max(0, parseInt('invalid_qty', 10)) produces NaN in memory,
  // which serializes to null when saved to localStorage ('pls-products').
  // Consequently, getProductStock treats null as unlimited stock (Infinity)!
  const isNullQuantity = nanProduct.quantity === null;
  const outOfStockForNan = env.eval('isProductOutOfStock(getProduct("football-001"))');
  const getProductStockForNan = env.eval('getProductStock(getProduct("football-001"))');
  console.log(`    [Empirical Discovery] Quantity is null via JSON: ${isNullQuantity}, isProductOutOfStock: ${outOfStockForNan}, getProductStock: ${getProductStockForNan}`);
  check('6.6 [VULNERABILITY] Non-numeric stock string converts via JSON serialization into null/Infinity (unlimited inventory)', isNullQuantity && !outOfStockForNan && getProductStockForNan === Infinity);
}

// =============================================================================
// TEST SUITE 7: Production Minified Distribution Parity
// =============================================================================
console.log('\n[TEST SUITE 7] Production Minified Distribution Parity (script.min.js & admin-panel.min.js)');

{
  const minStoreEnv = createStorefrontEnv({
    bundleFile: 'products-bundle.min.js',
    scriptFile: 'script.min.js'
  });
  const minBc = minStoreEnv.getBroadcastChannel();
  const minClientId = minStoreEnv.eval('STORE_CLIENT_ID');

  check('7.1 Production script.min.js initializes STORE_CLIENT_ID', typeof minClientId === 'string' && minClientId.startsWith('store_'));

  // 1. Minified Echo dropping
  minBc.onmessage({
    data: {
      type: 'PRODUCT_UPDATE',
      payload: { id: 'football-001', name: 'MIN_ECHO_SHOULD_DROP' },
      eventId: 'evt_min_echo_1',
      senderId: minClientId
    }
  });
  check('7.2 Production script.min.js drops self-echo immediately', minStoreEnv.eval('getProduct("football-001")').name !== 'MIN_ECHO_SHOULD_DROP');

  // 2. Minified Duplicate dropping
  minBc.onmessage({
    data: {
      type: 'PRODUCT_UPDATE',
      payload: { id: 'football-001', name: 'Minified Ronaldo First' },
      eventId: 'evt_min_dup_1',
      senderId: 'admin_min'
    }
  });
  minBc.onmessage({
    data: {
      type: 'PRODUCT_UPDATE',
      payload: { id: 'football-001', name: 'Minified Ronaldo Duplicate Should Drop' },
      eventId: 'evt_min_dup_1',
      senderId: 'admin_min'
    }
  });
  check('7.3 Production script.min.js dedupes sequential duplicate eventId', minStoreEnv.eval('getProduct("football-001")').name === 'Minified Ronaldo First');

  // 3. Minified Ring Buffer 100-entry limit
  for (let i = 0; i < 120; i++) {
    minBc.onmessage({
      data: {
        type: 'PRODUCT_UPDATE',
        payload: { id: 'football-001', name: `Minified Blast ${i}` },
        eventId: `evt_min_blast_${i}`,
        senderId: 'admin_min_blast'
      }
    });
  }
  const minBufferSize = minStoreEnv.eval('_processedSyncEvents.size');
  check('7.4 Production script.min.js maintains <= 100 ring buffer size', minBufferSize === 100, `Got: ${minBufferSize}`);
  check('7.5 Production script.min.js evicts oldest key evt_min_blast_0', !minStoreEnv.eval('_processedSyncEvents.has("evt_min_blast_0")'));
}

// -----------------------------------------------------------------------------
// Final Verdict Summary
// -----------------------------------------------------------------------------
console.log('\n' + '='.repeat(70));
console.log(` CHALLENGER M2-1 SUMMARY: ${passedChecks}/${totalChecks} checks passed (${failedChecks} failed)`);
console.log('='.repeat(70));

if (failures.length > 0) {
  console.log('\nFailures recorded:');
  failures.forEach(f => console.log('  ✖ ' + f));
}

// Exit code
process.exit(failedChecks > 0 ? 1 : 0);

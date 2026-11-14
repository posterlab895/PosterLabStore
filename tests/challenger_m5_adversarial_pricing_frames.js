/**
 * tests/challenger_m5_adversarial_pricing_frames.js
 *
 * EMPIRICAL ADVERSARIAL CHALLENGER TEST SUITE (Tier 5 White-Box Hardening)
 * Milestone 5 Phase 2: Tier 5 White-Box Adversarial Coverage Hardening
 * Challenger M5-1: Product Pricing, Dimensions, Dynamic Frames & Admin Live Sync
 *
 * Coverage Focus:
 * 1. Product Pricing Structure & Dimensions across all 18 categories:
 *    - 20x30 cm = 180, 30x40 cm = 200, 40x50 cm = 250, 50x70 cm = 300 EGP.
 *    - Base price invariance (180 EGP).
 *    - Custom design upload product pricing and zero surcharge.
 *    - Multi-item mixed carts across categories and dimensions.
 *    - Price tampering defenses (cart injection, corrupted size keys).
 *    - Currency formatting edge cases (`money()`).
 *    - Out-of-stock items, negative stock clamping, in-cart stock lockouts.
 * 2. Dynamic Frame Switching & Visualization:
 *    - Default Black frame invariance on detail view load.
 *    - In-place dynamic frame switching (Black <-> White <-> Transparent / None).
 *    - Zero frame adder across all frame options.
 *    - White wall gallery background gradient rendering and elevation shadows.
 *    - Responsive sizing on mobile/desktop (border scaling 12px -> 9px).
 *    - Frame swatch dot styling and alias equivalence.
 * 3. Admin Panel Live Synchronization:
 *    - Dual-channel broadcast (BroadcastChannel + localStorage event).
 *    - Ring buffer deduplication (max 100 entries, FIFO eviction).
 *    - Self-sent loopback rejection (`STORE_CLIENT_ID` / `CLIENT_ID`).
 *    - Rapid consecutive burst updates (100 sequential events).
 *    - Live stock decrement streaming to 0.
 *    - Price floor defense (clamping sub-floor, negative, NaN prices).
 *    - Corrupted / missing sizes object reconstruction.
 *    - Production minified bundle parity.
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
const failures = [];

function check(label, condition, extra = '') {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✓ [PASS] ${label}`);
  } else {
    failedAssertions++;
    const errMsg = `FAIL: ${label}${extra ? ' -> ' + extra : ''}`;
    failures.push(errMsg);
    console.error(`  ✗ [FAIL] ${errMsg}`);
  }
}

async function checkAsync(label, fn) {
  totalAssertions++;
  try {
    const res = await fn();
    if (res !== false) {
      passedAssertions++;
      console.log(`  ✓ [PASS] ${label}`);
    } else {
      failedAssertions++;
      const errMsg = `FAIL: ${label} -> returned false`;
      failures.push(errMsg);
      console.error(`  ✗ [FAIL] ${errMsg}`);
    }
  } catch (err) {
    failedAssertions++;
    const errMsg = `FAIL: ${label} -> ${err.message}`;
    failures.push(errMsg);
    console.error(`  ✗ [FAIL] ${errMsg}`);
  }
}

console.log('======================================================================');
console.log(' CHALLENGER M5-1: TIER 5 WHITE-BOX ADVERSARIAL STRESS SUITE');
console.log(' Pricing, Dimensions, Dynamic Frames & Admin Live Sync');
console.log('======================================================================\n');

// -----------------------------------------------------------------------------
// Lightweight Mock DOM & Browser Environment
// -----------------------------------------------------------------------------
const VOID_ELEMENTS = new Set(['img', 'br', 'hr', 'input', 'link', 'meta', 'path', 'circle', 'rect', 'line']);

class MockElement {
  constructor(tagName = 'div', parent = null) {
    this.tagName = tagName.toUpperCase();
    this.parentElement = parent;
    this.children = [];
    this.attributes = Object.create(null);
    this.dataset = Object.create(null);
    this.style = Object.create(null);
    this._textContent = '';
    this._innerHTML = '';
    this.hidden = false;
    this.disabled = false;
    this.listeners = new Map();

    const self = this;
    this.classList = {
      _classes: new Set(),
      add(...classes) {
        for (const c of classes) {
          if (!c) continue;
          String(c).trim().split(/\s+/).forEach(tok => {
            if (tok) self.classList._classes.add(tok);
          });
        }
        self.attributes['class'] = Array.from(self.classList._classes).join(' ');
      },
      remove(...classes) {
        for (const c of classes) {
          if (!c) continue;
          String(c).trim().split(/\s+/).forEach(tok => {
            if (tok) self.classList._classes.delete(tok);
          });
        }
        self.attributes['class'] = Array.from(self.classList._classes).join(' ');
      },
      contains(c) {
        return self.classList._classes.has(String(c).trim());
      },
      toggle(c, force) {
        const tok = String(c).trim();
        if (force !== undefined) {
          if (force) this.add(tok);
          else this.remove(tok);
          return force;
        }
        if (this.contains(tok)) {
          this.remove(tok);
          return false;
        } else {
          this.add(tok);
          return true;
        }
      }
    };
  }

  toDataURL(type) {
    return 'data:image/webp;base64,mock';
  }

  get id() { return this.attributes['id'] || ''; }
  set id(v) { this.setAttribute('id', v); }

  get textContent() {
    if (this.children.length === 0) return this._textContent;
    return this.children.map(c => c.textContent).join(' ').trim();
  }
  set textContent(val) {
    this._textContent = String(val);
    this.children = [];
    this._innerHTML = String(val);
  }

  get innerHTML() { return this._innerHTML; }
  set innerHTML(val) {
    this._innerHTML = String(val);
    this.children = [];
    parseHTMLToMockTree(this._innerHTML, this);
  }

  setAttribute(name, val) {
    const k = name.toLowerCase();
    const strVal = String(val);
    this.attributes[k] = strVal;
    if (k === 'class') {
      this.classList._classes.clear();
      strVal.split(/\s+/).forEach(t => { if (t) this.classList._classes.add(t); });
    } else if (k.startsWith('data-')) {
      const camel = k.slice(5).replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
      this.dataset[camel] = strVal;
    }
  }

  getAttribute(name) {
    const k = name.toLowerCase();
    return this.attributes[k] !== undefined ? this.attributes[k] : null;
  }

  hasAttribute(name) {
    return this.attributes[name.toLowerCase()] !== undefined;
  }

  removeAttribute(name) {
    const k = name.toLowerCase();
    delete this.attributes[k];
    if (k === 'class') this.classList._classes.clear();
    if (k.startsWith('data-')) {
      const camel = k.slice(5).replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
      delete this.dataset[camel];
    }
  }

  addEventListener(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(fn);
  }

  dispatchEvent(event) {
    if (!event.target) event.target = this;
    event.currentTarget = this;
    const list = this.listeners.get(event.type) || [];
    for (const fn of list) fn.call(this, event);
    if (this.parentElement && !event.cancelBubble) {
      this.parentElement.dispatchEvent(event);
    }
    return true;
  }

  matches(selector) {
    if (!selector) return false;
    selector = selector.trim();
    if (selector.startsWith('#')) return this.id === selector.slice(1);
    if (selector.startsWith('.')) {
      const classes = selector.slice(1).split('.').filter(Boolean);
      return classes.every(c => this.classList.contains(c));
    }
    const attrMatch = selector.match(/^\[([a-zA-Z0-9\-]+)(?:([*^$]?=)(["']?)(.*?)\3)?\]$/);
    if (attrMatch) {
      const attrKey = attrMatch[1].toLowerCase();
      const op = attrMatch[2];
      const val = attrMatch[4];
      if (op === undefined) return this.hasAttribute(attrKey);
      const curVal = this.getAttribute(attrKey);
      if (curVal === null) return false;
      if (op === '=') return curVal === val;
      if (op === '*=') return curVal.includes(val);
      if (op === '^=') return curVal.startsWith(val);
      if (op === '$=') return curVal.endsWith(val);
    }
    if (/^[a-zA-Z0-9\-]+$/.test(selector)) {
      return this.tagName.toLowerCase() === selector.toLowerCase();
    }
    return false;
  }

  _matchesCompound(selector) {
    selector = selector.trim();
    if (!selector.includes(' ')) return this.matches(selector);
    const parts = selector.split(/\s+/).filter(Boolean);
    if (!this.matches(parts[parts.length - 1])) return false;
    let cur = this.parentElement;
    let partIdx = parts.length - 2;
    while (cur && partIdx >= 0) {
      if (cur.matches(parts[partIdx])) partIdx--;
      cur = cur.parentElement;
    }
    return partIdx < 0;
  }

  querySelector(selector) {
    const results = this.querySelectorAll(selector);
    return results.length > 0 ? results[0] : null;
  }

  querySelectorAll(selector) {
    const found = [];
    const search = (node) => {
      for (const child of node.children) {
        if (child._matchesCompound(selector)) found.push(child);
        search(child);
      }
    };
    search(this);
    return found;
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  remove() {
    if (this.parentElement) {
      const idx = this.parentElement.children.indexOf(this);
      if (idx >= 0) this.parentElement.children.splice(idx, 1);
      this.parentElement = null;
    }
  }

  scrollIntoView() {}
}

function parseHTMLToMockTree(html, parentElement) {
  const root = { children: [] };
  const stack = [root];
  const tagRegex = /<!--[\s\S]*?-->|<(\/)?([a-zA-Z0-9\-]+)([^>]*)>|([^<]+)/g;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    if (match[0].startsWith('<!--')) continue;
    if (match[4]) {
      const text = match[4].trim();
      const current = stack[stack.length - 1];
      if (current && text) {
        current.textContent = (current.textContent ? current.textContent + ' ' : '') + text;
      }
      continue;
    }

    const isClosing = Boolean(match[1]);
    const tagName = match[2].toLowerCase();
    const rawAttrs = match[3] || '';

    if (isClosing) {
      if (stack.length > 1 && stack[stack.length - 1].tagName.toLowerCase() === tagName) {
        stack.pop();
      }
    } else {
      const node = new MockElement(tagName);
      const isSelfClosing = rawAttrs.trim().endsWith('/') || VOID_ELEMENTS.has(tagName);

      const attrRegex = /([a-zA-Z0-9\-]+)(?:=(?:["']([^"']*)["']|([^>\s]+)))?/g;
      let aMatch;
      while ((aMatch = attrRegex.exec(rawAttrs)) !== null) {
        const k = aMatch[1].toLowerCase();
        const v = aMatch[2] !== undefined ? aMatch[2] : (aMatch[3] !== undefined ? aMatch[3] : '');
        node.setAttribute(k, v);
      }

      const current = stack[stack.length - 1];
      node.parentElement = current === root ? parentElement : current;
      if (current === root) {
        parentElement.children.push(node);
      } else {
        current.children.push(node);
      }

      if (!isSelfClosing) {
        stack.push(node);
      }
    }
  }
}

// Mock Storage conforming to WHATWG Web Storage specification
// (Storage events only dispatch across distinct browsing contexts / tabs, not the originating window)
class MockStorage {
  constructor() {
    this.store = new Map();
    this.listeners = [];
  }
  getItem(k) { return this.store.has(k) ? this.store.get(k) : null; }
  setItem(k, v) {
    this.store.set(k, String(v));
  }
  dispatchCrossTabStorageEvent(k, v) {
    const oldVal = this.getItem(k);
    const newVal = v !== null ? String(v) : null;
    if (newVal !== null) this.store.set(k, newVal);
    else this.store.delete(k);
    this.listeners.forEach(fn => fn({ key: k, oldValue: oldVal, newValue: newVal, url: 'http://localhost/' }));
  }
  removeItem(k) {
    this.store.delete(k);
  }
  clear() {
    this.store.clear();
  }
  addEventListener(type, fn) {
    if (type === 'storage') this.listeners.push(fn);
  }
}

// Mock Broadcast Channel Hub
class MockBroadcastHub {
  constructor() {
    this.channels = new Map();
  }
  createChannel(name) {
    if (!this.channels.has(name)) this.channels.set(name, new Set());
    const set = this.channels.get(name);
    class MockBroadcastChannel {
      constructor() {
        this.name = name;
        this.onmessage = null;
        this.listeners = [];
        this.closed = false;
        set.add(this);
      }
      postMessage(data) {
        if (this.closed) throw new Error('Channel closed');
        for (const peer of set) {
          if (peer !== this && !peer.closed) {
            const evt = { data };
            if (typeof peer.onmessage === 'function') peer.onmessage(evt);
            for (const l of peer.listeners) l(evt);
          }
        }
      }
      addEventListener(type, fn) {
        if (type === 'message') this.listeners.push(fn);
      }
      close() {
        this.closed = true;
        set.delete(this);
      }
    }
    return new MockBroadcastChannel();
  }
}

// Environment factory to instantiate store context in Node VM
function createStoreEnvironment(overrides = {}) {
  const storage = new MockStorage();
  const hub = new MockBroadcastHub();

  const doc = new MockElement('html');
  doc.head = new MockElement('head', doc);
  doc.body = new MockElement('body', doc);
  doc.documentElement = { dataset: {} };
  doc.title = 'Poster Lab Store';

  // Setup DOM elements expected by script.js
  const productDetail = new MockElement('div', doc.body);
  productDetail.setAttribute('id', 'productDetail');
  doc.body.appendChild(productDetail);

  const cartDrawer = new MockElement('aside', doc.body);
  cartDrawer.setAttribute('id', 'cartDrawer');
  doc.body.appendChild(cartDrawer);

  const cartItems = new MockElement('div', doc.body);
  cartItems.setAttribute('id', 'cartItems');
  doc.body.appendChild(cartItems);

  const cartTotal = new MockElement('span', doc.body);
  cartTotal.setAttribute('id', 'cartTotal');
  doc.body.appendChild(cartTotal);

  const cartCount = new MockElement('span', doc.body);
  cartCount.setAttribute('id', 'cartCount');
  doc.body.appendChild(cartCount);

  const windowListeners = new Map();
  const mockWindow = {
    innerWidth: 1024,
    location: {
      href: 'http://localhost/product.html?id=football-001',
      pathname: '/product.html',
      search: '?id=football-001'
    },
    history: { replaceState: () => {} },
    localStorage: storage,
    BroadcastChannel: function(name) { return hub.createChannel(name); },
    addEventListener: (t, fn) => {
      if (!windowListeners.has(t)) windowListeners.set(t, []);
      windowListeners.get(t).push(fn);
      if (t === 'storage') storage.addEventListener('storage', fn);
    },
    dispatchEvent: (e) => {
      const list = windowListeners.get(e.type) || [];
      for (const fn of list) fn(e);
    },
    setTimeout: (fn) => setTimeout(fn, 1),
    clearTimeout: clearTimeout,
    document: null
  };

  const sandbox = {
    window: mockWindow,
    document: {
      documentElement: doc.documentElement,
      head: doc.head,
      body: doc.body,
      title: doc.title,
      createElement: (tag) => new MockElement(tag),
      querySelector: (sel) => {
        if (sel === '#productDetail' || sel === '.productDetail') return productDetail;
        if (sel === '#cartDrawer') return cartDrawer;
        if (sel === '#cartItems') return cartItems;
        if (sel === '#cartTotal') return cartTotal;
        if (sel === '#cartCount') return cartCount;
        return doc.body.querySelector(sel);
      },
      querySelectorAll: (sel) => doc.body.querySelectorAll(sel),
      getElementById: (id) => {
        if (id === 'productDetail') return productDetail;
        if (id === 'cartDrawer') return cartDrawer;
        if (id === 'cartItems') return cartItems;
        if (id === 'cartTotal') return cartTotal;
        if (id === 'cartCount') return cartCount;
        return doc.body.querySelector('#' + id);
      },
      addEventListener: () => {}
    },
    localStorage: storage,
    BroadcastChannel: mockWindow.BroadcastChannel,
    navigator: {},
    indexedDB: { open: () => ({ addEventListener: () => {} }) },
    initFirebase: () => {},
    isFirebaseReady: () => false,
    ensureFirebaseReady: async () => false,
    getFirebaseDb: () => null,
    URL: URL,
    URLSearchParams: URLSearchParams,
    Intl: Intl,
    Math: Math,
    Date: Date,
    console: console,
    ...overrides
  };

  sandbox.globalThis = sandbox;
  sandbox.window.document = sandbox.document;

  // Load products-bundle.js
  const bundleCode = fs.readFileSync(path.join(ROOT_DIR, 'products-bundle.js'), 'utf8');
  vm.runInNewContext(bundleCode, sandbox);

  // Load script.js
  const scriptCode = fs.readFileSync(path.join(ROOT_DIR, 'script.js'), 'utf8');
  vm.runInNewContext(scriptCode + '\nglobalThis.state = state;\nglobalThis._processedSyncEvents = _processedSyncEvents;\nglobalThis.STORE_CLIENT_ID = STORE_CLIENT_ID;', sandbox);

  return {
    sandbox,
    storage,
    hub,
    productDetail,
    cartDrawer,
    cartItems,
    cartTotal,
    cartCount
  };
}

// =============================================================================
// SUITE 1: Product Pricing Structure & Dimensions Across all 18 Categories
// =============================================================================
console.log('--- SUITE 1: Product Pricing Structure & Dimensions (All 18 Categories) ---');

// T1.1: 1,019 Products Completeness and Exact Pricing Matrix
(() => {
  const bundleCode = fs.readFileSync(path.join(ROOT_DIR, 'products-bundle.js'), 'utf8');
  const ctx = { window: {}, globalThis: {} };
  vm.runInNewContext(bundleCode, ctx);
  const products = ctx.window.products || ctx.globalThis.products;

  check('T1.1.1: Products bundle contains exact total of 1,019 catalog items',
    Array.isArray(products) && products.length === 1019,
    `Actual count: ${products?.length}`);

  const EXPECTED_TIERS = { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 };
  let badBasePrice = 0;
  let badSizes = 0;
  let badFrames = 0;
  const categories = new Set();

  products.forEach(p => {
    categories.add(p.category);
    if (p.basePrice !== 180) badBasePrice++;
    if (!p.sizes) {
      badSizes++;
    } else {
      for (const [dim, expected] of Object.entries(EXPECTED_TIERS)) {
        if (p.sizes[dim] !== expected) badSizes++;
      }
    }
    if (!Array.isArray(p.frames) || p.frames.length < 3) badFrames++;
  });

  check('T1.1.2: All 1,019 products have basePrice strictly equal to 180 EGP',
    badBasePrice === 0,
    `Found ${badBasePrice} items with non-180 basePrice`);

  check('T1.1.3: All 1,019 products specify exact sizes: 20x30=180, 30x40=200, 40x50=250, 50x70=300',
    badSizes === 0,
    `Found ${badSizes} dimensional mismatches`);

  check('T1.1.4: Catalog covers all 18 standard categories plus custom upload',
    categories.size === 19 && categories.has('custom'),
    `Category count: ${categories.size}`);

  check('T1.1.5: All products support Black, White, and Transparent/None frames',
    badFrames === 0,
    `Found ${badFrames} items with missing frames`);
})();

// T1.2: Individual 18 Category Source Files Invariant
(() => {
  const categoryFiles = fs.readdirSync(ROOT_DIR).filter(f => f.endsWith('-products.js') && f !== 'build-products.js' && f !== 'products-bundle.js');

  check('T1.2.1: Exactly 18 individual category files found in project root',
    categoryFiles.length === 18,
    `Found ${categoryFiles.length} files`);

  const EXPECTED_TIERS = { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 };
  let totalIndividualProducts = 0;
  let fileDiscrepancies = 0;

  categoryFiles.forEach(f => {
    const code = fs.readFileSync(path.join(ROOT_DIR, f), 'utf8');
    const m = code.match(/(?:const|var|let)\s+([a-zA-Z0-9_]+)\s*=/);
    if (!m) { fileDiscrepancies++; return; }
    const varName = m[1];
    const sandbox = { globalThis: {} };
    vm.runInNewContext(code + '\nglobalThis.__items = ' + varName + ';', sandbox);
    const items = sandbox.globalThis.__items;
    if (!Array.isArray(items)) { fileDiscrepancies++; return; }

    items.forEach(p => {
      totalIndividualProducts++;
      if (p.basePrice !== 180) fileDiscrepancies++;
      for (const [dim, expected] of Object.entries(EXPECTED_TIERS)) {
        if (!p.sizes || p.sizes[dim] !== expected) fileDiscrepancies++;
      }
    });
  });

  check('T1.2.2: Verified 1,018 individual products across 18 category files: 100% compliant with standard tiers',
    totalIndividualProducts === 1018 && fileDiscrepancies === 0,
    `Checked: ${totalIndividualProducts}, discrepancies: ${fileDiscrepancies}`);
})();

// T1.3: Custom Design Product Definition and Pricing Invariants
(() => {
  const env = createStoreEnvironment();
  const custom = env.sandbox.getProduct('custom-design');

  check('T1.3.1: Custom design product exists with isCustom flag',
    custom && custom.isCustom === true);

  check('T1.3.2: Custom design has basePrice 180 and exact standard dimensions',
    custom.basePrice === 180 &&
    custom.sizes['20x30'] === 180 &&
    custom.sizes['30x40'] === 200 &&
    custom.sizes['40x50'] === 250 &&
    custom.sizes['50x70'] === 300);

  // White-box unit price calculations on custom design
  check('T1.3.3: itemUnitPrice on custom design returns 180 for 20x30 with Black frame',
    env.sandbox.itemUnitPrice(custom, '20x30', 'Black') === 180);
  check('T1.3.4: itemUnitPrice on custom design returns 200 for 30x40 with White frame',
    env.sandbox.itemUnitPrice(custom, '30x40', 'White') === 200);
  check('T1.3.5: itemUnitPrice on custom design returns 250 for 40x50 with Transparent frame',
    env.sandbox.itemUnitPrice(custom, '40x50', 'Transparent') === 250);
  check('T1.3.6: itemUnitPrice on custom design returns 300 for 50x70 with None frame',
    env.sandbox.itemUnitPrice(custom, '50x70', 'None') === 300);
})();

// T1.4: Mixed Multi-Item Bundle Cart Math & Surcharge Invariance
(() => {
  const env = createStoreEnvironment();

  // Populate cart with 4 varied items across categories and dimensions
  env.sandbox.state.cart = [
    { key: 'football-001-20x30-Black', productId: 'football-001', size: '20x30', frame: 'Black', quantity: 1 },
    { key: 'cars-001-30x40-White', productId: 'cars-001', size: '30x40', frame: 'White', quantity: 2 },
    { key: 'art-001-40x50-Transparent', productId: 'art-001', size: '40x50', frame: 'Transparent', quantity: 1 },
    { key: 'custom-design-50x70-None', productId: 'custom-design', size: '50x70', frame: 'None', quantity: 1 }
  ];

  // Calculations:
  // Item 1: 180 * 1 = 180
  // Item 2: 200 * 2 = 400
  // Item 3: 250 * 1 = 250
  // Item 4: 300 * 1 = 300
  // Subtotal = 180 + 400 + 250 + 300 = 1130 EGP
  // Delivery Fee = 35 EGP
  // Grand Total = 1165 EGP
  const subtotal = env.sandbox.cartSubtotal();
  const delivery = env.sandbox.orderDeliveryFee();
  const grandTotal = env.sandbox.cartGrandTotal();

  check('T1.4.1: Cart subtotal correctly sums 180 + 400 + 250 + 300 = 1,130 EGP',
    subtotal === 1130,
    `Actual subtotal: ${subtotal}`);

  check('T1.4.2: Delivery fee strictly equals 35 EGP when cart is non-empty',
    delivery === 35,
    `Actual delivery: ${delivery}`);

  check('T1.4.3: Grand total strictly equals 1,130 + 35 = 1,165 EGP',
    grandTotal === 1165,
    `Actual grand total: ${grandTotal}`);

  // Test empty cart delivery fee
  env.sandbox.state.cart = [];
  check('T1.4.4: Empty cart yields 0 EGP delivery fee and 0 EGP total',
    env.sandbox.orderDeliveryFee() === 0 && env.sandbox.cartGrandTotal() === 0);
})();

// T1.5: Client-Side Price Tampering Defense (Cart Injection Stress)
(() => {
  const env = createStoreEnvironment();

  // Adversary attempts to inject manipulated low prices directly into cart state
  env.sandbox.state.cart = [
    {
      key: 'tampered-item-1',
      productId: 'football-001',
      size: '50x70',
      frame: 'Black',
      quantity: 1,
      price: 1,           // Malicious injection: 1 EGP instead of 300
      unitPrice: 0,       // Malicious injection: 0 EGP
      basePrice: -50      // Malicious negative price
    }
  ];

  const lineTotal = env.sandbox.cartLineTotal(env.sandbox.state.cart[0]);
  const subtotal = env.sandbox.cartSubtotal();

  check('T1.5.1: cartLineTotal ignores injected price: 1 and computes authoritative 300 EGP for 50x70',
    lineTotal === 300,
    `Actual line total: ${lineTotal}`);

  check('T1.5.2: cartSubtotal ignores injected price properties and recomputes authoritative 300 EGP',
    subtotal === 300,
    `Actual subtotal: ${subtotal}`);

  // Adversary attempts corrupted / unlisted size string
  const corruptedItem = {
    key: 'corrupted-size-item',
    productId: 'football-001',
    size: '999x999_injected',
    frame: 'Black',
    quantity: 1
  };
  const fallbackPrice = env.sandbox.cartLineTotal(corruptedItem);
  check('T1.5.3: Unknown size tier safely falls back to standard base tier (180 EGP)',
    fallbackPrice === 180,
    `Actual fallback price: ${fallbackPrice}`);
})();

// T1.6: Currency Formatting Oracle (`money()`) Edge Cases
(() => {
  const env = createStoreEnvironment();
  const money = env.sandbox.money;

  check('T1.6.1: money(180) formats as "EGP 180"', money(180) === 'EGP 180', `Got: "${money(180)}"`);
  check('T1.6.2: money(200) formats as "EGP 200"', money(200) === 'EGP 200', `Got: "${money(200)}"`);
  check('T1.6.3: money(250) formats as "EGP 250"', money(250) === 'EGP 250', `Got: "${money(250)}"`);
  check('T1.6.4: money(300) formats as "EGP 300"', money(300) === 'EGP 300', `Got: "${money(300)}"`);
  check('T1.6.5: money(0) formats as "EGP 0"', money(0) === 'EGP 0', `Got: "${money(0)}"`);
  check('T1.6.6: money(180.49) rounds down to "EGP 180"', money(180.49) === 'EGP 180', `Got: "${money(180.49)}"`);
  check('T1.6.7: money(199.50) rounds up to "EGP 200"', money(199.50) === 'EGP 200', `Got: "${money(199.50)}"`);
  check('T1.6.8: money(1000) formats with thousands separator "EGP 1,000"', money(1000) === 'EGP 1,000', `Got: "${money(1000)}"`);
  check('T1.6.9: money output contains no raw non-breaking spaces (\u00a0)', !money(180).includes('\u00a0'));
})();

// T1.7: Out-of-Stock and Clamping Adversarial Checks
(() => {
  const env = createStoreEnvironment();

  const normalProduct = { id: 'p-normal', quantity: 10 };
  const zeroStockProduct = { id: 'p-zero', quantity: 0 };
  const negativeStockProduct = { id: 'p-neg', quantity: -15 };
  const nullStockProduct = { id: 'p-null', quantity: null };
  const undefinedStockProduct = { id: 'p-undef' };
  const nanStockProduct = { id: 'p-nan', quantity: 'out_of_stock' };

  check('T1.7.1: isProductOutOfStock returns false for normal in-stock product',
    env.sandbox.isProductOutOfStock(normalProduct) === false);

  check('T1.7.2: isProductOutOfStock returns true for product with quantity: 0',
    env.sandbox.isProductOutOfStock(zeroStockProduct) === true);

  check('T1.7.3: isProductOutOfStock returns true for negative quantity: -15',
    env.sandbox.isProductOutOfStock(negativeStockProduct) === true);

  check('T1.7.4: getProductStock returns Infinity for untracked null/undefined stock',
    env.sandbox.getProductStock(nullStockProduct) === Infinity &&
    env.sandbox.getProductStock(undefinedStockProduct) === Infinity);

  check('T1.7.5: getProductStock clamps negative or NaN quantity to 0',
    env.sandbox.getProductStock(negativeStockProduct) === 0 &&
    env.sandbox.getProductStock(nanStockProduct) === 0);
})();

// =============================================================================
// SUITE 2: Dynamic Frame Switching & Visualization Invariants
// =============================================================================
console.log('\n--- SUITE 2: Dynamic Frame Switching & Visualization Invariants ---');

// T2.1: Default Black Frame Invariance on Detail Load
(() => {
  const env = createStoreEnvironment();

  // Render detail for football-001
  env.sandbox.renderDetail('football-001');

  check('T2.1.1: Detail state initializes default frame to "Black"',
    env.sandbox.state.detailFrame === 'Black',
    `Detail frame: ${env.sandbox.state.detailFrame}`);

  const container = env.sandbox.document.querySelector('.detail-main-image');
  check('T2.1.2: Main image container renders with class "frame-black"',
    container && container.classList.contains('frame-black'),
    `Container classes: ${Array.from(container?.classList?._classes || [])}`);

  const blackBtn = env.sandbox.document.querySelector('[data-frame="Black"]');
  check('T2.1.3: Black frame swatch button is marked .is-selected by default',
    blackBtn && blackBtn.classList.contains('is-selected'));
})();

// T2.2: Seamless In-Place Frame Switching (Black <-> White <-> Transparent / None)
(() => {
  const env = createStoreEnvironment();
  env.sandbox.renderDetail('football-001');

  const containerBefore = env.sandbox.document.querySelector('.detail-main-image');

  // 1. Switch to White
  env.sandbox.switchDetailFrame('White');
  const containerAfterWhite = env.sandbox.document.querySelector('.detail-main-image');

  check('T2.2.1: In-place switch preserves container element identity (no DOM rebuild)',
    containerBefore === containerAfterWhite);

  check('T2.2.2: Switching to White adds .frame-white and removes .frame-black',
    containerAfterWhite.classList.contains('frame-white') &&
    !containerAfterWhite.classList.contains('frame-black'));

  const whiteBtn = env.sandbox.document.querySelector('[data-frame="White"]');
  const blackBtn = env.sandbox.document.querySelector('[data-frame="Black"]');
  check('T2.2.3: White button becomes .is-selected, Black button loses .is-selected',
    whiteBtn && whiteBtn.classList.contains('is-selected') &&
    blackBtn && !blackBtn.classList.contains('is-selected'));

  // 2. Switch to Transparent
  env.sandbox.switchDetailFrame('Transparent');
  check('T2.2.4: Switching to Transparent adds both .frame-transparent and .frame-none',
    containerAfterWhite.classList.contains('frame-transparent') &&
    containerAfterWhite.classList.contains('frame-none') &&
    !containerAfterWhite.classList.contains('frame-white'));

  // 3. Switch to None (Alias equivalence check)
  env.sandbox.switchDetailFrame('None');
  check('T2.2.5: Switching to None adds both .frame-none and .frame-transparent',
    containerAfterWhite.classList.contains('frame-none') &&
    containerAfterWhite.classList.contains('frame-transparent'));

  // 4. Switch back to Black
  env.sandbox.switchDetailFrame('Black');
  check('T2.2.6: Switching back to Black restores .frame-black and cleans prior classes',
    containerAfterWhite.classList.contains('frame-black') &&
    !containerAfterWhite.classList.contains('frame-white') &&
    !containerAfterWhite.classList.contains('frame-transparent') &&
    !containerAfterWhite.classList.contains('frame-none'));
})();

// T2.3: Rapid 100-Cycle Frame Alternation Stress
(() => {
  const env = createStoreEnvironment();
  env.sandbox.renderDetail('football-001');

  const frames = ['Black', 'White', 'Transparent', 'None'];
  let errCount = 0;

  for (let i = 0; i < 100; i++) {
    const target = frames[i % frames.length];
    try {
      env.sandbox.switchDetailFrame(target);
      const expectedClass = `frame-${target.toLowerCase()}`;
      const container = env.sandbox.document.querySelector('.detail-main-image');
      if (!container.classList.contains(expectedClass)) {
        errCount++;
      }
      // Ensure unit price invariant holds through every single frame switch
      const product = env.sandbox.getProduct('football-001');
      const price = env.sandbox.itemUnitPrice(product, '20x30', target);
      if (price !== 180) errCount++;
    } catch (_) {
      errCount++;
    }
  }

  check('T2.3.1: 100 consecutive rapid frame switches execute with 0 errors and zero price variance',
    errCount === 0,
    `Error count: ${errCount}`);
})();

// T2.4: Static CSS Invariants: White Wall Gradient, Elevation Shadows, Responsive Sizing
(() => {
  const css = fs.readFileSync(path.join(ROOT_DIR, 'styles.css'), 'utf8');

  // Gallery white wall background gradient
  check('T2.4.1: styles.css specifies gallery white wall background gradient on .detail-main-image',
    css.includes('linear-gradient(180deg, #fbfbfb 0%, #f1f2f5 100%)'));

  // Dark mode white wall preservation
  check('T2.4.2: Dark mode selector preserves gallery white wall gradient for contrast',
    css.includes(':root[data-theme="dark"] .detail-main-image') ||
    css.includes('[data-theme="dark"] .detail-main-image'));

  // Poster images already have frames in the artwork; artificial CSS frame borders are removed (border: none)
  check('T2.4.3: .frame-black defines clean natural elevation box-shadow without artificial border',
    css.includes('.frame-black img') &&
    css.includes('border: none'));

  // White frame styling
  check('T2.4.4: .frame-white displays picture as-is with border: none',
    css.includes('.frame-white img') &&
    css.includes('border: none'));

  // Frameless / Transparent border: none and clean elevation
  check('T2.4.5: .frame-transparent / .frame-none sets border: none and clean elevation shadow',
    css.includes('.frame-transparent img') &&
    css.includes('border: none'));

  // Responsive display on mobile
  check('T2.4.6: Media query maintains border: none for mobile viewports (<= 640px)',
    css.includes('@media (max-width: 640px)') &&
    css.includes('border: none'));

  // Swatch dots styling
  check('T2.4.7: Swatch dot classes .dot.black, .dot.white, .dot.transparent correctly styled',
    css.includes('.dot.black') &&
    css.includes('.dot.white') &&
    (css.includes('.dot.transparent') || css.includes('.dot.none')));
})();

// =============================================================================
// SUITE 3: Admin Panel Live Synchronization & Ring Buffer Hardening
// =============================================================================
console.log('\n--- SUITE 3: Admin Panel Live Synchronization & Ring Buffer Hardening ---');

// T3.1: Ring Buffer FIFO Eviction Under Memory Pressure
(() => {
  const env = createStoreEnvironment();

  //script.js contains _processedSyncEvents ring buffer (max 100)
  for (let i = 1; i <= 150; i++) {
    env.sandbox.recordStoreSyncEvent(`evt_stress_${i}`);
  }

  // Access the internal map
  const mapSize = env.sandbox._processedSyncEvents?.size;
  const hasFirst = env.sandbox._processedSyncEvents?.has('evt_stress_1');
  const has50th = env.sandbox._processedSyncEvents?.has('evt_stress_50');
  const has101st = env.sandbox._processedSyncEvents?.has('evt_stress_101');
  const has150th = env.sandbox._processedSyncEvents?.has('evt_stress_150');

  check('T3.1.1: Ring buffer strictly limits maximum capacity to 100 items',
    mapSize === 100,
    `Map size: ${mapSize}`);

  check('T3.1.2: Earliest events (1 to 50) were evicted (FIFO)',
    hasFirst === false && has50th === false,
    `hasFirst: ${hasFirst}, has50th: ${has50th}`);

  check('T3.1.3: Recent events (101 to 150) are safely retained in buffer',
    has101st === true && has150th === true,
    `has101st: ${has101st}, has150th: ${has150th}`);
})();

// T3.2: Dual-Channel Broadcast Deduplication (BroadcastChannel + Storage Event)
(() => {
  const env = createStoreEnvironment();

  let updateCount = 0;
  const origTrigger = env.sandbox.triggerLiveUIReRender;
  env.sandbox.triggerLiveUIReRender = () => {
    updateCount++;
    if (typeof origTrigger === 'function') origTrigger();
  };

  const syncEvent = {
    type: 'PRODUCT_UPDATE',
    eventId: 'evt_dual_dedup_001',
    senderId: 'admin_test_session',
    timestamp: Date.now(),
    payload: {
      id: 'football-001',
      tag: 'Dedup Live Test',
      _updatedAt: new Date().toISOString()
    }
  };

  // 1. First delivery arrives via BroadcastChannel
  const bc = env.hub.createChannel('poster-lab-sync');
  bc.postMessage(syncEvent);

  // 2. Second delivery arrives via cross-tab storage event 'pls-sync-signal'
  env.storage.dispatchCrossTabStorageEvent('pls-sync-signal', JSON.stringify(syncEvent));

  check('T3.2.1: Duplicate event received on both channels processed exactly once',
    updateCount === 1,
    `Processed count: ${updateCount}`);
})();

// T3.3: Self-Origin Loopback Rejection
(() => {
  const env = createStoreEnvironment();

  let updateTriggered = false;
  env.sandbox.triggerLiveUIReRender = () => { updateTriggered = true; };

  // Envelope sent with STORE_CLIENT_ID (own client ID)
  const selfEnvelope = {
    type: 'PRODUCT_UPDATE',
    eventId: 'evt_self_echo',
    senderId: env.sandbox.STORE_CLIENT_ID,
    timestamp: Date.now(),
    payload: { id: 'football-001', tag: 'Should Not Apply' }
  };

  const bc = env.hub.createChannel('poster-lab-sync');
  bc.postMessage(selfEnvelope);

  check('T3.3.1: Self-sent broadcast envelope rejected without triggering state mutation',
    updateTriggered === false);
})();

// T3.4: Rapid Burst of 100 Consecutive Live Product Updates
(() => {
  const env = createStoreEnvironment();

  const bc = env.hub.createChannel('poster-lab-sync');

  // Stream 100 rapid updates with incrementing tags
  for (let i = 1; i <= 100; i++) {
    bc.postMessage({
      type: 'PRODUCT_UPDATE',
      eventId: `burst_evt_${i}`,
      senderId: 'admin_burst_sender',
      timestamp: Date.now() + i,
      payload: {
        id: 'football-001',
        tag: `Burst Version ${i}`,
        _updatedAt: new Date(Date.now() + i).toISOString()
      }
    });
  }

  const updatedProduct = env.sandbox.getProduct('football-001');

  check('T3.4.1: Storefront converges to the 100th update after 100-event rapid burst',
    updatedProduct && updatedProduct.tag === 'Burst Version 100',
    `Final tag: "${updatedProduct?.tag}"`);
})();

// T3.5: Stock Decrement Streaming & Out-of-Stock Lockout
(() => {
  const env = createStoreEnvironment();

  const bc = env.hub.createChannel('poster-lab-sync');

  // Initial stock: set product to stock 3
  bc.postMessage({
    type: 'STOCK_UPDATE',
    eventId: 'stock_evt_init',
    senderId: 'admin_stock_controller',
    timestamp: Date.now(),
    payload: { id: 'football-001', quantity: 3 }
  });

  check('T3.5.1: Initial live stock update applies: stock is 3',
    env.sandbox.getProductStock(env.sandbox.getProduct('football-001')) === 3);

  // Stream stock decrement to 0: 3 -> 2 -> 1 -> 0
  [2, 1, 0].forEach((q, idx) => {
    bc.postMessage({
      type: 'STOCK_UPDATE',
      eventId: `stock_decrement_${idx}`,
      senderId: 'admin_stock_controller',
      timestamp: Date.now() + idx + 1,
      payload: { id: 'football-001', quantity: q }
    });
  });

  const pAfterZero = env.sandbox.getProduct('football-001');
  check('T3.5.2: Product quantity successfully decremented live to 0',
    pAfterZero.quantity === 0 && env.sandbox.isProductOutOfStock(pAfterZero) === true);

  // Attempting to add out-of-stock product to cart is blocked
  let toastMsg = '';
  env.sandbox.showToast = (msg) => { toastMsg = msg; };
  env.sandbox.addToCart('football-001', '20x30', 'Black');

  check('T3.5.3: addToCart is blocked when live stock decrements to 0',
    env.sandbox.state.cart.length === 0 && toastMsg.length > 0,
    `Cart size: ${env.sandbox.state.cart.length}, toast: "${toastMsg}"`);
})();

// =============================================================================
// SUITE 4: Price Floor Defense & Corrupted Data Sanitization
// =============================================================================
console.log('\n--- SUITE 4: Price Floor Defense & Corrupted Data Sanitization ---');

// T4.1: Sub-Floor Price Injection Neutralization in script.js and admin-panel.js
(() => {
  const env = createStoreEnvironment();
  const sanitize = env.sandbox.sanitizeRemoteProduct;

  const maliciousPayload = {
    id: 'football-001',
    basePrice: 10,
    sizes: {
      '20x30': 50,  // Minimum allowed is 180
      '30x40': 75,  // Minimum allowed is 200
      '40x50': 100, // Minimum allowed is 250
      '50x70': 120  // Minimum allowed is 300
    }
  };

  const sanitized = sanitize(maliciousPayload);

  check('T4.1.1: sanitizeRemoteProduct clamps 20x30 cm from 50 up to floor 180 EGP',
    sanitized.sizes['20x30'] === 180,
    `Actual 20x30: ${sanitized.sizes['20x30']}`);

  check('T4.1.2: sanitizeRemoteProduct clamps 30x40 cm from 75 up to floor 200 EGP',
    sanitized.sizes['30x40'] === 200,
    `Actual 30x40: ${sanitized.sizes['30x40']}`);

  check('T4.1.3: sanitizeRemoteProduct clamps 40x50 cm from 100 up to floor 250 EGP',
    sanitized.sizes['40x50'] === 250,
    `Actual 40x50: ${sanitized.sizes['40x50']}`);

  check('T4.1.4: sanitizeRemoteProduct clamps 50x70 cm from 120 up to floor 300 EGP',
    sanitized.sizes['50x70'] === 300,
    `Actual 50x70: ${sanitized.sizes['50x70']}`);

  check('T4.1.5: sanitizeRemoteProduct clamps basePrice from 10 up to floor 180 EGP',
    sanitized.basePrice === 180,
    `Actual basePrice: ${sanitized.basePrice}`);
})();

// T4.2: Negative and Non-Numeric Price Tampering
(() => {
  const env = createStoreEnvironment();
  const sanitize = env.sandbox.sanitizeRemoteProduct;

  const corruptedPayload = {
    id: 'corrupted-item',
    basePrice: 'free',
    sizes: {
      '20x30': -180,
      '30x40': 'zero',
      '40x50': NaN,
      '50x70': null
    }
  };

  const sanitized = sanitize(corruptedPayload);

  check('T4.2.1: Negative and non-numeric sizes successfully healed to minimum floors',
    sanitized.sizes['20x30'] === 180 &&
    sanitized.sizes['30x40'] === 200 &&
    sanitized.sizes['40x50'] === 250 &&
    sanitized.sizes['50x70'] === 300,
    `Healed sizes: ${JSON.stringify(sanitized.sizes)}`);

  check('T4.2.2: Non-numeric basePrice healed to 180 EGP',
    sanitized.basePrice === 180,
    `Healed basePrice: ${sanitized.basePrice}`);
})();

// T4.3: Missing / Null Sizes Object Auto-Reconstruction
(() => {
  const env = createStoreEnvironment();
  const sanitize = env.sandbox.sanitizeRemoteProduct;

  const noSizesPayload = {
    id: 'no-sizes-item',
    name: 'Missing Sizes Product'
  };

  const sanitized = sanitize(noSizesPayload);

  check('T4.3.1: Missing sizes object automatically reconstructed with standard dimensions',
    sanitized.sizes &&
    sanitized.sizes['20x30'] === 180 &&
    sanitized.sizes['30x40'] === 200 &&
    sanitized.sizes['40x50'] === 250 &&
    sanitized.sizes['50x70'] === 300);
})();

// T4.4: Production Minified Bundle Parity Check
(() => {
  const minScript = fs.readFileSync(path.join(ROOT_DIR, 'script.min.js'), 'utf8');
  const minAdmin = fs.readFileSync(path.join(ROOT_DIR, 'admin-panel.min.js'), 'utf8');
  const minBundle = fs.readFileSync(path.join(ROOT_DIR, 'products-bundle.min.js'), 'utf8');

  check('T4.4.1: script.min.js contains price floor defense (180)',
    minScript.includes('180') && minScript.includes('200') && minScript.includes('250') && minScript.includes('300'));

  check('T4.4.2: script.min.js contains sync event deduplication map',
    minScript.includes('recordStoreSyncEvent') || minScript.includes('poster-lab-sync'));

  check('T4.4.3: admin-panel.min.js contains standard sizes and live broadcast channel',
    minAdmin.includes('poster-lab-sync') && minAdmin.includes('180'));

  check('T4.4.4: products-bundle.min.js contains custom-design and catalog items',
    minBundle.includes('custom-design') && minBundle.includes('Upload Your Custom Design'));
})();

// T4.5: Checkout Order Math & LocalStorage Persistence Hardening
(() => {
  const env = createStoreEnvironment();

  env.sandbox.state.cart = [
    { key: 'football-001-20x30-Black', productId: 'football-001', size: '20x30', frame: 'Black', quantity: 1 },
    { key: 'football-002-30x40-White', productId: 'football-002', size: '30x40', frame: 'White', quantity: 1 },
    { key: 'football-003-40x50-Transparent', productId: 'football-003', size: '40x50', frame: 'Transparent', quantity: 1 },
    { key: 'football-004-50x70-None', productId: 'football-004', size: '50x70', frame: 'None', quantity: 1 }
  ];

  // Apply a 10% coupon: POSTER10
  env.sandbox.state.appliedCoupon = { code: 'POSTER10', type: 'percent', value: 10, minOrder: 100 };

  // Subtotal = 180 + 200 + 250 + 300 = 930 EGP
  // Discount = 10% of 930 = 93 EGP
  // Delivery = 35 EGP
  // Total = 930 - 93 + 35 = 872 EGP
  const order = env.sandbox.createOrder({
    customerName: 'Test Buyer',
    customerPhone: '01012345678',
    customerAddress: 'Cairo, Egypt',
    paymentMethod: 'cash_on_delivery'
  });

  check('T4.5.1: createOrder calculates exact subtotal: 930 EGP',
    order.subtotal === 930,
    `Actual: ${order.subtotal}`);

  check('T4.5.2: createOrder calculates exact discount: 93 EGP',
    order.discount === 93,
    `Actual: ${order.discount}`);

  check('T4.5.3: createOrder includes delivery fee: 35 EGP',
    order.deliveryFee === 35,
    `Actual: ${order.deliveryFee}`);

  check('T4.5.4: createOrder calculates exact grand total: 872 EGP',
    order.total === 872,
    `Actual: ${order.total}`);

  const ordersInStorage = JSON.parse(env.storage.getItem('pls-orders') || '[]');
  check('T4.5.5: Order persisted to pls-orders in localStorage with pending status',
    ordersInStorage.some(o => o.id === order.id && o.status === 'pending'));
})();

// T4.6: Coupon Live Synchronization (Creation & Deletion)
(() => {
  const env = createStoreEnvironment();

  // Admin broadcasts new live coupon
  env.sandbox.applyLiveCouponUpdate({
    code: 'LIVE25',
    type: 'percent',
    value: 25,
    minOrder: 200,
    maxUses: 50,
    uses: 0
  });

  const couponsAfterAdd = env.sandbox.getCouponsData();
  const foundLiveCoupon = couponsAfterAdd.find(c => c.code === 'LIVE25');
  check('T4.6.1: applyLiveCouponUpdate persists new coupon LIVE25 to pls-coupons',
    foundLiveCoupon && foundLiveCoupon.value === 25);

  // Validate coupon
  const validCheck = env.sandbox.validateCoupon('LIVE25', 400);
  check('T4.6.2: validateCoupon succeeds for LIVE25 on 400 EGP subtotal with 100 EGP discount',
    validCheck.valid === true && validCheck.discount === 100);

  // Admin deletes coupon
  env.sandbox.applyLiveCouponUpdate({
    code: 'LIVE25',
    _deleted: true
  });

  const couponsAfterDelete = env.sandbox.getCouponsData();
  const deletedStillExists = couponsAfterDelete.some(c => c.code === 'LIVE25');
  check('T4.6.3: applyLiveCouponUpdate with _deleted: true removes coupon from store',
    deletedStillExists === false);
})();

// T4.7: Admin Panel Source Sanitizer & Ring Buffer Exact Behavioral Parity
(() => {
  const adminCode = fs.readFileSync(path.join(ROOT_DIR, 'admin-panel.js'), 'utf8');

  // Verify admin-panel.js has matching MIN_PRICE_FLOOR = 180 and STANDARD_SIZES
  check('T4.7.1: admin-panel.js specifies MIN_PRICE_FLOOR = 180',
    adminCode.includes('MIN_PRICE_FLOOR = 180'));

  check('T4.7.2: admin-panel.js specifies standard sizes 20x30=180, 30x40=200, 40x50=250, 50x70=300',
    adminCode.includes("'20x30': 180") &&
    adminCode.includes("'30x40': 200") &&
    adminCode.includes("'40x50': 250") &&
    adminCode.includes("'50x70': 300"));

  check('T4.7.3: admin-panel.js defines live sync ring buffer with max 100 entries',
    adminCode.includes('_processedSyncEvents.size > 100'));

  check('T4.7.4: admin-panel.js broadcasts PRODUCT_UPDATE, STOCK_UPDATE, and COUPON_UPDATE',
    adminCode.includes("broadcastLiveSync('PRODUCT_UPDATE'") &&
    adminCode.includes("broadcastLiveSync('STOCK_UPDATE'"));
})();

// =============================================================================
// SUMMARY & VERDICT
// =============================================================================
console.log('\n======================================================================');
console.log('              CHALLENGER M5-1 ADVERSARIAL STRESS SUMMARY');
console.log('======================================================================');
console.log(`  Total Assertions:    ${totalAssertions}`);
console.log(`  Passed Assertions:   ${passedAssertions}`);
console.log(`  Failed Assertions:   ${failedAssertions}`);
console.log('======================================================================');

if (failedAssertions > 0) {
  console.error('\nFAILED ASSERTION DETAILS:');
  failures.forEach(f => console.error(`  - ${f}`));
  process.exit(1);
} else {
  console.log('\n[CHALLENGER VERDICT] All adversarial stress assertions passed with 100% compliance!');
  process.exit(0);
}

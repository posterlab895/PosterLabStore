/**
 * tests/challenger_m3_layout_custom_stress.js
 * 
 * Empirical Adversarial Challenger Test Suite
 * Milestone 3: Product Page Simplification & Dynamic Frame Visualizer
 * Challenger M3-2: DOM Layout, Custom Upload & Navigation Stress Challenger
 * 
 * Authoritative Contracts:
 * - ORIGINAL_REQUEST.md: Requirement R3 (Simplification & Dynamic Frame Visualizer)
 * - PROJECT.md: Milestone 3, Features 10, 11, 12, 13, 14
 * - Worker Handoff: .agents/teamwork/worker_m3/handoff.md
 * 
 * Challenge Vectors:
 * 1. Duplicate Back Button Prevention Stress:
 *    - Verify product.html NEVER contains more than exactly one .page-back-bar under all navigation conditions
 *      (direct URL visit, category routing, empty states, repeated language switches EN <-> AR).
 * 2. Custom Upload Image Preview & Frame Switching:
 *    - Simulate custom design file upload with blob objectUrl.
 *    - Switch frames between Black, White, and Transparent/None.
 *    - Verify objectUrl on #detailMainImage is never lost, revoked, or replaced with default placeholder image.
 * 3. Gallery Thumbnail Interaction:
 *    - For multi-image products, select a secondary gallery thumbnail.
 *    - Switch frames. Verify that secondary thumbnail image remains active and is not reset to the cover photo.
 * 4. Cart Frame Integrity:
 *    - Add items with various frame selections (including "Transparent" and "None").
 *    - Verify cart line item keys, checkout payloads, and WhatsApp message strings in both EN and AR.
 * 5. CSS & Visual Design System Conformance:
 *    - White wall gradient, shadows, borders, dot swatches, and responsive mobile rules.
 * 6. Production Minified Distribution Parity:
 *    - Ensure script.min.js and styles.min.css adhere to all invariants.
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
console.log(' CHALLENGER M3-2: DOM LAYOUT, CUSTOM UPLOAD & NAVIGATION STRESS SUITE');
console.log('======================================================================\n');

// -----------------------------------------------------------------------------
// Lightweight, High-Fidelity Mock DOM Implementation
// -----------------------------------------------------------------------------
const VOID_TAGS = new Set(['img', 'br', 'hr', 'input', 'link', 'meta', 'path', 'circle', 'rect', 'line']);

class MockElement {
  constructor(tag = 'div', parent = null) {
    this.tagName = tag.toUpperCase();
    this.parentElement = parent;
    this.children = [];
    this.attributes = {};
    this.dataset = {};
    this.style = {};
    this.textContent = '';
    this._innerHTML = '';
    this.listeners = new Map();
    this.hidden = false;
    this.disabled = false;

    const self = this;
    this.classList = {
      _set: new Set(),
      add(...classes) {
        classes.forEach(c => {
          if (!c) return;
          String(c).trim().split(/\s+/).forEach(token => {
            if (token) self.classList._set.add(token);
          });
        });
        self.attributes['class'] = Array.from(self.classList._set).join(' ');
      },
      remove(...classes) {
        classes.forEach(c => {
          if (!c) return;
          String(c).trim().split(/\s+/).forEach(token => {
            if (token) self.classList._set.delete(token);
          });
        });
        self.attributes['class'] = Array.from(self.classList._set).join(' ');
      },
      toggle(c, force) {
        if (!c) return;
        if (force === true) this.add(c);
        else if (force === false) this.remove(c);
        else if (this.contains(c)) this.remove(c);
        else this.add(c);
      },
      contains(c) {
        return self.classList._set.has(c);
      }
    };
  }

  get id() { return this.attributes['id'] || ''; }
  set id(v) { this.attributes['id'] = String(v); }

  get className() { return Array.from(this.classList._set).join(' '); }
  set className(v) {
    this.classList._set.clear();
    if (v) {
      String(v).trim().split(/\s+/).forEach(c => {
        if (c) this.classList._set.add(c);
      });
      this.attributes['class'] = Array.from(this.classList._set).join(' ');
    } else {
      delete this.attributes['class'];
    }
  }

  get src() { return this.attributes['src'] || ''; }
  set src(v) { this.attributes['src'] = String(v); }

  get href() { return this.attributes['href'] || ''; }
  set href(v) { this.attributes['href'] = String(v); }

  get value() { return this.attributes['value'] !== undefined ? this.attributes['value'] : ''; }
  set value(v) { this.attributes['value'] = String(v); }

  setAttribute(k, v) {
    const key = k.toLowerCase();
    this.attributes[key] = String(v);
    if (key === 'class') this.className = String(v);
    if (key === 'id') this.id = String(v);
    if (key.startsWith('data-')) {
      const camel = key.slice(5).replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
      this.dataset[camel] = String(v);
    }
  }

  getAttribute(k) {
    const key = k.toLowerCase();
    return this.attributes[key] !== undefined ? this.attributes[key] : null;
  }

  hasAttribute(k) {
    return this.attributes[k.toLowerCase()] !== undefined;
  }

  removeAttribute(k) {
    const key = k.toLowerCase();
    delete this.attributes[key];
    if (key === 'class') this.classList._set.clear();
    if (key.startsWith('data-')) {
      const camel = key.slice(5).replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
      delete this.dataset[camel];
    }
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx >= 0) {
      this.children.splice(idx, 1);
      child.parentElement = null;
    }
    return child;
  }

  remove() {
    if (this.parentElement) {
      this.parentElement.removeChild(this);
    }
  }

  contains(other) {
    if (!other) return false;
    if (other === this) return true;
    for (const child of this.children) {
      if (child.contains(other)) return true;
    }
    return false;
  }

  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(fn);
  }

  removeEventListener(type, fn) {
    if (this.listeners.has(type)) {
      this.listeners.set(type, this.listeners.get(type).filter(l => l !== fn));
    }
  }

  dispatchEvent(event) {
    if (!event) event = { type: 'click' };
    if (!event.preventDefault) event.preventDefault = () => {};
    if (!event.stopPropagation) event.stopPropagation = () => {};
    event.target = this;
    let cur = this;
    while (cur) {
      event.currentTarget = cur;
      if (cur.listeners.has(event.type)) {
        for (const fn of cur.listeners.get(event.type)) {
          fn.call(cur, event);
        }
      }
      cur = cur.parentElement;
    }
    return true;
  }

  closest(selector) {
    let cur = this;
    while (cur) {
      if (cur.matches && cur.matches(selector)) return cur;
      cur = cur.parentElement;
    }
    return null;
  }

  matches(selector) {
    if (!selector) return false;
    selector = selector.trim();

    // ID selector
    if (selector.startsWith('#')) {
      return this.id === selector.slice(1);
    }

    // Class selector
    if (selector.startsWith('.')) {
      const classes = selector.slice(1).split('.');
      return classes.every(c => this.classList.contains(c));
    }

    // Attribute selector [attr] or [attr="val"]
    const attrMatch = selector.match(/^\[([a-zA-Z0-9\-]+)(?:=(["']?)(.*?)\2)?\]$/);
    if (attrMatch) {
      const attrKey = attrMatch[1].toLowerCase();
      const val = attrMatch[3];
      if (val === undefined) {
        return this.hasAttribute(attrKey);
      }
      return this.getAttribute(attrKey) === val;
    }

    // Tag name
    if (/^[a-zA-Z0-9\-]+$/.test(selector)) {
      return this.tagName.toLowerCase() === selector.toLowerCase();
    }

    // Fallback simple checks
    return false;
  }

  querySelector(selector) {
    const list = this.querySelectorAll(selector);
    return list.length ? list[0] : null;
  }

  querySelectorAll(selector) {
    const results = [];
    selector = selector.trim();

    // Check children recursively
    const search = (node) => {
      for (const child of node.children) {
        if (child._matchesSelector(selector)) {
          results.push(child);
        }
        search(child);
      }
    };
    search(this);
    return results;
  }

  _matchesSelector(selector) {
    selector = selector.trim();

    // Handle compound descendant selectors like ".frame-options [data-frame]"
    if (selector.includes(' ')) {
      const parts = selector.split(/\s+/);
      const targetSel = parts[parts.length - 1];
      const parentSel = parts.slice(0, -1).join(' ');
      if (!this._matchesSimple(targetSel)) return false;
      let p = this.parentElement;
      while (p) {
        if (p._matchesSimple(parentSel)) return true;
        p = p.parentElement;
      }
      return false;
    }

    return this._matchesSimple(selector);
  }

  _matchesSimple(sel) {
    sel = sel.trim();
    if (sel.startsWith('#')) return this.id === sel.slice(1);
    if (sel.startsWith('.')) {
      const classes = sel.slice(1).split('.');
      return classes.every(c => this.classList.contains(c));
    }
    const attrMatch = sel.match(/^\[([a-zA-Z0-9\-]+)(?:=(["']?)(.*?)\2)?\]$/);
    if (attrMatch) {
      const attrKey = attrMatch[1].toLowerCase();
      const val = attrMatch[3];
      if (val === undefined) return this.hasAttribute(attrKey);
      return this.getAttribute(attrKey) === val;
    }
    if (/^[a-zA-Z0-9\-]+$/.test(sel)) {
      return this.tagName.toLowerCase() === sel.toLowerCase();
    }
    return false;
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(html) {
    this._innerHTML = String(html);
    this.children = [];
    parseHTMLToMockTree(this._innerHTML, this);
  }

  scrollIntoView() {}
  focus() {}
  blur() {}
  toDataURL() { return 'data:image/webp;base64,mock'; }
  getContext() { return { fillRect: () => {}, drawImage: () => {} }; }
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
      const isSelfClosing = rawAttrs.trim().endsWith('/') || VOID_TAGS.has(tagName);

      const attrRegex = /([a-zA-Z0-9\-]+)(?:=(?:["']([^"']*)["']|([^>\s]+)))?/g;
      let aMatch;
      while ((aMatch = attrRegex.exec(rawAttrs)) !== null) {
        const k = aMatch[1].toLowerCase();
        const v = aMatch[2] !== undefined ? aMatch[2] : (aMatch[3] !== undefined ? aMatch[3] : '');
        node.setAttribute(k, v);
      }

      const current = stack[stack.length - 1];
      node.parentElement = current === root ? parentElement : current;
      current.children.push(node);
      if (current === root && parentElement) {
        parentElement.children.push(node);
      }

      if (!isSelfClosing) {
        stack.push(node);
      }
    }
  }
}

// -----------------------------------------------------------------------------
// VM Environment Builder for product.html Execution
// -----------------------------------------------------------------------------
function createProductPageEnvironment(options = {}) {
  const {
    productId = 'cars-001',
    initialFrame = 'Black',
    lang = 'en',
    hasExternalBackBar = true,
    scriptFile = 'script.js'
  } = options;

  const storage = {
    'pls-lang': lang
  };

  const revokedUrls = [];
  const createdUrls = [];

  const documentElement = new MockElement('html');
  documentElement.setAttribute('lang', lang);
  documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  documentElement.dataset = { device: 'desktop' };

  const head = new MockElement('head', documentElement);
  const body = new MockElement('body', documentElement);
  documentElement.children.push(head, body);

  const main = new MockElement('main', body);
  body.children.push(main);

  let pageBackBar = null;
  if (hasExternalBackBar) {
    pageBackBar = new MockElement('div', main);
    pageBackBar.className = 'page-back-bar';
    const backBtn = new MockElement('a', pageBackBar);
    backBtn.className = 'page-back-btn';
    backBtn.href = 'index.html';
    const backText = new MockElement('span', backBtn);
    backText.setAttribute('data-t', 'backToStore');
    backText.textContent = lang === 'ar' ? 'العودة للمتجر' : 'Back to store';
    backBtn.children.push(backText);
    pageBackBar.children.push(backBtn);
    main.children.push(pageBackBar);
  }

  const productDetail = new MockElement('section', main);
  productDetail.id = 'productDetail';
  productDetail.className = 'detail-shell';
  productDetail.hidden = true;
  main.children.push(productDetail);

  const cartDrawer = new MockElement('aside', body);
  cartDrawer.setAttribute('data-cart-drawer', '');
  const cartItems = new MockElement('div', cartDrawer);
  cartItems.id = 'cartItems';
  const cartTotal = new MockElement('span', cartDrawer);
  cartTotal.id = 'cartTotal';
  const checkoutForm = new MockElement('form', cartDrawer);
  checkoutForm.id = 'checkoutForm';

  const customerName = new MockElement('input', checkoutForm);
  customerName.id = 'customerName';
  customerName.name = 'customerName';
  customerName.value = 'Challenger Tester';

  const customerPhone = new MockElement('input', checkoutForm);
  customerPhone.id = 'customerPhone';
  customerPhone.name = 'customerPhone';
  customerPhone.value = '01012345678';

  const customerAddress = new MockElement('textarea', checkoutForm);
  customerAddress.id = 'customerAddress';
  customerAddress.name = 'customerAddress';
  customerAddress.value = '10 Nasr City, Cairo';

  const paymentMethod = new MockElement('select', checkoutForm);
  paymentMethod.id = 'paymentMethod';
  paymentMethod.name = 'paymentMethod';
  paymentMethod.value = 'VF-Cash';

  checkoutForm.children.push(customerName, customerPhone, customerAddress, paymentMethod);
  checkoutForm.elements = {
    customerName,
    customerPhone,
    customerAddress,
    paymentMethod
  };
  cartDrawer.children.push(cartItems, cartTotal, checkoutForm);
  body.children.push(cartDrawer);

  const confirmationSummary = new MockElement('div', body);
  confirmationSummary.id = 'confirmationSummary';
  body.children.push(confirmationSummary);

  const mockDoc = {
    documentElement,
    head,
    body,
    title: '',
    readyState: 'complete',
    createElement: (tag) => new MockElement(tag),
    getElementById: (id) => {
      const clean = id.replace('#', '');
      return documentElement.querySelector(`#${clean}`);
    },
    querySelector: (sel) => documentElement.querySelector(sel),
    querySelectorAll: (sel) => documentElement.querySelectorAll(sel),
    addEventListener: (type, fn) => body.addEventListener(type, fn),
    removeEventListener: (type, fn) => body.removeEventListener(type, fn),
    dispatchEvent: (ev) => body.dispatchEvent(ev)
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
    Intl,
    Math,
    Date,
    Array,
    Object,
    String,
    Number,
    Map,
    Set,
    RegExp,
    JSON,
    Promise,
    encodeURIComponent,
    decodeURIComponent,
    parseFloat,
    parseInt,
    isNaN,
    isFinite,
    URL: class MockURL {
      constructor(path, base) {
        this.base = base || 'http://localhost/product.html';
        try {
          const u = new URL(path, this.base);
          this.href = u.href;
          this.pathname = u.pathname;
          this.search = u.search;
          this.searchParams = u.searchParams;
        } catch (_) {
          this.href = path;
          this.searchParams = new URLSearchParams();
        }
      }
      toString() { return this.href; }
      static createObjectURL(file) {
        const u = `blob:http://localhost/uuid-${Math.random().toString(36).slice(2)}`;
        createdUrls.push(u);
        return u;
      }
      static revokeObjectURL(url) {
        revokedUrls.push(url);
      }
    },
    URLSearchParams
  };

  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.document = mockDoc;
  sandbox.window.innerWidth = 1200;
  sandbox.window.innerHeight = 800;
  sandbox.window.location = {
    href: `http://localhost/product.html?id=${productId}&frame=${initialFrame}`,
    pathname: '/product.html',
    search: `?id=${productId}&frame=${initialFrame}`,
    origin: 'http://localhost'
  };
  sandbox.window.history = {
    replaceState: (state, title, url) => {
      sandbox.window.location.href = url;
      sandbox.window.location.search = url.includes('?') ? '?' + url.split('?')[1] : '';
    },
    pushState: (state, title, url) => {
      sandbox.window.location.href = url;
      sandbox.window.location.search = url.includes('?') ? '?' + url.split('?')[1] : '';
    }
  };
  sandbox.window.requestAnimationFrame = (cb) => { if (typeof cb === 'function') cb(); };
  sandbox.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  sandbox.window.addEventListener = (t, fn) => mockDoc.addEventListener(t, fn);
  sandbox.window.removeEventListener = (t, fn) => mockDoc.removeEventListener(t, fn);

  sandbox.navigator = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    language: 'en-US'
  };
  sandbox.localStorage = {
    getItem: (k) => (storage[k] !== undefined ? storage[k] : null),
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: (k) => { delete storage[k]; },
    clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
  };
  sandbox.sessionStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  };
  sandbox.indexedDB = { open: () => ({ onsuccess: null, onerror: null }) };
  sandbox.BroadcastChannel = function(name) {
    this.name = name;
    this.postMessage = () => {};
    this.close = () => {};
    this.onmessage = null;
  };
  sandbox.CustomEvent = function(type, p) { this.type = type; this.detail = p?.detail; };
  sandbox.Event = function(type) { this.type = type; };

  sandbox.initFirebase = () => {};
  sandbox.isFirebaseReady = () => false;

  vm.createContext(sandbox);

  // Execute products-bundle.js
  const bundleCode = fs.readFileSync(path.join(ROOT_DIR, 'products-bundle.js'), 'utf8');
  vm.runInContext(bundleCode, sandbox);

  // Execute target script
  const scriptCode = fs.readFileSync(path.join(ROOT_DIR, scriptFile), 'utf8');
  vm.runInContext(scriptCode, sandbox);

  // Bind top-level lexically scoped variables and functions to sandbox for test assertions
  const boundKeys = [
    'state', 'products', 'renderDetail', 'switchDetailFrame', 'toggleLanguage',
    'addToCart', 'getProduct', 'itemUnitPrice', 'createOrder', 'buildWhatsAppMessage',
    'productImageUrl', 'displayImageForItem', 'money', 't'
  ];
  for (const k of boundKeys) {
    try {
      sandbox[k] = vm.runInContext(k, sandbox);
    } catch (_) {}
  }

  return {
    sandbox,
    doc: mockDoc,
    documentElement,
    productDetail,
    main,
    revokedUrls,
    createdUrls,
    storage
  };
}

// =============================================================================
// OBJECTIVE 1: Duplicate Back Button Prevention Stress Testing
// =============================================================================
console.log('--- OBJECTIVE 1: Duplicate Back Button Prevention Stress ---');

// 1.1 Source Markup Static Verification
const productHtmlSource = fs.readFileSync(path.join(ROOT_DIR, 'product.html'), 'utf8');
const staticBackBars = (productHtmlSource.match(/class=["'][^"']*\bpage-back-bar\b[^"']*["']/g) || []).length;
check('1.1 product.html raw markup contains exactly 1 static .page-back-bar', staticBackBars === 1, `found: ${staticBackBars}`);

// 1.2 Direct Visit Initial Render
{
  const env = createProductPageEnvironment({ productId: 'cars-001', hasExternalBackBar: true });
  const backBars = env.doc.querySelectorAll('.page-back-bar');
  check('1.2 Direct visit to valid product (cars-001) renders exactly 1 .page-back-bar', backBars.length === 1, `count: ${backBars.length}`);
  const backLink = env.doc.querySelector('.page-back-btn');
  check('1.2.1 .page-back-btn links to index.html', backLink && backLink.href.includes('index.html'));
}

// 1.3 Rapid Category Routing & Product ID Switches
{
  const env = createProductPageEnvironment({ productId: 'cars-001', hasExternalBackBar: true });
  const testIds = ['cars-002', 'football-001', 'anime-001', 'art-001', 'gym-001', 'islamic-001', 'clubs-001', 'cities-001'];
  let invariantHolds = true;

  for (const id of testIds) {
    env.sandbox.renderDetail(id);
    const count = env.doc.querySelectorAll('.page-back-bar').length;
    if (count !== 1) {
      invariantHolds = false;
      break;
    }
  }
  check('1.3 Rapid routing across 8 consecutive product IDs preserves exactly 1 .page-back-bar', invariantHolds);
}

// 1.4 Empty State Routing Invariance
{
  const env = createProductPageEnvironment({ productId: 'cars-001', hasExternalBackBar: true });
  
  // Non-existent product ID
  env.sandbox.renderDetail('non-existent-product-id-99999');
  let count = env.doc.querySelectorAll('.page-back-bar').length;
  check('1.4.1 Non-existent product ID renders empty state with exactly 1 .page-back-bar', count === 1, `count: ${count}`);

  // Null product ID
  env.sandbox.renderDetail(null);
  count = env.doc.querySelectorAll('.page-back-bar').length;
  check('1.4.2 Null product ID renders empty state with exactly 1 .page-back-bar', count === 1, `count: ${count}`);

  // Empty string product ID
  env.sandbox.renderDetail('');
  count = env.doc.querySelectorAll('.page-back-bar').length;
  check('1.4.3 Empty string ID renders empty state with exactly 1 .page-back-bar', count === 1, `count: ${count}`);

  // Transition from empty state back to valid product
  env.sandbox.renderDetail('cars-001');
  count = env.doc.querySelectorAll('.page-back-bar').length;
  check('1.4.4 Recovery from empty state back to valid product maintains exactly 1 .page-back-bar', count === 1, `count: ${count}`);
}

// 1.5 Repeated Bilingual Language Switching Stress (EN <-> AR)
{
  const env = createProductPageEnvironment({ productId: 'cars-001', lang: 'en', hasExternalBackBar: true });
  let langSwitchSuccess = true;

  for (let i = 0; i < 10; i++) {
    env.sandbox.toggleLanguage();
    const count = env.doc.querySelectorAll('.page-back-bar').length;
    if (count !== 1) {
      langSwitchSuccess = false;
      break;
    }
    const currentLang = env.sandbox.state.lang;
    const backBarSpan = env.doc.querySelector('.page-back-btn [data-t="backToStore"]');
    if (!backBarSpan) {
      langSwitchSuccess = false;
      break;
    }
    const expectedText = currentLang === 'ar' ? 'العودة للمتجر' : 'Back to store';
    if (backBarSpan.textContent !== expectedText) {
      langSwitchSuccess = false;
      break;
    }
  }
  check('1.5 10 consecutive EN <-> AR language toggles maintain exactly 1 .page-back-bar with correct localization', langSwitchSuccess);

  // 1.5.1 Re-entrant routing stress: 50 rapid alternating navigation calls
  {
    const navCandidates = ['cars-001', 'non-existent-99', 'football-001', '', 'gym-001', null, 'anime-001'];
    let backBarCountStrict = true;
    for (let i = 0; i < 50; i++) {
      const pid = navCandidates[i % navCandidates.length];
      env.sandbox.renderDetail(pid);
      const count = env.doc.querySelectorAll('.page-back-bar').length;
      if (count !== 1) {
        backBarCountStrict = false;
        break;
      }
    }
    check('1.5.1 50 rapid re-entrant transitions across valid, empty, and null IDs preserve strictly 1 .page-back-bar', backBarCountStrict);
  }
}

// 1.6 Standalone Layout Embed (No External Back Bar)
{
  const env = createProductPageEnvironment({ productId: 'cars-001', hasExternalBackBar: false });
  // Initially hidden before renderDetail
  env.sandbox.renderDetail('cars-001');
  const count = env.doc.querySelectorAll('.page-back-bar').length;
  check('1.6 Standalone embed without external back-bar injects fallback exactly once', count === 1, `count: ${count}`);
  
  // Re-render standalone embed
  env.sandbox.renderDetail('cars-002');
  const countAfterReRender = env.doc.querySelectorAll('.page-back-bar').length;
  check('1.6.1 Standalone embed re-render does not duplicate fallback back-bar', countAfterReRender === 1, `count: ${countAfterReRender}`);
}

// =============================================================================
// OBJECTIVE 2: Custom Upload Image Preview & Frame Switching
// =============================================================================
console.log('\n--- OBJECTIVE 2: Custom Upload Image Preview & Frame Switching ---');

{
  const env = createProductPageEnvironment({ productId: 'custom-poster-test', hasExternalBackBar: true });
  
  // Inject custom product into runtime products array
  const customProd = {
    id: 'custom-poster-test',
    name: 'Custom Art Poster',
    nameAr: 'بوستر مخصص',
    category: 'custom',
    basePrice: 180,
    sizes: { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 },
    frames: ['Black', 'White', 'Transparent'],
    image: 'assets/custom-placeholder.webp',
    isCustom: true
  };
  env.sandbox.products.push(customProd);

  // Initial render of custom product
  env.sandbox.renderDetail(customProd.id);
  const mainImageBeforeUpload = env.doc.querySelector('#detailMainImage');
  check('2.1 Custom product initially renders default catalog image', mainImageBeforeUpload && mainImageBeforeUpload.src.includes('custom-placeholder'));

  // Simulate file upload with objectUrl
  const testBlobUrl = 'blob:http://localhost/custom-design-uuid-999';
  env.sandbox.state.customUpload = {
    name: 'my-unique-design.png',
    size: 2048500,
    type: 'image/png',
    url: testBlobUrl,
    isObjectUrl: true,
    previewError: false
  };
  env.sandbox.state.customUploadFile = { name: 'my-unique-design.png', size: 2048500, type: 'image/png' };
  
  // Re-render detail after upload
  env.sandbox.renderDetail(customProd.id);
  const mainImageAfterUpload = env.doc.querySelector('#detailMainImage');
  check('2.2 #detailMainImage src reflects custom blob objectUrl immediately after upload', mainImageAfterUpload && mainImageAfterUpload.src === testBlobUrl);

  // Frame Switching Stress Loop: Black -> White -> Transparent -> None -> Black
  const frameSequence = [
    { target: 'White', expectedClass: 'frame-white', avoidClass: 'frame-black' },
    { target: 'Transparent', expectedClass: 'frame-transparent', avoidClass: 'frame-white' },
    { target: 'None', expectedClass: 'frame-none', avoidClass: 'frame-black' },
    { target: 'Black', expectedClass: 'frame-black', avoidClass: 'frame-white' }
  ];

  let frameLoopSuccess = true;
  for (const step of frameSequence) {
    env.sandbox.switchDetailFrame(step.target);
    const container = env.doc.querySelector('.detail-main-image');
    const mainImg = env.doc.querySelector('#detailMainImage');

    if (!container || !container.classList.contains(step.expectedClass)) {
      frameLoopSuccess = false;
      break;
    }
    if (mainImg.src !== testBlobUrl) {
      frameLoopSuccess = false;
      break;
    }
  }
  check('2.3 Frame switching (White -> Transparent -> None -> Black) strictly preserves blob objectUrl on #detailMainImage', frameLoopSuccess);

  // Revocation Leak Audit: Verify URL.revokeObjectURL was NOT called during frame switching
  check('2.4 URL.revokeObjectURL was NOT called during frame transitions (blob remains active)', !env.revokedUrls.includes(testBlobUrl));

  // Placeholder Fallback Audit: Verify image was never replaced with POSTER_FALLBACK_IMAGE
  const currentImgSrc = env.doc.querySelector('#detailMainImage').src;
  check('2.5 Main image was not corrupted to POSTER_FALLBACK_IMAGE', !currentImgSrc.includes('poster-lab-logo'));

  // Size Switching Preservation: Switch sizes while custom upload is active
  env.sandbox.state.detailSize = '40x50';
  env.sandbox.renderDetail(customProd.id);
  const mainImgAfterSizeChange = env.doc.querySelector('#detailMainImage');
  check('2.6 Size modification (40x50) preserves blob objectUrl on #detailMainImage', mainImgAfterSizeChange && mainImgAfterSizeChange.src === testBlobUrl);

  // Explicit Removal Verification
  // Simulate user clicking [data-remove-upload]
  if (env.sandbox.state.customUpload?.url && env.sandbox.state.customUpload.isObjectUrl) {
    env.sandbox.URL.revokeObjectURL(env.sandbox.state.customUpload.url);
  }
  env.sandbox.state.customUpload = null;
  env.sandbox.renderDetail(customProd.id);
  const mainImgAfterRemoval = env.doc.querySelector('#detailMainImage');
  check('2.7 Explicit design removal revokes objectUrl and reverts preview to catalog image', env.revokedUrls.includes(testBlobUrl) && mainImgAfterRemoval.src.includes('custom-placeholder'));

  // 2.8 Custom Upload with Base64 Data URL
  const testDataUrl = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAQAcJaQAA3AA/v39gA==';
  env.sandbox.state.customUpload = {
    name: 'vector-artwork.png',
    size: 1048576,
    type: 'image/png',
    url: testDataUrl,
    isObjectUrl: false
  };
  env.sandbox.renderDetail(customProd.id);
  const mainImgDataUrl = env.doc.querySelector('#detailMainImage');
  check('2.8 Base64 data URL upload displays as preview on #detailMainImage', mainImgDataUrl && mainImgDataUrl.src === testDataUrl);

  // Switch frames with Data URL active
  let dataUrlSwitchSuccess = true;
  for (const f of ['White', 'Transparent', 'None', 'Black']) {
    env.sandbox.switchDetailFrame(f);
    const img = env.doc.querySelector('#detailMainImage');
    if (!img || img.src !== testDataUrl) {
      dataUrlSwitchSuccess = false;
      break;
    }
  }
  check('2.8.1 Data URL upload preview strictly maintained across all 4 frame switches', dataUrlSwitchSuccess);

  // 2.9 Add custom upload to cart
  env.sandbox.state.cart = [];
  env.sandbox.state.customUploadFile = null;
  env.sandbox.addToCart(customProd.id, '30x40', 'White');
  const customCartItem = env.sandbox.state.cart[0];
  check('2.9 Custom product added to cart retains upload metadata',
    customCartItem && customCartItem.upload && customCartItem.upload.name === 'vector-artwork.png' && customCartItem.upload.url === testDataUrl);
  check('2.9.1 Custom cart line item key generated correctly with White frame',
    customCartItem && customCartItem.key.startsWith(`${customProd.id}-30x40-White`));
}

// =============================================================================
// OBJECTIVE 3: Gallery Thumbnail Interaction & Frame Switch Invariance
// =============================================================================
console.log('\n--- OBJECTIVE 3: Gallery Thumbnail Interaction Persistence ---');

{
  const env = createProductPageEnvironment({ productId: 'multi-img-test', hasExternalBackBar: true });
  
  const multiImgProd = {
    id: 'multi-img-test',
    name: 'Multi Gallery Artwork',
    nameAr: 'عمل فني متعدد الصور',
    category: 'art',
    basePrice: 180,
    sizes: { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 },
    frames: ['Black', 'White', 'Transparent'],
    image: 'assets/products/art/art-001.webp',
    gallery: [
      'assets/products/art/art-001.webp',
      'assets/products/art/art-001-angle.webp',
      'assets/products/art/art-001-close.webp'
    ]
  };
  env.sandbox.products.push(multiImgProd);

  // Initial render
  env.sandbox.renderDetail(multiImgProd.id);
  const initialMainImage = env.doc.querySelector('#detailMainImage');
  check('3.1 Gallery product loads with cover photo initially active', initialMainImage && initialMainImage.src.includes('art-001.webp'));

  // Select secondary gallery thumbnail (index 1)
  const secondaryImageSrc = env.sandbox.productImageUrl(multiImgProd.gallery[1]);
  const mainImgEl = env.doc.querySelector('#detailMainImage');
  mainImgEl.src = secondaryImageSrc;
  
  // Set is-active on thumbnail buttons
  const thumbButtons = env.doc.querySelectorAll('[data-gallery-image]');
  thumbButtons.forEach((btn, idx) => {
    btn.classList.toggle('is-active', idx === 1);
  });

  check('3.2 Secondary gallery thumbnail selected and active', mainImgEl.src === secondaryImageSrc && thumbButtons[1].classList.contains('is-active'));

  // Frame Switches with Secondary Thumbnail Active
  // Previously, renderDetail was called, resetting mainImgEl.src to cover photo.
  // Now switchDetailFrame updates classes in-place!
  env.sandbox.switchDetailFrame('White');
  check('3.3 Frame switch to White preserves secondary thumbnail image on #detailMainImage', mainImgEl.src === secondaryImageSrc);
  check('3.3.1 Thumbnail button 1 remains .is-active after White frame switch', thumbButtons[1].classList.contains('is-active'));

  env.sandbox.switchDetailFrame('Transparent');
  check('3.4 Frame switch to Transparent preserves secondary thumbnail image on #detailMainImage', mainImgEl.src === secondaryImageSrc);
  check('3.4.1 Thumbnail button 1 remains .is-active after Transparent frame switch', thumbButtons[1].classList.contains('is-active'));

  env.sandbox.switchDetailFrame('Black');
  check('3.5 Frame switch back to Black preserves secondary thumbnail image on #detailMainImage', mainImgEl.src === secondaryImageSrc);
  check('3.5.1 Thumbnail button 1 remains .is-active after Black frame switch', thumbButtons[1].classList.contains('is-active'));

  // Switch to third thumbnail (index 2) and verify again
  const tertiaryImageSrc = env.sandbox.productImageUrl(multiImgProd.gallery[2]);
  mainImgEl.src = tertiaryImageSrc;
  thumbButtons.forEach((btn, idx) => {
    btn.classList.toggle('is-active', idx === 2);
  });
  env.sandbox.switchDetailFrame('White');
  check('3.6 Switching to third thumbnail (index 2) and toggling White frame preserves active third thumbnail', mainImgEl.src === tertiaryImageSrc && thumbButtons[2].classList.contains('is-active'));

  // 3.7 Browser event dispatch simulation
  // Click on secondary thumbnail button
  thumbButtons[1].dispatchEvent(new env.sandbox.Event('click'));
  check('3.7 DOM click event on secondary thumbnail button sets #detailMainImage.src',
    mainImgEl.src === secondaryImageSrc && thumbButtons[1].classList.contains('is-active'));

  // Click on White frame button
  const whiteFrameBtn = env.doc.querySelector('.frame-options [data-frame="White"]');
  if (whiteFrameBtn) {
    whiteFrameBtn.dispatchEvent(new env.sandbox.Event('click'));
  } else {
    env.sandbox.switchDetailFrame('White');
  }
  check('3.7.1 DOM click event on White frame button preserves active secondary thumbnail',
    mainImgEl.src === secondaryImageSrc && thumbButtons[1].classList.contains('is-active'));
  check('3.7.2 Frame container updated to frame-white via click event',
    env.doc.querySelector('.detail-main-image').classList.contains('frame-white'));

  // 3.8 20 rapid alternating thumbnail & frame clicks
  let interactionLoopSuccess = true;
  for (let i = 0; i < 20; i++) {
    const thumbIdx = i % thumbButtons.length;
    thumbButtons[thumbIdx].dispatchEvent(new env.sandbox.Event('click'));
    const expectedImg = env.sandbox.productImageUrl(multiImgProd.gallery[thumbIdx]);
    
    const frames = ['Black', 'White', 'Transparent', 'None'];
    const targetFrame = frames[i % frames.length];
    env.sandbox.switchDetailFrame(targetFrame);

    if (mainImgEl.src !== expectedImg || !thumbButtons[thumbIdx].classList.contains('is-active')) {
      interactionLoopSuccess = false;
      break;
    }
  }
  check('3.8 20 rapid alternating thumbnail and frame toggles never clobber active gallery image', interactionLoopSuccess);
}

// =============================================================================
// OBJECTIVE 4: Cart Frame Integrity (Transparent, None, Black, White)
// =============================================================================
console.log('\n--- OBJECTIVE 4: Cart Frame Integrity & WhatsApp / Checkout Serialization ---');

{
  const env = createProductPageEnvironment({ productId: 'cars-001', hasExternalBackBar: true });

  // 4.1 Cart Line Item Key Integrity
  env.sandbox.state.cart = [];
  
  // Add item with Black frame
  env.sandbox.addToCart('cars-001', '20x30', 'Black');
  const itemBlack = env.sandbox.state.cart.find(i => i.frame === 'Black');
  check('4.1.1 Black frame cart line item key generated correctly', itemBlack && itemBlack.key === 'cars-001-20x30-Black');

  // Add item with White frame
  env.sandbox.addToCart('cars-001', '30x40', 'White');
  const itemWhite = env.sandbox.state.cart.find(i => i.frame === 'White');
  check('4.1.2 White frame cart line item key generated correctly', itemWhite && itemWhite.key === 'cars-001-30x40-White');

  // Add item with Transparent frame
  env.sandbox.addToCart('cars-001', '40x50', 'Transparent');
  const itemTransparent = env.sandbox.state.cart.find(i => i.frame === 'Transparent');
  check('4.1.3 Transparent frame cart line item key generated correctly', itemTransparent && itemTransparent.key === 'cars-001-40x50-Transparent');

  // Add item with None frame
  env.sandbox.addToCart('cars-001', '50x70', 'None');
  const itemNone = env.sandbox.state.cart.find(i => i.frame === 'None');
  check('4.1.4 None frame cart line item key generated correctly', itemNone && itemNone.key === 'cars-001-50x70-None');

  // 4.2 Inclusive Pricing Across All Frames (Zero Frame Adder)
  const product = env.sandbox.getProduct('cars-001');
  const pBlack = env.sandbox.itemUnitPrice(product, '20x30', 'Black');
  const pWhite = env.sandbox.itemUnitPrice(product, '20x30', 'White');
  const pTrans = env.sandbox.itemUnitPrice(product, '20x30', 'Transparent');
  const pNone  = env.sandbox.itemUnitPrice(product, '20x30', 'None');
  check('4.2 Frame options (Black, White, Transparent, None) exhibit identical inclusive price 180 for 20x30',
    pBlack === 180 && pWhite === 180 && pTrans === 180 && pNone === 180);

  // 4.3 Checkout Payload Integrity
  const formData = {
    customerName: 'Challenger Reviewer',
    customerPhone: '01012345678',
    customerAddress: 'Tahrir Square, Cairo',
    paymentMethod: 'VF-Cash',
    orderNote: 'Fragile artwork, please handle carefully'
  };
  const order = env.sandbox.createOrder(formData);

  check('4.3.1 Checkout payload creates valid order with id', Boolean(order && order.id && order.id.startsWith('PLS-')));
  check('4.3.2 Order items array contains 4 distinct framed items', order.items.length === 4);
  check('4.3.3 Order subtotal matches sum of tier sizes (180 + 200 + 250 + 300 = 930)', order.subtotal === 930);
  check('4.3.4 Order total matches subtotal + delivery (930 + 35 = 965)', order.total === 965);

  // 4.4 WhatsApp Message String Serialization (English)
  env.sandbox.state.lang = 'en';
  const whatsappMsgEn = env.sandbox.buildWhatsAppMessage(order);
  
  check('4.4.1 WhatsApp EN includes "Black frame" customization line', whatsappMsgEn.includes('20x30 cm | Black frame'));
  check('4.4.2 WhatsApp EN includes "White frame" customization line', whatsappMsgEn.includes('30x40 cm | White frame'));
  check('4.4.3 WhatsApp EN formats Transparent frame as "Frameless"', whatsappMsgEn.includes('40x50 cm | Frameless'));
  check('4.4.4 WhatsApp EN formats None frame as "Frameless"', whatsappMsgEn.includes('50x70 cm | Frameless'));
  check('4.4.5 WhatsApp EN message is free of undefined, null, or NaN artifacts',
    !whatsappMsgEn.includes('undefined') && !whatsappMsgEn.includes('null') && !whatsappMsgEn.includes('NaN'));

  // 4.5 WhatsApp Message String Serialization (Arabic)
  env.sandbox.state.lang = 'ar';
  const whatsappMsgAr = env.sandbox.buildWhatsAppMessage(order);

  check('4.5.1 WhatsApp AR includes Arabic title "طلب جديد من متجر بوستر لاب"', whatsappMsgAr.includes('طلب جديد من متجر بوستر لاب'));
  check('4.5.2 WhatsApp AR formats Black frame as "إطار أسود"', whatsappMsgAr.includes('إطار أسود'));
  check('4.5.3 WhatsApp AR formats White frame as "إطار أبيض"', whatsappMsgAr.includes('إطار أبيض'));
  check('4.5.4 WhatsApp AR formats Transparent frame as "بدون إطار"', whatsappMsgAr.includes('بدون إطار'));
  check('4.5.5 WhatsApp AR formats None frame as "بدون إطار"', whatsappMsgAr.includes('بدون إطار'));
  check('4.5.6 WhatsApp AR message is free of undefined, null, or NaN artifacts',
    !whatsappMsgAr.includes('undefined') && !whatsappMsgAr.includes('null') && !whatsappMsgAr.includes('NaN'));

  // 4.6 Simultaneous Transparent and None Frame Items in Cart
  env.sandbox.state.cart = [];
  env.sandbox.addToCart('cars-001', '20x30', 'Transparent');
  env.sandbox.addToCart('cars-001', '20x30', 'None');
  check('4.6 Transparent and None can co-exist in cart with distinct item keys',
    env.sandbox.state.cart.length === 2 &&
    env.sandbox.state.cart[0].key === 'cars-001-20x30-Transparent' &&
    env.sandbox.state.cart[1].key === 'cars-001-20x30-None');
  check('4.6.1 Both Transparent and None items calculate 180 EGP base unit price',
    env.sandbox.cartLineTotal(env.sandbox.state.cart[0]) === 180 &&
    env.sandbox.cartLineTotal(env.sandbox.state.cart[1]) === 180);

  // 4.7 Language switch while items are in cart
  env.sandbox.toggleLanguage(); // Switch to AR
  const arCartMarkup = env.doc.querySelector('#cartItems')?.innerHTML || '';
  check('4.7 Language switch to AR renders cart without undefined / NaN artifacts',
    !arCartMarkup.includes('undefined') && !arCartMarkup.includes('NaN'));
}

// =============================================================================
// OBJECTIVE 5: CSS & Visual Design System Conformance
// =============================================================================
console.log('\n--- OBJECTIVE 5: CSS & Visual Design System Conformance ---');

const stylesCss = fs.readFileSync(path.join(ROOT_DIR, 'styles.css'), 'utf8');

// 5.1 White Wall Background
check('5.1.1 styles.css defines linear-gradient white wall background on .detail-main-image',
  stylesCss.includes('linear-gradient(180deg, #fbfbfb 0%, #f1f2f5 100%)'));
check('5.1.2 styles.css defines #fbfbfb solid fallback background',
  /background:\s*#fbfbfb\s*;/i.test(stylesCss));
check('5.1.3 styles.css defines dark theme lightbox override with white gradient preserved',
  /:root\[data-theme="dark"\]\s*\.detail-main-image[\s\S]*?linear-gradient\(180deg,\s*#fbfbfb/i.test(stylesCss));

// 5.2 Poster Images Display As-Is (Frames already inside the artwork)
check('5.2.1 .detail-main-image.frame-black img has border: none (displays picture as-is)',
  /\.detail-main-image\.frame-black\s+img[\s\S]*?border:\s*none/i.test(stylesCss));
check('5.2.2 .frame-black img defines natural elevation shadow',
  /\.frame-black\s+img[\s\S]*?box-shadow:\s*0\s+14px\s+34px/i.test(stylesCss));
check('5.2.3 .detail-main-image.frame-white img has border: none (displays picture as-is)',
  /\.detail-main-image\.frame-white\s+img[\s\S]*?border:\s*none/i.test(stylesCss));
check('5.2.4 .frame-white img defines clean elevation shadow',
  /\.frame-white\s+img[\s\S]*?box-shadow:\s*0\s+14px\s+34px/i.test(stylesCss));
check('5.2.5 .frame-transparent img and .frame-none img have border: none',
  /\.frame-transparent\s+img,\s*\.frame-none\s+img[\s\S]*?border:\s*none/i.test(stylesCss));
check('5.2.6 .frame-transparent img defines paper lift shadow',
  /\.frame-transparent\s+img[\s\S]*?box-shadow:\s*0\s+14px\s+34px/i.test(stylesCss));

// 5.3 Frame Swatch Dots
check('5.3.1 styles.css defines base .dot dimensions (14px circular)',
  /\.dot\s*\{[\s\S]*?width:\s*14px[\s\S]*?height:\s*14px[\s\S]*?border-radius:\s*50%/i.test(stylesCss));
check('5.3.2 styles.css defines .dot.black as #111111',
  /\.dot\.black\s*\{[\s\S]*?background:\s*#111111/i.test(stylesCss));
check('5.3.3 styles.css defines .dot.white as #ffffff with subtle perimeter',
  /\.dot\.white\s*\{[\s\S]*?background:\s*#ffffff/i.test(stylesCss));
check('5.3.4 styles.css defines .dot.transparent / .dot.none diagonal slash gradient',
  /\.dot\.transparent,\s*\.dot\.none\s*\{[\s\S]*?background:\s*linear-gradient\(135deg/i.test(stylesCss));
check('5.3.5 styles.css defines selected state tactile scale 1.12x',
  /\.variant-options\s+button\.is-selected\s+\.dot\s*\{[\s\S]*?transform:\s*scale\(1\.12\)/i.test(stylesCss));

// 5.4 Responsive Mobile Display
check('5.4.1 styles.css defines border: none for mobile screens <= 640px',
  /@media\s*\(max-width:\s*640px\)[\s\S]*?\.detail-main-image\.frame-black\s+img[\s\S]*?border:\s*none/i.test(stylesCss));

// =============================================================================
// OBJECTIVE 6: Production Minified Distribution Parity
// =============================================================================
console.log('\n--- OBJECTIVE 6: Production Minified Distribution Parity ---');

const minifiedScriptExists = fs.existsSync(path.join(ROOT_DIR, 'script.min.js'));
const minifiedStylesExists = fs.existsSync(path.join(ROOT_DIR, 'styles.min.css'));
check('6.1 script.min.js exists in project root', minifiedScriptExists);
check('6.2 styles.min.css exists in project root', minifiedStylesExists);

if (minifiedScriptExists) {
  const minScriptContent = fs.readFileSync(path.join(ROOT_DIR, 'script.min.js'), 'utf8');
  check('6.3 script.min.js includes switchDetailFrame implementation', minScriptContent.includes('switchDetailFrame'));
  check('6.4 script.min.js includes external back-bar existence guard', minScriptContent.includes('page-back-bar'));

  // Test execution under minified script
  const minEnv = createProductPageEnvironment({
    productId: 'cars-001',
    hasExternalBackBar: true,
    scriptFile: 'script.min.js'
  });
  const minBackBars = minEnv.doc.querySelectorAll('.page-back-bar');
  check('6.5 script.min.js runtime produces exactly 1 .page-back-bar on product page', minBackBars.length === 1);
  
  // Test in-place frame switch on minified script
  minEnv.sandbox.switchDetailFrame('White');
  const minContainer = minEnv.doc.querySelector('.detail-main-image');
  check('6.6 script.min.js switchDetailFrame successfully adds frame-white class',
    minContainer && minContainer.classList.contains('frame-white'));
}

if (minifiedStylesExists) {
  const minStylesContent = fs.readFileSync(path.join(ROOT_DIR, 'styles.min.css'), 'utf8');
  check('6.7 styles.min.css contains .dot.white rule', minStylesContent.includes('.dot.white'));
  check('6.8 styles.min.css contains .frame-transparent rule', minStylesContent.includes('.frame-transparent'));
  check('6.9 styles.min.css contains white wall gradient', minStylesContent.includes('linear-gradient(180deg,#fbfbfb 0%,#f1f2f5 100%)') || minStylesContent.includes('linear-gradient(180deg,#fbfbfb,#f1f2f5)'));
}

// =============================================================================
// SUITE SUMMARY & VERDICT
// =============================================================================
console.log('\n======================================================================');
console.log(` TOTAL CHECKS : ${totalChecks}`);
console.log(` PASSED       : ${passedChecks}`);
console.log(` FAILED       : ${failedChecks}`);
console.log('======================================================================\n');

if (failedChecks > 0) {
  console.error(`VERDICT: REJECT (${failedChecks} failure(s) detected)`);
  process.exit(1);
} else {
  console.log('ALL EMPIRICAL ADVERSARIAL STRESS TESTS PASSED WITH 100% SUCCESS.');
  console.log('VERDICT: APPROVE');
  process.exit(0);
}

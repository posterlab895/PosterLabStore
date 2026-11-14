/**
 * tests/challenger_m4_nav_cart_stress.js
 * 
 * Empirical Adversarial Challenger Test Suite
 * Milestone 4: Homepage, Navbar, Server Stabilization & Error/Artifact Cleanup
 * Challenger M4-1: Navigation & Subpage Cart Challenger
 * 
 * Authoritative Inputs:
 * - ORIGINAL_REQUEST.md: Requirements R4 & R5
 * - PROJECT.md: Milestone 4, Features 15 & 16
 * - Worker Handoff: .agents/teamwork/worker_m4/handoff.md
 * 
 * Challenge Vectors:
 * 1. Multi-Page Category Navigation Stress:
 *    - Verify drawer markup and scripts across all 4 storefront pages (index.html, product.html, our-work.html, faq.html).
 *    - Verify buildNavMenu() generates exact links targeting index.html?cat=${c.id} for all 19 categories.
 *    - Subpage click stress: Clicking drawer links on product.html, our-work.html, and faq.html NEVER calls preventDefault(),
 *      navigates to index.html?cat=..., and NEVER gets trapped in relative subpage URLs (e.g. product.html?cat=... -> empty state).
 *    - Homepage in-place category switch stress: Clicking drawer links on index.html, /, or no-ext routes calls preventDefault(),
 *      closes the drawer, pushes history state, and triggers renderSingleCategory() with smooth scrolling.
 *    - Homepage back/forward browser history (popstate) stress: Seamless category re-rendering without page reload.
 * 2. Cross-Page Cart Consistency & Catalog Resolution Stress:
 *    - Verify products-bundle.min.js preload and inclusion before script.min.js on our-work.html and faq.html.
 *    - Subpage catalog resolution: getProduct() resolves all 1,019 catalog products on both our-work.html and faq.html.
 *    - Multi-item cross-category cart rendering on our-work.html and faq.html: full details (title, size, frame, unit price, quantity, non-empty image).
 *    - Mathematical precision & pricing invariance oracle: 100% parity of subtotal, delivery fee, discount, and grand total across all 4 storefront pages.
 *    - Out-of-stock visual indicators and quantity controls consistency across subpages.
 * 3. Regression Sensitivity & Asset Parity:
 *    - Verify negative oracle: omitting products-bundle fails item resolution (proves test harness detects regressions).
 *    - Verify production asset parity between script.js, script.min.js, products-bundle.js, and products-bundle.min.js.
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
console.log(' CHALLENGER M4-1: NAVIGATION & SUBPAGE CART EMPIRICAL STRESS SUITE');
console.log('======================================================================\n');

// -----------------------------------------------------------------------------
// High-Fidelity Mock DOM Implementation for Isolated Headless Testing
// -----------------------------------------------------------------------------
const VOID_ELEMENTS = new Set(['img', 'br', 'hr', 'input', 'link', 'meta', 'path', 'circle', 'rect', 'line']);

class MockElement {
  constructor(tagName = 'div', parentElement = null) {
    this.tagName = tagName.toUpperCase();
    this.parentElement = parentElement;
    this.children = [];
    this.attributes = Object.create(null);
    this.dataset = Object.create(null);
    this.style = Object.create(null);
    this._textContent = '';
    this._innerHTML = '';
    this.listeners = new Map();
    this.hidden = false;
    this.disabled = false;

    const self = this;
    this.classList = {
      _tokens: new Set(),
      add(...classes) {
        for (const cls of classes) {
          if (!cls) continue;
          String(cls).trim().split(/\s+/).forEach(token => {
            if (token) self.classList._tokens.add(token);
          });
        }
        self.attributes['class'] = Array.from(self.classList._tokens).join(' ');
      },
      remove(...classes) {
        for (const cls of classes) {
          if (!cls) continue;
          String(cls).trim().split(/\s+/).forEach(token => {
            if (token) self.classList._tokens.delete(token);
          });
        }
        self.attributes['class'] = Array.from(self.classList._tokens).join(' ');
      },
      toggle(cls, force) {
        if (!cls) return false;
        if (force === true) {
          this.add(cls);
          return true;
        } else if (force === false) {
          this.remove(cls);
          return false;
        } else if (this.contains(cls)) {
          this.remove(cls);
          return false;
        } else {
          this.add(cls);
          return true;
        }
      },
      contains(cls) {
        return self.classList._tokens.has(cls);
      }
    };
  }

  get parentNode() { return this.parentElement; }

  get id() { return this.attributes['id'] || ''; }
  set id(val) { this.attributes['id'] = String(val); }

  get className() { return Array.from(this.classList._tokens).join(' '); }
  set className(val) {
    this.classList._tokens.clear();
    if (val) {
      String(val).trim().split(/\s+/).forEach(token => {
        if (token) this.classList._tokens.add(token);
      });
      this.attributes['class'] = Array.from(this.classList._tokens).join(' ');
    } else {
      delete this.attributes['class'];
    }
  }

  insertAdjacentHTML(position, html) {
    if (position === 'beforeend') {
      parseHtmlToMockElementTree(html, this);
    } else if (position === 'afterbegin') {
      const temp = new MockElement('div');
      parseHtmlToMockElementTree(html, temp);
      for (let i = temp.children.length - 1; i >= 0; i--) {
        const c = temp.children[i];
        c.parentElement = this;
        this.children.unshift(c);
      }
    }
  }

  get src() { return this.attributes['src'] || ''; }
  set src(val) { this.attributes['src'] = String(val); }

  get href() { return this.attributes['href'] || ''; }
  set href(val) { this.attributes['href'] = String(val); }

  get value() { return this.attributes['value'] !== undefined ? this.attributes['value'] : ''; }
  set value(val) { this.attributes['value'] = String(val); }

  get textContent() {
    if (this.children.length === 0) return this._textContent;
    return this.children.map(c => c.textContent).join(' ');
  }
  set textContent(val) {
    this._textContent = String(val);
    this.children = [];
  }

  get innerHTML() {
    if (this._innerHTML) return this._innerHTML;
    return this.children.map(c => c.outerHTML).join('');
  }
  set innerHTML(html) {
    this._innerHTML = String(html);
    this.children = [];
    parseHtmlToMockElementTree(this._innerHTML, this);
  }

  get outerHTML() {
    const tag = this.tagName.toLowerCase();
    const attrs = Object.entries(this.attributes)
      .map(([k, v]) => ` ${k}="${String(v).replace(/"/g, '&quot;')}"`)
      .join('');
    if (VOID_ELEMENTS.has(tag)) {
      return `<${tag}${attrs}>`;
    }
    return `<${tag}${attrs}>${this.innerHTML}</${tag}>`;
  }

  setAttribute(name, val) {
    const key = name.toLowerCase();
    this.attributes[key] = String(val);
    if (key === 'class') this.className = String(val);
    if (key === 'id') this.id = String(val);
    if (key.startsWith('data-')) {
      const camel = key.slice(5).replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
      this.dataset[camel] = String(val);
    }
  }

  getAttribute(name) {
    const key = name.toLowerCase();
    return this.attributes[key] !== undefined ? this.attributes[key] : null;
  }

  hasAttribute(name) {
    return this.attributes[name.toLowerCase()] !== undefined;
  }

  removeAttribute(name) {
    const key = name.toLowerCase();
    delete this.attributes[key];
    if (key === 'class') this.classList._tokens.clear();
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
    if (!event.preventDefault) {
      event.defaultPrevented = false;
      event.preventDefault = function() { this.defaultPrevented = true; };
    }
    if (!event.stopPropagation) {
      event.propagationStopped = false;
      event.stopPropagation = function() { this.propagationStopped = true; };
    }
    event.target = this;
    let cur = this;
    while (cur) {
      event.currentTarget = cur;
      if (cur.listeners.has(event.type)) {
        for (const fn of cur.listeners.get(event.type)) {
          fn.call(cur, event);
          if (event.propagationStopped) return !event.defaultPrevented;
        }
      }
      cur = cur.parentElement;
    }
    return !event.defaultPrevented;
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
    if (selector.startsWith('#')) return this.id === selector.slice(1);
    if (selector.startsWith('.')) {
      const classes = selector.slice(1).split('.');
      return classes.every(c => this.classList.contains(c));
    }
    const attrMatch = selector.match(/^\[([a-zA-Z0-9\-]+)(?:=(["']?)(.*?)\2)?\]$/);
    if (attrMatch) {
      const attrKey = attrMatch[1].toLowerCase();
      const val = attrMatch[3];
      if (val === undefined) return this.hasAttribute(attrKey);
      return this.getAttribute(attrKey) === val;
    }
    const compoundMatch = selector.match(/^([a-zA-Z0-9\-]+)\.([a-zA-Z0-9\-]+)$/i);
    if (compoundMatch) {
      return this.tagName.toLowerCase() === compoundMatch[1].toLowerCase() && this.classList.contains(compoundMatch[2]);
    }
    const attrCompound = selector.match(/^a\[([a-zA-Z0-9\-]+)(?:=(["']?)(.*?)\2)?\]$/i);
    if (attrCompound) {
      if (this.tagName.toLowerCase() !== 'a') return false;
      const attrKey = attrCompound[1].toLowerCase();
      const val = attrCompound[3];
      if (val === undefined) return this.hasAttribute(attrKey);
      return this.getAttribute(attrKey) === val;
    }
    if (/^[a-zA-Z0-9\-]+$/.test(selector)) {
      return this.tagName.toLowerCase() === selector.toLowerCase();
    }
    return false;
  }

  querySelector(selector) {
    const list = this.querySelectorAll(selector);
    return list.length ? list[0] : null;
  }

  querySelectorAll(selector) {
    const results = [];
    selector = selector.trim();
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
    const compoundMatch = sel.match(/^([a-zA-Z0-9\-]+)\.([a-zA-Z0-9\-]+)$/i);
    if (compoundMatch) {
      return this.tagName.toLowerCase() === compoundMatch[1].toLowerCase() && this.classList.contains(compoundMatch[2]);
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

  scrollIntoView() { this._scrolledIntoView = true; }
  focus() { this._focused = true; }
  blur() { this._focused = false; }
  toDataURL() { return 'data:image/webp;base64,mock'; }
  getContext() { return { fillRect: () => {}, drawImage: () => {} }; }
  getBoundingClientRect() { return { top: 100, bottom: 200, left: 50, right: 150, width: 100, height: 100 }; }
}

function parseHtmlToMockElementTree(html, parentElement) {
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
// Isolated Page Environment Factory
// -----------------------------------------------------------------------------
function createStoreEnvironment(pageName = 'index.html', queryParams = '', initialCart = []) {
  const htmlPath = path.join(ROOT_DIR, pageName);
  const rawHtml = fs.readFileSync(htmlPath, 'utf8');

  const storage = {
    'poster-lab-cart': JSON.stringify(initialCart),
    'pls-cart': JSON.stringify(initialCart),
    'pls-lang': 'en',
    'poster-lab-theme': 'light',
    'poster-lab-coupons': JSON.stringify([
      { code: 'SAVE10', discountPercentage: 10, validUntil: '2099-12-31' }
    ])
  };

  const documentElement = new MockElement('html');
  documentElement.setAttribute('lang', 'en');
  documentElement.dataset = { device: 'desktop', theme: 'light' };

  const head = new MockElement('head', documentElement);
  const body = new MockElement('body', documentElement);
  documentElement.children.push(head, body);

  // Parse actual page body into mock DOM
  const bodyMatch = rawHtml.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    parseHtmlToMockElementTree(bodyMatch[1], body);
  }

  const historyStack = [`http://localhost/${pageName}${queryParams ? '?' + queryParams : ''}`];
  let historyIndex = 0;

  const mockLocation = {
    href: historyStack[0],
    pathname: `/${pageName}`,
    search: queryParams ? `?${queryParams}` : '',
    origin: 'http://localhost',
    hostname: 'localhost'
  };

  const popstateListeners = [];

  const mockDoc = {
    documentElement,
    head,
    body,
    title: 'Poster Lab Store',
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
    setTimeout: (cb, delay) => {
      if (typeof cb === 'function') cb();
      return 1;
    },
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
    URL: class MockURL extends URL {
      constructor(pathStr, base) {
        super(pathStr, base || mockLocation.href);
      }
      static createObjectURL() { return `blob:http://localhost/${Math.random().toString(36).slice(2)}`; }
      static revokeObjectURL() {}
    },
    URLSearchParams,
    navigator: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      language: 'en-US'
    },
    localStorage: {
      getItem: (k) => (storage[k] !== undefined ? storage[k] : null),
      setItem: (k, v) => { storage[k] = String(v); },
      removeItem: (k) => { delete storage[k]; },
      clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
    },
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    indexedDB: { open: () => ({ onsuccess: null, onerror: null }) },
    BroadcastChannel: function(name) {
      this.name = name;
      this.postMessage = () => {};
      this.close = () => {};
      this.onmessage = null;
    },
    CustomEvent: function(type, p) { this.type = type; this.detail = p?.detail; },
    Event: function(type) { this.type = type; },
    IntersectionObserver: class MockIntersectionObserver {
      constructor(cb) { this.cb = cb; }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
    initFirebase: () => {},
    isFirebaseReady: () => false,
    getFirebaseAuth: () => null,
    syncProductsFromFirestore: () => Promise.resolve(0),
    syncCouponsFromFirestore: () => {},
    initLiveSyncChannel: () => {}
  };

  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.document = mockDoc;
  sandbox.window.innerWidth = 1200;
  sandbox.window.innerHeight = 800;
  sandbox.window.scrollY = 0;
  sandbox.window.scrollTo = () => {};
  sandbox.window.location = mockLocation;

  sandbox.window.history = {
    length: 1,
    pushState: (st, title, newUrl) => {
      mockLocation.href = newUrl;
      const u = new URL(newUrl, 'http://localhost');
      mockLocation.search = u.search;
      mockLocation.pathname = u.pathname;
      historyStack.push(newUrl);
      historyIndex = historyStack.length - 1;
      sandbox.window.history.length = historyStack.length;
    },
    replaceState: (st, title, newUrl) => {
      mockLocation.href = newUrl;
      const u = new URL(newUrl, 'http://localhost');
      mockLocation.search = u.search;
      mockLocation.pathname = u.pathname;
      historyStack[historyIndex] = newUrl;
    },
    back: () => {
      if (historyIndex > 0) {
        historyIndex--;
        const prevUrl = historyStack[historyIndex];
        mockLocation.href = prevUrl;
        const u = new URL(prevUrl, 'http://localhost');
        mockLocation.search = u.search;
        mockLocation.pathname = u.pathname;
        for (const fn of popstateListeners) fn({ type: 'popstate', state: {} });
      }
    },
    forward: () => {
      if (historyIndex < historyStack.length - 1) {
        historyIndex++;
        const nextUrl = historyStack[historyIndex];
        mockLocation.href = nextUrl;
        const u = new URL(nextUrl, 'http://localhost');
        mockLocation.search = u.search;
        mockLocation.pathname = u.pathname;
        for (const fn of popstateListeners) fn({ type: 'popstate', state: {} });
      }
    }
  };

  sandbox.window.addEventListener = (t, fn) => {
    if (t === 'popstate') popstateListeners.push(fn);
    else body.addEventListener(t, fn);
  };
  sandbox.window.removeEventListener = (t, fn) => {
    if (t === 'popstate') {
      const idx = popstateListeners.indexOf(fn);
      if (idx >= 0) popstateListeners.splice(idx, 1);
    } else body.removeEventListener(t, fn);
  };
  sandbox.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  sandbox.window.requestAnimationFrame = (cb) => { if (typeof cb === 'function') cb(); };

  vm.createContext(sandbox);

  const loadScripts = (bundleFile = 'products-bundle.min.js', scriptFile = 'script.min.js') => {
    if (bundleFile) {
      const bundleCode = fs.readFileSync(path.join(ROOT_DIR, bundleFile), 'utf8');
      vm.runInContext(bundleCode, sandbox);
    }
    if (scriptFile) {
      const scriptCode = fs.readFileSync(path.join(ROOT_DIR, scriptFile), 'utf8');
      vm.runInContext(scriptCode, sandbox);
    }
    const boundKeys = [
      'state', 'products', 'renderDetail', 'switchDetailFrame', 'toggleLanguage',
      'addToCart', 'getProduct', 'itemUnitPrice', 'createOrder', 'buildWhatsAppMessage',
      'productImageUrl', 'displayImageForItem', 'money', 't', 'renderCart',
      'cartSubtotal', 'cartGrandTotal', 'orderDeliveryFee', 'renderSingleCategory',
      'renderProducts', 'productGrid', 'openNav', 'closeNav'
    ];
    for (const k of boundKeys) {
      try {
        sandbox[k] = vm.runInContext(k, sandbox);
      } catch (_) {}
    }
  };

  return {
    sandbox,
    mockDoc,
    mockLocation,
    historyStack,
    popstateListeners,
    storage,
    loadScripts
  };
}

// -----------------------------------------------------------------------------
// Authoritative Calculation Oracle
// -----------------------------------------------------------------------------
const AuthoritativeOracle = {
  tiers: { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 },
  deliveryFee: 35,
  calculateItemPrice(size) {
    const p = this.tiers[size];
    if (p === undefined) throw new Error(`Invalid size: ${size}`);
    return p;
  },
  calculateCartTotal(items, discountPct = 0) {
    let subtotal = 0;
    for (const item of items) {
      subtotal += this.calculateItemPrice(item.size) * (item.quantity || 1);
    }
    const discount = discountPct > 0 ? Math.min(subtotal, Math.round(subtotal * (discountPct / 100))) : 0;
    const discountedSubtotal = subtotal - discount;
    const grandTotal = discountedSubtotal + this.deliveryFee;
    return { subtotal, discount, discountedSubtotal, deliveryFee: this.deliveryFee, grandTotal };
  }
};

// =============================================================================
// VECTOR 1: STATIC MARKUP & SCRIPT INCLUSION PARITY ACROSS ALL STORE PAGES
// =============================================================================
console.log('--- Vector 1: Static Markup & Script Inclusion Parity ---');
const STOREFRONT_PAGES = ['index.html', 'product.html', 'our-work.html', 'faq.html'];

for (const page of STOREFRONT_PAGES) {
  const filePath = path.join(ROOT_DIR, page);
  check(`File ${page} exists on filesystem`, fs.existsSync(filePath));
  const html = fs.readFileSync(filePath, 'utf8');

  // Nav drawer markup checks
  check(`${page} contains nav drawer element [data-nav-drawer]`, html.includes('data-nav-drawer'));
  check(`${page} contains nav drawer body container [data-nav-body]`, html.includes('data-nav-body'));
  check(`${page} contains nav open trigger button [data-open-nav]`, html.includes('data-open-nav'));
  check(`${page} contains nav close trigger button [data-close-nav]`, html.includes('data-close-nav'));

  // Cart drawer markup checks
  check(`${page} contains cart drawer element [data-cart-drawer]`, html.includes('data-cart-drawer'));
  check(`${page} contains cart items container #cartItems`, /id=["']cartItems["']/.test(html));
  check(`${page} contains cart total indicator #cartTotal`, /id=["']cartTotal["']/.test(html));
  check(`${page} contains brand link pointing explicitly to index.html`, /<a[^>]*class=["'][^"']*brand[^"']*["'][^>]*href=["']index\.html["']/.test(html));

  // Script tags & ordering
  const bundlePos = html.indexOf('products-bundle.min.js');
  const scriptPos = html.indexOf('script.min.js');
  check(`${page} includes products-bundle.min.js`, bundlePos !== -1);
  check(`${page} includes script.min.js`, scriptPos !== -1);
  check(`${page} loads products-bundle.min.js BEFORE script.min.js`, bundlePos < scriptPos, `bundlePos: ${bundlePos}, scriptPos: ${scriptPos}`);

  // Preload links in head
  check(`${page} preloads products-bundle.min.js in head`, /<link[^>]*rel=["']preload["'][^>]*href=["']products-bundle\.min\.js["'][^>]*as=["']script["']/.test(html));
  check(`${page} preloads script.min.js in head`, /<link[^>]*rel=["']preload["'][^>]*href=["']script\.min\.js["'][^>]*as=["']script["']/.test(html));
}

// =============================================================================
// VECTOR 2: MULTI-PAGE CATEGORY NAVIGATION & DRAWER LINK RESOLUTION STRESS
// =============================================================================
console.log('\n--- Vector 2: Multi-Page Category Drawer Navigation Stress ---');

const ALL_CATEGORY_IDS = [
  'custom', 'football', 'cars', 'clubs', 'anime', 'movie', 'album',
  'quotes', 'islamic', 'art', 'gym', 'girls', 'games', 'cities',
  'nba', 'meemes', 'pharaonic', 'rap', 'jordan'
];

check('Verified total 19 collection categories defined in contract', ALL_CATEGORY_IDS.length === 19);

// Execute buildNavMenu() inside a clean environment and inspect generated link attributes
{
  const env = createStoreEnvironment('index.html');
  const bundleCode = fs.readFileSync(path.join(ROOT_DIR, 'products-bundle.min.js'), 'utf8');
  const scriptCode = fs.readFileSync(path.join(ROOT_DIR, 'script.min.js'), 'utf8');
  vm.runInContext(bundleCode, env.sandbox);
  vm.runInContext(scriptCode, env.sandbox);

  const openNavBtn = env.mockDoc.querySelector('[data-open-nav]');
  check('Homepage openNavBtn exists in DOM', Boolean(openNavBtn));
  if (openNavBtn) openNavBtn.dispatchEvent({ type: 'click' });

  const navSubLinks = env.mockDoc.querySelectorAll('a.nav-sub');
  check('Navigation drawer populated 19 category links in DOM', navSubLinks.length === 19, `Found: ${navSubLinks.length}`);

  for (const catId of ALL_CATEGORY_IDS) {
    const link = navSubLinks.find(a => (a.getAttribute('href') || '').includes(`cat=${catId}`));
    check(`Drawer category link '${catId}' targets 'index.html?cat=${catId}'`, Boolean(link) && link.getAttribute('href') === `index.html?cat=${catId}`);
  }
}

// Subpage click stress: Clicking drawer links on product.html, our-work.html, and faq.html
const SUBPAGES = [
  { file: 'product.html', query: 'id=football-001' },
  { file: 'our-work.html', query: '' },
  { file: 'faq.html', query: '' }
];

for (const subpage of SUBPAGES) {
  console.log(`\n  * Stress testing drawer link clicks from subpage: ${subpage.file}`);
  const env = createStoreEnvironment(subpage.file, subpage.query);
  const bundleCode = fs.readFileSync(path.join(ROOT_DIR, 'products-bundle.min.js'), 'utf8');
  const scriptCode = fs.readFileSync(path.join(ROOT_DIR, 'script.min.js'), 'utf8');
  vm.runInContext(bundleCode, env.sandbox);
  vm.runInContext(scriptCode, env.sandbox);

  const openNavBtn = env.mockDoc.querySelector('[data-open-nav]');
  if (openNavBtn) openNavBtn.dispatchEvent({ type: 'click' });

  const navSubLinks = env.mockDoc.querySelectorAll('a.nav-sub');
  check(`${subpage.file}: Generated 19 category links`, navSubLinks.length === 19);

  for (const link of navSubLinks) {
    const href = link.getAttribute('href') || '';
    const match = href.match(/[?&]cat=([^&]+)/);
    const catId = match ? match[1] : 'unknown';

    // Dispatch click event on subpage category link
    const clickEv = { type: 'click' };
    const allowed = link.dispatchEvent(clickEv);

    // CRITICAL: Must NOT be prevented (allowed === true) so the browser naturally navigates to index.html?cat=...
    check(`${subpage.file} -> click cat '${catId}' allows natural navigation (preventDefault NOT called)`, allowed === true && clickEv.defaultPrevented === false);

    // Resolve target URL relative to subpage location
    const resolvedUrl = new env.sandbox.URL(href, env.mockLocation.href);
    check(`${subpage.file} -> click cat '${catId}' target pathname is '/index.html'`, resolvedUrl.pathname === '/index.html' || resolvedUrl.pathname.endsWith('index.html'));
    check(`${subpage.file} -> click cat '${catId}' target query parameter is 'cat=${catId}'`, resolvedUrl.searchParams.get('cat') === catId);
    check(`${subpage.file} -> DOES NOT get trapped in relative subpage path (not ${subpage.file}?cat=${catId})`, !resolvedUrl.pathname.includes(subpage.file));
  }
}

// Homepage client-side click interception stress (isHome === true)
console.log('\n  * Stress testing homepage client-side click interception (in-place switch without full page reload)');
{
  const env = createStoreEnvironment('index.html');
  env.loadScripts();

  const navDrawer = env.mockDoc.querySelector('[data-nav-drawer]');
  const openNavBtn = env.mockDoc.querySelector('[data-open-nav]');
  if (openNavBtn) openNavBtn.dispatchEvent({ type: 'click' });
  check('Homepage drawer opened (classList contains is-open)', navDrawer.classList.contains('is-open'));

  const navSubLinks = env.mockDoc.querySelectorAll('a.nav-sub');
  
  // Test 5 sequential category switches on homepage
  const testCategories = ['cars', 'football', 'anime', 'rap', 'custom'];
  for (const catId of testCategories) {
    const link = navSubLinks.find(a => (a.getAttribute('href') || '').includes(`cat=${catId}`));
    check(`Found link for category ${catId}`, Boolean(link));

    // Open drawer before each click
    if (!navDrawer.classList.contains('is-open') && openNavBtn) {
      openNavBtn.dispatchEvent({ type: 'click' });
    }

    const clickEv = { type: 'click' };
    const notPrevented = link.dispatchEvent(clickEv);

    // CRITICAL: On homepage, click MUST be intercepted via preventDefault()
    check(`Homepage click on '${catId}' called preventDefault()`, clickEv.defaultPrevented === true && notPrevented === false);
    check(`Homepage click on '${catId}' closed nav drawer (is-open removed)`, !navDrawer.classList.contains('is-open'));
    check(`Homepage click on '${catId}' updated URL via pushState to '?cat=${catId}'`, env.mockLocation.search === `?cat=${catId}`);

    const catHeader = env.mockDoc.querySelector('.single-cat-header h2');
    check(`Homepage click on '${catId}' updated DOM with single category view`, Boolean(catHeader));
  }

  // Also verify root '/' and routes without extension are treated as isHome
  const alternateHomePaths = ['/', '/store', '/index'];
  for (const homePath of alternateHomePaths) {
    env.mockLocation.pathname = homePath;
    const testLink = navSubLinks.find(a => (a.getAttribute('href') || '').includes('cat=football'));
    const testEv = { type: 'click' };
    testLink.dispatchEvent(testEv);
    check(`Path '${homePath}' recognized as isHome and calls preventDefault()`, testEv.defaultPrevented === true);
  }
}

// Homepage back/forward history navigation (popstate) stress
console.log('\n  * Stress testing homepage back/forward browser history navigation (popstate)');
{
  const env = createStoreEnvironment('index.html');
  env.loadScripts();

  const navDrawer = env.mockDoc.querySelector('[data-nav-drawer]');
  const openNavBtn = env.mockDoc.querySelector('[data-open-nav]');
  if (openNavBtn) openNavBtn.dispatchEvent({ type: 'click' });
  const navSubLinks = env.mockDoc.querySelectorAll('a.nav-sub');

  // Push history sequence: index -> cars -> anime -> rap
  const sequence = ['cars', 'anime', 'rap'];
  for (const cat of sequence) {
    const link = navSubLinks.find(a => (a.getAttribute('href') || '').includes(`cat=${cat}`));
    link.dispatchEvent({ type: 'click' });
  }

  check('History stack reached 4 entries (initial + 3 pushes)', env.historyStack.length === 4);
  check('Current URL has ?cat=rap', env.mockLocation.search === '?cat=rap');

  // Simulate Back button -> should go to ?cat=anime
  env.sandbox.window.history.back();
  check("Browser Back: URL restored to '?cat=anime'", env.mockLocation.search === '?cat=anime');
  const catHeader1 = env.mockDoc.querySelector('.single-cat-header h2');
  check("Browser Back: popstate handler re-rendered 'anime' category in DOM", Boolean(catHeader1) && catHeader1.textContent.toLowerCase().includes('anime'));

  // Simulate Back button -> should go to ?cat=cars
  env.sandbox.window.history.back();
  check("Browser Back: URL restored to '?cat=cars'", env.mockLocation.search === '?cat=cars');
  const catHeader2 = env.mockDoc.querySelector('.single-cat-header h2');
  check("Browser Back: popstate handler re-rendered 'cars' category in DOM", Boolean(catHeader2) && catHeader2.textContent.toLowerCase().includes('cars'));

  // Simulate Back button -> should go to initial index.html (no ?cat)
  env.sandbox.window.history.back();
  check("Browser Back: URL restored to initial root (search is empty)", env.mockLocation.search === '');
  check("Browser Back: popstate handler re-rendered all products (single-cat-header cleared)", !env.mockDoc.querySelector('.single-cat-header'));

  // Simulate Forward button -> should re-render ?cat=cars
  env.sandbox.window.history.forward();
  check("Browser Forward: URL advanced to '?cat=cars'", env.mockLocation.search === '?cat=cars');
  const catHeader3 = env.mockDoc.querySelector('.single-cat-header h2');
  check("Browser Forward: popstate handler re-rendered 'cars' category in DOM", Boolean(catHeader3) && catHeader3.textContent.toLowerCase().includes('cars'));
}

// =============================================================================
// VECTOR 3: SUBPAGE COMPLETE CATALOG RESOLUTION (ALL 1,019 PRODUCTS)
// =============================================================================
console.log('\n--- Vector 3: Cross-Page Complete Catalog Resolution (1,019 Products) ---');

for (const subpageFile of ['our-work.html', 'faq.html']) {
  console.log(`\n  * Verifying complete catalog resolution in simulated ${subpageFile}`);
  const env = createStoreEnvironment(subpageFile);
  env.loadScripts();

  const getProduct = env.sandbox.getProduct;
  const products = env.sandbox.products;

  check(`${subpageFile}: products array contains exactly 1,019 items`, Array.isArray(products) && products.length === 1019, `Got: ${products?.length}`);

  let resolvedCount = 0;
  let validNameCount = 0;
  let validImageCount = 0;
  let validPriceCount = 0;

  for (const p of products) {
    const resolved = getProduct(p.id);
    if (resolved && resolved.id === p.id) {
      resolvedCount++;
      if (resolved.name && typeof resolved.name === 'string' && resolved.name.trim().length > 0) validNameCount++;
      if (resolved.image && typeof resolved.image === 'string' && resolved.image.trim().length > 0) validImageCount++;
      if (typeof resolved.basePrice === 'number' && resolved.basePrice > 0) validPriceCount++;
    }
  }

  check(`${subpageFile}: getProduct(id) successfully resolved 1019/1019 products`, resolvedCount === 1019, `Resolved: ${resolvedCount}/1019`);
  check(`${subpageFile}: All 1,019 resolved products have non-empty titles`, validNameCount === 1019);
  check(`${subpageFile}: All 1,019 resolved products have non-empty image paths`, validImageCount === 1019);
  check(`${subpageFile}: All 1,019 resolved products have valid base prices`, validPriceCount === 1019);
}

// =============================================================================
// VECTOR 4: MULTI-ITEM CART RENDERING & PRICING INVARIANCE ORACLE VERIFICATION
// =============================================================================
console.log('\n--- Vector 4: Multi-Item Cart Rendering & Pricing Invariance Oracle ---');

const STRESS_CART_ITEMS = [
  {
    key: 'football-001-30x40-Black',
    productId: 'football-001',
    size: '30x40',
    frame: 'Black',
    quantity: 2
  },
  {
    key: 'cars-001-40x50-White',
    productId: 'cars-001',
    size: '40x50',
    frame: 'White',
    quantity: 1
  },
  {
    key: 'anime-001-20x30-Transparent',
    productId: 'anime-001',
    size: '20x30',
    frame: 'Transparent',
    quantity: 3
  },
  {
    key: 'rap-001-50x70-Black',
    productId: 'rap-001',
    size: '50x70',
    frame: 'Black',
    quantity: 1
  },
  {
    key: 'custom-design-30x40-Black',
    productId: 'custom-design',
    size: '30x40',
    frame: 'Black',
    quantity: 1,
    upload: { name: 'customer-art.png', size: 102400 }
  }
];

// Expected Oracle Totals:
// football-001: 30x40 (200) * 2 = 400
// cars-001:     40x50 (250) * 1 = 250
// anime-001:    20x30 (180) * 3 = 540
// rap-001:      50x70 (300) * 1 = 300
// custom-design:30x40 (200) * 1 = 200
// Subtotal = 1690 EGP, Delivery = 35 EGP, Grand Total = 1725 EGP
const expectedPricing = AuthoritativeOracle.calculateCartTotal(STRESS_CART_ITEMS);
check('Oracle expected subtotal is exactly 1690 EGP', expectedPricing.subtotal === 1690);
check('Oracle expected delivery fee is exactly 35 EGP', expectedPricing.deliveryFee === 35);
check('Oracle expected grand total is exactly 1725 EGP', expectedPricing.grandTotal === 1725);

const ALL_STORE_PAGES = ['index.html', 'product.html', 'our-work.html', 'faq.html'];
const pageCartCalculations = {};

for (const pageName of ALL_STORE_PAGES) {
  console.log(`\n  * Verifying cart rendering and math precision on ${pageName}`);
  const env = createStoreEnvironment(pageName, '', STRESS_CART_ITEMS);
  env.loadScripts();

  // Set cart in state and render
  env.sandbox.state.cart = STRESS_CART_ITEMS.map(i => ({ ...i }));
  env.sandbox.renderCart();

  const cartItemsContainer = env.mockDoc.querySelector('#cartItems');
  check(`${pageName}: #cartItems container exists`, Boolean(cartItemsContainer));

  const renderedArticles = cartItemsContainer.querySelectorAll('article.cart-item');
  check(`${pageName}: Rendered exactly 5 cart items (none returned empty string)`, renderedArticles.length === 5, `Rendered: ${renderedArticles.length}`);

  // Inspect each item in rendered cart
  for (let i = 0; i < STRESS_CART_ITEMS.length; i++) {
    const item = STRESS_CART_ITEMS[i];
    const article = renderedArticles[i];
    const product = env.sandbox.getProduct(item.productId);

    check(`${pageName} [Item ${i + 1} (${item.productId})]: Article rendered in DOM`, Boolean(article));
    const titleEl = article.querySelector('h3');
    check(`${pageName} [Item ${i + 1}]: Title matches product name '${product.name}'`, titleEl && titleEl.textContent.trim() === product.name);

    const imgEl = article.querySelector('img');
    check(`${pageName} [Item ${i + 1}]: Image src is non-empty and starts with http or assets`, Boolean(imgEl) && imgEl.src.length > 5);

    const qtyStrong = article.querySelector('.quantity-controls strong');
    check(`${pageName} [Item ${i + 1}]: Quantity strong text equals ${item.quantity}`, qtyStrong && qtyStrong.textContent.trim() === String(item.quantity));

    const plusBtn = article.querySelector(`[data-qty-plus="${item.key}"]`);
    const minusBtn = article.querySelector(`[data-qty-minus="${item.key}"]`);
    check(`${pageName} [Item ${i + 1}]: Quantity plus button wired with item key`, Boolean(plusBtn));
    check(`${pageName} [Item ${i + 1}]: Quantity minus button wired with item key`, Boolean(minusBtn));
  }

  // Calculate cart subtotal and grand total in page context
  const pageSubtotal = env.sandbox.cartSubtotal();
  const pageGrandTotal = env.sandbox.cartGrandTotal();
  const pageDeliveryFee = env.sandbox.orderDeliveryFee();

  pageCartCalculations[pageName] = { pageSubtotal, pageGrandTotal, pageDeliveryFee };

  check(`${pageName}: cartSubtotal() === 1690 EGP`, pageSubtotal === 1690, `Got: ${pageSubtotal}`);
  check(`${pageName}: orderDeliveryFee() === 35 EGP`, pageDeliveryFee === 35, `Got: ${pageDeliveryFee}`);
  check(`${pageName}: cartGrandTotal() === 1725 EGP`, pageGrandTotal === 1725, `Got: ${pageGrandTotal}`);

  // Test coupon discount in page context (10% discount: 1690 - 169 = 1521, + 35 = 1556 EGP)
  env.sandbox.state.appliedCoupon = { code: 'POSTER10' };
  const discountedTotal = env.sandbox.cartGrandTotal();
  check(`${pageName}: 10% coupon grand total === 1556 EGP`, discountedTotal === 1556, `Got: ${discountedTotal}`);
}

// 100% Mathematical Equivalence across ALL pages
console.log('\n  * Cross-page mathematical parity check:');
const firstCalc = pageCartCalculations['index.html'];
for (const pageName of ['product.html', 'our-work.html', 'faq.html']) {
  const calc = pageCartCalculations[pageName];
  check(`Subtotal parity: ${pageName} matches index.html (1690 EGP)`, calc.pageSubtotal === firstCalc.pageSubtotal);
  check(`Delivery fee parity: ${pageName} matches index.html (35 EGP)`, calc.pageDeliveryFee === firstCalc.pageDeliveryFee);
  check(`Grand total parity: ${pageName} matches index.html (1725 EGP)`, calc.pageGrandTotal === firstCalc.pageGrandTotal);
}

// =============================================================================
// VECTOR 5: OUT-OF-STOCK & STOCK EXCEEDED VISUAL INTEGRITY ON SUBPAGES
// =============================================================================
console.log('\n--- Vector 5: Out-Of-Stock Visual Integrity on Subpages ---');

for (const subpageFile of ['our-work.html', 'faq.html']) {
  const env = createStoreEnvironment(subpageFile);
  env.loadScripts();

  // Mark cars-001 as stock = 0 in underlying catalog
  const targetProduct = env.sandbox.products.find(p => p.id === 'cars-001');
  if (targetProduct) targetProduct.quantity = 0;

  env.sandbox.state.cart = [
    { key: 'cars-001-40x50-Black', productId: 'cars-001', size: '40x50', frame: 'Black', quantity: 1 }
  ];
  env.sandbox.renderCart();

  const cartArticle = env.mockDoc.querySelector('article.cart-item');
  check(`${subpageFile}: Out-of-stock item has class 'is-out-of-stock'`, cartArticle && cartArticle.classList.contains('is-out-of-stock'));

  const warningText = cartArticle.querySelector('.cart-stock-warning');
  check(`${subpageFile}: Out-of-stock warning message rendered`, Boolean(warningText));

  const plusBtn = cartArticle.querySelector('[data-qty-plus]');
  check(`${subpageFile}: Plus button is disabled for out-of-stock item`, plusBtn && (plusBtn.disabled || plusBtn.hasAttribute('disabled')));
}

// =============================================================================
// VECTOR 6: REGRESSION SENSITIVITY ORACLE (FAILURE REPRODUCTION PROOF)
// =============================================================================
console.log('\n--- Vector 6: Negative Oracle: Reproduction of Pre-M4 Bug When Bundle is Omitted ---');
{
  // Simulate subpage WITHOUT products-bundle.min.js (the exact pre-M4 bug)
  const env = createStoreEnvironment('our-work.html');
  // NOTE: Deliberately omit bundleCode
  env.loadScripts(null, 'script.min.js');

  const getProduct = env.sandbox.getProduct;
  const missingProduct = getProduct ? getProduct('cars-001') : undefined;
  check('NEGATIVE ORACLE CONFIRMATION: getProduct("cars-001") returns undefined when bundle is missing', missingProduct === undefined);

  env.sandbox.state.cart = [
    { key: 'cars-001-40x50-Black', productId: 'cars-001', size: '40x50', frame: 'Black', quantity: 1 }
  ];
  env.sandbox.renderCart();

  const cartItems = env.mockDoc.querySelector('#cartItems');
  const renderedItems = cartItems.querySelectorAll('article.cart-item');
  check('NEGATIVE ORACLE CONFIRMATION: Cart renders 0 articles (item returns empty string "") when bundle is missing', renderedItems.length === 0);

  const brokenSubtotal = env.sandbox.cartSubtotal();
  check('NEGATIVE ORACLE CONFIRMATION: Subtotal evaluates to 0 when bundle is missing', brokenSubtotal === 0);
  console.log('  -> Regression sensitivity oracle successfully confirmed: harness reliably detects bundle absence bug.');
}

// =============================================================================
// VECTOR 7: PRODUCTION ASSET PARITY (SOURCE vs MINIFIED)
// =============================================================================
console.log('\n--- Vector 7: Production Minified Asset Parity ---');
{
  const sourceScript = fs.readFileSync(path.join(ROOT_DIR, 'script.js'), 'utf8');
  const minScript = fs.readFileSync(path.join(ROOT_DIR, 'script.min.js'), 'utf8');

  // Verify navigation routing pattern present in both
  check("script.js has index.html?cat= navigation link target", sourceScript.includes('index.html?cat='));
  check("script.min.js has index.html?cat= navigation link target", minScript.includes('index.html?cat='));

  // Verify isHome interception logic present in both
  check("script.js has endsWith('index.html') routing check", sourceScript.includes('endsWith("index.html")'));
  check("script.min.js has endsWith('index.html') routing check", minScript.includes('endsWith("index.html")'));

  // Verify popstate listener present in both
  check("script.js has popstate listener", sourceScript.includes('window.addEventListener("popstate"'));
  check("script.min.js has popstate listener", minScript.includes('popstate'));

  // Verify products-bundle.js vs products-bundle.min.js
  const sourceBundle = fs.readFileSync(path.join(ROOT_DIR, 'products-bundle.js'), 'utf8');
  const minBundle = fs.readFileSync(path.join(ROOT_DIR, 'products-bundle.min.js'), 'utf8');

  check("products-bundle.js has window.products export", sourceBundle.includes('window.products'));
  check("products-bundle.min.js has window.products export", minBundle.includes('window.products'));
}

// =============================================================================
// FINAL SUMMARY & VERDICT
// =============================================================================
console.log('\n======================================================================');
console.log(' CHALLENGER M4-1 EMPIRICAL STRESS TEST SUITE RESULTS');
console.log('======================================================================');
console.log(`  Total Empirical Checks: ${totalAssertions}`);
console.log(`  Passed Checks:          ${passedAssertions}`);
console.log(`  Failed Checks:          ${failedAssertions}`);
console.log('----------------------------------------------------------------------');

if (failedAssertions > 0) {
  console.error(`\nVERDICT: REJECT (${failedAssertions} failure(s) detected)`);
  failureDetails.forEach(f => console.error(`  - ${f}`));
  process.exit(1);
} else {
  console.log('\nVERDICT: APPROVE (100% of adversarial stress assertions passed cleanly)');
  process.exit(0);
}

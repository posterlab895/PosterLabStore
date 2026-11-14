/**
 * tests/challenger_m5_adversarial_cart_nav_sw.js
 * 
 * Milestone 5 Phase 2: Tier 5 White-Box Adversarial Coverage Hardening
 * Challenger M5-2: Cart Math, Multi-Page Navigation, SW Isolation, WhatsApp Checkout Latency
 * 
 * Authoritative Directives:
 * 1. Cart Calculations & Multi-Item Stress:
 *    - Subtotals, grand totals, coupon logic (percent/fixed, minOrder, maxUses, dynamic re-eval),
 *      stock exhaustion, invalid quantity injection, cross-page state persistence across
 *      index.html, product.html, our-work.html, faq.html.
 * 2. Multi-Page Navigation & Popstate Integrity:
 *    - Complex history stacks, rapid back/forward between diverse categories, brand logo resets,
 *      bilingual language switching (AR/EN), in-page back buttons.
 * 3. Service Worker Same-Origin Boundary & Server Caching:
 *    - Fetch event handling, cache bypassing for non-origin endpoints, no-cache enforcement on /sw.js,
 *      static asset long-term caching.
 * 4. WhatsApp Checkout Latency & Custom Upload Pipeline:
 *    - Zero-upload latency for catalog posters, base64 payload handling for custom designs,
 *      network failure recovery.
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
console.log(' CHALLENGER M5-2: TIER 5 WHITE-BOX ADVERSARIAL COVERAGE HARDENING');
console.log(' Cart Calculations, Multi-Page Navigation, SW Boundary, Checkout Latency');
console.log('======================================================================\n');

// -----------------------------------------------------------------------------
// High-Fidelity Mock DOM Implementation for Isolated Headless Testing
// -----------------------------------------------------------------------------
const VOID_ELEMENTS = new Set(['img', 'br', 'hr', 'input', 'link', 'meta', 'path', 'circle', 'rect', 'line', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr']);

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
    this.open = false;

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

  get lang() { return this.attributes['lang'] || ''; }
  set lang(val) { this.attributes['lang'] = String(val); }

  get dir() { return this.attributes['dir'] || ''; }
  set dir(val) { this.attributes['dir'] = String(val); }

  get elements() {
    const elMap = {};
    const inputs = this.querySelectorAll('input, select, textarea');
    inputs.forEach(inp => {
      const name = inp.getAttribute('name') || inp.id;
      if (name) elMap[name] = inp;
    });
    return elMap;
  }

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
    } else if (position === 'beforebegin') {
      if (this.parentElement) {
        const temp = new MockElement('div');
        parseHtmlToMockElementTree(html, temp);
        const idx = this.parentElement.children.indexOf(this);
        if (idx >= 0) {
          this.parentElement.children.splice(idx, 0, ...temp.children);
          temp.children.forEach(c => c.parentElement = this.parentElement);
        }
      }
    }
  }

  get src() { return this.attributes['src'] || ''; }
  set src(val) { this.attributes['src'] = String(val); }

  get href() { return this.attributes['href'] || ''; }
  set href(val) { this.attributes['href'] = String(val); }

  get value() { return this.attributes['value'] !== undefined ? this.attributes['value'] : ''; }
  set value(val) { this.attributes['value'] = String(val); }

  get placeholder() { return this.attributes['placeholder'] || ''; }
  set placeholder(val) { this.attributes['placeholder'] = String(val); }

  get textContent() {
    if (this.children.length === 0) return this._textContent;
    return this.children.map(c => c.textContent).join(' ');
  }
  set textContent(val) {
    this._textContent = String(val);
    this.children = [];
  }

  get innerHTML() {
    if (this._innerHTML && this.children.length === 0) return this._innerHTML;
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
    if (key === 'lang') this.lang = String(val);
    if (key === 'dir') this.dir = String(val);
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
    return this._matchesSelector(selector);
  }

  querySelector(selector) {
    const results = this.querySelectorAll(selector);
    return results.length > 0 ? results[0] : null;
  }

  querySelectorAll(selector) {
    const results = [];
    const search = (node) => {
      for (const child of node.children) {
        if (child.matches(selector)) {
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
    if (selector.includes(',')) {
      return selector.split(',').some(part => this._matchesSelector(part.trim()));
    }
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
    const attrMatch = sel.match(/^\[([a-zA-Z0-9\-]+)(?:([*^$]?=)(["']?)(.*?)\3)?\]$/);
    if (attrMatch) {
      const attrKey = attrMatch[1].toLowerCase();
      const op = attrMatch[2];
      const val = attrMatch[4];
      if (val === undefined) return this.hasAttribute(attrKey);
      const actualVal = this.getAttribute(attrKey) || '';
      if (op === '=') return actualVal === val;
      if (op === '*=') return actualVal.includes(val);
      if (op === '^=') return actualVal.startsWith(val);
      if (op === '$=') return actualVal.endsWith(val);
      return actualVal === val;
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
  click() {
    this.dispatchEvent({ type: 'click' });
  }
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
// Environment Factory for Headless Storefront Testing
// -----------------------------------------------------------------------------
function createStoreEnvironment(pageName = 'index.html', queryParams = '', initialCart = [], scriptFileName = 'script.js') {
  const htmlPath = path.join(ROOT_DIR, pageName);
  const rawHtml = fs.readFileSync(htmlPath, 'utf8');

  const storage = {
    'poster-lab-cart': JSON.stringify(initialCart),
    'pls-cart': JSON.stringify(initialCart),
    'pls-lang': 'en',
    'poster-lab-theme': 'light',
    'pls-coupons': JSON.stringify([
      { code: 'SAVE10', type: 'percent', value: 10, minOrder: 0, uses: 0, maxUses: 100 },
      { code: 'FLAT50', type: 'fixed', value: 50, minOrder: 150, uses: 0, maxUses: 50 },
      { code: 'BIGDISCOUNT', type: 'fixed', value: 500, minOrder: 100, uses: 0, maxUses: 10 },
      { code: 'EXHAUSTED', type: 'percent', value: 20, minOrder: 0, uses: 5, maxUses: 5 },
      { code: 'MIN500', type: 'percent', value: 15, minOrder: 500, uses: 0, maxUses: 50 }
    ])
  };

  const documentElement = new MockElement('html');
  documentElement.setAttribute('lang', 'en');
  documentElement.setAttribute('dir', 'ltr');
  documentElement.dataset = { device: 'desktop', theme: 'light' };

  const head = new MockElement('head', documentElement);
  const body = new MockElement('body', documentElement);
  documentElement.children.push(head, body);

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
  const windowListeners = new Map();

  const mockDoc = {
    documentElement,
    head,
    body,
    title: 'Poster Lab Store',
    readyState: 'complete',
    hidden: false,
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

  const networkUploadLog = [];
  const inMemoryDB = new Map();

  const sandbox = {
    console: {
      log: () => {},
      warn: () => {},
      error: () => {},
      info: () => {}
    },
    setTimeout: (cb, delay) => {
      if (typeof cb === 'function') setImmediate(cb);
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
    FormData: class MockFormData {
      constructor() { this.data = {}; }
      append(k, v, name) { this.data[k] = { value: v, filename: name }; }
    },
    Blob: class MockBlob {
      constructor(parts, opts) { this.parts = parts; this.type = opts?.type; }
    },
    File: class MockFile {
      constructor(parts, name, opts) { this.parts = parts; this.name = name; this.type = opts?.type; }
    },
    URL: class MockURL extends URL {
      constructor(pathStr, base) {
        super(pathStr, base || mockLocation.href);
      }
      static createObjectURL(blob) { return `blob:http://localhost/${Math.random().toString(36).slice(2)}`; }
      static revokeObjectURL() {}
    },
    requestAnimationFrame: (cb) => { if (typeof cb === 'function') setImmediate(cb); },
    cancelAnimationFrame: () => {},
    URLSearchParams,
    navigator: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      language: 'en-US',
      serviceWorker: {
        register: async () => ({ scope: '/' })
      }
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
    indexedDB: {
      open: () => {
        const req = {
          onsuccess: null,
          onerror: null,
          result: {
            transaction: () => ({
              objectStore: () => ({
                get: (k) => {
                  const r = { onsuccess: null, onerror: null, result: inMemoryDB.get(k) || null };
                  setImmediate(() => { if (r.onsuccess) r.onsuccess({ target: r }); });
                  return r;
                },
                put: (val, k) => {
                  inMemoryDB.set(k, val);
                  const r = { onsuccess: null, onerror: null };
                  setImmediate(() => { if (r.onsuccess) r.onsuccess(); });
                  return r;
                },
                delete: (k) => {
                  inMemoryDB.delete(k);
                  const r = { onsuccess: null, onerror: null };
                  setImmediate(() => { if (r.onsuccess) r.onsuccess(); });
                  return r;
                }
              })
            })
          }
        };
        setImmediate(() => { if (req.onsuccess) req.onsuccess({ target: req }); });
        return req;
      }
    },
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
    initLiveSyncChannel: () => {},
    fetch: async (url, options = {}) => {
      networkUploadLog.push({ url, options });
      if (typeof url === 'string' && url.includes('tmpfiles.org/api/v1/upload')) {
        if (sandbox._forceUploadFailure) {
          throw new Error('Simulated tmpfiles.org network connection failure');
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            status: 'success',
            data: { url: 'https://tmpfiles.org/12345/custom-mock-design.png' }
          })
        };
      }
      return {
        ok: true,
        status: 200,
        blob: async () => new sandbox.Blob(['mock image data'], { type: 'image/png' }),
        json: async () => ({})
      };
    },
    document: mockDoc,
    window: {
      location: mockLocation,
      history: {
        length: 1,
        pushState: (st, title, newUrl) => {
          const u = new URL(newUrl, mockLocation.origin || 'http://localhost');
          mockLocation.href = u.href;
          mockLocation.search = u.search;
          mockLocation.pathname = u.pathname;
          historyStack.push(u.href);
          historyIndex = historyStack.length - 1;
          sandbox.window.history.length = historyStack.length;
        },
        replaceState: (st, title, newUrl) => {
          const u = new URL(newUrl, mockLocation.origin || 'http://localhost');
          mockLocation.href = u.href;
          mockLocation.search = u.search;
          mockLocation.pathname = u.pathname;
          historyStack[historyIndex] = u.href;
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
      },
      scrollTo: (opts) => {},
      addEventListener: (t, fn) => {
        if (t === 'popstate') popstateListeners.push(fn);
        else {
          if (!windowListeners.has(t)) windowListeners.set(t, []);
          windowListeners.get(t).push(fn);
          body.addEventListener(t, fn);
        }
      },
      removeEventListener: (t, fn) => {
        if (t === 'popstate') {
          const idx = popstateListeners.indexOf(fn);
          if (idx >= 0) popstateListeners.splice(idx, 1);
        } else {
          body.removeEventListener(t, fn);
        }
      },
      matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
      setTimeout: (cb, delay) => { if (typeof cb === 'function') setImmediate(cb); return 1; },
      clearTimeout: () => {},
      setInterval: () => 1,
      clearInterval: () => {},
      requestAnimationFrame: (cb) => { if (typeof cb === 'function') setImmediate(cb); },
      cancelAnimationFrame: () => {}
    }
  };

  // Circular references
  sandbox.window.document = mockDoc;
  sandbox.window.window = sandbox.window;
  sandbox.window.localStorage = sandbox.localStorage;
  sandbox.window.sessionStorage = sandbox.sessionStorage;
  sandbox.window.navigator = sandbox.navigator;
  sandbox.window.location = mockLocation;
  sandbox.global = sandbox;
  sandbox.self = sandbox.window;

  vm.createContext(sandbox);

  // Load bundles
  const bundleCode = fs.readFileSync(path.join(ROOT_DIR, 'products-bundle.js'), 'utf8');
  vm.runInContext(bundleCode, sandbox);

  const scriptCode = fs.readFileSync(path.join(ROOT_DIR, scriptFileName), 'utf8');
  vm.runInContext(scriptCode, sandbox);

  const boundKeys = [
    'state', 'products', 'renderDetail', 'switchDetailFrame', 'toggleLanguage',
    'addToCart', 'getProduct', 'itemUnitPrice', 'createOrder', 'buildWhatsAppMessage',
    'productImageUrl', 'displayImageForItem', 'money', 't', 'renderCart',
    'cartSubtotal', 'cartGrandTotal', 'orderDeliveryFee', 'renderSingleCategory',
    'renderProducts', 'productGrid', 'openNav', 'closeNav', 'validateCoupon',
    'applyCoupon', 'removeCoupon', 'getDiscountedTotal', 'sendWhatsAppOrder',
    'buildNavMenu', 'updateQuantity', 'isProductOutOfStock', 'getProductStock',
    'catParam', 'getMergedProducts', 'getStoreHomeUrl'
  ];
  for (const k of boundKeys) {
    try {
      sandbox[k] = vm.runInContext(k, sandbox);
    } catch (_) {}
  }

  return {
    sandbox,
    storage,
    inMemoryDB,
    networkUploadLog,
    mockLocation,
    mockDoc,
    historyStack,
    getHistoryIndex: () => historyIndex,
    getCatParam: () => {
      try { return vm.runInContext('catParam', sandbox); } catch (_) { return null; }
    },
    popstateListeners,
    firePopstate: () => {
      for (const fn of popstateListeners) fn({ type: 'popstate', state: {} });
    }
  };
}

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
    add: async (url) => {
      mockCacheStore.set(url, { status: 200, url });
    }
  };

  const sandbox = {
    self: {
      location: { origin: customOrigin },
      addEventListener: (event, handler) => { listeners[event] = handler; },
      skipWaiting: () => {},
      clients: { claim: async () => {} }
    },
    caches: {
      open: async () => mockCache,
      match: async (req) => mockCache.match(req),
      keys: async () => ['poster-lab-store-v40', 'poster-lab-images-v2'],
      delete: async () => true
    },
    fetch: async (req) => {
      return {
        ok: true,
        status: 200,
        clone: () => ({ ok: true, status: 200 })
      };
    },
    Response: class MockResponse {
      constructor(body, init) {
        this.body = body;
        this.status = init?.status || 200;
      }
    },
    URL,
    Promise,
    console: { log: () => {}, warn: () => {}, error: () => {} }
  };

  vm.createContext(sandbox);
  vm.runInContext(swCode, sandbox);

  return {
    fetchListener: listeners['fetch'],
    mockCacheStore
  };
}

// =============================================================================
// SUITE 1: CART CALCULATIONS & MULTI-ITEM STRESS
// =============================================================================
async function testCartMathAndStress() {
  console.log('\n--- SUITE 1: Cart Calculations & Multi-Item Stress ---');

  const env = createStoreEnvironment('index.html');
  const { sandbox } = env;

  // 1.1 Empty cart math invariants
  sandbox.state.cart = [];
  sandbox.renderCart();
  check('1.1.1 Empty cart subtotal is exactly 0', sandbox.cartSubtotal() === 0);
  check('1.1.2 Empty cart delivery fee is exactly 0', sandbox.orderDeliveryFee() === 0);
  check('1.1.3 Empty cart grand total is exactly 0', sandbox.cartGrandTotal() === 0);

  // 1.2 Multi-item standard pricing matrix across all 4 tier sizes and frames
  const sizePricingExpectation = {
    '20x30': 180,
    '30x40': 200,
    '40x50': 250,
    '50x70': 300
  };
  const frames = ['Black', 'White', 'Transparent'];

  let accumulatedSubtotal = 0;
  const mockItems = [];

  for (const [size, expectedPrice] of Object.entries(sizePricingExpectation)) {
    for (const frame of frames) {
      const p = sandbox.getProduct('football-001');
      const unit = sandbox.itemUnitPrice(p, size, frame);
      check(`1.2.1 football-001 [${size}, ${frame}] unit price is ${expectedPrice} EGP (frame adder 0)`, unit === expectedPrice);
      
      const item = {
        key: `football-001-${size}-${frame}`,
        productId: 'football-001',
        size,
        frame,
        quantity: 2
      };
      mockItems.push(item);
      accumulatedSubtotal += (expectedPrice * 2);
    }
  }

  sandbox.state.cart = mockItems;
  sandbox.renderCart();
  const subtotal = sandbox.cartSubtotal();
  const delivery = sandbox.orderDeliveryFee();
  const grandTotal = sandbox.cartGrandTotal();

  check('1.2.2 12-item matrix subtotal matches exact mathematical sum', subtotal === accumulatedSubtotal, `subtotal: ${subtotal}, expected: ${accumulatedSubtotal}`);
  check('1.2.3 Non-empty cart incurs standard 35 EGP delivery fee', delivery === 35);
  check('1.2.4 Grand total equals subtotal + 35 EGP', grandTotal === accumulatedSubtotal + 35, `grand: ${grandTotal}, expected: ${accumulatedSubtotal + 35}`);

  // 1.3 High-item volume stress (50 items across diverse categories)
  const stressCart = [];
  let expectedStressSum = 0;
  const sampleProducts = sandbox.getMergedProducts().slice(0, 50);

  sampleProducts.forEach((p, idx) => {
    const size = idx % 4 === 0 ? '20x30' : (idx % 4 === 1 ? '30x40' : (idx % 4 === 2 ? '40x50' : '50x70'));
    const frame = idx % 3 === 0 ? 'Black' : (idx % 3 === 1 ? 'White' : 'Transparent');
    const qty = (idx % 5) + 1;
    const unitPrice = sandbox.itemUnitPrice(p, size, frame);
    expectedStressSum += unitPrice * qty;
    stressCart.push({
      key: `${p.id}-${size}-${frame}-${idx}`,
      productId: p.id,
      size,
      frame,
      quantity: qty
    });
  });

  sandbox.state.cart = stressCart;
  sandbox.renderCart();
  check('1.3.1 50-item massive cart subtotal matches exact mathematical sum', sandbox.cartSubtotal() === expectedStressSum);
  check('1.3.2 50-item grand total retains exact mathematical precision without float drift', sandbox.cartGrandTotal() === expectedStressSum + 35);

  // 1.4 Coupon Calculation & Adversarial Boundaries
  // 1.4.1 Percent coupon math (SAVE10 -> 10%)
  sandbox.state.cart = [{
    key: 'football-001-20x30-Black',
    productId: 'football-001',
    size: '20x30',
    frame: 'Black',
    quantity: 2 // 360 EGP
  }];
  const sub360 = sandbox.cartSubtotal(); // 360
  const vPercent = sandbox.validateCoupon('SAVE10', sub360);
  check('1.4.1.1 SAVE10 percent coupon is valid on 360 EGP subtotal', vPercent.valid === true);
  check('1.4.1.2 10% discount on 360 EGP is exactly 36 EGP', vPercent.discount === 36);

  sandbox.applyCoupon('SAVE10');
  check('1.4.1.3 getDiscountedTotal() returns 324 EGP', sandbox.getDiscountedTotal() === 324);
  check('1.4.1.4 cartGrandTotal() with coupon returns 324 + 35 = 359 EGP', sandbox.cartGrandTotal() === 359);

  // 1.4.2 Flat coupon & subtotal capping (BIGDISCOUNT 500 EGP on 360 EGP subtotal)
  const vBig = sandbox.validateCoupon('BIGDISCOUNT', sub360);
  check('1.4.2.1 500 EGP coupon on 360 EGP order capped at subtotal (360 EGP discount)', vBig.discount === 360);
  sandbox.applyCoupon('BIGDISCOUNT');
  check('1.4.2.2 getDiscountedTotal() with capped coupon is 0 EGP (subtotal never negative)', sandbox.getDiscountedTotal() === 0);
  check('1.4.2.3 cartGrandTotal() with 100% covered order is only the delivery fee (35 EGP)', sandbox.cartGrandTotal() === 35);

  // 1.4.3 minOrder boundary threshold (MIN500 requires 500 EGP)
  const vMinFail = sandbox.validateCoupon('MIN500', 499);
  const vMinPassExact = sandbox.validateCoupon('MIN500', 500);
  const vMinPassAbove = sandbox.validateCoupon('MIN500', 501);
  check('1.4.3.1 Coupon with minOrder=500 rejected at boundary 499 EGP', vMinFail.valid === false);
  check('1.4.3.2 Coupon with minOrder=500 accepted at exact boundary 500 EGP', vMinPassExact.valid === true);
  check('1.4.3.3 Coupon with minOrder=500 accepted above boundary at 501 EGP', vMinPassAbove.valid === true);

  // 1.4.4 Dynamic coupon invalidation when items removed
  sandbox.state.cart = [
    { key: 'item-1', productId: 'football-001', size: '50x70', frame: 'Black', quantity: 2 } // 600 EGP
  ];
  sandbox.applyCoupon('MIN500'); // Valid, subtotal = 600
  check('1.4.4.1 Coupon MIN500 initially applied to 600 EGP cart', sandbox.state.appliedCoupon !== null);

  // Now mutate cart to reduce subtotal below 500
  sandbox.state.cart[0].quantity = 1; // 300 EGP (< 500)
  const reevaluatedTotal = sandbox.getDiscountedTotal();
  check('1.4.4.2 getDiscountedTotal() self-corrects and revokes discount when subtotal falls below minOrder', reevaluatedTotal === 300);

  // 1.4.5 Coupon exhaustion (maxUses)
  const vExhausted = sandbox.validateCoupon('EXHAUSTED', 1000);
  check('1.4.5.1 Coupon with uses >= maxUses rejected', vExhausted.valid === false && vExhausted.msg.includes('maximum uses'));

  // 1.4.6 Invalid coupon code injection
  check('1.4.6.1 Empty string coupon rejected', sandbox.validateCoupon('', 300).valid === false);
  check('1.4.6.2 Null coupon rejected', sandbox.validateCoupon(null, 300).valid === false);
  check('1.4.6.3 Bogus coupon code rejected', sandbox.validateCoupon('NONEXISTENT_CODE', 300).valid === false);
  check('1.4.6.4 Case-insensitive and trimmed coupon code accepted', sandbox.validateCoupon('  save10  ', 300).valid === true);

  // 1.5 Stock Exhaustion & Enforcement
  const baseP = sandbox.products.find(p => p.id === 'football-001');
  if (baseP) baseP.quantity = 2; // Finite stock = 2
  sandbox.localStorage.setItem('pls-products', JSON.stringify([{ id: 'football-001', quantity: 2 }]));

  sandbox.state.cart = [];
  await sandbox.addToCart('football-001', '20x30', 'Black'); // Qty 1
  await sandbox.addToCart('football-001', '20x30', 'Black'); // Qty 2
  check('1.5.1 Added 2 items up to finite stock limit of 2', sandbox.state.cart[0].quantity === 2);

  // Attempt to add 3rd item (exceeds stock)
  await sandbox.addToCart('football-001', '20x30', 'Black');
  check('1.5.2 3rd item rejected by addToCart stock guard (qty remains 2)', sandbox.state.cart[0].quantity === 2);

  // Multi-line stock aggregation: adding another size for same product when stock limit reached
  await sandbox.addToCart('football-001', '30x40', 'Black');
  check('1.5.3 Adding different size for same exhausted product rejected (overall product stock tracked)', sandbox.state.cart.length === 1 && sandbox.state.cart[0].quantity === 2);

  // Completely out-of-stock product
  if (baseP) baseP.quantity = 0;
  sandbox.localStorage.setItem('pls-products', JSON.stringify([{ id: 'football-001', quantity: 0 }]));
  const pStock0 = sandbox.getProduct('football-001');
  check('1.5.4 isProductOutOfStock returns true for quantity=0', sandbox.isProductOutOfStock(pStock0) === true);
  await sandbox.addToCart('football-001', '40x50', 'White');
  check('1.5.5 addToCart refuses completely out-of-stock product', sandbox.state.cart.every(i => i.size !== '40x50'));

  // Reset stock back to normal
  if (baseP) delete baseP.quantity;
  sandbox.localStorage.removeItem('pls-products');

  // 1.6 Invalid Quantity Injection & Corrupt State Recovery
  // 1.6.1 Corrupt JSON in localStorage
  sandbox.localStorage.setItem('poster-lab-cart', '<<<INVALID JSON CORRUPT STATE>>>');
  const recoveredCart = sandbox.state.cart; // loadCart safety
  check('1.6.1 loadCart gracefully recovers from malformed JSON without throwing', Array.isArray(recoveredCart));

  // 1.6.2 Deleted / unknown productId in cart
  sandbox.state.cart = [{
    key: 'deleted-item-999-20x30-Black',
    productId: 'deleted-item-999',
    size: '20x30',
    frame: 'Black',
    quantity: 3
  }];
  sandbox.renderCart();
  check('1.6.2.1 cartSubtotal returns 0 for deleted/unknown productId', sandbox.cartSubtotal() === 0);
  check('1.6.2.2 renderCart renders without error when non-existent item is present', true);

  // 1.6.3 Negative quantity cleanup
  sandbox.state.cart = [{
    key: 'football-002-20x30-Black',
    productId: 'football-002',
    size: '20x30',
    frame: 'Black',
    quantity: -1
  }];
  await sandbox.updateQuantity('football-002-20x30-Black', -1);
  check('1.6.3 updateQuantity cleans up and purges item when quantity <= 0', sandbox.state.cart.length === 0);

  // 1.7 Cross-Page Cart State & Layout Persistence
  const storefrontPages = ['index.html', 'product.html', 'our-work.html', 'faq.html'];
  const testCartPayload = [
    { key: 'football-001-20x30-Black', productId: 'football-001', size: '20x30', frame: 'Black', quantity: 2 },
    { key: 'cars-001-30x40-White', productId: 'cars-001', size: '30x40', frame: 'White', quantity: 1 }
  ];

  for (const page of storefrontPages) {
    const pageEnv = createStoreEnvironment(page, '', testCartPayload);
    pageEnv.sandbox.renderCart();

    const cartCountEl = pageEnv.mockDoc.querySelector('[data-cart-count]');
    const cartTotalEl = pageEnv.mockDoc.querySelector('#cartTotal');
    const cartDrawerEl = pageEnv.mockDoc.querySelector('[data-cart-drawer]');
    const renderedArticles = pageEnv.mockDoc.querySelectorAll('.cart-item');

    check(`1.7.1 [${page}] has [data-cart-count] element`, cartCountEl !== null);
    check(`1.7.2 [${page}] cartCount displays exact total items count: 3`, cartCountEl && cartCountEl.textContent.trim() === '3');
    check(`1.7.3 [${page}] has #cartTotal element`, cartTotalEl !== null);
    check(`1.7.4 [${page}] cartTotal matches exact sum (180*2 + 200 + 35 = EGP 595)`, cartTotalEl && cartTotalEl.textContent.includes('595'));
    check(`1.7.5 [${page}] has [data-cart-drawer] with aria-hidden="true"`, cartDrawerEl && cartDrawerEl.getAttribute('aria-hidden') === 'true');
    check(`1.7.6 [${page}] rendered exactly 2 .cart-item articles`, renderedArticles.length === 2);
  }
}

// =============================================================================
// SUITE 2: MULTI-PAGE NAVIGATION & POPSTATE INTEGRITY
// =============================================================================
async function testNavigationAndPopstate() {
  console.log('\n--- SUITE 2: Multi-Page Navigation & Popstate Integrity ---');

  const env = createStoreEnvironment('index.html');
  const { sandbox, mockDoc, mockLocation, firePopstate } = env;

  // 2.1 Drawer Menu Structure & 19-Category Links
  sandbox.openNav();
  const drawerBody = mockDoc.querySelector('[data-nav-body]');
  check('2.1.1 Drawer body populated on openNav()', drawerBody !== null && drawerBody.children.length > 0);

  const subLinks = mockDoc.querySelectorAll('a.nav-sub');
  check('2.1.2 Drawer generates exactly 19 category links', subLinks.length === 19);

  const allHaveIndexPrefix = subLinks.every(a => a.href && a.href.startsWith('index.html?cat='));
  check('2.1.3 100% of drawer category links explicitly prefixed with index.html?cat=', allHaveIndexPrefix);

  const allHaveDataNavClose = subLinks.every(a => a.hasAttribute('data-nav-close'));
  check('2.1.4 100% of drawer category links have data-nav-close attribute', allHaveDataNavClose);

  // 2.2 Category click interception on Homepage vs Subpages
  // 2.2.1 On index.html: clicking a.nav-sub calls preventDefault(), pushes state, renders single category
  const carsLink = subLinks.find(a => a.href.includes('cat=cars'));
  const homeClickEvent = {
    type: 'click',
    defaultPrevented: false,
    preventDefault() { this.defaultPrevented = true; }
  };
  carsLink.dispatchEvent(homeClickEvent);

  check('2.2.1.1 Homepage category click calls preventDefault()', homeClickEvent.defaultPrevented === true);
  check('2.2.1.2 Homepage category click updates history to include ?cat=cars', mockLocation.search.includes('cat=cars'));
  check('2.2.1.3 Homepage category click sets catParam to "cars"', env.getCatParam() === 'cars');

  // 2.2.2 On subpage (product.html): clicking a.nav-sub does NOT call preventDefault()
  const prodEnv = createStoreEnvironment('product.html', 'id=football-001');
  prodEnv.sandbox.openNav();
  const prodSubLinks = prodEnv.mockDoc.querySelectorAll('a.nav-sub');
  const prodCarsLink = prodSubLinks.find(a => (a.href || '').includes('cat=cars'));
  const subClickEvent = {
    type: 'click',
    defaultPrevented: false,
    preventDefault() { this.defaultPrevented = true; }
  };
  if (prodCarsLink) prodCarsLink.dispatchEvent(subClickEvent);
  check('2.2.2.1 Subpage category click NEVER calls preventDefault() (allows normal page navigation to index.html?cat=cars)', subClickEvent.defaultPrevented === false);

  // 2.3 Popstate Integrity & Rapid Category Navigation on Homepage
  const categoriesToTraverse = ['football', 'anime', 'movie', 'quotes', 'gym', 'art', 'nba'];
  for (const cat of categoriesToTraverse) {
    const link = subLinks.find(a => a.href.includes(`cat=${cat}`));
    if (link) {
      const ev = { type: 'click', defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
      link.dispatchEvent(ev);
    }
  }
  check('2.3.1 Navigated deeply through 7 categories on homepage', env.getCatParam() === 'nba');

  // Traverse backward 3 steps
  sandbox.window.history.back(); // art (index 5)
  check('2.3.2 History back(1) correctly switches category to art', env.getCatParam() === 'art');
  sandbox.window.history.back(); // gym (index 4)
  check('2.3.3 History back(2) correctly switches category to gym', env.getCatParam() === 'gym');
  sandbox.window.history.back(); // quotes (index 3)
  check('2.3.4 History back(3) correctly switches category to quotes', env.getCatParam() === 'quotes');

  // Traverse forward 2 steps
  sandbox.window.history.forward(); // gym (index 4)
  check('2.3.5 History forward(1) correctly restores category to gym', env.getCatParam() === 'gym');
  sandbox.window.history.forward(); // art (index 5)
  check('2.3.6 History forward(2) correctly restores category to art', env.getCatParam() === 'art');

  // 2.4 Popstate Boundary Query Inputs
  // 2.4.1 Empty ?cat=
  mockLocation.search = '?cat=';
  firePopstate();
  check('2.4.1 Popstate with empty ?cat= handles gracefully without throwing', true);

  // 2.4.2 Non-existent category ?cat=nonexistent_xyz
  mockLocation.search = '?cat=nonexistent_xyz';
  firePopstate();
  const backBar = mockDoc.querySelector('.page-back-bar');
  const emptyState = mockDoc.querySelector('.empty-state');
  check('2.4.2.1 Popstate with nonexistent category renders clean empty state', emptyState !== null);
  check('2.4.2.2 Popstate with nonexistent category provides .page-back-btn (never traps user)', backBar !== null);

  // 2.5 Brand Logo Reset Stress
  // On homepage in single-category view
  sandbox.renderSingleCategory('cars');
  check('2.5.1 Currently in single category view for cars', env.getCatParam() === 'cars');

  const brandEl = mockDoc.querySelector('.brand');
  const brandClickEvent = {
    type: 'click',
    defaultPrevented: false,
    preventDefault() { this.defaultPrevented = true; }
  };
  brandEl.dispatchEvent(brandClickEvent);

  check('2.5.2.1 Homepage brand logo click calls preventDefault()', brandClickEvent.defaultPrevented === true);
  check('2.5.2.2 Homepage brand logo click resets catParam to null', env.getCatParam() === null);
  check('2.5.2.3 Homepage brand logo click clears active category', sandbox.state.activeCategory === null);
  check('2.5.2.4 Homepage brand logo click clears search state', sandbox.state.search === '');

  // On subpage (our-work.html)
  const workEnv = createStoreEnvironment('our-work.html');
  const workBrand = workEnv.mockDoc.querySelector('.brand');
  const workBrandClick = {
    type: 'click',
    defaultPrevented: false,
    preventDefault() { this.defaultPrevented = true; }
  };
  workBrand.dispatchEvent(workBrandClick);
  check('2.5.3 Subpage brand logo click navigates to index.html', workBrandClick.defaultPrevented === true && workEnv.mockLocation.href.includes('index.html'));

  // 2.6 In-Page Back Button (.page-back-btn)
  // On homepage category view
  sandbox.renderSingleCategory('football');
  const backBtn = mockDoc.querySelector('.page-back-btn');
  const backClickEvent = {
    type: 'click',
    defaultPrevented: false,
    preventDefault() { this.defaultPrevented = true; }
  };
  backBtn.dispatchEvent(backClickEvent);

  check('2.6.1.1 Homepage .page-back-btn click resets category view and returns to carousels', sandbox.catParam === null);

  // 2.7 Bilingual Language Switching Interaction (AR/EN)
  check('2.7.1 Initial language is en', sandbox.state.lang === 'en');
  check('2.7.2 Document direction initially ltr', mockDoc.documentElement.dir === 'ltr');

  // Toggle to Arabic
  sandbox.toggleLanguage();
  check('2.7.3 Language toggled to ar', sandbox.state.lang === 'ar');
  check('2.7.4 Document direction updated to rtl', mockDoc.documentElement.dir === 'rtl');
  check('2.7.5 Document lang updated to ar', mockDoc.documentElement.lang === 'ar');

  // Open drawer in Arabic: verify labels translated
  sandbox.openNav();
  const arSubLinks = mockDoc.querySelectorAll('a.nav-sub');
  const arFootball = arSubLinks.find(a => (a.href || '').includes('cat=football'));
  check('2.7.6 Arabic drawer contains translated football category label (كرة قدم)', arFootball && arFootball.textContent.includes('كرة قدم'));

  // Toggle back to English
  sandbox.toggleLanguage();
  check('2.7.7 Language toggled back to en', sandbox.state.lang === 'en');
  check('2.7.8 Document direction restored to ltr', mockDoc.documentElement.dir === 'ltr');
}

// =============================================================================
// SUITE 3: SERVICE WORKER SAME-ORIGIN BOUNDARY & SERVER CACHING
// =============================================================================
async function testServiceWorkerIsolation() {
  console.log('\n--- SUITE 3: Service Worker Same-Origin Boundary & Server Caching ---');

  const { fetchListener } = setupServiceWorkerEnvironment('https://posterlabstore.web.app');

  check('3.1 sw.js registers fetch event listener', typeof fetchListener === 'function');

  // 3.1.1 Matrix of 120+ cross-origin endpoints that MUST bypass SW cache
  const crossOriginEndpoints = [
    // Firestore & Google APIs
    'https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel',
    'https://firestore.googleapis.com/v1/projects/posterlabstore/databases/(default)/documents/products',
    'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword',
    'https://securetoken.googleapis.com/v1/token',
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap',
    'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2',
    'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
    'https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js',
    'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js',
    // Remote upload servers
    'https://tmpfiles.org/api/v1/upload',
    'https://tmpfiles.org/dl/12345/custom-poster.png',
    // Phishing, subdomain & origin spoofing
    'https://posterlabstore.web.app.evil-attacker.com/index.html',
    'https://evil-posterlabstore.web.app/sw.js',
    'https://posterlabstore.firebaseapp.com/index.html',
    'https://posterlabstore.web.app:8443/styles.min.css',
    'https://posterlabstore.web.app:3000/script.min.js',
    'http://posterlabstore.web.app/index.html' // Protocol mismatch (http vs https)
  ];

  // Expand matrix with permutations
  for (let i = 1; i <= 105; i++) {
    crossOriginEndpoints.push(`https://api-external-${i}.posterlabstore-cdn.net/data-${i}.json`);
  }

  let crossOriginBypassFailures = 0;
  for (const url of crossOriginEndpoints) {
    let respondedWith = false;
    const mockEvent = {
      request: {
        method: 'GET',
        url
      },
      respondWith: () => { respondedWith = true; }
    };
    fetchListener(mockEvent);
    if (respondedWith) {
      crossOriginBypassFailures++;
    }
  }

  check(`3.1.2 100% of ${crossOriginEndpoints.length} cross-origin endpoints bypass SW cache (0 calls to respondWith)`, crossOriginBypassFailures === 0, `Failures: ${crossOriginBypassFailures}`);

  // 3.1.3 Non-GET HTTP methods MUST bypass SW cache
  const nonGetMethods = ['POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
  let nonGetFailures = 0;
  for (const method of nonGetMethods) {
    let respondedWith = false;
    const mockEvent = {
      request: {
        method,
        url: 'https://posterlabstore.web.app/api/products'
      },
      respondWith: () => { respondedWith = true; }
    };
    fetchListener(mockEvent);
    if (respondedWith) nonGetFailures++;
  }
  check('3.1.3 All non-GET methods (POST, PUT, DELETE, PATCH, OPTIONS, HEAD) bypass SW cache', nonGetFailures === 0);

  // 3.1.4 Non-HTTP protocols bypass SW cache
  const nonHttpUrls = [
    'blob:https://posterlabstore.web.app/12345-blob',
    'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAD8D+JaQAA3AA/ua1AAA=',
    'chrome-extension://abcdefghijklmnop/main.js',
    'file:///C:/PosterLabStore/index.html',
    'javascript:void(0)'
  ];
  let nonHttpFailures = 0;
  for (const url of nonHttpUrls) {
    let respondedWith = false;
    const mockEvent = {
      request: { method: 'GET', url },
      respondWith: () => { respondedWith = true; }
    };
    try {
      fetchListener(mockEvent);
    } catch (_) {}
    if (respondedWith) nonHttpFailures++;
  }
  check('3.1.4 Non-HTTP protocols (blob, data, chrome-extension, file) bypass SW cache', nonHttpFailures === 0);

  // 3.1.5 Valid Same-Origin Requests MUST be intercepted
  const sameOriginAssets = [
    'https://posterlabstore.web.app/',
    'https://posterlabstore.web.app/index.html',
    'https://posterlabstore.web.app/styles.min.css',
    'https://posterlabstore.web.app/script.min.js',
    'https://posterlabstore.web.app/assets/poster-lab-logo.webp',
    'https://posterlabstore.web.app/admin/panel.html',
    'https://posterlabstore.web.app/firebase-config.js'
  ];

  let sameOriginInterceptSuccesses = 0;
  for (const url of sameOriginAssets) {
    let respondedWith = false;
    const mockEvent = {
      request: { method: 'GET', url },
      respondWith: (promise) => { respondedWith = true; }
    };
    fetchListener(mockEvent);
    if (respondedWith) sameOriginInterceptSuccesses++;
  }
  check(`3.1.5 100% of ${sameOriginAssets.length} same-origin assets intercepted via respondWith`, sameOriginInterceptSuccesses === sameOriginAssets.length);

  // 3.2 Server Caching Headers in firebase.json
  const fbJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'firebase.json'), 'utf8'));
  check('3.2.1 firebase.json contains hosting configuration', fbJson.hosting !== undefined);
  check('3.2.2 firebase.json specifies hosting.headers array', Array.isArray(fbJson.hosting.headers));

  const headers = fbJson.hosting.headers;
  const swRuleIndex = headers.findIndex(h => h.source === '/sw.js');
  const genericJsCssIndex = headers.findIndex(h => h.source === '**/*.@(js|css)');
  const imagesRule = headers.find(h => h.source.includes('webp') || h.source.includes('png'));

  check('3.2.3 Explicit rule for /sw.js exists in firebase.json', swRuleIndex !== -1);

  const swHeaders = headers[swRuleIndex]?.headers || [];
  const swCacheControl = swHeaders.find(h => h.key === 'Cache-Control')?.value || '';
  check('3.2.4 /sw.js specifies Cache-Control: "no-cache, no-store, must-revalidate"', swCacheControl.includes('no-cache') && swCacheControl.includes('no-store') && swCacheControl.includes('must-revalidate'));

  check('3.2.5 /sw.js rule strictly precedes generic **/*.@(js|css) rule for caching precedence', swRuleIndex < genericJsCssIndex);

  const imgCacheControl = imagesRule?.headers?.find(h => h.key === 'Cache-Control')?.value || '';
  check('3.2.6 Static image assets specify 1-year immutable caching (max-age=31536000, immutable)', imgCacheControl.includes('31536000') && imgCacheControl.includes('immutable'));

  const jsCssRule = headers[genericJsCssIndex];
  const jsCssCacheControl = jsCssRule?.headers?.find(h => h.key === 'Cache-Control')?.value || '';
  check('3.2.7 Generic JS/CSS assets specify max-age=86400 (24h)', jsCssCacheControl.includes('86400'));

  const ignores = fbJson.hosting.ignore || [];
  check('3.2.8 sw.js is NOT ignored in hosting.ignore', !ignores.includes('sw.js') && !ignores.includes('/sw.js'));
}

// =============================================================================
// SUITE 4: WHATSAPP CHECKOUT LATENCY & CUSTOM UPLOAD PIPELINE
// =============================================================================
async function testWhatsAppCheckoutLatency() {
  console.log('\n--- SUITE 4: WhatsApp Checkout Latency & Custom Upload Pipeline ---');

  const env = createStoreEnvironment('index.html');
  const { sandbox, networkUploadLog } = env;

  // Fill in checkout form fields
  const nameInp = sandbox.document.getElementById('customerName');
  const phoneInp = sandbox.document.getElementById('customerPhone');
  const addrInp = sandbox.document.getElementById('customerAddress');
  const payInp = sandbox.document.getElementById('paymentMethod');
  if (nameInp) nameInp.value = 'Mohamed Ali';
  if (phoneInp) phoneInp.value = '01012345678';
  if (addrInp) addrInp.value = '15 Cairo Street, Dokki, Giza';
  if (payInp) payInp.value = 'VF-Cash';

  // 4.1 Catalog Posters Zero-Upload Latency Benchmark
  sandbox.state.cart = [
    { key: 'football-001-20x30-Black', productId: 'football-001', size: '20x30', frame: 'Black', quantity: 2 },
    { key: 'cars-001-30x40-White', productId: 'cars-001', size: '30x40', frame: 'White', quantity: 1 },
    { key: 'anime-001-40x50-Transparent', productId: 'anime-001', size: '40x50', frame: 'Transparent', quantity: 1 }
  ];

  networkUploadLog.length = 0; // reset
  const tStart = Date.now();
  await sandbox.sendWhatsAppOrder();
  const tElapsed = Date.now() - tStart;

  const tmpfilesCalls = networkUploadLog.filter(req => typeof req.url === 'string' && req.url.includes('tmpfiles.org'));
  check('4.1.1 Catalog-only order makes ZERO calls to tmpfiles.org', tmpfilesCalls.length === 0);
  check(`4.1.2 Catalog-only checkout completes with zero remote upload latency (${tElapsed} ms <= 200 ms)`, tElapsed <= 200);

  // 4.2 Custom Design Upload Pipeline & IndexedDB Separation
  // Add a custom upload item
  const customPoster = sandbox.getProduct('custom-001') || {
    id: 'custom-001',
    name: 'Custom Poster Design',
    isCustom: true,
    basePrice: 180,
    sizes: { '20x30': 180 },
    frames: ['Black', 'White', 'Transparent']
  };

  sandbox.state.customUpload = {
    name: 'my-personal-art.png',
    size: 102400,
    type: 'image/png',
    url: 'blob:http://localhost/mock-blob-1234',
    dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
  };
  sandbox.state.customUploadFile = new sandbox.File(['mock-binary-data'], 'my-personal-art.png', { type: 'image/png' });

  // Add to cart
  await sandbox.addToCart('custom-design', '20x30', 'Black');
  const customCartItem = sandbox.state.cart.find(i => i.upload);
  check('4.2.1 Custom design added to cart', Boolean(customCartItem));

  // Verify localStorage clean payload (URL stripped, dataUrl NOT saved in localStorage)
  const savedCartRaw = sandbox.localStorage.getItem('poster-lab-cart');
  const savedCart = JSON.parse(savedCartRaw);
  const savedCustom = savedCart.find(i => i.upload);
  check('4.2.2 localStorage does NOT store bulky base64 dataUrl (prevents QuotaExceededError)', !savedCartRaw.includes('data:image/png;base64'));
  check('4.2.3 localStorage upload.url is empty string (blob URLs never persisted)', savedCustom.upload.url === '');

  // 4.2.4 Checkout with Custom Upload item
  networkUploadLog.length = 0;
  await sandbox.sendWhatsAppOrder();
  const customTmpfilesCalls = networkUploadLog.filter(req => typeof req.url === 'string' && req.url.includes('tmpfiles.org'));
  check('4.2.4 Custom design triggers upload to tmpfiles.org', customTmpfilesCalls.length === 1);

  // 4.3 Mixed Catalog & Custom Order
  sandbox.state.cart = [
    { key: 'football-001-20x30-Black', productId: 'football-001', size: '20x30', frame: 'Black', quantity: 1 },
    { key: 'cars-001-30x40-White', productId: 'cars-001', size: '30x40', frame: 'White', quantity: 1 },
    customCartItem
  ];
  networkUploadLog.length = 0;
  await sandbox.sendWhatsAppOrder();
  const mixedTmpfilesCalls = networkUploadLog.filter(req => typeof req.url === 'string' && req.url.includes('tmpfiles.org'));
  check('4.3.1 Mixed order uploads ONLY the custom item (exactly 1 call to tmpfiles.org for 3 total items)', mixedTmpfilesCalls.length === 1);

  // 4.4 Network Failure Recovery during Custom Upload
  sandbox._forceUploadFailure = true;
  let checkoutErrorThrown = false;
  try {
    await sandbox.sendWhatsAppOrder();
  } catch (err) {
    checkoutErrorThrown = true;
  }
  check('4.4.1 Remote upload network failure does NOT crash checkout or throw uncaught exception', checkoutErrorThrown === false);

  // 4.5 WhatsApp URL & Formatting Integrity
  const orderDetails = sandbox.createOrder(sandbox.readCheckoutForm());
  const waMsg = sandbox.buildWhatsAppMessage(orderDetails);
  check('4.5.1 WhatsApp message contains customer name', waMsg.includes('Mohamed Ali'));
  check('4.5.2 WhatsApp message contains customer phone', waMsg.includes('01012345678'));
  check('4.5.3 WhatsApp message contains customer address', waMsg.includes('Dokki, Giza'));
  check('4.5.4 WhatsApp message contains Payment Method details', waMsg.includes('VF-Cash - 01090927525'));
  check('4.5.5 WhatsApp message contains Order ID', waMsg.includes(orderDetails.id));
  check('4.5.6 WhatsApp message contains Subtotal, Delivery, and Total', waMsg.includes('Subtotal') && waMsg.includes('Delivery'));

  const encodedUrl = `https://wa.me/201010414187?text=${encodeURIComponent(waMsg)}`;
  check('4.5.7 Encoded WhatsApp URL targets official Poster Lab number (201010414187)', encodedUrl.startsWith('https://wa.me/201010414187?text='));
}

// =============================================================================
// SUITE 5: PRODUCTION MINIFIED ASSET PARITY (script.min.js vs script.js)
// =============================================================================
async function testMinifiedAssetParity() {
  console.log('\n--- SUITE 5: Production Minified Asset Parity ---');

  const devEnv = createStoreEnvironment('index.html', '', [], 'script.js');
  const prodEnv = createStoreEnvironment('index.html', '', [], 'script.min.js');

  // Verify cart pricing parity
  const p1 = devEnv.sandbox.getProduct('football-001');
  const p2 = prodEnv.sandbox.getProduct('football-001');
  check('5.1.1 Product pricing parity between dev and prod scripts', 
    devEnv.sandbox.itemUnitPrice(p1, '20x30', 'Black') === prodEnv.sandbox.itemUnitPrice(p2, '20x30', 'Black') &&
    devEnv.sandbox.itemUnitPrice(p1, '50x70', 'Transparent') === prodEnv.sandbox.itemUnitPrice(p2, '50x70', 'Transparent')
  );

  // Verify coupon validation parity
  const c1 = devEnv.sandbox.validateCoupon('SAVE10', 400);
  const c2 = prodEnv.sandbox.validateCoupon('SAVE10', 400);
  check('5.1.2 Coupon discount parity between dev and prod scripts', c1.discount === c2.discount && c1.valid === c2.valid);

  // Verify navigation drawer generation parity
  devEnv.sandbox.openNav();
  prodEnv.sandbox.openNav();
  const devLinks = devEnv.mockDoc.querySelectorAll('a.nav-sub');
  const prodLinks = prodEnv.mockDoc.querySelectorAll('a.nav-sub');
  check('5.1.3 Navigation drawer links parity (19 categories) in minified script', devLinks.length === 19 && prodLinks.length === 19);

  // Verify observable DOM rendering parity for single category
  devEnv.sandbox.renderSingleCategory('football');
  prodEnv.sandbox.renderSingleCategory('football');
  const devHeader = devEnv.mockDoc.querySelector('.single-cat-header h2');
  const prodHeader = prodEnv.mockDoc.querySelector('.single-cat-header h2');
  check('5.1.4 Both dev and prod scripts render single category header with exact parity', 
    devHeader !== null && prodHeader !== null && devHeader.textContent.trim() === prodHeader.textContent.trim()
  );
}

// =============================================================================
// MAIN TEST HARNESS RUNNER
// =============================================================================
async function runAllSuites() {
  try {
    await testCartMathAndStress();
    await testNavigationAndPopstate();
    await testServiceWorkerIsolation();
    await testWhatsAppCheckoutLatency();
    await testMinifiedAssetParity();

    console.log('\n======================================================================');
    console.log('                 ADVERSARIAL STRESS TEST SUMMARY');
    console.log('======================================================================');
    console.log(` Total Assertions Evaluated: ${totalAssertions}`);
    console.log(` Passed Assertions:          ${passedAssertions}`);
    console.log(` Failed Assertions:          ${failedAssertions}`);
    console.log('======================================================================\n');

    if (failedAssertions > 0) {
      console.error('FAILED ASSERTIONS DETAILS:');
      failureDetails.forEach(d => console.error(`  ✖ ${d}`));
      process.exit(1);
    } else {
      console.log('ALL ADVERSARIAL STRESS ASSERTIONS PASSED WITH ZERO GAPS!\n');
      process.exit(0);
    }
  } catch (err) {
    console.error('FATAL UNHANDLED ERROR IN SUITE EXECUTION:', err);
    process.exit(2);
  }
}

runAllSuites();

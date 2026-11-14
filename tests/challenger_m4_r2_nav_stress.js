/**
 * =============================================================================
 * CHALLENGER M4-R2-1: POPSTATE, BRAND LOGO, PAGE-BACK & ASYNC FIRESTORE STRESS
 * =============================================================================
 * Adversarial stress harness targeting Milestone 4 Remediation:
 * 1. Rapid browser back/forward transitions between root, category, and detail pages.
 * 2. Brand logo (.brand) clicks while in single-category view.
 * 3. In-page (.page-back-btn) clicks from category view.
 * 4. Async Firestore updates arriving while user transitions back to root.
 * 5. Corner-cases: empty cat query (?cat=), non-existent cat (?cat=xyz), rapid ping-pong popstate.
 * 6. AST & Minified asset parity across script.js and script.min.js.
 * =============================================================================
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = [];

function check(desc, condition, extraInfo = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  [PASS] ${desc}`);
  } else {
    failedChecks.push({ desc, extraInfo });
    console.error(`  [FAIL] ${desc}${extraInfo ? ` -> ${extraInfo}` : ''}`);
  }
}

// -----------------------------------------------------------------------------
// Lightweight Headless DOM Simulator for Storefront & Navigation
// -----------------------------------------------------------------------------
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

class MockClassList {
  constructor(node) {
    this.node = node;
    this._tokens = new Set();
  }
  add(...tokens) {
    for (const t of tokens) if (t) this._tokens.add(t);
    this.sync();
  }
  remove(...tokens) {
    for (const t of tokens) if (t) this._tokens.delete(t);
    this.sync();
  }
  toggle(token, force) {
    if (force !== undefined) {
      if (force) this.add(token); else this.remove(token);
      return force;
    }
    const has = this._tokens.has(token);
    if (has) this.remove(token); else this.add(token);
    return !has;
  }
  contains(token) {
    return this._tokens.has(token);
  }
  sync() {
    this.node.attributes.class = Array.from(this._tokens).join(' ');
  }
  setFromAttr(val) {
    this._tokens.clear();
    if (val && typeof val === 'string') {
      val.split(/\s+/).filter(Boolean).forEach(t => this._tokens.add(t));
    }
  }
}

class MockElement {
  constructor(tagName, parentElement = null) {
    this.tagName = tagName.toUpperCase();
    this.nodeName = this.tagName;
    this.nodeType = 1;
    this.parentElement = parentElement;
    this.children = [];
    this.attributes = {};
    this.dataset = {};
    this.style = {};
    this.listeners = new Map();
    this.classList = new MockClassList(this);
    this._textContent = '';
    this._innerHTML = '';
  }

  get parentNode() { return this.parentElement; }

  get id() { return this.attributes.id || ''; }
  set id(val) { this.attributes.id = String(val); }

  get className() { return this.attributes.class || ''; }
  set className(val) {
    this.attributes.class = val;
    this.classList.setFromAttr(val);
  }

  get textContent() {
    if (this.children.length === 0) return this._textContent;
    return this.children.map(c => c.textContent).join(' ');
  }
  set textContent(val) {
    this.children = [];
    this._textContent = String(val);
    this._innerHTML = String(val).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  get innerHTML() {
    if (this._innerHTML && this.children.length === 0) return this._innerHTML;
    return this.children.map(c => c.outerHTML).join('');
  }
  set innerHTML(val) {
    this.children = [];
    this._innerHTML = String(val);
    parseHtmlToMockElementTree(this._innerHTML, this);
  }

  get outerHTML() {
    const tag = this.tagName.toLowerCase();
    const attrs = Object.entries(this.attributes)
      .map(([k, v]) => ` ${k}="${String(v).replace(/"/g, '&quot;')}"`)
      .join('');
    if (VOID_ELEMENTS.has(tag)) return `<${tag}${attrs}>`;
    return `<${tag}${attrs}>${this.innerHTML}</${tag}>`;
  }

  setAttribute(name, val) {
    const key = name.toLowerCase();
    this.attributes[key] = String(val);
    if (key === 'class') this.classList.setFromAttr(String(val));
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
    if (this.parentElement) this.parentElement.removeChild(this);
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
    if (!this.listeners.has(type)) return;
    const list = this.listeners.get(type);
    const idx = list.indexOf(fn);
    if (idx >= 0) list.splice(idx, 1);
  }

  dispatchEvent(event) {
    if (!event.target) event.target = this;
    if (event.defaultPrevented === undefined) event.defaultPrevented = false;
    if (!event.preventDefault) {
      event.preventDefault = () => { event.defaultPrevented = true; };
    }
    if (!event.stopPropagation) {
      event.stopPropagation = () => { event._stopped = true; };
    }

    let cur = this;
    while (cur && !event._stopped) {
      const list = cur.listeners.get(event.type);
      if (list) {
        for (const fn of [...list]) {
          fn.call(cur, event);
          if (event._stopped) break;
        }
      }
      cur = cur.parentElement;
    }
    return !event.defaultPrevented;
  }

  querySelector(selector) {
    const all = this.querySelectorAll(selector);
    return all.length > 0 ? all[0] : null;
  }

  querySelectorAll(selector) {
    const results = [];
    const matchSimple = (node, sel) => {
      if (!sel || !node.tagName) return false;
      const s = sel.trim();
      if (s === '*') return true;
      if (s.startsWith('#')) return node.id === s.slice(1);
      if (s.startsWith('.')) return node.classList.contains(s.slice(1));
      if (s.startsWith('[') && s.endsWith(']')) {
        const inner = s.slice(1, -1);
        if (inner.includes('=')) {
          const [k, v] = inner.split('=');
          const cleanV = v.replace(/^["']|["']$/g, '');
          return node.getAttribute(k) === cleanV;
        }
        return node.hasAttribute(inner);
      }
      return node.tagName.toLowerCase() === s.toLowerCase();
    };

    const matchCompound = (node, sel) => {
      const parts = sel.match(/[.#]?[a-zA-Z0-9\-_]+|\[[^\]]+\]/g) || [];
      if (!parts.length) return false;
      return parts.every(part => matchSimple(node, part));
    };

    const traverse = (node) => {
      for (const child of node.children) {
        if (selector.includes(',')) {
          const subSelectors = selector.split(',').map(x => x.trim());
          if (subSelectors.some(sub => matchCompound(child, sub))) results.push(child);
        } else if (selector.includes(' ')) {
          const segments = selector.split(/\s+/).filter(Boolean);
          if (matchSegmentChain(child, segments)) results.push(child);
        } else {
          if (matchCompound(child, selector)) results.push(child);
        }
        traverse(child);
      }
    };

    const matchSegmentChain = (leaf, segments) => {
      let cur = leaf;
      for (let i = segments.length - 1; i >= 0; i--) {
        const seg = segments[i];
        while (cur && !matchCompound(cur, seg)) cur = cur.parentElement;
        if (!cur) return false;
        cur = cur.parentElement;
      }
      return true;
    };

    traverse(this);
    return results;
  }

  closest(selector) {
    let cur = this;
    while (cur && cur.tagName) {
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

  scrollIntoView() {}
  scrollBy() {}
  focus() { this._focused = true; }
  blur() { this._focused = false; }
  toDataURL() { return 'data:image/webp;base64,mock'; }
  getContext() { return { fillRect: () => {}, drawImage: () => {} }; }
  getBoundingClientRect() { return { top: 50, bottom: 150, left: 10, right: 110, width: 100, height: 100 }; }
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

function createStoreEnvironment(pageName = 'index.html', queryParams = '') {
  const htmlPath = path.join(ROOT_DIR, pageName);
  const rawHtml = fs.readFileSync(htmlPath, 'utf8');

  const storage = {
    'poster-lab-cart': '[]',
    'pls-cart': '[]',
    'pls-lang': 'en',
    'poster-lab-theme': 'light'
  };

  const documentElement = new MockElement('html');
  documentElement.setAttribute('lang', 'en');
  const head = new MockElement('head', documentElement);
  const body = new MockElement('body', documentElement);
  documentElement.children.push(head, body);

  const bodyMatch = rawHtml.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    parseHtmlToMockElementTree(bodyMatch[1], body);
  }

  const initialUrl = `http://localhost/${pageName}${queryParams ? '?' + queryParams : ''}`;
  const historyStack = [initialUrl];
  let historyIndex = 0;

  const mockLocation = {
    href: initialUrl,
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

  let firestoreProductsResolver = null;

  const sandbox = {
    console: { log: () => {}, warn: () => {}, error: () => {}, info: () => {} },
    setTimeout: (cb, delay) => { if (typeof cb === 'function') cb(); return 1; },
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    Intl, Math, Date, Array, Object, String, Number, Map, Set, RegExp, JSON, Promise,
    encodeURIComponent, decodeURIComponent, parseFloat, parseInt, isNaN, isFinite,
    URL: class MockURL extends URL {
      constructor(pathStr, base) {
        super(pathStr, base || mockLocation.href);
      }
      static createObjectURL() { return `blob:http://localhost/${Math.random().toString(36).slice(2)}`; }
      static revokeObjectURL() {}
    },
    URLSearchParams,
    navigator: { userAgent: 'Mozilla/5.0', language: 'en-US' },
    localStorage: {
      getItem: (k) => storage[k] !== undefined ? storage[k] : null,
      setItem: (k, v) => { storage[k] = String(v); },
      removeItem: (k) => { delete storage[k]; },
      clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
    },
    sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
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
    syncProductsFromFirestore: () => new Promise(res => {
      firestoreProductsResolver = res;
      // default immediate resolve with 0 (no updates yet)
      res(0);
    }),
    syncCouponsFromFirestore: () => {},
    initLiveSyncChannel: () => {}
  };

  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.document = mockDoc;
  sandbox.window.innerWidth = 1200;
  sandbox.window.innerHeight = 800;
  sandbox.window.scrollY = 0;
  let scrollToCallCount = 0;
  sandbox.window.scrollTo = (opts) => {
    scrollToCallCount++;
    sandbox.window.scrollY = typeof opts === 'object' ? opts.top : opts;
  };
  sandbox.getScrollToCallCount = () => scrollToCallCount;
  sandbox.window.location = mockLocation;

  sandbox.window.history = {
    length: 1,
    pushState: (st, title, newUrl) => {
      const u = new URL(newUrl, mockLocation.origin);
      mockLocation.href = u.href;
      mockLocation.search = u.search;
      mockLocation.pathname = u.pathname;
      historyStack.push(u.href);
      historyIndex = historyStack.length - 1;
      sandbox.window.history.length = historyStack.length;
    },
    replaceState: (st, title, newUrl) => {
      const u = new URL(newUrl, mockLocation.origin);
      mockLocation.href = u.href;
      mockLocation.search = u.search;
      mockLocation.pathname = u.pathname;
      historyStack[historyIndex] = u.href;
    },
    back: () => {
      if (historyIndex > 0) {
        historyIndex--;
        const prevUrl = historyStack[historyIndex];
        const u = new URL(prevUrl, mockLocation.origin);
        mockLocation.href = u.href;
        mockLocation.search = u.search;
        mockLocation.pathname = u.pathname;
        for (const fn of [...popstateListeners]) fn({ type: 'popstate', state: {} });
      }
    },
    forward: () => {
      if (historyIndex < historyStack.length - 1) {
        historyIndex++;
        const nextUrl = historyStack[historyIndex];
        const u = new URL(nextUrl, mockLocation.origin);
        mockLocation.href = u.href;
        mockLocation.search = u.search;
        mockLocation.pathname = u.pathname;
        for (const fn of [...popstateListeners]) fn({ type: 'popstate', state: {} });
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

  const loadScripts = (bundle = 'products-bundle.min.js', script = 'script.min.js') => {
    if (bundle) {
      const bCode = fs.readFileSync(path.join(ROOT_DIR, bundle), 'utf8');
      vm.runInContext(bCode, sandbox);
    }
    if (script) {
      const sCode = fs.readFileSync(path.join(ROOT_DIR, script), 'utf8');
      vm.runInContext(sCode, sandbox);
    }
    const bound = [
      'state', 'products', 'catParam', 'renderSingleCategory', 'renderProducts',
      'renderCatPills', 'triggerLiveUIReRender', 'productGrid', 'openNav', 'closeNav',
      'filteredProducts', 'getMergedProducts', 'getProduct'
    ];
    for (const k of bound) {
      try { sandbox[k] = vm.runInContext(k, sandbox); } catch (_) {}
    }
  };

  return {
    sandbox,
    mockDoc,
    mockLocation,
    historyStack,
    getHistoryIndex: () => historyIndex,
    popstateListeners,
    loadScripts
  };
}

console.log('======================================================================');
console.log(' CHALLENGER M4-R2-1: POPSTATE & HOMEPAGE STATE TRANSITIONS STRESS');
console.log('======================================================================');

// =============================================================================
// SUITE 1: RAPID BROWSER BACK/FORWARD & MULTI-STEP TRANSITIONS
// =============================================================================
console.log('\n--- Suite 1: Rapid Browser Back/Forward Navigation & Deep History Stacks ---');

{
  const env = createStoreEnvironment('index.html');
  env.loadScripts();

  const openNavBtn = env.mockDoc.querySelector('[data-open-nav]');
  if (openNavBtn) openNavBtn.dispatchEvent({ type: 'click' });
  const navSubLinks = env.mockDoc.querySelectorAll('a.nav-sub');

  check('Drawer initialized and contains category links', navSubLinks.length === 19);

  // Step 1.1: Push 4 categories in sequence: root -> cars -> football -> anime -> rap
  const testCats = ['cars', 'football', 'anime', 'rap'];
  for (const c of testCats) {
    const link = navSubLinks.find(a => (a.getAttribute('href') || '').includes(`cat=${c}`));
    link.dispatchEvent({ type: 'click' });
    check(`Navigated to ?cat=${c}`, env.mockLocation.search === `?cat=${c}`);
    const h2 = env.mockDoc.querySelector('.single-cat-header h2');
    check(`Header rendered for ${c}`, Boolean(h2) && h2.textContent.toLowerCase().includes(c));
  }

  // Step 1.2: Stepwise Back button navigation
  // rap -> anime
  env.sandbox.window.history.back();
  check('Back 1: search is ?cat=anime', env.mockLocation.search === '?cat=anime');
  let header = env.mockDoc.querySelector('.single-cat-header h2');
  check('Back 1: anime category rendered', Boolean(header) && header.textContent.toLowerCase().includes('anime'));

  // anime -> football
  env.sandbox.window.history.back();
  check('Back 2: search is ?cat=football', env.mockLocation.search === '?cat=football');
  header = env.mockDoc.querySelector('.single-cat-header h2');
  check('Back 2: football category rendered', Boolean(header) && header.textContent.toLowerCase().includes('football'));

  // football -> Forward -> anime
  env.sandbox.window.history.forward();
  check('Forward 1: search is ?cat=anime', env.mockLocation.search === '?cat=anime');
  header = env.mockDoc.querySelector('.single-cat-header h2');
  check('Forward 1: anime category re-rendered', Boolean(header) && header.textContent.toLowerCase().includes('anime'));

  // anime -> Back -> football
  env.sandbox.window.history.back();
  check('Back 3: search is ?cat=football', env.mockLocation.search === '?cat=football');

  // football -> Back -> cars
  env.sandbox.window.history.back();
  check('Back 4: search is ?cat=cars', env.mockLocation.search === '?cat=cars');
  header = env.mockDoc.querySelector('.single-cat-header h2');
  check('Back 4: cars category rendered', Boolean(header) && header.textContent.toLowerCase().includes('cars'));

  // cars -> Back -> ROOT (index.html, search is empty)
  env.sandbox.window.history.back();
  check('Back 5: search is empty (reached root)', env.mockLocation.search === '');
  const singleHeaderAtRoot = env.mockDoc.querySelector('.single-cat-header');
  check('Back 5: .single-cat-header is completely removed at root', singleHeaderAtRoot === null);
  const catSectionsAtRoot = env.mockDoc.querySelectorAll('.category-section');
  check('Back 5: Multi-category sections are restored at root (> 5 sections)', catSectionsAtRoot.length > 5, `Found: ${catSectionsAtRoot.length}`);

  // Step 1.3: 50-cycle rapid ping-pong stress test (Forward <-> Back)
  console.log('  * Running 50-cycle rapid ping-pong between root and cars');
  let pingPongDesync = 0;
  for (let i = 0; i < 50; i++) {
    env.sandbox.window.history.forward(); // -> cars
    if (env.mockLocation.search !== '?cat=cars' || !env.mockDoc.querySelector('.single-cat-header')) {
      pingPongDesync++;
    }
    env.sandbox.window.history.back(); // -> root
    if (env.mockLocation.search !== '' || env.mockDoc.querySelector('.single-cat-header')) {
      pingPongDesync++;
    }
  }
  check('50 rapid ping-pong transitions executed with 0 DOM state desynchronizations', pingPongDesync === 0, `Desync count: ${pingPongDesync}`);
  check('DOM remained in multi-category catalog after ping-pong stress', env.mockDoc.querySelectorAll('.category-section').length > 5);
}

// Deep 19-category full stack push and rapid rewind
{
  console.log('\n  * Stress testing deep 19-category stack push and consecutive rapid rewind');
  const env = createStoreEnvironment('index.html');
  env.loadScripts();

  const openNavBtn = env.mockDoc.querySelector('[data-open-nav]');
  if (openNavBtn) openNavBtn.dispatchEvent({ type: 'click' });
  const navSubLinks = env.mockDoc.querySelectorAll('a.nav-sub');

  const ALL_CATS = [
    'custom', 'football', 'cars', 'clubs', 'anime', 'movie', 'album',
    'quotes', 'islamic', 'art', 'gym', 'girls', 'games', 'cities',
    'nba', 'meemes', 'pharaonic', 'rap', 'jordan'
  ];

  for (const cat of ALL_CATS) {
    const link = navSubLinks.find(a => (a.getAttribute('href') || '').includes(`cat=${cat}`));
    link.dispatchEvent({ type: 'click' });
  }

  check('History stack length reached 20 entries (1 root + 19 categories)', env.historyStack.length === 20);
  check('Current URL is ?cat=jordan', env.mockLocation.search === '?cat=jordan');

  // Rapidly rewind 19 times
  let rewindErrors = 0;
  for (let i = ALL_CATS.length - 2; i >= 0; i--) {
    env.sandbox.window.history.back();
    const expectedCat = ALL_CATS[i];
    const searchMatch = env.mockLocation.search === `?cat=${expectedCat}`;
    const h2 = env.mockDoc.querySelector('.single-cat-header h2');
    const headerMatch = Boolean(h2) && (
      h2.textContent.toLowerCase().includes(expectedCat) ||
      (expectedCat === 'meemes' && h2.textContent.toLowerCase().includes('memes')) ||
      (expectedCat === 'custom' && h2.textContent.toLowerCase().includes('custom'))
    );
    if (!searchMatch || !headerMatch) {
      console.log(`Rewind mismatch at i=${i} expected=${expectedCat}: search=${env.mockLocation.search} (match=${searchMatch}), h2 text='${h2 ? h2.textContent : 'null'}'`);
      rewindErrors++;
    }
  }
  check('Rewound through all 19 categories with 0 mismatches', rewindErrors === 0, `rewindErrors=${rewindErrors}`);

  // Final back to root
  env.sandbox.window.history.back();
  check('Final back landed on root (search is empty)', env.mockLocation.search === '');
  check('Final back cleared single-cat-header', env.mockDoc.querySelector('.single-cat-header') === null);
  check('Final back restored category-section carousels', env.mockDoc.querySelectorAll('.category-section').length > 5);
}

// =============================================================================
// SUITE 2: BRAND LOGO CLICKS WHILE IN SINGLE-CATEGORY VIEW
// =============================================================================
console.log('\n--- Suite 2: Brand Logo (.brand) Click Edge Cases & State Reset ---');

{
  const env = createStoreEnvironment('index.html', 'cat=cars');
  env.loadScripts();

  check('Initial page load directly with ?cat=cars renders single category header', Boolean(env.mockDoc.querySelector('.single-cat-header')));

  const brandLink = env.mockDoc.querySelector('.brand');
  check('Brand logo element exists in DOM', Boolean(brandLink));

  // Set active search state as well to stress-test full reset
  env.sandbox.state.search = 'bmw';
  const headerSearch = env.mockDoc.querySelector('#headerSearchInput');
  if (headerSearch) headerSearch.value = 'bmw';

  // Click brand logo
  const brandClickEv = { type: 'click' };
  brandLink.dispatchEvent(brandClickEv);

  check('Brand click invoked preventDefault()', brandClickEv.defaultPrevented === true);
  check('Brand click pushed clean URL without ?cat or ?search', env.mockLocation.search === '');
  check('Brand click reset state.activeCategory to null', env.sandbox.state.activeCategory === null);
  check('Brand click reset state.search to empty string', env.sandbox.state.search === '');
  check('Brand click cleared search input fields', headerSearch ? headerSearch.value === '' : true);
  check('Brand click cleared .single-cat-header from DOM', env.mockDoc.querySelector('.single-cat-header') === null);
  check('Brand click restored full multi-category sections', env.mockDoc.querySelectorAll('.category-section').length > 5);
  check('Brand click triggered window.scrollTo(0)', env.sandbox.getScrollToCallCount() > 0 && env.sandbox.window.scrollY === 0);

  // Stress: Browser Back after brand click should return to ?cat=cars
  env.sandbox.window.history.back();
  check('Browser Back after brand click restores ?cat=cars', env.mockLocation.search === '?cat=cars');
  const restoredHeader = env.mockDoc.querySelector('.single-cat-header h2');
  check('Browser Back re-rendered cars single category view', Boolean(restoredHeader) && restoredHeader.textContent.toLowerCase().includes('cars'));

  // Stress: Repeated 10 brand clicks in succession
  let repeatedBrandErrors = 0;
  for (let i = 0; i < 10; i++) {
    try {
      brandLink.dispatchEvent({ type: 'click' });
      if (env.mockDoc.querySelector('.single-cat-header')) repeatedBrandErrors++;
      if (env.mockDoc.querySelectorAll('.category-section').length === 0) repeatedBrandErrors++;
    } catch (_) {
      repeatedBrandErrors++;
    }
  }
  check('10 repeated brand logo clicks executed idempotently with 0 errors', repeatedBrandErrors === 0);
}

// Brand click on subpages (must NOT preventDefault; must redirect)
{
  const subpages = ['product.html', 'our-work.html', 'faq.html'];
  for (const sp of subpages) {
    const env = createStoreEnvironment(sp, 'id=football-001');
    env.loadScripts();

    const brandLink = env.mockDoc.querySelector('.brand');
    check(`${sp}: brand link has href`, Boolean(brandLink));
    
    // In subpage context, brand click handler in script.js line 4144:
    // e.preventDefault(); window.location.href = getStoreHomeUrl();
    const brandEv = { type: 'click' };
    brandLink.dispatchEvent(brandEv);
    check(`${sp}: brand click sets window.location.href to store home URL`, env.sandbox.window.location.href.includes('index.html') || env.sandbox.window.location.href.endsWith('/'));
  }
}

// =============================================================================
// SUITE 3: IN-PAGE .PAGE-BACK-BTN CLICKS FROM CATEGORY VIEW
// =============================================================================
console.log('\n--- Suite 3: In-Page .page-back-btn Click Interception & Catalog Restoration ---');

{
  const env = createStoreEnvironment('index.html', 'cat=clubs');
  env.loadScripts();

  const backBtn = env.mockDoc.querySelector('.page-back-btn');
  check('In-page .page-back-btn exists in single category view', Boolean(backBtn));

  // Click in-page back button
  const clickBackEv = { type: 'click' };
  backBtn.dispatchEvent(clickBackEv);

  check('.page-back-btn click called preventDefault()', clickBackEv.defaultPrevented === true);
  check('.page-back-btn click deleted ?cat from URL search params', env.mockLocation.search === '');
  check('.page-back-btn click cleared .single-cat-header from DOM', env.mockDoc.querySelector('.single-cat-header') === null);
  check('.page-back-btn click restored .category-section carousels', env.mockDoc.querySelectorAll('.category-section').length > 5);
  check('.page-back-btn click triggered smooth scroll to top', env.sandbox.getScrollToCallCount() > 0);

  // Test history navigation after .page-back-btn click:
  // History now has [initial (?cat=clubs), root]
  env.sandbox.window.history.back();
  check('Browser Back after .page-back-btn restores ?cat=clubs', env.mockLocation.search === '?cat=clubs');
  const clubsHeader = env.mockDoc.querySelector('.single-cat-header h2');
  check('Browser Back re-rendered clubs category view', Boolean(clubsHeader) && clubsHeader.textContent.toLowerCase().includes('clubs'));

  // Forward returns to root
  env.sandbox.window.history.forward();
  check('Browser Forward returns to root catalog without single-cat-header', env.mockLocation.search === '' && env.mockDoc.querySelector('.single-cat-header') === null);

  // Stress: What if category view is opened again and back button is clicked 5 times?
  env.sandbox.renderSingleCategory('gym');
  const gymBackBtn = env.mockDoc.querySelector('.page-back-btn');
  check('Gym category opened with .page-back-btn', Boolean(gymBackBtn));

  let repeatedBackErrors = 0;
  for (let i = 0; i < 5; i++) {
    try {
      gymBackBtn.dispatchEvent({ type: 'click' });
      if (env.mockDoc.querySelector('.single-cat-header')) repeatedBackErrors++;
      if (env.mockLocation.search !== '') repeatedBackErrors++;
    } catch (_) {
      repeatedBackErrors++;
    }
  }
  check('5 consecutive .page-back-btn clicks execute cleanly with 0 errors', repeatedBackErrors === 0);
}

// In-page back button on product.html subpage
{
  const env = createStoreEnvironment('product.html', 'id=cars-001');
  env.loadScripts();

  const backBtn = env.mockDoc.querySelector('.page-back-btn');
  check('product.html has .page-back-btn', Boolean(backBtn));
  if (backBtn) {
    const ev = { type: 'click' };
    backBtn.dispatchEvent(ev);
    check('product.html: .page-back-btn delegates to history.back() or store home', Boolean(ev.defaultPrevented));
  }
}

// =============================================================================
// SUITE 4: ASYNC FIRESTORE UPDATES ARRIVING DURING / AFTER TRANSITIONS
// =============================================================================
console.log('\n--- Suite 4: Async Firestore Snapshot Arrival Race Condition Stress ---');

{
  const env = createStoreEnvironment('index.html');
  env.loadScripts();

  // Step 4.1: User enters ?cat=movie
  const openNavBtn = env.mockDoc.querySelector('[data-open-nav]');
  if (openNavBtn) openNavBtn.dispatchEvent({ type: 'click' });
  const movieLink = env.mockDoc.querySelectorAll('a.nav-sub').find(a => (a.getAttribute('href') || '').includes('cat=movie'));
  movieLink.dispatchEvent({ type: 'click' });

  check('Entered ?cat=movie', env.mockLocation.search === '?cat=movie');
  check('.single-cat-header is present for movie', Boolean(env.mockDoc.querySelector('.single-cat-header')));

  // Step 4.2: User presses browser Back to return to root
  env.sandbox.window.history.back();
  check('Browser Back navigated to root', env.mockLocation.search === '');
  check('.single-cat-header cleared after Back', env.mockDoc.querySelector('.single-cat-header') === null);

  // Step 4.3: Right after reaching root, an asynchronous Firestore realtime snapshot arrives!
  // Calling triggerLiveUIReRender() simulates the Firestore snapshot callback
  console.log('  * Simulating incoming live Firestore update while at root...');
  env.sandbox.triggerLiveUIReRender('movie-001');

  // CRITICAL ASSERTION: The async snapshot MUST derive category strictly from URL, NOT stale catParam!
  const resurrectedHeader = env.mockDoc.querySelector('.single-cat-header');
  check('CRITICAL: triggerLiveUIReRender did NOT resurrect the stale movie category', resurrectedHeader === null);
  const sectionsAfterSync = env.mockDoc.querySelectorAll('.category-section');
  check('CRITICAL: triggerLiveUIReRender preserved root multi-category view', sectionsAfterSync.length > 5);

  // Step 4.4: Live update while legitimately inside category view
  console.log('  * Simulating incoming live Firestore update while legitimately in ?cat=art...');
  const artLink = env.mockDoc.querySelectorAll('a.nav-sub').find(a => (a.getAttribute('href') || '').includes('cat=art'));
  artLink.dispatchEvent({ type: 'click' });
  check('Navigated to ?cat=art', env.mockLocation.search === '?cat=art');

  env.sandbox.triggerLiveUIReRender('art-001');
  const artHeaderAfterSync = env.mockDoc.querySelector('.single-cat-header h2');
  check('triggerLiveUIReRender correctly refreshes current category view when search is ?cat=art', Boolean(artHeaderAfterSync) && artHeaderAfterSync.textContent.toLowerCase().includes('art'));

  // Step 4.5: Rapid asynchronous burst during continuous navigation
  console.log('  * Simulating 20 rapid Firestore update bursts during rapid navigation switches...');
  let burstErrors = 0;
  for (let i = 0; i < 20; i++) {
    try {
      if (i % 2 === 0) {
        env.sandbox.window.history.back();
      } else {
        env.sandbox.window.history.forward();
      }
      env.sandbox.triggerLiveUIReRender(`product-${i}`);
      const isRoot = env.mockLocation.search === '';
      const hasHeader = Boolean(env.mockDoc.querySelector('.single-cat-header'));
      if (isRoot && hasHeader) burstErrors++;
      if (!isRoot && !hasHeader) burstErrors++;
    } catch (_) {
      burstErrors++;
    }
  }
  check('20 rapid Firestore update bursts during navigation caused 0 desyncs or errors', burstErrors === 0);
}

// =============================================================================
// SUITE 5: CORNER-CASES & ADVERSARIAL QUERY PARAMS
// =============================================================================
console.log('\n--- Suite 5: Adversarial Edge Cases (Empty cat, Unknown cat, Popstate Spam) ---');

// Edge 5.1: Malformed query parameter '?cat=' (empty category string)
{
  const env = createStoreEnvironment('index.html', 'cat=');
  env.loadScripts();

  // In URLSearchParams, get('cat') returns '' (falsy)
  // Should render all products without crashing
  check('?cat= (empty string) does not render .single-cat-header', env.mockDoc.querySelector('.single-cat-header') === null);
  check('?cat= (empty string) renders multi-category catalog', env.mockDoc.querySelectorAll('.category-section').length > 5);
}

// Edge 5.2: Non-existent category '?cat=non_existent_category_xyz'
{
  const env = createStoreEnvironment('index.html', 'cat=non_existent_category_xyz');
  env.loadScripts();

  // Should render empty-state message inside categorySections with .page-back-btn to recover
  const backBtn = env.mockDoc.querySelector('.page-back-btn');
  check('Unknown category renders .page-back-btn for recovery', Boolean(backBtn));
  const emptyState = env.mockDoc.querySelector('.empty-state');
  check('Unknown category renders empty-state container', Boolean(emptyState));

  // Clicking backBtn recovers cleanly to full catalog
  backBtn.dispatchEvent({ type: 'click' });
  check('Clicking .page-back-btn from empty unknown category view recovers root catalog', env.mockLocation.search === '' && env.mockDoc.querySelectorAll('.category-section').length > 5);
}

// Edge 5.3: Popstate event triggered when productGrid is absent (e.g. subpage)
{
  const env = createStoreEnvironment('faq.html');
  env.loadScripts();

  let thrown = false;
  try {
    for (const fn of env.popstateListeners) {
      fn({ type: 'popstate', state: {} });
    }
  } catch (err) {
    thrown = true;
  }
  check('Popstate event on subpage (without productGrid) does not throw uncaught error', !thrown);
}

// =============================================================================
// SUITE 6: AST & MINIFIED ASSET PARITY SCAN FOR REMEDIATION DEFENSES
// =============================================================================
console.log('\n--- Suite 6: Production Minified Bundle AST Parity Verification ---');

const scriptSrc = fs.readFileSync(path.join(ROOT_DIR, 'script.js'), 'utf8');
const scriptMin = fs.readFileSync(path.join(ROOT_DIR, 'script.min.js'), 'utf8');

// 6.1: popstate event listener resets catParam = null
check('script.js popstate listener resets catParam = null', /window\.addEventListener\(["']popstate["'],[\s\S]*?catParam\s*=\s*null/.test(scriptSrc));
check('script.min.js popstate listener resets catParam = null', /addEventListener\(["']popstate["'],[\s\S]*?catParam=null/.test(scriptMin));

// 6.2: renderProducts derives currentCat strictly from URL
check('script.js renderProducts derives currentCat from URL', /function renderProducts\(\)[\s\S]*?new URLSearchParams\(window\.location\.search\)\.get\(["']cat["']\)/.test(scriptSrc));
check('script.min.js renderProducts derives currentCat from URL', /renderProducts\(\)[\s\S]*?new URLSearchParams\(window\.location\.search\)\.get\(["']cat["']\)/.test(scriptMin));

// 6.3: triggerLiveUIReRender derives currentCat strictly from URL without fallback to catParam
check('script.js triggerLiveUIReRender derives currentCat from URL without fallback', /function triggerLiveUIReRender\([\s\S]*?new URLSearchParams\(window\.location\.search\)\.get\(["']cat["']\);/.test(scriptSrc));
check('script.min.js triggerLiveUIReRender derives currentCat from URL without fallback', /triggerLiveUIReRender\([\s\S]*?new URLSearchParams\(window\.location\.search\)\.get\(["']cat["']\)/.test(scriptMin));

// 6.4: Brand click handler resets catParam = null
check('script.js brand logo click resets catParam = null', /isHome[\s\S]*?catParam\s*=\s*null/.test(scriptSrc));
check('script.min.js brand logo click resets catParam = null', /catParam=null/.test(scriptMin));

// 6.5: In-page back button (.page-back-btn) has in-place transition on home
check('script.js .page-back-btn handler has in-place SPA restoration', /\.page-back-btn[\s\S]*?delete\(["']cat["']\)[\s\S]*?renderProducts/.test(scriptSrc));
check('script.min.js .page-back-btn handler has in-place SPA restoration', /\.page-back-btn[\s\S]*?delete\(["']cat["']\)[\s\S]*?renderProducts/.test(scriptMin));

// =============================================================================
// VERDICT & SUMMARY
// =============================================================================
console.log('\n======================================================================');
console.log(' CHALLENGER M4-R2-1 EMPIRICAL RESULTS SUMMARY');
console.log('======================================================================');
console.log(`  Total Checks Executed : ${totalChecks}`);
console.log(`  Passed Checks         : ${passedChecks}`);
console.log(`  Failed Checks         : ${failedChecks.length}`);
console.log('----------------------------------------------------------------------');

if (failedChecks.length === 0) {
  console.log('VERDICT: APPROVE (All adversarial navigation & state assertions passed cleanly)');
  process.exit(0);
} else {
  console.error(`VERDICT: REJECT (${failedChecks.length} failure(s) detected)`);
  for (const f of failedChecks) {
    console.error(`  - FAIL: ${f.desc} ${f.extraInfo || ''}`);
  }
  process.exit(1);
}

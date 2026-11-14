/**
 * tests/challenger_m2_stock_price_stress.js
 * 
 * Empirical Adversarial Challenger Suite — Milestone 2
 * Stock Boundaries, Cart Inventory Limit, Checkout Stock Enforcement & Price Floor Protection
 * 
 * Focus Areas:
 * 1. Stock Boundary Stress: Extreme values (-100, -1, 0, 0.5, 1, 999999, null, undefined, "0", "abc")
 *    in isProductOutOfStock(), getProductStock(), and Admin quantity normalization.
 * 2. Cart & Checkout Enforcement Stress: Rejection of zero-stock addToCart(), inventory cap in
 *    updateQuantity(), and hard abort in handleCheckout().
 * 3. Price Floor Downgrade Attack: sanitizeRemoteProduct() defense against hostile or legacy
 *    Firestore price injections (< 180 EGP, non-standard sizes, malformed structures).
 * 4. Metadata Preservation Stress: Preserving multi-image galleries, search tags, isCustom flags,
 *    and custom metadata during Admin stock/price edits.
 * 5. Production Minified Parity: Verifying script.min.js and admin-panel.min.js maintain identical defenses.
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
    console.error(`  [X] ${msg}`);
  }
}

console.log('======================================================================');
console.log(' CHALLENGER M2-2: STOCK BOUNDARIES, CART LIMIT & PRICE FLOOR STRESS');
console.log('======================================================================\n');

// -----------------------------------------------------------------------------
// HELPER: Create DOM & VM Environment for Storefront (script.js / script.min.js)
// -----------------------------------------------------------------------------
function createStorefrontVM(bundleFile = 'products-bundle.js', scriptFile = 'script.js') {
  const elements = new Map();

  function makeElement(tag = 'div', id = '') {
    const el = {
      tagName: tag.toUpperCase(),
      id: id || '',
      className: '',
      classList: {
        _classes: new Set(),
        add(c) { this._classes.add(c); el.className = Array.from(this._classes).join(' '); },
        remove(c) { this._classes.delete(c); el.className = Array.from(this._classes).join(' '); },
        toggle(c, force) {
          if (force === true) this.add(c);
          else if (force === false) this.remove(c);
          else if (this._classes.has(c)) this.remove(c);
          else this.add(c);
        },
        contains(c) { return this._classes.has(c); }
      },
      textContent: '',
      innerHTML: '',
      value: '',
      style: {},
      disabled: false,
      hidden: false,
      dataset: {},
      elements: {},
      setAttribute(k, v) { this[k] = String(v); },
      getAttribute(k) { return this[k] !== undefined ? this[k] : null; },
      removeAttribute(k) { delete this[k]; },
      appendChild(child) { return child; },
      removeChild(child) { return child; },
      remove() {},
      closest() { return null; },
      querySelector(sel) { return makeElement('div'); },
      querySelectorAll(sel) { return []; },
      addEventListener() {},
      removeEventListener() {},
      focus() {},
      blur() {}
    };
    return el;
  }

  const defaultElements = {
    cartDrawer: makeElement('div', 'cartDrawer'),
    cartItems: makeElement('div', 'cartItems'),
    cartSubtotal: makeElement('span', 'cartSubtotal'),
    cartTotal: makeElement('span', 'cartTotal'),
    cartDelivery: makeElement('span', 'cartDelivery'),
    cartDiscount: makeElement('span', 'cartDiscount'),
    cartCount: makeElement('span', 'cartCount'),
    cartEmpty: makeElement('div', 'cartEmpty'),
    cartSummary: makeElement('div', 'cartSummary'),
    checkoutForm: makeElement('form', 'checkoutForm'),
    confirmationSummary: makeElement('div', 'confirmationSummary'),
    toast: makeElement('div', 'toast'),
    productGrid: makeElement('div', 'productGrid'),
    productDetail: makeElement('div', 'productDetail'),
    addToCartBtn: makeElement('button', 'addToCartBtn')
  };

  defaultElements.checkoutForm.elements = {
    customerName: { value: 'Test Customer' },
    customerPhone: { value: '01012345678' },
    customerAddress: { value: '123 Test St, Cairo' }
  };

  const toastsFired = [];
  const broadcastMessages = [];
  const storage = {};

  const sandbox = {
    console: {
      log: () => {},
      warn: () => {},
      error: (...args) => {},
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
    URL,
    URLSearchParams
  };

  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.window.innerWidth = 1200;
  sandbox.window.innerHeight = 800;
  sandbox.window.addEventListener = () => {};
  sandbox.window.removeEventListener = () => {};
  sandbox.window.location = { href: 'http://localhost/index.html', pathname: '/index.html', search: '', origin: 'http://localhost' };
  sandbox.window.history = { pushState: () => {}, replaceState: () => {} };
  sandbox.window.requestAnimationFrame = (cb) => { if (typeof cb === 'function') cb(); };
  sandbox.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });

  sandbox.navigator = {
    userAgent: 'node',
    language: 'en-US',
    serviceWorker: { register: () => Promise.resolve() }
  };
  sandbox.indexedDB = { open: () => ({ onsuccess: null, onerror: null }) };
  sandbox.localStorage = {
    getItem(k) { return storage[k] !== undefined ? storage[k] : null; },
    setItem(k, v) { storage[k] = String(v); },
    removeItem(k) { delete storage[k]; },
    clear() { Object.keys(storage).forEach(k => delete storage[k]); },
    _store: storage
  };
  sandbox.sessionStorage = {
    getItem() { return null; },
    setItem() {},
    removeItem() {}
  };

  sandbox.document = {
    documentElement: { dataset: {}, style: {} },
    head: makeElement('head'),
    body: makeElement('body'),
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: (sel) => {
      const clean = sel.replace(/[#.]/g, '');
      if (defaultElements[clean]) return defaultElements[clean];
      return makeElement('div');
    },
    querySelectorAll: (sel) => [],
    getElementById: (id) => {
      if (defaultElements[id]) return defaultElements[id];
      const el = makeElement('div', id);
      defaultElements[id] = el;
      return el;
    },
    createElement: (tag) => makeElement(tag),
    readyState: 'complete',
    title: ''
  };

  sandbox.BroadcastChannel = function(name) {
    this.name = name;
    this.postMessage = (msg) => { broadcastMessages.push(msg); };
    this.close = () => {};
    this.onmessage = null;
  };
  sandbox.CustomEvent = function(type, params) { this.type = type; this.detail = params?.detail; };
  sandbox.Event = function(type) { this.type = type; };

  sandbox.initFirebase = () => {};
  sandbox.isFirebaseReady = () => false;
  sandbox.ensureFirebaseReady = async () => false;
  sandbox.getFirebaseDb = () => null;

  vm.createContext(sandbox);

  if (bundleFile) {
    const bundleSrc = fs.readFileSync(path.join(ROOT_DIR, bundleFile), 'utf8');
    vm.runInContext(bundleSrc, sandbox);
  }

  if (scriptFile) {
    const scriptSrc = fs.readFileSync(path.join(ROOT_DIR, scriptFile), 'utf8');
    vm.runInContext(scriptSrc, sandbox);
  }

  // Intercept showToast to observe UI warnings
  const origShowToast = sandbox.showToast;
  sandbox.showToast = function(msg) {
    toastsFired.push(msg);
    if (typeof origShowToast === 'function') {
      try { origShowToast(msg); } catch (_) {}
    }
  };

  return {
    sandbox,
    eval: (code) => vm.runInContext(code, sandbox),
    storage,
    defaultElements,
    toastsFired,
    broadcastMessages
  };
}

// -----------------------------------------------------------------------------
// HELPER: Create DOM & VM Environment for Admin Panel (admin-panel.js)
// -----------------------------------------------------------------------------
function createAdminVM(adminScript = 'admin-panel.js', initialStorage = {}) {
  const domClickListeners = [];

  function createInputMock(initial = '') {
    let _v = String(initial);
    return {
      get value() { return _v; },
      set value(val) { _v = val != null ? String(val) : ''; },
      readOnly: false,
      style: {},
      dataset: {},
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      addEventListener: (evt, fn) => {
        if (evt === 'click') domClickListeners.push(fn);
      },
      removeEventListener() {},
      closest() { return null; },
      querySelector() { return null; },
      querySelectorAll() { return []; }
    };
  }

  const formElements = {
    apId: createInputMock(''),
    apName: createInputMock(''),
    apNameAr: createInputMock(''),
    apCategory: createInputMock('football'),
    apTag: createInputMock(''),
    apTagAr: createInputMock(''),
    apImage: createInputMock('assets/products/football/football-001.webp'),
    apBasePrice: createInputMock('180'),
    apQuantity: createInputMock(''),
    apSizes: createInputMock('20x30=180, 30x40=200, 40x50=250, 50x70=300'),
    apFrames: createInputMock('None, Black, White'),
    apDescription: createInputMock(''),
    apDescriptionAr: createInputMock(''),
    apImagePreview: { src: '' },
    adminProductModal: { hidden: false },
    adminToastContainer: { appendChild() {} },
    adminProductSearch: createInputMock(''),
    adminProductCategoryFilter: createInputMock('all'),
    adminProductsCount: { textContent: '' },
    adminProductsList: { innerHTML: '' },
    adminApp: {
      addEventListener: (evt, fn) => {
        if (evt === 'click') domClickListeners.push(fn);
      }
    }
  };

  const storage = Object.assign({
    'pls-admin-session': 'true',
    'pls-admin-email': 'posterlab895@gmail.com'
  }, initialStorage);

  const broadcastEvents = [];

  function makeAdminEl(tag = 'div') {
    return {
      tagName: tag.toUpperCase(),
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      dataset: {},
      style: {},
      appendChild() {},
      remove() {},
      innerHTML: '',
      textContent: '',
      closest() { return null; },
      querySelector() { return makeAdminEl(); },
      querySelectorAll() { return []; },
      addEventListener: (evt, fn) => {
        if (evt === 'click') domClickListeners.push(fn);
      }
    };
  }

  const sandbox = {
    console: { log: () => {}, warn: () => {}, error: () => {}, info: () => {} },
    setTimeout: (cb) => { if (typeof cb === 'function') cb(); return 1; },
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    alert: () => {},
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
    parseFloat,
    parseInt,
    isNaN,
    isFinite
  };

  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.window.location = { href: 'http://localhost/admin/panel.html', pathname: '/admin/panel.html', replace: () => {}, hostname: 'localhost', origin: 'http://localhost' };
  sandbox.window.addEventListener = () => {};
  sandbox.window.removeEventListener = () => {};

  sandbox.navigator = { userAgent: 'node', language: 'en-US' };
  sandbox.localStorage = {
    getItem(k) { return storage[k] !== undefined ? storage[k] : null; },
    setItem(k, v) { storage[k] = String(v); },
    removeItem(k) { delete storage[k]; },
    clear() { Object.keys(storage).forEach(k => delete storage[k]); },
    _store: storage
  };

  sandbox.document = {
    documentElement: { dataset: {}, style: {} },
    body: { style: {} },
    readyState: 'complete',
    addEventListener: (evt, fn) => {
      if (evt === 'click') domClickListeners.push(fn);
    },
    removeEventListener: () => {},
    querySelector: (sel) => {
      const clean = sel.replace('#', '');
      if (formElements[clean]) return formElements[clean];
      return makeAdminEl();
    },
    querySelectorAll: (sel) => [],
    getElementById: (id) => {
      if (formElements[id]) return formElements[id];
      return makeAdminEl();
    },
    createElement: (tag) => makeAdminEl(tag)
  };

  sandbox.BroadcastChannel = function(name) {
    this.name = name;
    this.postMessage = (msg) => { broadcastEvents.push(msg); };
    this.close = () => {};
    this.onmessage = null;
  };

  vm.createContext(sandbox);

  const adminSrc = fs.readFileSync(path.join(ROOT_DIR, adminScript), 'utf8');
  vm.runInContext(adminSrc, sandbox);

  return {
    sandbox,
    eval: (code) => vm.runInContext(code, sandbox),
    formElements,
    storage,
    broadcastEvents,
    domClickListeners,
    triggerClick: (cmd, pid = null) => {
      const mockEvent = {
        target: {
          closest: (sel) => {
            if (sel === '[data-cmd]') {
              return { dataset: { cmd, pid } };
            }
            return null;
          }
        },
        preventDefault() {}
      };
      domClickListeners.forEach(listener => {
        try { listener(mockEvent); } catch (_) {}
      });
    }
  };
}

// =============================================================================
// OBJECTIVE 1: STOCK BOUNDARY STRESS
// =============================================================================
console.log('--- OBJECTIVE 1: Stock Boundary Stress Testing ---');

const storeVM = createStorefrontVM('products-bundle.js', 'script.js');
const isProductOutOfStock = storeVM.eval('isProductOutOfStock');
const getProductStock = storeVM.eval('getProductStock');

check('storeVM exports isProductOutOfStock function', typeof isProductOutOfStock === 'function');
check('storeVM exports getProductStock function', typeof getProductStock === 'function');

const stockTestMatrix = [
  { val: -100,      expOut: true,  expStock: 0,        desc: 'Negative integer (-100)' },
  { val: -1,        expOut: true,  expStock: 0,        desc: 'Negative boundary (-1)' },
  { val: 0,         expOut: true,  expStock: 0,        desc: 'Zero boundary (0)' },
  { val: 0.5,       expOut: false, expStock: 0,        desc: 'Fractional (0.5) -> stock floored to 0' },
  { val: 1,         expOut: false, expStock: 1,        desc: 'Unit positive (1)' },
  { val: 999999,    expOut: false, expStock: 999999,   desc: 'Extreme quantity (999999)' },
  { val: null,      expOut: false, expStock: Infinity, desc: 'Null quantity (unlimited)' },
  { val: undefined, expOut: false, expStock: Infinity, desc: 'Undefined quantity (unlimited)' },
  { val: '0',       expOut: true,  expStock: 0,        desc: 'String zero ("0")' },
  { val: '-5',      expOut: true,  expStock: 0,        desc: 'String negative ("-5")' },
  { val: 'abc',     expOut: false, expStock: 0,        desc: 'Malformed string ("abc") -> stock 0' },
  { val: '',        expOut: true,  expStock: 0,        desc: 'Empty string ("") -> stock 0' }
];

for (const tc of stockTestMatrix) {
  const prod = { id: 'test-p', quantity: tc.val };
  const out = isProductOutOfStock(prod);
  const stock = getProductStock(prod);

  check(
    `Stock Boundary [${tc.desc}]: isProductOutOfStock === ${tc.expOut}`,
    out === tc.expOut,
    `Got ${out} for quantity ${JSON.stringify(tc.val)}`
  );

  check(
    `Stock Boundary [${tc.desc}]: getProductStock === ${tc.expStock}`,
    stock === tc.expStock,
    `Got ${stock} for quantity ${JSON.stringify(tc.val)}`
  );
}

// Verify that if a product is fractional (0.5) or malformed ('abc'), getProductStock returns 0,
// effectively preventing any purchases in addToCart
{
  const pFractional = { id: 'p-frac', quantity: 0.5 };
  check('Fractional stock (0.5) returns maxStock 0 (no items purchasable)', getProductStock(pFractional) === 0);
  const pAbc = { id: 'p-abc', quantity: 'abc' };
  check('Malformed stock ("abc") returns maxStock 0 (no items purchasable)', getProductStock(pAbc) === 0);
}

// Stress Admin Stock Normalization:
// In admin panel, entering negative values or bad strings into #apQuantity MUST normalize to 0
console.log('\n--- Admin Panel Stock Input Normalization Stress ---');
const adminVM = createAdminVM('admin-panel.js');

const adminStockTestMatrix = [
  { input: '-100',  expected: 0,         desc: 'Admin negative integer (-100) -> 0' },
  { input: '-1',    expected: 0,         desc: 'Admin negative boundary (-1) -> 0' },
  { input: '0',     expected: 0,         desc: 'Admin zero boundary ("0") -> 0' },
  { input: '0.5',   expected: 0,         desc: 'Admin fractional ("0.5") -> 0' },
  { input: '1',     expected: 1,         desc: 'Admin unit positive ("1") -> 1' },
  { input: '999999',expected: 999999,    desc: 'Admin extreme ("999999") -> 999999' },
  { input: '',      expected: undefined, desc: 'Admin empty string ("") -> unlimited (undefined)' },
  { input: '   ',   expected: undefined, desc: 'Admin whitespace ("   ") -> unlimited (undefined)' },
  { input: 'abc',   expected: 0,         desc: 'Admin malformed ("abc") -> 0' },
  { input: '-0',    expected: 0,         desc: 'Admin negative zero ("-0") -> 0' }
];

for (const tc of adminStockTestMatrix) {
  // Setup form fields for a test product
  adminVM.formElements.apId.value = 'stock-norm-prod';
  adminVM.formElements.apName.value = 'Stock Norm Test';
  adminVM.formElements.apBasePrice.value = '180';
  adminVM.formElements.apQuantity.value = tc.input;

  // Trigger Save Product
  adminVM.triggerClick('save-product');

  const customProducts = JSON.parse(adminVM.storage['pls-products'] || '[]');
  const saved = customProducts.find(p => p.id === 'stock-norm-prod');

  check(
    `Admin Stock Normalization [${tc.desc}]`,
    saved && saved.quantity === tc.expected,
    `Saved quantity: ${saved?.quantity}, Expected: ${tc.expected}`
  );
}


// =============================================================================
// OBJECTIVE 2: CART & CHECKOUT ENFORCEMENT STRESS
// =============================================================================
console.log('\n--- OBJECTIVE 2: Cart & Checkout Enforcement Stress Testing ---');

// 1. Programmatic addToCart on zero-stock items: verify rejection
{
  const testEnv = createStorefrontVM('products-bundle.js', 'script.js');
  testEnv.eval(`
    const prod = products.find(p => p.id === "football-001");
    if (prod) prod.quantity = 0;
    state.cart = [];
  `);

  testEnv.eval('addToCart("football-001", "20x30", "Black")');
  const cartLen = testEnv.eval('state.cart.length');
  check('addToCart rejected for zero-stock product (cart length remains 0)', cartLen === 0, `Cart length: ${cartLen}`);
  check('addToCart triggered warning toast on zero-stock', testEnv.toastsFired.length > 0 && testEnv.toastsFired.some(t => t.includes('غير متوفر') || t.includes('out of stock')));
}

// 2. Programmatic addToCart on negative-stock item (-5): verify rejection
{
  const testEnv = createStorefrontVM('products-bundle.js', 'script.js');
  testEnv.eval(`
    const prod = products.find(p => p.id === "football-002");
    if (prod) prod.quantity = -5;
    state.cart = [];
  `);

  testEnv.eval('addToCart("football-002", "20x30", "Black")');
  const cartLen = testEnv.eval('state.cart.length');
  check('addToCart rejected for negative-stock product (quantity: -5)', cartLen === 0, `Cart length: ${cartLen}`);
}

// 3. Programmatic addToCart up to inventory limit (quantity = 2)
{
  const testEnv = createStorefrontVM('products-bundle.js', 'script.js');
  testEnv.eval(`
    const prod = products.find(p => p.id === "cars-001");
    if (prod) prod.quantity = 2;
    state.cart = [];
  `);

  // First add: 1 unit (allowed)
  testEnv.eval('addToCart("cars-001", "20x30", "Black")');
  let cartTotalUnits = testEnv.eval('state.cart.reduce((s, i) => s + i.quantity, 0)');
  check('First addToCart allowed (1 unit in cart)', cartTotalUnits === 1);

  // Second add: 2 units (allowed - reaches limit)
  testEnv.eval('addToCart("cars-001", "20x30", "Black")');
  cartTotalUnits = testEnv.eval('state.cart.reduce((s, i) => s + i.quantity, 0)');
  check('Second addToCart allowed (2 units in cart, reaches inventory)', cartTotalUnits === 2);

  // Third add: 3 units (MUST BE REJECTED)
  testEnv.toastsFired.length = 0;
  testEnv.eval('addToCart("cars-001", "20x30", "Black")');
  cartTotalUnits = testEnv.eval('state.cart.reduce((s, i) => s + i.quantity, 0)');
  check('Third addToCart REJECTED (units remain capped at 2)', cartTotalUnits === 2, `Cart units: ${cartTotalUnits}`);
  check('Third addToCart showed stock limit warning toast', testEnv.toastsFired.length > 0 && testEnv.toastsFired.some(t => t.includes('2')));
}

// 4. Cart updateQuantity() cannot increment beyond inventory
{
  const testEnv = createStorefrontVM('products-bundle.js', 'script.js');
  testEnv.eval(`
    const prod = products.find(p => p.id === "cars-002");
    if (prod) prod.quantity = 3;
    state.cart = [];
  `);

  testEnv.eval('addToCart("cars-002", "20x30", "Black")'); // qty: 1
  testEnv.eval('addToCart("cars-002", "20x30", "Black")'); // qty: 2
  testEnv.eval('addToCart("cars-002", "20x30", "Black")'); // qty: 3

  const itemKey = testEnv.eval('state.cart[0].key');
  let currentQty = testEnv.eval('state.cart[0].quantity');
  check('Cart initialized with 3 units of cars-002', currentQty === 3);

  // Attempt to increment by +1 via updateQuantity
  testEnv.toastsFired.length = 0;
  testEnv.eval(`updateQuantity("${itemKey}", 1)`);
  currentQty = testEnv.eval('state.cart[0].quantity');
  check('updateQuantity(+1) beyond inventory limit REJECTED (quantity remains 3)', currentQty === 3, `Got: ${currentQty}`);
  check('updateQuantity showed inventory toast warning', testEnv.toastsFired.length > 0);

  // Attempt huge jump (+100)
  testEnv.eval(`updateQuantity("${itemKey}", 100)`);
  currentQty = testEnv.eval('state.cart[0].quantity');
  check('updateQuantity(+100) REJECTED (quantity remains 3)', currentQty === 3);

  // Decrement by -1 (should succeed to 2)
  testEnv.eval(`updateQuantity("${itemKey}", -1)`);
  currentQty = testEnv.eval('state.cart[0].quantity');
  check('updateQuantity(-1) allowed (quantity becomes 2)', currentQty === 2);

  // Re-increment by +1 (should succeed back to 3)
  testEnv.eval(`updateQuantity("${itemKey}", 1)`);
  currentQty = testEnv.eval('state.cart[0].quantity');
  check('updateQuantity(+1) within stock allowed (quantity back to 3)', currentQty === 3);
}

// 5. Checkout validation: handleCheckout aborts on zero-stock items in cart
{
  const testEnv = createStorefrontVM('products-bundle.js', 'script.js');
  testEnv.eval(`
    const prod = products.find(p => p.id === "football-003");
    if (prod) prod.quantity = 5;
    state.cart = [];
  `);

  testEnv.eval('addToCart("football-003", "20x30", "Black")');
  check('Item added to cart before stock change', testEnv.eval('state.cart.length === 1'));

  // Admin/Remote sync reduces stock of football-003 to 0 via localStorage override
  testEnv.eval(`
    localStorage.setItem("pls-products", JSON.stringify([{ id: "football-003", quantity: 0 }]));
  `);

  // Attempt handleCheckout
  let renderConfirmationCalled = false;
  testEnv.sandbox.renderConfirmation = () => { renderConfirmationCalled = true; };

  const mockSubmitEvent = { preventDefault() {} };
  testEnv.toastsFired.length = 0;
  testEnv.sandbox.handleCheckout(mockSubmitEvent);

  check('handleCheckout ABORTED when item in cart has stock 0', renderConfirmationCalled === false);
  check('handleCheckout warned user to remove out-of-stock item', testEnv.toastsFired.length > 0 && testEnv.toastsFired.some(t => t.includes('نفد') || t.includes('out of stock')));
}

// 6. Checkout validation: handleCheckout aborts when cart item quantity > maxStock
{
  const testEnv = createStorefrontVM('products-bundle.js', 'script.js');
  testEnv.eval(`
    const prod = products.find(p => p.id === "football-004");
    if (prod) prod.quantity = 5;
    state.cart = [];
  `);

  testEnv.eval('addToCart("football-004", "20x30", "Black")');
  testEnv.eval('addToCart("football-004", "20x30", "Black")'); // qty: 2

  // Remote update drops stock down to 1 via localStorage override
  testEnv.eval(`
    localStorage.setItem("pls-products", JSON.stringify([{ id: "football-004", quantity: 1 }]));
  `);

  let renderConfirmationCalled = false;
  testEnv.sandbox.renderConfirmation = () => { renderConfirmationCalled = true; };

  const mockSubmitEvent = { preventDefault() {} };
  testEnv.toastsFired.length = 0;
  testEnv.sandbox.handleCheckout(mockSubmitEvent);

  check('handleCheckout ABORTED when cart item quantity (2) exceeds inventory (1)', renderConfirmationCalled === false);
  check('handleCheckout alerted user about quantity exceeding available stock', testEnv.toastsFired.length > 0 && testEnv.toastsFired.some(t => t.includes('تتجاوز') || t.includes('exceeds')));
}


// =============================================================================
// OBJECTIVE 3: PRICE FLOOR DOWNGRADE ATTACK STRESS
// =============================================================================
console.log('\n--- OBJECTIVE 3: Price Floor Downgrade Attack Testing ---');

const sanitizeRemoteProductStore = storeVM.eval('sanitizeRemoteProduct');
check('storeVM exports sanitizeRemoteProduct function', typeof sanitizeRemoteProductStore === 'function');

// 1. Hostile/stale Firestore injection with basePrice: 5 and sub-floor sizes
{
  const hostileDoc = {
    id: 'hostile-001',
    name: 'Cheap Poster Attack',
    basePrice: 5,
    sizes: {
      '20x30': 10,
      '30x40': 20,
      '40x50': 50,
      '50x70': 100
    }
  };

  const sanitized = sanitizeRemoteProductStore(JSON.parse(JSON.stringify(hostileDoc)));

  check('Hostile basePrice: 5 aggressively raised to >= 180', sanitized.basePrice >= 180, `Got: ${sanitized.basePrice}`);
  check('Hostile basePrice: 5 normalized exactly to 180', sanitized.basePrice === 180, `Got: ${sanitized.basePrice}`);
  check('Hostile 20x30: 10 raised to tier min 180', sanitized.sizes['20x30'] === 180, `Got: ${sanitized.sizes['20x30']}`);
  check('Hostile 30x40: 20 raised to tier min 200', sanitized.sizes['30x40'] === 200, `Got: ${sanitized.sizes['30x40']}`);
  check('Hostile 40x50: 50 raised to tier min 250', sanitized.sizes['40x50'] === 250, `Got: ${sanitized.sizes['40x50']}`);
  check('Hostile 50x70: 100 raised to tier min 300', sanitized.sizes['50x70'] === 300, `Got: ${sanitized.sizes['50x70']}`);
}

// 2. Non-standard size keys with prices below 180 EGP
{
  const hostileNonStandard = {
    id: 'hostile-002',
    name: 'Non Standard Size Attack',
    basePrice: 50,
    sizes: {
      '20x30': 180,
      '30x40': 200,
      '40x50': 250,
      '50x70': 300,
      '60x90': 90,        // below floor 180 -> must be raised to 180
      'custom_small': 15,  // below floor 180 -> must be raised to 180
      'giant_banner': 650 // above floor 180 -> must be preserved at 650
    }
  };

  const sanitized = sanitizeRemoteProductStore(JSON.parse(JSON.stringify(hostileNonStandard)));

  check('Non-standard size "60x90" (90) raised to MIN_PRICE_FLOOR 180', sanitized.sizes['60x90'] === 180, `Got: ${sanitized.sizes['60x90']}`);
  check('Non-standard size "custom_small" (15) raised to MIN_PRICE_FLOOR 180', sanitized.sizes['custom_small'] === 180, `Got: ${sanitized.sizes['custom_small']}`);
  check('Non-standard size "giant_banner" (650) preserved at 650', sanitized.sizes['giant_banner'] === 650, `Got: ${sanitized.sizes['giant_banner']}`);
  check('Base price raised to at least 180', sanitized.basePrice >= 180);
}

// 3. Extreme hostile structural attacks on Firestore documents
{
  // Null sizes
  const docNullSizes = { id: 'null-sizes', basePrice: 0, sizes: null };
  const sNull = sanitizeRemoteProductStore(JSON.parse(JSON.stringify(docNullSizes)));
  check('Null sizes replaced with STANDARD_SIZES tier map', sNull.sizes && sNull.sizes['20x30'] === 180 && sNull.sizes['50x70'] === 300);
  check('Null sizes basePrice raised to 180', sNull.basePrice === 180);

  // Array sizes (corrupted)
  const docArraySizes = { id: 'arr-sizes', basePrice: 10, sizes: [10, 20, 30] };
  const sArr = sanitizeRemoteProductStore(JSON.parse(JSON.stringify(docArraySizes)));
  check('Corrupted array sizes replaced with STANDARD_SIZES tier map', !Array.isArray(sArr.sizes) && sArr.sizes['20x30'] === 180);

  // String non-numeric prices in sizes
  const docStringPrices = {
    id: 'str-prices',
    basePrice: 'free',
    sizes: { '20x30': 'free', '30x40': 'zero', '40x50': '-100', '50x70': 150 }
  };
  const sStr = sanitizeRemoteProductStore(JSON.parse(JSON.stringify(docStringPrices)));
  check('String price "free" in 20x30 raised to 180', sStr.sizes['20x30'] === 180);
  check('String price "zero" in 30x40 raised to 200', sStr.sizes['30x40'] === 200);
  check('Negative string "-100" in 40x50 raised to 250', sStr.sizes['40x50'] === 250);
  check('Sub-floor price 150 in 50x70 raised to 300', sStr.sizes['50x70'] === 300);
  check('Corrupted basePrice "free" raised to 180', sStr.basePrice === 180);

  // Negative basePrice
  const docNegBase = { id: 'neg-base', basePrice: -999, sizes: { '20x30': 180 } };
  const sNeg = sanitizeRemoteProductStore(JSON.parse(JSON.stringify(docNegBase)));
  check('Negative basePrice (-999) raised to 180', sNeg.basePrice === 180);
}

// 4. Verify admin-panel.js contains identical price floor defense
{
  const adminPanelSrc = fs.readFileSync(path.join(ROOT_DIR, 'admin-panel.js'), 'utf8');
  check('admin-panel.js defines MIN_PRICE_FLOOR = 180', adminPanelSrc.includes('const MIN_PRICE_FLOOR = 180;'));
  check('admin-panel.js enforces STANDARD_SIZES mapping', adminPanelSrc.includes("'20x30': 180") && adminPanelSrc.includes("'50x70': 300"));
  check('admin-panel.js includes sanitizeRemoteProduct', adminPanelSrc.includes('function sanitizeRemoteProduct('));
}


// =============================================================================
// OBJECTIVE 4: METADATA PRESERVATION STRESS
// =============================================================================
console.log('\n--- OBJECTIVE 4: Metadata Preservation Stress Testing ---');

{
  // Pre-seed an existing product with rich metadata in localStorage
  const richProduct = {
    id: 'legend-messi-001',
    name: 'Messi World Champion',
    nameAr: 'ميسي بطل العالم',
    category: 'football',
    tag: 'messi',
    tagAr: 'ميسي',
    tags: ['messi', 'argentina', 'barca', 'goat', 'champion', 'fifa', 'qatar2022', '10'],
    image: 'assets/products/football/messi-main.webp',
    gallery: [
      'assets/products/football/messi-main.webp',
      'assets/products/football/messi-angle-2.webp',
      'assets/products/football/messi-detail-3.webp'
    ],
    isCustom: true,
    rating: 4.95,
    reviewsCount: 420,
    player: 'Lionel Messi',
    team: 'Argentina',
    originalId: 'fb-orig-messi',
    customAttributeAlpha: 'alpha_secure_val',
    customAttributeBeta: 98765,
    basePrice: 180,
    quantity: 20,
    sizes: { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 },
    frames: ['None', 'Black', 'White']
  };

  const adminTestVM = createAdminVM('admin-panel.js', {
    'pls-products': JSON.stringify([richProduct])
  });

  // Admin opens product for editing
  adminTestVM.triggerClick('edit-product', 'legend-messi-001');

  // Verify form loaded product attributes
  check('Admin form populated apId', adminTestVM.formElements.apId.value.toString() === 'legend-messi-001');
  check('Admin form populated apName', adminTestVM.formElements.apName.value.toString() === 'Messi World Champion');
  check('Admin form populated apQuantity', adminTestVM.formElements.apQuantity.value.toString() === '20');

  // Admin updates ONLY base price and quantity
  adminTestVM.formElements.apBasePrice.value = '220';
  adminTestVM.formElements.apQuantity.value = '15';

  // Trigger Save Product
  adminTestVM.triggerClick('save-product');

  const savedProducts = JSON.parse(adminTestVM.storage['pls-products'] || '[]');
  const updated = savedProducts.find(p => p.id === 'legend-messi-001');

  check('Updated product found in storage', !!updated);
  if (updated) {
    // 1. Updated properties
    check('Price successfully updated to 220', updated.basePrice === 220, `Got: ${updated.basePrice}`);
    check('Quantity successfully updated to 15', updated.quantity === 15, `Got: ${updated.quantity}`);

    // 2. Preserved metadata
    check('isCustom flag preserved (true)', updated.isCustom === true);
    check('Rating preserved (4.95)', updated.rating === 4.95);
    check('Reviews count preserved (420)', updated.reviewsCount === 420);
    check('Player name preserved (Lionel Messi)', updated.player === 'Lionel Messi');
    check('Team name preserved (Argentina)', updated.team === 'Argentina');
    check('originalId preserved (fb-orig-messi)', updated.originalId === 'fb-orig-messi');
    check('customAttributeAlpha preserved', updated.customAttributeAlpha === 'alpha_secure_val');
    check('customAttributeBeta preserved', updated.customAttributeBeta === 98765);

    // 3. Multi-image gallery preserved without truncation
    check('Gallery is array with 3 images', Array.isArray(updated.gallery) && updated.gallery.length === 3, `Length: ${updated.gallery?.length}`);
    check('Gallery image 0 matches main image', updated.gallery?.[0] === 'assets/products/football/messi-main.webp');
    check('Gallery image 1 preserved', updated.gallery?.[1] === 'assets/products/football/messi-angle-2.webp');
    check('Gallery image 2 preserved', updated.gallery?.[2] === 'assets/products/football/messi-detail-3.webp');

    // 4. Search tags preserved without truncation
    check('Tags array preserves all original tags without truncation', Array.isArray(updated.tags) && richProduct.tags.every(t => updated.tags.includes(t)) && updated.tags.length >= 8, `Tags count: ${updated.tags?.length}`);
    check('Tags contains "goat"', updated.tags?.includes('goat'));
    check('Tags contains "qatar2022"', updated.tags?.includes('qatar2022'));
    check('Tags contains "champion"', updated.tags?.includes('champion'));
  }

  // Next: Test updating main image preserves other gallery items
  adminTestVM.triggerClick('edit-product', 'legend-messi-001');
  adminTestVM.formElements.apImage.value = 'assets/products/football/messi-new-angle-hero.webp';
  adminTestVM.triggerClick('save-product');

  const afterImgUpdate = JSON.parse(adminTestVM.storage['pls-products'] || '[]').find(p => p.id === 'legend-messi-001');
  check('Gallery contains new image at index 0', afterImgUpdate.gallery[0] === 'assets/products/football/messi-new-angle-hero.webp');
  check('Gallery retains previous secondary images', afterImgUpdate.gallery.includes('assets/products/football/messi-angle-2.webp') && afterImgUpdate.gallery.includes('assets/products/football/messi-detail-3.webp'));

  // Next: Test adding a new tag non-destructively
  adminTestVM.triggerClick('edit-product', 'legend-messi-001');
  adminTestVM.formElements.apTag.value = 'golden-ball';
  adminTestVM.triggerClick('save-product');

  const afterTagUpdate = JSON.parse(adminTestVM.storage['pls-products'] || '[]').find(p => p.id === 'legend-messi-001');
  check('Tags contains newly entered tag "golden-ball"', afterTagUpdate.tags.includes('golden-ball'));
  check('Tags retains original tags ("goat", "champion")', afterTagUpdate.tags.includes('goat') && afterTagUpdate.tags.includes('champion'));

  // Verify Broadcast message sent payload with full preserved metadata
  const lastBroadcast = adminTestVM.broadcastEvents.filter(e => e.type === 'PRODUCT_UPDATE').pop();
  check('PRODUCT_UPDATE broadcast includes preserved gallery', Array.isArray(lastBroadcast?.payload?.gallery) && lastBroadcast.payload.gallery.length >= 3);
  check('PRODUCT_UPDATE broadcast includes preserved isCustom', lastBroadcast?.payload?.isCustom === true);
}


// =============================================================================
// OBJECTIVE 5: MINIFIED BUNDLE PARITY VERIFICATION
// =============================================================================
console.log('\n--- OBJECTIVE 5: Minified Bundle Parity Testing ---');

const minStoreVM = createStorefrontVM('products-bundle.min.js', 'script.min.js');
const minIsOutOfStock = minStoreVM.eval('isProductOutOfStock');
const minGetStock = minStoreVM.eval('getProductStock');
const minSanitize = minStoreVM.eval('sanitizeRemoteProduct');

check('script.min.js exports isProductOutOfStock', typeof minIsOutOfStock === 'function');
check('script.min.js exports getProductStock', typeof minGetStock === 'function');
check('script.min.js exports sanitizeRemoteProduct', typeof minSanitize === 'function');

// Check parity for zero stock
check('minified isProductOutOfStock(quantity: 0) === true', minIsOutOfStock({ quantity: 0 }) === true);
check('minified getProductStock(quantity: 0) === 0', minGetStock({ quantity: 0 }) === 0);
check('minified getProductStock(quantity: -5) === 0', minGetStock({ quantity: -5 }) === 0);
check('minified getProductStock(quantity: null) === Infinity', minGetStock({ quantity: null }) === Infinity);

// Check price floor parity
const minHostile = { id: 'min-test', basePrice: 10, sizes: { '20x30': 50, '30x40': 70 } };
const minSanitized = minSanitize(minHostile);
check('minified sanitizeRemoteProduct raises basePrice to 180', minSanitized.basePrice === 180);
check('minified sanitizeRemoteProduct raises 20x30 to 180', minSanitized.sizes['20x30'] === 180);
check('minified sanitizeRemoteProduct raises 30x40 to 200', minSanitized.sizes['30x40'] === 200);

// Check admin-panel.min.js exists and is synced
const adminMinExists = fs.existsSync(path.join(ROOT_DIR, 'admin-panel.min.js'));
const adminFolderMinExists = fs.existsSync(path.join(ROOT_DIR, 'admin', 'admin-panel.min.js'));
check('admin-panel.min.js exists at root', adminMinExists);
check('admin/admin-panel.min.js exists in admin dir', adminFolderMinExists);

// =============================================================================
// OBJECTIVE 6: MULTI-VARIANT CUMULATIVE STOCK & FUZZING STRESS
// =============================================================================
console.log('\n--- OBJECTIVE 6: Multi-Variant Cumulative Stock & Fuzzing Stress ---');

// 1. Multi-variant cumulative inventory limit across different sizes
{
  const multiEnv = createStorefrontVM('products-bundle.js', 'script.js');
  multiEnv.eval(`
    const prod = products.find(p => p.id === "cars-003");
    if (prod) prod.quantity = 2;
    state.cart = [];
  `);

  // Add 1st item (size 20x30)
  multiEnv.eval('addToCart("cars-003", "20x30", "Black")');
  // Add 2nd item (size 30x40)
  multiEnv.eval('addToCart("cars-003", "30x40", "White")');

  let totalItems = multiEnv.eval('state.cart.reduce((s, i) => s + i.quantity, 0)');
  check('Two distinct variants added up to product inventory limit (total = 2)', totalItems === 2);

  // Attempt to add 3rd variant (size 40x50)
  multiEnv.toastsFired.length = 0;
  multiEnv.eval('addToCart("cars-003", "40x50", "Transparent")');
  totalItems = multiEnv.eval('state.cart.reduce((s, i) => s + i.quantity, 0)');
  check('Third variant addToCart REJECTED due to cumulative inventory cap (total remains 2)', totalItems === 2);
  check('Warning toast fired for cumulative stock exhaustion', multiEnv.toastsFired.length > 0);
}

// 2. Fuzzing sanitizeRemoteProduct with 1,000 random hostile variations
{
  let fuzzPass = 0;
  const hostileSizes = ['20x30', '30x40', '40x50', '50x70', '60x90', 'extra_custom', 'mini'];
  const testValues = [-1000, -1, 0, 0.001, 5, 50, 179, 179.99, 180, 200, 250, 300, 9999, 'free', 'zero', '-50', null, undefined, NaN, [], {}];

  for (let i = 0; i < 1000; i++) {
    const randomBase = testValues[Math.floor(Math.random() * testValues.length)];
    const randomSizes = {};
    for (const s of hostileSizes) {
      if (Math.random() > 0.2) {
        randomSizes[s] = testValues[Math.floor(Math.random() * testValues.length)];
      }
    }
    const hostile = {
      id: `fuzz-${i}`,
      name: `Fuzz Poster ${i}`,
      basePrice: randomBase,
      sizes: Math.random() < 0.1 ? null : (Math.random() < 0.1 ? [] : randomSizes)
    };

    const cleaned = sanitizeRemoteProductStore(JSON.parse(JSON.stringify(hostile)));

    let valid = true;
    if (typeof cleaned.basePrice !== 'number' || cleaned.basePrice < 180 || isNaN(cleaned.basePrice)) valid = false;
    if (!cleaned.sizes || typeof cleaned.sizes !== 'object') valid = false;
    else {
      if (cleaned.sizes['20x30'] < 180 || isNaN(cleaned.sizes['20x30'])) valid = false;
      if (cleaned.sizes['30x40'] < 200 || isNaN(cleaned.sizes['30x40'])) valid = false;
      if (cleaned.sizes['40x50'] < 250 || isNaN(cleaned.sizes['40x50'])) valid = false;
      if (cleaned.sizes['50x70'] < 300 || isNaN(cleaned.sizes['50x70'])) valid = false;
      for (const k of Object.keys(cleaned.sizes)) {
        const p = cleaned.sizes[k];
        if (typeof p !== 'number' || p < 180 || isNaN(p)) valid = false;
      }
    }
    if (valid) fuzzPass++;
  }

  check('Property Fuzzing: 1,000 hostile documents 100% sanitized above price floor', fuzzPass === 1000, `Passed: ${fuzzPass}/1000`);
}

// =============================================================================
// SUMMARY & VERDICT
// =============================================================================
console.log('\n======================================================================');
console.log(` TOTAL CHECKS : ${totalChecks}`);
console.log(` PASSED       : ${passedChecks}`);
console.log(` FAILED       : ${failedChecks}`);
console.log('======================================================================\n');

if (failedChecks > 0) {
  console.error('FAILURES SUMMARY:');
  failures.forEach((f, idx) => console.error(`  ${idx + 1}. ${f}`));
  console.error('\nVERDICT: REJECT');
  process.exit(1);
} else {
  console.log('ALL EMPIRICAL ADVERSARIAL STRESS TESTS PASSED WITH 100% SUCCESS.');
  console.log('VERDICT: APPROVE');
  process.exit(0);
}

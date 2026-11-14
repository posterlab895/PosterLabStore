/**
 * tests/challenger_m1_r2_stress.js
 * 
 * Empirical Adversarial Challenger Suite (Round 2)
 * Milestone 1: Product Pricing Structure & Data Consistency
 * 
 * Conducts white-box VM execution and fuzzing:
 * 1. VM Storefront Execution (script.js ALONE without bundle - tests fallback custom-design)
 * 2. VM Storefront Execution (script.min.js ALONE without bundle)
 * 3. VM Storefront Execution (script.js WITH products-bundle.js - full runtime)
 * 4. VM Storefront Execution (script.min.js WITH products-bundle.min.js - production distribution)
 * 5. Exhaustive 1,019 catalog items x 4 sizes x 12 frame variants = 48,912 checks
 * 6. Property-based fuzzing of 25,000 randomized cart line items (uPrice, lineTotal, qty)
 * 7. Full codebase legacy price string extinction audit
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
  } else {
    failedChecks++;
    const msg = `FAIL: ${name}${extra ? ' -> ' + extra : ''}`;
    failures.push(msg);
    console.error(`  [X] ${msg}`);
  }
}

console.log('======================================================================');
console.log(' CHALLENGER ROUND 2: EMPIRICAL PRICING INVARIANCE STRESS HARNESS');
console.log('======================================================================\n');

function createStoreEnvironment(bundleFile = null, scriptFile = 'script.js') {
  const makeEl = () => ({
    addEventListener: () => {},
    removeEventListener: () => {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    textContent: '',
    innerHTML: '',
    value: '',
    style: {},
    setAttribute() {},
    getAttribute() { return null; },
    appendChild() {},
    removeChild() {},
    remove() {},
    closest() { return null; },
    querySelector() { return makeEl(); },
    querySelectorAll() { return []; },
    getElementById: () => makeEl(),
    hidden: false,
    dataset: {}
  });

  const storage = {};
  const sandbox = {
    console: { log: () => {}, warn: () => {}, error: () => {}, info: () => {} },
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
    URL,
    URLSearchParams
  };

  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.window.innerWidth = 1200;
  sandbox.window.innerHeight = 800;
  sandbox.window.addEventListener = () => {};
  sandbox.window.removeEventListener = () => {};
  sandbox.window.location = { href: 'http://localhost/', pathname: '/', search: '' };
  sandbox.window.history = { pushState: () => {}, replaceState: () => {} };
  sandbox.window.requestAnimationFrame = (cb) => { if (typeof cb === 'function') cb(); };
  sandbox.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });

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
    head: makeEl(),
    body: makeEl(),
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: () => makeEl(),
    querySelectorAll: () => [],
    getElementById: () => makeEl(),
    createElement: () => Object.assign(makeEl(), { toDataURL: () => 'image/webp' }),
    readyState: 'complete',
    title: ''
  };
  sandbox.indexedDB = { open: () => ({ onsuccess: null, onerror: null }) };
  sandbox.navigator = { userAgent: 'node', language: 'en-US' };

  sandbox.BroadcastChannel = function(name) {
    this.name = name;
    this.postMessage = () => {};
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

  return {
    sandbox,
    eval: (code) => vm.runInContext(code, sandbox),
    storage
  };
}

// -----------------------------------------------------------------------------
// PART 1: script.js ALONE (Fallback catalog & custom-design resolution)
// -----------------------------------------------------------------------------
console.log('[PART 1] Storefront VM Execution: script.js (STANDALONE fallback)');
const envStandalone = createStoreEnvironment(null, 'script.js');

check('envStandalone has getProduct', typeof envStandalone.eval('typeof getProduct') === 'string' && envStandalone.eval('typeof getProduct') === 'function');
check('envStandalone has itemUnitPrice', envStandalone.eval('typeof itemUnitPrice') === 'function');
check('envStandalone has cartLineTotal', envStandalone.eval('typeof cartLineTotal') === 'function');

const standaloneCustom = envStandalone.eval('getProduct("custom-design")');
check('Standalone fallback resolves custom-design', !!standaloneCustom);
if (standaloneCustom) {
  check('Standalone custom-design basePrice === 180 (NOT 60)', standaloneCustom.basePrice === 180, `Got: ${standaloneCustom.basePrice}`);
  check('Standalone custom-design sizes["20x30"] === 180 (NOT 60)', standaloneCustom.sizes?.['20x30'] === 180, `Got: ${standaloneCustom.sizes?.['20x30']}`);
  check('Standalone custom-design sizes["30x40"] === 200 (NOT 80)', standaloneCustom.sizes?.['30x40'] === 200, `Got: ${standaloneCustom.sizes?.['30x40']}`);
  check('Standalone custom-design sizes["40x50"] === 250', standaloneCustom.sizes?.['40x50'] === 250);
  check('Standalone custom-design sizes["50x70"] === 300', standaloneCustom.sizes?.['50x70'] === 300);

  const testFrames = ['None', 'Black', 'White', 'Transparent', '', null, undefined, 'Unknown'];
  for (const [sz, exp] of Object.entries({ '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 })) {
    for (const fr of testFrames) {
      const uPrice = envStandalone.eval(`itemUnitPrice(getProduct("custom-design"), "${sz}", ${JSON.stringify(fr)})`);
      check(`Standalone itemUnitPrice(custom-design, "${sz}", "${fr}") === ${exp}`, uPrice === exp, `Got: ${uPrice}`);
      check(`Standalone itemUnitPrice(custom-design, "${sz}", "${fr}") !== 60 and !== 80`, uPrice !== 60 && uPrice !== 80);

      const lTot = envStandalone.eval(`cartLineTotal({ productId: "custom-design", size: "${sz}", frame: ${JSON.stringify(fr)}, quantity: 1 })`);
      check(`Standalone cartLineTotal(custom-design, "${sz}", "${fr}", qty=1) === ${exp}`, lTot === exp, `Got: ${lTot}`);
      check(`Standalone cartLineTotal(custom-design, "${sz}", "${fr}", qty=1) !== 60 and !== 80`, lTot !== 60 && lTot !== 80);
    }
  }
}

// -----------------------------------------------------------------------------
// PART 2: script.min.js ALONE (Minified fallback custom-design resolution)
// -----------------------------------------------------------------------------
console.log('\n[PART 2] Storefront VM Execution: script.min.js (STANDALONE minified)');
const envMinStandalone = createStoreEnvironment(null, 'script.min.js');

const minStandaloneCustom = envMinStandalone.eval('getProduct("custom-design")');
check('Minified standalone resolves custom-design', !!minStandaloneCustom);
if (minStandaloneCustom) {
  check('Minified standalone custom-design basePrice === 180', minStandaloneCustom.basePrice === 180, `Got: ${minStandaloneCustom.basePrice}`);
  check('Minified standalone custom-design 20x30 === 180', minStandaloneCustom.sizes?.['20x30'] === 180);
  check('Minified standalone custom-design 30x40 === 200', minStandaloneCustom.sizes?.['30x40'] === 200);

  const uPrice20 = envMinStandalone.eval('itemUnitPrice(getProduct("custom-design"), "20x30", "Black")');
  const uPrice30 = envMinStandalone.eval('itemUnitPrice(getProduct("custom-design"), "30x40", "Black")');
  check('Minified standalone itemUnitPrice 20x30 === 180 (not 60)', uPrice20 === 180, `Got: ${uPrice20}`);
  check('Minified standalone itemUnitPrice 30x40 === 200 (not 80)', uPrice30 === 200, `Got: ${uPrice30}`);

  const line20 = envMinStandalone.eval('cartLineTotal({ productId: "custom-design", size: "20x30", frame: "Black", quantity: 1 })');
  const line30 = envMinStandalone.eval('cartLineTotal({ productId: "custom-design", size: "30x40", frame: "Black", quantity: 1 })');
  check('Minified standalone cartLineTotal 20x30 === 180 (not 60)', line20 === 180, `Got: ${line20}`);
  check('Minified standalone cartLineTotal 30x40 === 200 (not 80)', line30 === 200, `Got: ${line30}`);
}

// -----------------------------------------------------------------------------
// PART 3: Full Storefront Runtime (products-bundle.js + script.js)
// -----------------------------------------------------------------------------
console.log('\n[PART 3] Full Storefront Runtime: products-bundle.js + script.js');
const envRuntime = createStoreEnvironment('products-bundle.js', 'script.js');

const runtimeProducts = envRuntime.eval('products');
check('Runtime catalog has 1,019 products', Array.isArray(runtimeProducts) && runtimeProducts.length === 1019, `Got: ${runtimeProducts?.length}`);

const runtimeMerged = envRuntime.eval('getMergedProducts()');
check('Runtime getMergedProducts() returns 1,019 items', Array.isArray(runtimeMerged) && runtimeMerged.length === 1019, `Got: ${runtimeMerged?.length}`);

// -----------------------------------------------------------------------------
// PART 4: Exhaustive Permutation Check across all 1,019 products
// -----------------------------------------------------------------------------
console.log('\n[PART 4] Exhaustive Permutation Check (1,019 products x 4 sizes x 12 frames)');

const testSizes = ["20x30", "30x40", "40x50", "50x70"];
const tierMap = { "20x30": 180, "30x40": 200, "40x50": 250, "50x70": 300 };
const testFrames = ["Black", "White", "Transparent", "None", "", null, undefined, "Gold", "Wood", 999, false, true];

let permTotal = 0;
let permMismatches = 0;
let permLegacyHits = 0;

for (const prod of runtimeProducts) {
  for (const sz of testSizes) {
    const exp = tierMap[sz];
    for (const fr of testFrames) {
      permTotal++;
      const uPrice = envRuntime.eval(`itemUnitPrice(getProduct(${JSON.stringify(prod.id)}), ${JSON.stringify(sz)}, ${JSON.stringify(fr)})`);
      if (uPrice !== exp) {
        permMismatches++;
      }
      if (uPrice === 60 || uPrice === 80) {
        permLegacyHits++;
      }

      const lTotal = envRuntime.eval(`cartLineTotal({ productId: ${JSON.stringify(prod.id)}, size: ${JSON.stringify(sz)}, frame: ${JSON.stringify(fr)}, quantity: 1 })`);
      if (lTotal !== exp) {
        permMismatches++;
      }
      if (lTotal === 60 || lTotal === 80) {
        permLegacyHits++;
      }
    }
  }
}

check(`Tested all ${permTotal} combinations of product, size, and frame`, permTotal === 1019 * 4 * 12);
check('Zero price mismatches across all 48,912 permutations', permMismatches === 0, `Mismatches: ${permMismatches}`);
check('Zero occurrences of 60 or 80 EGP in itemUnitPrice or cartLineTotal across all permutations', permLegacyHits === 0, `Hits: ${permLegacyHits}`);

// -----------------------------------------------------------------------------
// PART 5: Property-Based Fuzzing of 25,000 Randomized Cart Lines
// -----------------------------------------------------------------------------
console.log('\n[PART 5] Property-Based Fuzzing: 25,000 Randomized Cart Lines');

let fuzzLegacyHits = 0;
let fuzzNanOrInf = 0;
let fuzzProportionalityErrors = 0;

const fuzzFrames = ["Black", "White", "Transparent", "None", "black", "WHITE", "", null, undefined, "Custom", 42];
const fuzzSizes = ["20x30", "30x40", "40x50", "50x70", "unknown", "", null, undefined];

for (let i = 0; i < 25000; i++) {
  const p = runtimeProducts[Math.floor(Math.random() * runtimeProducts.length)];
  const sz = fuzzSizes[Math.floor(Math.random() * fuzzSizes.length)];
  const fr = fuzzFrames[Math.floor(Math.random() * fuzzFrames.length)];
  const qty = Math.floor(Math.random() * 20) + 1; // 1 to 20

  const uPrice = envRuntime.eval(`itemUnitPrice(getProduct(${JSON.stringify(p.id)}), ${JSON.stringify(sz)}, ${JSON.stringify(fr)})`);
  const lTotal = envRuntime.eval(`cartLineTotal({ productId: ${JSON.stringify(p.id)}, size: ${JSON.stringify(sz)}, frame: ${JSON.stringify(fr)}, quantity: ${qty} })`);

  if (!Number.isFinite(uPrice) || !Number.isFinite(lTotal)) {
    fuzzNanOrInf++;
  }

  // Unit price check: can NEVER be 60 or 80 EGP
  if (uPrice === 60 || uPrice === 80) {
    fuzzLegacyHits++;
  }

  // Effective unit price from cartLineTotal: can NEVER be 60 or 80 EGP
  const effUnit = lTotal / qty;
  if (effUnit === 60 || effUnit === 80) {
    fuzzLegacyHits++;
  }

  // For qty = 1, line total can NEVER be 60 or 80 EGP
  if (qty === 1 && (lTotal === 60 || lTotal === 80)) {
    fuzzLegacyHits++;
  }

  if (lTotal !== uPrice * qty) {
    fuzzProportionalityErrors++;
  }
}

check('Tested 25,000 randomized cart line items', true);
check('Zero NaN or non-finite numbers in fuzzing', fuzzNanOrInf === 0);
check('Zero legacy 60 or 80 EGP prices produced across 25,000 items', fuzzLegacyHits === 0, `Hits: ${fuzzLegacyHits}`);
check('Line total strictly matches unitPrice * quantity for all 25,000 items', fuzzProportionalityErrors === 0, `Errors: ${fuzzProportionalityErrors}`);

// -----------------------------------------------------------------------------
// PART 6: Full Repository Legacy String Extinction Audit
// -----------------------------------------------------------------------------
console.log('\n[PART 6] Codebase Legacy String Extinction Audit');

const filesToAudit = [
  'script.js',
  'script.min.js',
  'admin-panel.js',
  'admin-panel.min.js',
  'build-products.js',
  'products-bundle.js',
  'products-bundle.min.js',
  'admin/products-bundle.js',
  'admin/products-bundle.min.js',
  'index.html',
  'product.html',
  'faq.html',
  'our-work.html',
  'admin/panel.html',
  'admin/index.html'
];

const catFiles = fs.readdirSync(ROOT_DIR).filter(f => f.endsWith('-products.js') && f !== 'build-products.js' && f !== 'products-bundle.js');
filesToAudit.push(...catFiles);

const legacyPriceRegexes = [
  { name: 'basePrice: 60', rx: /(["']?basePrice["']?)\s*:\s*60\b/ },
  { name: 'size 20x30: 60', rx: /["']20x30["']\s*:\s*60\b/ },
  { name: 'size 30x40: 80', rx: /["']30x40["']\s*:\s*80\b/ },
  { name: 'placeholder 20x30=60', rx: /20x30=60/ },
  { name: 'placeholder 30x40=80', rx: /30x40=80/ },
  { name: 'Frames add EGP 120', rx: /Frames\s+add\s+EGP\s+120/i }
];

let extinctionFailures = 0;

for (const rel of filesToAudit) {
  const full = path.join(ROOT_DIR, rel);
  if (!fs.existsSync(full)) {
    check(`Audit target exists: ${rel}`, false, 'Missing');
    continue;
  }
  const content = fs.readFileSync(full, 'utf8');
  for (const lp of legacyPriceRegexes) {
    if (lp.rx.test(content)) {
      extinctionFailures++;
      check(`Extinction check: ${rel} contains NO ${lp.name}`, false, `Matched ${lp.rx}`);
    }
  }
}

check(`Audited ${filesToAudit.length} files for legacy price tokens`, true);
check('Zero legacy pricing tokens detected across all production files', extinctionFailures === 0, `Violations: ${extinctionFailures}`);

// -----------------------------------------------------------------------------
// VERDICT
// -----------------------------------------------------------------------------
console.log('\n======================================================================');
console.log(' CHALLENGER ROUND 2 AUDIT SUMMARY');
console.log('======================================================================');
console.log(`Total Checks Run : ${totalChecks}`);
console.log(`Checks Passed    : ${passedChecks}`);
console.log(`Checks Failed    : ${failedChecks}`);
console.log('======================================================================');

if (failedChecks > 0) {
  console.error('\nFAILURES:');
  failures.forEach(f => console.error(f));
  console.log('\nFINAL VERDICT: REJECT');
  process.exit(1);
} else {
  console.log('\nFINAL VERDICT: APPROVE');
  console.log('Milestone 1 Pricing Structure & Data Consistency is EMPIRICALLY BULLETPROOF.');
  process.exit(0);
}

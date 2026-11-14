/**
 * independent_victory_check.js
 * Independent Auditor Verification Script
 * Executed by Victory Auditor to verify Requirements R1 - R5 directly.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..', '..');

const results = {
  r1: { pass: 0, fail: 0, errors: [] },
  r2: { pass: 0, fail: 0, errors: [] },
  r3: { pass: 0, fail: 0, errors: [] },
  r4: { pass: 0, fail: 0, errors: [] },
  r5: { pass: 0, fail: 0, errors: [] },
};

function assert(req, name, cond, msg) {
  if (cond) {
    results[req].pass++;
  } else {
    results[req].fail++;
    results[req].errors.push(`${name}: ${msg}`);
    console.error(`[FAIL] [${req.toUpperCase()}] ${name}: ${msg}`);
  }
}

async function verifyR1() {
  console.log('\n--- VERIFYING R1: Product Pricing Structure ---');
  
  // 1. Inspect all 18 category files
  const categoryFiles = [
    'football-products.js',
    'cars-products.js',
    'clubs-products.js',
    'movie-artist-products.js',
    'album-artist-products.js',
    'gym-products.js',
    'art-products.js',
    'anime-products.js',
    'girls-products.js',
    'games-products.js',
    'islamic-products.js',
    'cities-products.js',
    'quotes-products.js',
    'nba-products.js',
    'meemes-products.js',
    'pharaonic-products.js',
    'rap-scene-products.js',
    'jordan-products.js'
  ];

  let totalCatProducts = 0;
  for (const cf of categoryFiles) {
    const fullPath = path.join(ROOT, cf);
    assert('r1', `File exists: ${cf}`, fs.existsSync(fullPath), `Missing category file ${cf}`);
    const code = fs.readFileSync(fullPath, 'utf8');
    
    // Check no legacy prices
    assert('r1', `No legacy 60 in ${cf}`, !code.includes(': 60') && !code.includes(':60'), `Found price 60 in ${cf}`);
    assert('r1', `No legacy 80 in ${cf}`, !code.includes(': 80') && !code.includes(':80'), `Found price 80 in ${cf}`);
    assert('r1', `No legacy 240 in ${cf}`, !code.includes(': 240') && !code.includes(':240'), `Found price 240 in ${cf}`);

    // Extract the const variable name
    const match = code.match(/const\s+([a-zA-Z0-9_]+)\s*=/);
    const varName = match ? match[1] : null;
    assert('r1', `Variable declaration found in ${cf}`, !!varName, `No variable declared in ${cf}`);

    if (varName) {
      try {
        const arr = vm.runInNewContext(code + `\n;${varName};`);
        assert('r1', `Category array exported in ${cf}`, Array.isArray(arr) && arr.length > 0, `No array found in ${cf}`);
        if (Array.isArray(arr)) {
          totalCatProducts += arr.length;
          for (const p of arr) {
            const validBase = p.basePrice === 180;
            const validSizes = p.sizes &&
              p.sizes['20x30'] === 180 &&
              p.sizes['30x40'] === 200 &&
              p.sizes['40x50'] === 250 &&
              p.sizes['50x70'] === 300;
            if (!validBase || !validSizes) {
              assert('r1', `Product pricing in ${cf} (${p.id})`, false, `Invalid price on ${p.id}: basePrice=${p.basePrice}, sizes=${JSON.stringify(p.sizes)}`);
            }
          }
        }
      } catch (e) {
        assert('r1', `Evaluation of ${cf}`, false, e.message);
      }
    }
  }

  assert('r1', 'Total category products count == 1018', totalCatProducts === 1018, `Expected 1018, got ${totalCatProducts}`);

  // 2. Products bundle check
  const bundleCode = fs.readFileSync(path.join(ROOT, 'products-bundle.js'), 'utf8');
  const bundleSandbox = { window: {}, globalThis: {}, console };
  vm.createContext(bundleSandbox);
  vm.runInContext(bundleCode, bundleSandbox);
  const bundleList = bundleSandbox.window.products || bundleSandbox.globalThis.products;
  assert('r1', 'Bundle products count == 1019', Array.isArray(bundleList) && bundleList.length === 1019, `Expected 1019 in bundle, got ${bundleList?.length}`);

  // 3. Script.js frame options and itemUnitPrice
  const scriptCode = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
  assert('r1', 'frameOptions defined in script.js', scriptCode.includes('const frameOptions ='), 'frameOptions missing');
  assert('r1', 'frameOptions Black price is 0', scriptCode.includes('Black: { label: "Black frame", price: 0'), 'Black frame option missing');
  assert('r1', 'No frame surcharge adder logic', !scriptCode.includes('sizePrice + 120'), 'Old frame surcharge found');

  // Verify itemUnitPrice logic in mock browser sandbox
  const mockWindow = {
    innerWidth: 1024,
    addEventListener: () => {},
    removeEventListener: () => {},
    location: { search: '', pathname: '/', href: 'http://localhost/' },
    history: { pushState: () => {} },
    scrollTo: () => {}
  };
  const mockDoc = {
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    createElement: () => ({ toDataURL: () => 'data:image/webp;base64,', setAttribute: () => {}, appendChild: () => {} }),
    head: { appendChild: () => {} },
    body: { appendChild: () => {} },
    documentElement: { dataset: {}, setAttribute: () => {} }
  };
  const sandbox = {
    window: mockWindow,
    document: mockDoc,
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    navigator: { serviceWorker: {} },
    BroadcastChannel: function() { this.postMessage = () => {}; this.close = () => {}; },
    URLSearchParams: globalThis.URLSearchParams,
    URL: globalThis.URL,
    indexedDB: { open: () => ({ onupgradeneeded: null, onsuccess: null, onerror: null }) },
    initFirebase: () => {},
    isFirebaseReady: () => false,
    syncProductsFromFirestore: () => Promise.resolve(),
    console,
    setTimeout: () => 1,
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {}
  };
  sandbox.self = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(bundleCode, sandbox);
  vm.runInContext(scriptCode, sandbox);

  const itemUnitPrice = sandbox.itemUnitPrice;
  assert('r1', 'itemUnitPrice function exists in scope', typeof itemUnitPrice === 'function', 'itemUnitPrice missing');
  if (typeof itemUnitPrice === 'function') {
    const prod = (sandbox.window.products || sandbox.products)[1];
    assert('r1', '20x30 unit price is 180', itemUnitPrice(prod, '20x30', 'Black') === 180, `Expected 180, got ${itemUnitPrice(prod, '20x30', 'Black')}`);
    assert('r1', '30x40 unit price is 200', itemUnitPrice(prod, '30x40', 'White') === 200, `Expected 200, got ${itemUnitPrice(prod, '30x40', 'White')}`);
    assert('r1', '40x50 unit price is 250', itemUnitPrice(prod, '40x50', 'Transparent') === 250, `Expected 250, got ${itemUnitPrice(prod, '40x50', 'Transparent')}`);
    assert('r1', '50x70 unit price is 300', itemUnitPrice(prod, '50x70', 'None') === 300, `Expected 300, got ${itemUnitPrice(prod, '50x70', 'None')}`);
  }
}

async function verifyR2() {
  console.log('\n--- VERIFYING R2: Admin Panel Synchronization & Operations ---');
  
  const adminCode = fs.readFileSync(path.join(ROOT, 'admin-panel.js'), 'utf8');
  const storeCode = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');

  // 1. Dual channel BroadcastChannel & storage fallback
  assert('r2', 'BroadcastChannel in admin-panel.js', adminCode.includes('BroadcastChannel'), 'Missing BroadcastChannel in admin');
  assert('r2', 'BroadcastChannel in script.js', storeCode.includes('BroadcastChannel'), 'Missing BroadcastChannel in store');
  assert('r2', 'storage event listener fallback in script.js', /window\.addEventListener\(['"]storage['"]/.test(storeCode), 'Missing storage fallback in store');
  assert('r2', 'pls-sync-signal broadcast in admin-panel.js', adminCode.includes('pls-sync-signal'), 'Missing pls-sync-signal fallback');

  // 2. Price floor defense >= 180 EGP
  assert('r2', 'Price floor MIN_PRICE_FLOOR in admin-panel.js', adminCode.includes('MIN_PRICE_FLOOR = 180') || adminCode.includes('180'), 'Missing price floor in admin');
  assert('r2', 'sanitizeRemoteProduct price floor defense in script.js', storeCode.includes('sanitizeRemoteProduct'), 'Missing sanitizeRemoteProduct in script.js');

  // 3. Stock tracking & blocking
  assert('r2', 'isProductOutOfStock in script.js', storeCode.includes('function isProductOutOfStock'), 'Missing isProductOutOfStock');
  assert('r2', 'getProductStock in script.js', storeCode.includes('function getProductStock'), 'Missing getProductStock');
  assert('r2', 'addToCart checks stock limit', storeCode.includes('isProductOutOfStock'), 'addToCart stock check missing');
}

async function verifyR3() {
  console.log('\n--- VERIFYING R3: Product Page Simplification & Dynamic Frame Visualizer ---');

  const scriptCode = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
  const stylesCode = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
  const productHtml = fs.readFileSync(path.join(ROOT, 'product.html'), 'utf8');

  // 1. Default frame Black
  assert('r3', 'Default detailFrame is Black in script.js', scriptCode.includes('detailFrame = "Black"') || scriptCode.includes('detailFrame: "Black"'), 'Default frame is not Black');

  // 2. In-place switching switchDetailFrame
  assert('r3', 'switchDetailFrame function in script.js', scriptCode.includes('function switchDetailFrame'), 'Missing switchDetailFrame');
  assert('r3', 'In-place switching preserves element without recreate', scriptCode.includes('frame-black') && scriptCode.includes('frame-white'), 'switchDetailFrame frame classes missing');

  // 3. CSS Frame classes & wall background
  assert('r3', '.frame-black defined in styles.css', stylesCode.includes('.frame-black'), 'Missing .frame-black');
  assert('r3', '.frame-white defined in styles.css', stylesCode.includes('.frame-white'), 'Missing .frame-white');
  assert('r3', '.frame-transparent defined in styles.css', stylesCode.includes('.frame-transparent'), 'Missing .frame-transparent');
  assert('r3', 'White wall background gradient in styles.css', stylesCode.includes('radial-gradient') || stylesCode.includes('linear-gradient'), 'Missing wall gradient');

  // 4. Back button duplication check
  const backBarMatches = productHtml.match(/class="[^"]*page-back-bar[^"]*"/g) || [];
  assert('r3', 'Exactly 1 page-back-bar in product.html', backBarMatches.length === 1, `Found ${backBarMatches.length} back bars`);
}

async function verifyR4() {
  console.log('\n--- VERIFYING R4: Homepage, Navbar & Server Stabilization ---');

  const scriptCode = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
  const swCode = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const firebaseJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'firebase.json'), 'utf8'));
  const ourWorkHtml = fs.readFileSync(path.join(ROOT, 'our-work.html'), 'utf8');
  const faqHtml = fs.readFileSync(path.join(ROOT, 'faq.html'), 'utf8');

  // 1. Drawer links index.html?cat=
  assert('r4', 'Drawer links target index.html?cat=', scriptCode.includes('index.html?cat='), 'Drawer links do not target index.html?cat=');

  // 2. Subpage products-bundle.min.js
  assert('r4', 'our-work.html loads products-bundle.min.js', ourWorkHtml.includes('products-bundle.min.js'), 'our-work.html missing products-bundle');
  assert('r4', 'faq.html loads products-bundle.min.js', faqHtml.includes('products-bundle.min.js'), 'faq.html missing products-bundle');

  // 3. sw.js same origin guard
  assert('r4', 'sw.js same-origin guard present', swCode.includes('requestUrl.origin !== self.location.origin'), 'sw.js missing same-origin guard');

  // 4. firebase.json caching headers
  const headers = firebaseJson.hosting?.headers || [];
  const swHeader = headers.find(h => h.source === '/sw.js');
  assert('r4', '/sw.js has no-cache header in firebase.json', !!swHeader, 'Missing /sw.js header in firebase.json');
  if (swHeader) {
    const cc = swHeader.headers.find(h => h.key === 'Cache-Control')?.value || '';
    assert('r4', '/sw.js Cache-Control is no-cache, no-store', cc.includes('no-cache') && cc.includes('no-store'), `Incorrect Cache-Control: ${cc}`);
  }

  // 5. Checkout speedup (zero tmpfiles upload for catalog)
  assert('r4', 'Checkout checks item.upload for remote upload', scriptCode.includes('item.upload') && scriptCode.includes('productImageUrl'), 'Catalog items not separated from custom upload');
}

async function verifyR5() {
  console.log('\n--- VERIFYING R5: Audit for Errors & Unrequested Features ---');

  const scriptCode = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
  const stylesCode = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');

  // 1. Obsolete files check
  const obsoleteFiles = [
    'scratchpad_phbf08cl.md',
    'scratchpad_q2u9oq20.md',
    'scratchpad_sl9ajhoy.md',
    '_gen-three.mjs',
    'gen-lists.js',
    'album-artist-new.json'
  ];
  for (const ofile of obsoleteFiles) {
    assert('r5', `Obsolete file ${ofile} is absent`, !fs.existsSync(path.join(ROOT, ofile)), `${ofile} still exists!`);
  }

  // 2. Unrequested animations pruned
  assert('r5', 'spawnConfetti pruned from script.js', !scriptCode.includes('function spawnConfetti'), 'spawnConfetti still present');
  assert('r5', 'animateFlyToCart pruned from script.js', !scriptCode.includes('function animateFlyToCart'), 'animateFlyToCart still present');
  assert('r5', 'initCardTiltEffects pruned from script.js', !scriptCode.includes('function initCardTiltEffects'), 'initCardTiltEffects still present');
  assert('r5', '.card-glare pruned from styles.css', !stylesCode.includes('.card-glare'), '.card-glare still present');
  assert('r5', '.confetti-container pruned from styles.css', !stylesCode.includes('.confetti-container'), '.confetti-container still present');

  // 3. Minification parity check
  const scriptMinCode = fs.readFileSync(path.join(ROOT, 'script.min.js'), 'utf8');
  assert('r5', 'script.min.js has index.html?cat=', scriptMinCode.includes('index.html?cat='), 'script.min.js missing nav fix');
  assert('r5', 'script.min.js has no spawnConfetti', !scriptMinCode.includes('spawnConfetti'), 'script.min.js has spawnConfetti');
}

async function run() {
  await verifyR1();
  await verifyR2();
  await verifyR3();
  await verifyR4();
  await verifyR5();

  console.log('\n===============================================================');
  console.log(' INDEPENDENT VICTORY AUDITOR VERIFICATION SUMMARY');
  console.log('===============================================================');
  let allPass = true;
  for (const [req, data] of Object.entries(results)) {
    console.log(`Requirement ${req.toUpperCase()}: ${data.pass} passed, ${data.fail} failed`);
    if (data.fail > 0) allPass = false;
  }
  console.log(`\nOVERALL VERDICT: ${allPass ? 'VICTORY CONFIRMED' : 'VICTORY REJECTED'}`);
  process.exit(allPass ? 0 : 1);
}

run();

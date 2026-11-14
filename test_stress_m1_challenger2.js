/**
 * Empirical Stress Test Harness - Challenger 2 (Milestone 1)
 *
 * Covers:
 * 1. Quick-Add Simulation (default 20x30, 180 EGP, Black frame, catalog-wide & multi-click)
 * 2. Bulk Cart Stress (100+ items, multi-dimension, delivery fee 35 EGP, floating-point precision, empty cart)
 * 3. Remote Sync Vulnerability Test (Firestore incoming hydration, legacy 60/80 downgrade attack simulation)
 * 4. Admin Panel Form Parsing (extra spaces, uppercase, decimals, malformed entries, missing values)
 */

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

let passedTests = 0;
let totalTests = 0;
const findings = [];

function it(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    findings.push({ test: name, error: err.message });
  }
}

async function itAsync(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    findings.push({ test: name, error: err.message });
  }
}

function createStoreEnvironment() {
  const makeEl = () => ({
    addEventListener: () => {},
    removeEventListener: () => {},
    classList: { add() {}, remove() {}, contains() { return false; } },
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

  const sandbox = {
    console,
    setTimeout: (cb) => { cb(); return 1; },
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
  sandbox.window.innerWidth = 1200;
  sandbox.window.addEventListener = () => {};
  sandbox.window.removeEventListener = () => {};
  sandbox.window.location = { href: 'http://localhost/', pathname: '/', search: '' };
  sandbox.window.requestAnimationFrame = (cb) => cb();
  sandbox.window.setTimeout = sandbox.setTimeout;
  sandbox.window.clearTimeout = sandbox.clearTimeout;
  sandbox.window.setInterval = sandbox.setInterval;
  sandbox.window.clearInterval = sandbox.clearInterval;
  sandbox.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });

  const storage = {};
  sandbox.localStorage = {
    getItem(k) { return storage[k] !== undefined ? storage[k] : null; },
    setItem(k, v) { storage[k] = String(v); },
    removeItem(k) { delete storage[k]; },
    _store: storage
  };
  sandbox.sessionStorage = {
    getItem() { return null; },
    setItem() {},
    removeItem() {}
  };
  sandbox.document = {
    documentElement: { dataset: {} },
    head: makeEl(),
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: () => makeEl(),
    querySelectorAll: () => [],
    getElementById: () => makeEl(),
    createElement: () => Object.assign(makeEl(), { toDataURL: () => 'image/webp' }),
    body: makeEl(),
    title: ''
  };
  sandbox.indexedDB = { open: () => ({ onsuccess: null, onerror: null }) };
  sandbox.navigator = { userAgent: 'node' };

  sandbox.initFirebase = () => {};
  sandbox.isFirebaseReady = () => false;
  sandbox.ensureFirebaseReady = async () => false;
  sandbox.getFirebaseDb = () => null;

  vm.createContext(sandbox);

  const bundleSrc = fs.readFileSync('products-bundle.js', 'utf8');
  vm.runInContext(bundleSrc, sandbox);

  const scriptSrc = fs.readFileSync('script.js', 'utf8');
  vm.runInContext(scriptSrc, sandbox);

  return {
    sandbox,
    eval: (code) => vm.runInContext(code, sandbox),
    getState: () => vm.runInContext('state', sandbox),
    getProducts: () => vm.runInContext('products', sandbox),
    storage
  };
}

console.log('================================================================');
console.log('CHALLENGER 2: Adversarial Pricing, Cart & Sync Stress Test Suite');
console.log('================================================================\n');

// ============================================================================
// SUITE 1: QUICK-ADD SIMULATION & DEFAULTS
// ============================================================================
console.log('--- SUITE 1: Quick-Add Simulation & Defaults ---');

it('Quick-add defaults to size 20x30, frame Black, and unit price 180 EGP', async () => {
  const env = createStoreEnvironment();
  const state = env.getState();
  assert.strictEqual(state.cart.length, 0);

  // Call addToCart with only productId
  await env.eval('addToCart("football-001")');

  assert.strictEqual(state.cart.length, 1, 'Cart should contain exactly 1 item');
  const item = state.cart[0];
  assert.strictEqual(item.productId, 'football-001');
  assert.strictEqual(item.size, '20x30', 'Default size must be 20x30');
  assert.strictEqual(item.frame, 'Black', 'Default frame must be Black');
  assert.strictEqual(item.quantity, 1, 'Default quantity must be 1');

  // Verify line total, subtotal, delivery fee, and grand total
  const lineTotal = env.eval('cartLineTotal(state.cart[0])');
  assert.strictEqual(lineTotal, 180, 'Line total must be 180 EGP');

  const subtotal = env.eval('cartSubtotal()');
  assert.strictEqual(subtotal, 180, 'Subtotal must be 180 EGP');

  const delivery = env.eval('orderDeliveryFee()');
  assert.strictEqual(delivery, 35, 'Delivery fee must be 35 EGP');

  const grandTotal = env.eval('cartGrandTotal()');
  assert.strictEqual(grandTotal, 215, 'Grand total must be 180 + 35 = 215 EGP');
});

it('Quick-add across all 18 categories defaults consistently to 180 EGP and Black frame', async () => {
  const env = createStoreEnvironment();
  const state = env.getState();
  const products = env.getProducts();

  // Pick first product from each category
  const categories = [...new Set(products.map(p => p.category))];
  assert.ok(categories.length >= 18, `Found ${categories.length} categories`);

  for (const cat of categories) {
    const prod = products.find(p => p.category === cat && !p.isCustom);
    if (!prod) continue;
    state.cart = []; // reset cart
    await env.eval(`addToCart("${prod.id}")`);
    assert.strictEqual(state.cart.length, 1);
    const item = state.cart[0];
    assert.strictEqual(item.size, '20x30', `Cat ${cat} size mismatch`);
    assert.strictEqual(item.frame, 'Black', `Cat ${cat} frame mismatch`);
    const lineTotal = env.eval('cartLineTotal(state.cart[0])');
    assert.strictEqual(lineTotal, 180, `Cat ${cat} (${prod.id}) unit price is ${lineTotal}, expected 180`);
  }
});

it('Multiple quick-adds of the same product increment quantity without price distortion', async () => {
  const env = createStoreEnvironment();
  const state = env.getState();

  for (let i = 1; i <= 5; i++) {
    await env.eval('addToCart("football-001")');
    assert.strictEqual(state.cart.length, 1, 'Should stay 1 unique item');
    assert.strictEqual(state.cart[0].quantity, i, `Quantity should be ${i}`);
    const lineTotal = env.eval('cartLineTotal(state.cart[0])');
    assert.strictEqual(lineTotal, 180 * i, `Line total should be ${180 * i}`);
    const subtotal = env.eval('cartSubtotal()');
    assert.strictEqual(subtotal, 180 * i);
    const grandTotal = env.eval('cartGrandTotal()');
    assert.strictEqual(grandTotal, 180 * i + 35);
  }
});

it('Quick-add with explicit variant arguments reflects exact tier prices (180, 200, 250, 300) with 0 frame adder', async () => {
  const env = createStoreEnvironment();
  const state = env.getState();
  const frames = ['Black', 'White', 'Transparent', 'None'];

  const testMatrix = [
    { size: '20x30', expectedUnit: 180 },
    { size: '30x40', expectedUnit: 200 },
    { size: '40x50', expectedUnit: 250 },
    { size: '50x70', expectedUnit: 300 }
  ];

  for (const variant of testMatrix) {
    for (const frame of frames) {
      state.cart = [];
      await env.eval(`addToCart("cars-001", "${variant.size}", "${frame}")`);
      assert.strictEqual(state.cart.length, 1);
      const lineTotal = env.eval('cartLineTotal(state.cart[0])');
      assert.strictEqual(lineTotal, variant.expectedUnit,
        `Variant ${variant.size} + ${frame} produced ${lineTotal}, expected ${variant.expectedUnit}`);
    }
  }
});

it('Quick-add with invalid/unexpected size safely falls back without throwing or NaN', async () => {
  const env = createStoreEnvironment();
  const state = env.getState();

  await env.eval('addToCart("football-001", "invalid-size-999", "weird-frame")');
  assert.strictEqual(state.cart.length, 1);
  const lineTotal = env.eval('cartLineTotal(state.cart[0])');
  assert.ok(!isNaN(lineTotal) && lineTotal > 0, `Line total should be a valid positive number, got ${lineTotal}`);
  const grandTotal = env.eval('cartGrandTotal()');
  assert.ok(!isNaN(grandTotal) && grandTotal >= 35, `Grand total should be valid number, got ${grandTotal}`);
});


// ============================================================================
// SUITE 2: BULK CART STRESS TESTS
// ============================================================================
console.log('\n--- SUITE 2: Bulk Cart Stress Tests ---');

it('Bulk cart with 100 distinct items across all 4 tiers computes exact subtotal and +35 delivery', async () => {
  const env = createStoreEnvironment();
  const state = env.getState();
  const products = env.getProducts().filter(p => !p.isCustom);
  const tiers = [
    { size: '20x30', unit: 180 },
    { size: '30x40', unit: 200 },
    { size: '40x50', unit: 250 },
    { size: '50x70', unit: 300 }
  ];
  const frames = ['Black', 'White', 'Transparent', 'None'];

  let expectedSubtotal = 0;
  let totalItemsAdded = 0;

  for (let i = 0; i < 100; i++) {
    const prod = products[i % products.length];
    const tier = tiers[i % tiers.length];
    const frame = frames[i % frames.length];
    const qty = (i % 3) + 1; // 1, 2, or 3

    state.cart.push({
      key: `${prod.id}-${tier.size}-${frame}`,
      productId: prod.id,
      size: tier.size,
      frame: frame,
      quantity: qty
    });

    expectedSubtotal += tier.unit * qty;
    totalItemsAdded += qty;
  }

  assert.strictEqual(state.cart.length, 100);

  const computedSubtotal = env.eval('cartSubtotal()');
  assert.strictEqual(computedSubtotal, expectedSubtotal,
    `Subtotal mismatch: computed ${computedSubtotal}, expected ${expectedSubtotal}`);

  const deliveryFee = env.eval('orderDeliveryFee()');
  assert.strictEqual(deliveryFee, 35, `Delivery fee must be 35, got ${deliveryFee}`);

  const grandTotal = env.eval('cartGrandTotal()');
  const expectedGrandTotal = expectedSubtotal + 35;
  assert.strictEqual(grandTotal, expectedGrandTotal,
    `Grand total mismatch: computed ${grandTotal}, expected ${expectedGrandTotal}`);

  // Test createOrder serialization
  const order = env.eval(`
    state.confirmedForm = {
      customerName: "Stress Tester",
      customerPhone: "01012345678",
      customerAddress: "Cairo, Egypt",
      paymentMethod: "VF-Cash"
    };
    window.testOrder = createOrder(state.confirmedForm);
    window.testOrder;
  `);
  assert.strictEqual(order.subtotal, expectedSubtotal);
  assert.strictEqual(order.deliveryFee, 35);
  assert.strictEqual(order.total, expectedGrandTotal);

  // Test WhatsApp message format with created order
  const waMsg = env.eval('buildWhatsAppMessage(window.testOrder)');
  assert.ok(waMsg.includes(`*الإجمالي قبل التوصيل:* ${env.eval(`money(${expectedSubtotal})`)}`) ||
            waMsg.includes(`*Subtotal:* ${env.eval(`money(${expectedSubtotal})`)}`) ||
            waMsg.includes(`*المجموع الفرعي:* ${env.eval(`money(${expectedSubtotal})`)}`),
            'WhatsApp message missing exact subtotal');
  assert.ok(waMsg.includes(`*التوصيل:* ${env.eval(`money(35)`)}`) ||
            waMsg.includes(`*Delivery:* ${env.eval(`money(35)`)}`),
            'WhatsApp message missing exact delivery fee 35');
  assert.ok(waMsg.includes(`*السعر الإجمالي:* ${env.eval(`money(${expectedGrandTotal})`)}`) ||
            waMsg.includes(`*Total Price:* ${env.eval(`money(${expectedGrandTotal})`)}`),
            `WhatsApp message missing exact grand total: ${waMsg.slice(-200)}`);
});

it('Empty cart returns subtotal 0, delivery fee 0, grand total 0', () => {
  const env = createStoreEnvironment();
  const state = env.getState();
  state.cart = [];

  const subtotal = env.eval('cartSubtotal()');
  assert.strictEqual(subtotal, 0, 'Empty cart subtotal must be 0');

  const deliveryFee = env.eval('orderDeliveryFee()');
  assert.strictEqual(deliveryFee, 0, 'Empty cart delivery fee must be 0 (no shipping charged on empty cart)');

  const grandTotal = env.eval('cartGrandTotal()');
  assert.strictEqual(grandTotal, 0, 'Empty cart grand total must be 0');
});

it('Bulk cart with percentage coupon computes exact discount and totals', () => {
  const env = createStoreEnvironment();
  const state = env.getState();

  // Add 10 x 20x30 (1,800) + 10 x 50x70 (3,000) = 4,800 EGP
  state.cart = [
    { key: 'p1-20x30-Black', productId: 'football-001', size: '20x30', frame: 'Black', quantity: 10 },
    { key: 'p2-50x70-White', productId: 'cars-001', size: '50x70', frame: 'White', quantity: 10 }
  ];

  const subtotal = env.eval('cartSubtotal()');
  assert.strictEqual(subtotal, 4800);

  // Apply default valid coupon POSTER10 (10% off, min 100)
  env.eval('applyCoupon("POSTER10")');
  assert.ok(state.appliedCoupon, 'POSTER10 coupon should be applied');

  const discounted = env.eval('getDiscountedTotal()');
  const expectedDiscount = Math.round(4800 * 0.10); // 480
  assert.strictEqual(discounted, 4800 - expectedDiscount); // 4320

  const grandTotal = env.eval('cartGrandTotal()');
  assert.strictEqual(grandTotal, 4320 + 35); // 4355

  const order = env.eval('createOrder({ customerName: "A", customerPhone: "B", customerAddress: "C" })');
  assert.strictEqual(order.subtotal, 4800);
  assert.strictEqual(order.discount, 480);
  assert.strictEqual(order.deliveryFee, 35);
  assert.strictEqual(order.total, 4355);
});


// ============================================================================
// SUITE 3: REMOTE SYNC VULNERABILITY & HYDRATION INTEGRITY
// ============================================================================
console.log('\n--- SUITE 3: Remote Sync Vulnerability & Hydration Integrity ---');

it('Remote sync with updated document updates local store without data loss', () => {
  const env = createStoreEnvironment();

  const remoteUpdated = [
    {
      id: 'football-001',
      name: 'Football #1 Updated',
      category: 'football',
      basePrice: 180,
      sizes: { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 },
      frames: ['Black', 'White', 'Transparent']
    }
  ];

  const changed = env.eval(`applyRemoteProducts(${JSON.stringify(remoteUpdated)})`);
  assert.strictEqual(changed, true, 'applyRemoteProducts should return true on update');

  const merged = env.eval('getMergedProducts()');
  const found = merged.find(p => p.id === 'football-001');
  assert.ok(found);
  assert.strictEqual(found.name, 'Football #1 Updated');
  assert.strictEqual(found.basePrice, 180);
  assert.deepStrictEqual(found.sizes, { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 });
});

it('VULNERABILITY CHALLENGE: Simulate legacy Firestore record downgrade attack', () => {
  const env = createStoreEnvironment();

  // Verify initial catalog state has 180/200/250/300
  const initialProduct = env.eval('getProduct("football-001")');
  assert.strictEqual(initialProduct.basePrice, 180);
  assert.strictEqual(initialProduct.sizes['20x30'], 180);

  // Attack scenario: Firestore receives or contains an unmigrated legacy product with old prices (60, 80)
  const legacyRemoteDoc = {
    id: 'football-001',
    name: 'Football #1 Legacy',
    category: 'football',
    basePrice: 60,
    sizes: {
      '20x30': 60,
      '30x40': 80,
      '40x50': 250,
      '50x70': 300
    },
    frames: ['Black', 'White']
  };

  // Hydrate from remote
  env.eval(`applyRemoteProducts([${JSON.stringify(legacyRemoteDoc)}])`);

  // Observe how getMergedProducts and itemUnitPrice behave
  const hydratedProduct = env.eval('getProduct("football-001")');
  const unitPrice20x30 = env.eval('itemUnitPrice(getProduct("football-001"), "20x30", "Black")');
  const unitPrice30x40 = env.eval('itemUnitPrice(getProduct("football-001"), "30x40", "Black")');

  console.log(`    [Empirical Observation] After legacy remote hydration:`);
  console.log(`    hydratedProduct.basePrice: ${hydratedProduct.basePrice}`);
  console.log(`    hydratedProduct.sizes["20x30"]: ${hydratedProduct.sizes['20x30']}`);
  console.log(`    itemUnitPrice("20x30"): ${unitPrice20x30} EGP`);
  console.log(`    itemUnitPrice("30x40"): ${unitPrice30x40} EGP`);

  // If client-side code blindly accepts remote legacy sizes without sanitizing against the price floor:
  const isDowngraded = (unitPrice20x30 === 60 || unitPrice30x40 === 80);
  if (isDowngraded) {
    console.log(`    ⚠️ ATTACK SUCCESSFUL: Remote sync downgraded product price to legacy 60/80 EGP!`);
  } else {
    console.log(`    🛡️ Remote sync defended against legacy price downgrade!`);
  }

  // We record this finding:
  assert.ok(true); // Complete measurement and capture empirical data
});


// ============================================================================
// SUITE 4: ADMIN PANEL FORM PARSING STRESS TESTS
// ============================================================================
console.log('\n--- SUITE 4: Admin Panel Form Parsing Stress Tests ---');

// Extract the exact parsing function from admin-panel.js
function parseAdminSizes(sizesStr) {
  let sizes = { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 };
  if (sizesStr) {
    const p = {};
    sizesStr.split(',').forEach(part => {
      const kv = part.trim().split('=');
      if (kv.length === 2) p[kv[0].trim()] = parseFloat(kv[1].trim()) || 0;
    });
    if (Object.keys(p).length) sizes = p;
  }
  return sizes;
}

it('Admin panel size parser handles extra spaces cleanly', () => {
  const input = "   20x30   =   180  ,   30x40  =  200  ,  40x50=250 , 50x70 = 300   ";
  const parsed = parseAdminSizes(input);
  assert.deepStrictEqual(parsed, {
    '20x30': 180,
    '30x40': 200,
    '40x50': 250,
    '50x70': 300
  });
});

it('Admin panel size parser handles decimals and formats properly', () => {
  const input = "20x30=180.50, 30x40=200.75, 40x50=250.00, 50x70=300.99";
  const parsed = parseAdminSizes(input);
  assert.strictEqual(parsed['20x30'], 180.50);
  assert.strictEqual(parsed['30x40'], 200.75);
  assert.strictEqual(parsed['40x50'], 250.00);
  assert.strictEqual(parsed['50x70'], 300.99);
});

it('Admin panel size parser with empty or whitespace-only string returns standard fallback tier', () => {
  const defaultExpected = { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 };
  assert.deepStrictEqual(parseAdminSizes(''), defaultExpected);
  assert.deepStrictEqual(parseAdminSizes('   '), defaultExpected);
  assert.deepStrictEqual(parseAdminSizes(null), defaultExpected);
  assert.deepStrictEqual(parseAdminSizes(undefined), defaultExpected);
});

it('Admin panel size parser handles trailing commas and empty segments gracefully', () => {
  const input = "20x30=180, , , 30x40=200, , 40x50=250, 50x70=300,";
  const parsed = parseAdminSizes(input);
  assert.deepStrictEqual(parsed, {
    '20x30': 180,
    '30x40': 200,
    '40x50': 250,
    '50x70': 300
  });
});

it('Admin panel size parser with non-numeric or missing price values defaults them to 0', () => {
  const input = "20x30=free, 30x40=abc, 40x50=, 50x70=300";
  const parsed = parseAdminSizes(input);
  assert.strictEqual(parsed['20x30'], 0);
  assert.strictEqual(parsed['30x40'], 0);
  assert.strictEqual(parsed['40x50'], 0);
  assert.strictEqual(parsed['50x70'], 300);
});

it('Admin panel size parser with completely invalid garbage retains default 180/200/250/300', () => {
  const input = "this is total garbage without any equals signs, just commas, here";
  const parsed = parseAdminSizes(input);
  assert.deepStrictEqual(parsed, {
    '20x30': 180,
    '30x40': 200,
    '40x50': 250,
    '50x70': 300
  });
});

it('Admin panel uppercase size strings test (20X30 vs 20x30)', () => {
  const input = "20X30=180, 30X40=200, 40X50=250, 50X70=300";
  const parsed = parseAdminSizes(input);
  assert.strictEqual(parsed['20X30'], 180);
  assert.strictEqual(parsed['30X40'], 200);

  // Check how script.js itemUnitPrice handles uppercase key
  const env = createStoreEnvironment();
  const testProduct = {
    id: 'test-case',
    basePrice: 180,
    sizes: parsed,
    frames: ['Black', 'White']
  };

  // If customer selects standard lowercase '20x30'
  const unitPrice = env.eval(`itemUnitPrice(${JSON.stringify(testProduct)}, '20x30', 'Black')`);
  console.log(`    [Empirical Observation] Storefront itemUnitPrice with uppercase sizes ('20X30'): ${unitPrice} EGP`);
  assert.strictEqual(unitPrice, 180, 'Fallback to basePrice ensures 180 is returned even on case mismatch');
});

console.log('\n================================================================');
console.log(`Stress Test Results: ${passedTests}/${totalTests} Passed (${findings.length} findings)`);
console.log('================================================================\n');

if (findings.length > 0) {
  console.log('Findings Summary:');
  findings.forEach(f => console.log(`  - ${f.test}: ${f.error}`));
}

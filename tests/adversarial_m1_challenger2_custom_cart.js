/**
 * tests/adversarial_m1_challenger2_custom_cart.js
 * 
 * Milestone 1 Round 2 Challenger 2 Adversarial Stress Suite:
 * - Custom Upload Checkout & Dimensions (20x30=180, 30x40=200, 40x50=250, 50x70=300)
 * - Mixed Carts (Catalog Posters + Custom Uploads + Mixed Frames)
 * - WhatsApp Payload Fidelity & Anti-Distortion Verification (EN & AR)
 * - Property-based randomized mixed cart stress (1,000 carts)
 * - Production minified bundle parity (script.min.js)
 */

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const failures = [];

function check(title, fn) {
  totalChecks++;
  try {
    fn();
    console.log(`  ✓ ${title}`);
    passedChecks++;
  } catch (err) {
    console.error(`  ✗ ${title}`);
    console.error(`    ${err.message}`);
    failedChecks++;
    failures.push({ title, error: err.message, stack: err.stack });
  }
}

async function checkAsync(title, fn) {
  totalChecks++;
  try {
    await fn();
    console.log(`  ✓ ${title}`);
    passedChecks++;
  } catch (err) {
    console.error(`  ✗ ${title}`);
    console.error(`    ${err.message}`);
    failedChecks++;
    failures.push({ title, error: err.message, stack: err.stack });
  }
}

function createEnv(useMinified = false) {
  const makeEl = (tag = 'div') => ({
    tagName: tag.toUpperCase(),
    addEventListener: () => {},
    removeEventListener: () => {},
    classList: { add() {}, remove() {}, contains() { return false; } },
    textContent: '',
    innerHTML: '',
    value: '',
    style: {},
    setAttribute() {},
    getAttribute() { return null; },
    removeAttribute() {},
    scrollIntoView() {},
    appendChild() {},
    removeChild() {},
    remove() {},
    closest() { return null; },
    querySelector() { return makeEl(); },
    querySelectorAll() { return []; },
    getElementById: () => makeEl(),
    elements: {
      customerName: { value: 'Ahmed Ali' },
      customerPhone: { value: '01012345678' },
      customerAddress: { value: '123 Zamalek, Cairo' },
      paymentMethod: { value: 'VF-Cash' }
    },
    hidden: false,
    dataset: {}
  });

  const storage = {};
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

  const docEl = makeEl('html');
  const bodyEl = makeEl('body');
  sandbox.document = {
    documentElement: docEl,
    head: makeEl('head'),
    body: bodyEl,
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: (sel) => makeEl(),
    querySelectorAll: (sel) => [],
    getElementById: (id) => makeEl(),
    createElement: (tag) => {
      const el = makeEl(tag);
      if (tag === 'canvas') {
        el.toDataURL = () => 'data:image/webp;base64,mock';
      }
      return el;
    },
    title: ''
  };

  sandbox.indexedDB = { open: () => ({ onsuccess: null, onerror: null }) };
  sandbox.navigator = { userAgent: 'node-adversarial-challenger' };

  sandbox.initFirebase = () => {};
  sandbox.isFirebaseReady = () => false;
  sandbox.ensureFirebaseReady = async () => false;
  sandbox.getFirebaseDb = () => null;

  vm.createContext(sandbox);

  const bundleSrc = fs.readFileSync('products-bundle.js', 'utf8');
  vm.runInContext(bundleSrc, sandbox);

  const scriptFile = useMinified ? 'script.min.js' : 'script.js';
  const scriptSrc = fs.readFileSync(scriptFile, 'utf8');
  vm.runInContext(scriptSrc, sandbox);

  return {
    sandbox,
    eval: (code) => vm.runInContext(code, sandbox),
    getState: () => vm.runInContext('state', sandbox),
    getProducts: () => vm.runInContext('products', sandbox),
    storage
  };
}

async function runAdversarialSuite() {
  console.log('======================================================================');
  console.log(' CHALLENGER 2: ADVERSARIAL CUSTOM CART & CHECKOUT STRESS HARNESS');
  console.log('======================================================================\n');

  // ==========================================================================
  // SECTION 1: CUSTOM-DESIGN PRICING ACROSS ALL DIMENSIONS & FRAMES
  // ==========================================================================
  console.log('--- SECTION 1: Custom Upload Dimensions & Frame Matrix ---');

  const dimensions = [
    { size: '20x30', expectedUnit: 180 },
    { size: '30x40', expectedUnit: 200 },
    { size: '40x50', expectedUnit: 250 },
    { size: '50x70', expectedUnit: 300 }
  ];

  const customFrames = ['None', 'Black', 'White', 'Transparent'];

  for (const dim of dimensions) {
    for (const frame of customFrames) {
      check(`custom-design size ${dim.size} with frame "${frame}" evaluates to exactly ${dim.expectedUnit} EGP`, () => {
        const env = createEnv();
        const customProd = env.eval('getProduct("custom-design")');
        assert.ok(customProd, 'custom-design must be present in catalog');
        assert.strictEqual(customProd.basePrice, 180, 'custom-design basePrice must be 180');
        assert.strictEqual(customProd.sizes[dim.size], dim.expectedUnit, `sizes[${dim.size}] must be ${dim.expectedUnit}`);

        const unit = env.eval(`itemUnitPrice(getProduct("custom-design"), "${dim.size}", "${frame}")`);
        assert.strictEqual(unit, dim.expectedUnit, `itemUnitPrice for ${dim.size} + ${frame} returned ${unit}, expected ${dim.expectedUnit}`);
      });
    }
  }

  // Multi-quantity custom upload line totals
  for (const dim of dimensions) {
    for (const qty of [1, 2, 5, 10, 50]) {
      check(`custom-design line total for ${dim.size} x ${qty} units equals ${dim.expectedUnit * qty} EGP`, () => {
        const env = createEnv();
        const item = {
          productId: 'custom-design',
          size: dim.size,
          frame: 'Black',
          quantity: qty,
          upload: { name: 'art.png', size: 5000, type: 'image/png' }
        };
        const lineTotal = env.eval(`cartLineTotal(${JSON.stringify(item)})`);
        assert.strictEqual(lineTotal, dim.expectedUnit * qty,
          `Line total mismatch for ${dim.size} x ${qty}: got ${lineTotal}, expected ${dim.expectedUnit * qty}`);
      });
    }
  }

  // ==========================================================================
  // SECTION 2: CUSTOM UPLOAD CHECKOUT GUARDING & WORKFLOW
  // ==========================================================================
  console.log('\n--- SECTION 2: Custom Upload Checkout Guarding & Lifecycle ---');

  await checkAsync('addToCart blocks custom-design if state.customUpload is absent', async () => {
    const env = createEnv();
    const state = env.getState();
    state.customUpload = null;
    state.customUploadFile = null;

    await env.eval('addToCart("custom-design", "20x30", "Black")');
    assert.strictEqual(state.cart.length, 0, 'Cart must remain empty when custom upload is missing');
  });

  await checkAsync('addToCart adds custom-design when state.customUpload is present with unique keys per upload', async () => {
    const env = createEnv();
    const state = env.getState();

    // First upload
    state.customUpload = {
      name: 'family_photo.jpg',
      size: 1048576,
      type: 'image/jpeg',
      url: 'blob:http://localhost/mock1',
      dataUrl: 'data:image/jpeg;base64,mock1'
    };
    await env.eval('addToCart("custom-design", "30x40", "White")');

    assert.strictEqual(state.cart.length, 1);
    assert.strictEqual(state.cart[0].productId, 'custom-design');
    assert.strictEqual(state.cart[0].size, '30x40');
    assert.strictEqual(state.cart[0].frame, 'White');
    assert.strictEqual(state.cart[0].upload.name, 'family_photo.jpg');
    assert.strictEqual(env.eval('cartLineTotal(state.cart[0])'), 200);

    // Second upload with different image and size
    state.customUpload = {
      name: 'digital_painting.png',
      size: 2097152,
      type: 'image/png',
      url: 'blob:http://localhost/mock2',
      dataUrl: 'data:image/png;base64,mock2'
    };
    // Delay 2ms to ensure unique Date.now() timestamp in key
    await new Promise(r => setTimeout(r, 5));
    await env.eval('addToCart("custom-design", "50x70", "Black")');

    assert.strictEqual(state.cart.length, 2, 'Two separate uploads should create 2 distinct cart line items');
    assert.strictEqual(state.cart[1].size, '50x70');
    assert.strictEqual(state.cart[1].frame, 'Black');
    assert.strictEqual(env.eval('cartLineTotal(state.cart[1])'), 300);

    // Subtotal: 200 + 300 = 500, Delivery: 35, Grand Total: 535
    assert.strictEqual(env.eval('cartSubtotal()'), 500);
    assert.strictEqual(env.eval('orderDeliveryFee()'), 35);
    assert.strictEqual(env.eval('cartGrandTotal()'), 535);
  });

  check('Custom-design quantity adjustments (+ / -) recalculate exact linear totals', () => {
    const env = createEnv();
    const state = env.getState();
    state.cart = [
      {
        key: 'custom-design-40x50-None-1001',
        productId: 'custom-design',
        size: '40x50',
        frame: 'None',
        upload: { name: 'art.png', size: 100, type: 'image/png' },
        quantity: 1
      }
    ];

    // Initial 1 unit of 40x50 = 250
    assert.strictEqual(env.eval('cartLineTotal(state.cart[0])'), 250);
    assert.strictEqual(env.eval('cartSubtotal()'), 250);
    assert.strictEqual(env.eval('cartGrandTotal()'), 285);

    // Increment to 4
    env.eval('updateQuantity("custom-design-40x50-None-1001", 3)');
    assert.strictEqual(state.cart[0].quantity, 4);
    assert.strictEqual(env.eval('cartLineTotal(state.cart[0])'), 1000);
    assert.strictEqual(env.eval('cartSubtotal()'), 1000);
    assert.strictEqual(env.eval('cartGrandTotal()'), 1035);

    // Decrement by 2
    env.eval('updateQuantity("custom-design-40x50-None-1001", -2)');
    assert.strictEqual(state.cart[0].quantity, 2);
    assert.strictEqual(env.eval('cartLineTotal(state.cart[0])'), 500);
    assert.strictEqual(env.eval('cartSubtotal()'), 500);
    assert.strictEqual(env.eval('cartGrandTotal()'), 535);

    // Decrement to 0 should remove item from cart
    env.eval('updateQuantity("custom-design-40x50-None-1001", -2)');
    assert.strictEqual(state.cart.length, 0);
    assert.strictEqual(env.eval('cartSubtotal()'), 0);
    assert.strictEqual(env.eval('orderDeliveryFee()'), 0);
    assert.strictEqual(env.eval('cartGrandTotal()'), 0);
  });

  // ==========================================================================
  // SECTION 3: MIXED CARTS (CATALOG + CUSTOM UPLOADS + MIXED FRAMES)
  // ==========================================================================
  console.log('\n--- SECTION 3: Mixed Carts (Catalog Posters & Custom Uploads) ---');

  check('Mixed Cart: 5 items across all 4 tiers, all frames, catalog + custom', () => {
    const env = createEnv();
    const state = env.getState();

    // 1. Catalog item: football-001, 20x30, Black, qty 2 -> 2 * 180 = 360
    // 2. Catalog item: cars-001, 30x40, White, qty 1 -> 1 * 200 = 200
    // 3. Custom upload: custom-design, 40x50, None, qty 3 -> 3 * 250 = 750
    // 4. Custom upload: custom-design, 50x70, Black, qty 1 -> 1 * 300 = 300
    // 5. Catalog item: anime-001, 50x70, Transparent, qty 2 -> 2 * 300 = 600
    state.cart = [
      { key: 'item-1', productId: 'football-001', size: '20x30', frame: 'Black', quantity: 2 },
      { key: 'item-2', productId: 'cars-001', size: '30x40', frame: 'White', quantity: 1 },
      { key: 'item-3', productId: 'custom-design', size: '40x50', frame: 'None', quantity: 3, upload: { name: 'posterA.png' } },
      { key: 'item-4', productId: 'custom-design', size: '50x70', frame: 'Black', quantity: 1, upload: { name: 'posterB.png' } },
      { key: 'item-5', productId: 'anime-001', size: '50x70', frame: 'Transparent', quantity: 2 }
    ];

    const expectedLineTotals = [360, 200, 750, 300, 600];
    const expectedSubtotal = 360 + 200 + 750 + 300 + 600; // 2,210 EGP
    const expectedDelivery = 35; // 35 EGP
    const expectedGrandTotal = expectedSubtotal + expectedDelivery; // 2,245 EGP

    state.cart.forEach((item, idx) => {
      const lt = env.eval(`cartLineTotal(state.cart[${idx}])`);
      assert.strictEqual(lt, expectedLineTotals[idx], `Line ${idx+1} expected ${expectedLineTotals[idx]}, got ${lt}`);
    });

    const subtotal = env.eval('cartSubtotal()');
    assert.strictEqual(subtotal, expectedSubtotal, `Subtotal expected ${expectedSubtotal}, got ${subtotal}`);

    const delivery = env.eval('orderDeliveryFee()');
    assert.strictEqual(delivery, expectedDelivery, `Delivery fee expected ${expectedDelivery}, got ${delivery}`);

    const grandTotal = env.eval('cartGrandTotal()');
    assert.strictEqual(grandTotal, expectedGrandTotal, `Grand total expected ${expectedGrandTotal}, got ${grandTotal}`);

    // Create Order object verification
    state.confirmedForm = {
      customerName: 'Kareem Tarek',
      customerPhone: '01234567890',
      customerAddress: 'Nasr City, Cairo',
      paymentMethod: 'Instapay',
      orderNote: 'Handle with care'
    };

    const order = env.eval('createOrder(state.confirmedForm)');
    assert.strictEqual(order.subtotal, expectedSubtotal);
    assert.strictEqual(order.deliveryFee, expectedDelivery);
    assert.strictEqual(order.discount, 0);
    assert.strictEqual(order.total, expectedGrandTotal);
    assert.strictEqual(order.items.length, 5);
  });

  check('Mixed Cart with 10% coupon correctly computes discount and totals', () => {
    const env = createEnv();
    const state = env.getState();

    state.cart = [
      { key: 'c1', productId: 'football-001', size: '20x30', frame: 'Black', quantity: 1 }, // 180
      { key: 'u1', productId: 'custom-design', size: '50x70', frame: 'White', quantity: 1, upload: { name: 'art.jpg' } } // 300
    ];
    // Subtotal: 480
    assert.strictEqual(env.eval('cartSubtotal()'), 480);

    // Apply POSTER10
    env.eval('applyCoupon("POSTER10")');
    assert.ok(state.appliedCoupon);

    // Discount: 10% of 480 = 48
    const disc = env.eval('cartSubtotal() - getDiscountedTotal()');
    assert.strictEqual(disc, 48);

    // Discounted total: 432
    assert.strictEqual(env.eval('getDiscountedTotal()'), 432);

    // Grand total: 432 + 35 = 467
    assert.strictEqual(env.eval('cartGrandTotal()'), 467);

    const order = env.eval('createOrder({ customerName: "Test", customerPhone: "010", customerAddress: "Cairo", paymentMethod: "VF-Cash" })');
    assert.strictEqual(order.subtotal, 480);
    assert.strictEqual(order.discount, 48);
    assert.strictEqual(order.deliveryFee, 35);
    assert.strictEqual(order.total, 467);
  });

  // ==========================================================================
  // SECTION 4: WHATSAPP PAYLOAD GENERATION & FIDELITY AUDIT
  // ==========================================================================
  console.log('\n--- SECTION 4: WhatsApp Payload Generation & Fidelity Audit ---');

  check('WhatsApp message in English contains exact tier amounts, custom file info, and no price distortion', () => {
    const env = createEnv();
    const state = env.getState();
    state.lang = 'en';

    state.cart = [
      { key: 'm1', productId: 'football-001', size: '20x30', frame: 'Black', quantity: 2 }, // 360
      { key: 'm2', productId: 'custom-design', size: '30x40', frame: 'White', quantity: 1, upload: { name: 'my_logo.png' } }, // 200
      { key: 'm3', productId: 'cars-001', size: '40x50', frame: 'Transparent', quantity: 1 }, // 250
      { key: 'm4', productId: 'custom-design', size: '50x70', frame: 'None', quantity: 1, upload: { name: 'wedding.png' } } // 300
    ];
    // Subtotal: 360 + 200 + 250 + 300 = 1,110 EGP
    // Delivery: 35 EGP
    // Total: 1,145 EGP

    const order = env.eval(`
      state.confirmedForm = {
        customerName: "Omar Sherif",
        customerPhone: "01122334455",
        customerAddress: "Maadi, Degla St 200",
        paymentMethod: "VF-Cash",
        orderNote: "Call before arrival"
      };
      createOrder(state.confirmedForm);
    `);

    const waMsg = env.eval('buildWhatsAppMessage(window.testOrder || createOrder(state.confirmedForm))');

    // 1. Verify Header & Customer Info
    assert.ok(waMsg.includes('*New Order - Poster Lab Store*'), 'English header missing');
    assert.ok(waMsg.includes('*Customer Name:* Omar Sherif'), 'Customer name missing');
    assert.ok(waMsg.includes('*Phone:* 01122334455'), 'Phone missing');
    assert.ok(waMsg.includes('*Address:* Maadi, Degla St 200'), 'Address missing');
    assert.ok(waMsg.includes('VF-Cash - 01090927525'), 'Payment details missing');
    assert.ok(waMsg.includes('*Notes:* Call before arrival'), 'Order note missing');

    // 2. Verify Product entries & Uploaded files
    assert.ok(waMsg.includes('*Product 1:*'), 'Product 1 missing');
    assert.ok(waMsg.includes('20x30 cm | Black frame'), 'Product 1 customization missing');

    assert.ok(waMsg.includes('*Product 2:* Upload Your Custom Design'), 'Product 2 name missing');
    assert.ok(waMsg.includes('30x40 cm | White frame'), 'Product 2 customization missing');
    assert.ok(waMsg.includes('Uploaded File: my_logo.png'), 'Uploaded file 1 name missing');

    assert.ok(waMsg.includes('*Product 3:*'), 'Product 3 missing');
    assert.ok(waMsg.includes('40x50 cm | Frameless'), 'Product 3 customization missing');

    assert.ok(waMsg.includes('*Product 4:* Upload Your Custom Design'), 'Product 4 name missing');
    assert.ok(waMsg.includes('50x70 cm | Frameless'), 'Product 4 customization missing');
    assert.ok(waMsg.includes('Uploaded File: wedding.png'), 'Uploaded file 2 name missing');

    // 3. Verify Financial lines
    const money1110 = env.eval('money(1110)');
    const money35 = env.eval('money(35)');
    const money1145 = env.eval('money(1145)');

    assert.ok(waMsg.includes(`*Subtotal:* ${money1110}`), `Subtotal string mismatch, expected ${money1110}`);
    assert.ok(waMsg.includes(`*Delivery:* ${money35}`), `Delivery string mismatch, expected ${money35}`);
    assert.ok(waMsg.includes(`*Total Price:* ${money1145}`), `Total price string mismatch, expected ${money1145}`);

    // 4. Adversarial check: No legacy prices (60, 80, 120) anywhere in financial lines
    const financialSection = waMsg.slice(waMsg.indexOf('*Subtotal:*'));
    assert.ok(!financialSection.includes('60'), 'Financial section must not contain legacy 60');
    assert.ok(!financialSection.includes('80'), 'Financial section must not contain legacy 80');
    assert.ok(!financialSection.includes('120'), 'Financial section must not contain legacy 120');
  });

  check('WhatsApp message in Arabic contains exact Arabic labels and matching prices', () => {
    const env = createEnv();
    const state = env.getState();
    state.lang = 'ar';

    state.cart = [
      { key: 'ar1', productId: 'custom-design', size: '20x30', frame: 'Black', quantity: 1, upload: { name: 'tasmeem.png' } }, // 180
      { key: 'ar2', productId: 'football-001', size: '30x40', frame: 'White', quantity: 1 } // 200
    ];
    // Subtotal: 380, Delivery: 35, Total: 415

    state.confirmedForm = {
      customerName: 'محمود حسن',
      customerPhone: '01099887766',
      customerAddress: 'الإسكندرية، سموحة',
      paymentMethod: 'Instapay',
      orderNote: 'توصيل صباحاً'
    };

    const waMsg = env.eval('buildWhatsAppMessage(createOrder(state.confirmedForm))');

    assert.ok(waMsg.includes('*طلب جديد من متجر بوستر لاب*'), 'Arabic title missing');
    assert.ok(waMsg.includes('*اسم العميل:* محمود حسن'), 'Arabic customer name missing');
    assert.ok(waMsg.includes('*رقم الهاتف:* 01099887766'), 'Arabic phone missing');
    assert.ok(waMsg.includes('*العنوان:* الإسكندرية، سموحة'), 'Arabic address missing');
    assert.ok(waMsg.includes('Instapay - qnbziad49015@instapay'), 'Instapay address missing');
    assert.ok(waMsg.includes('*ملاحظات:* توصيل صباحاً'), 'Arabic note missing');
    assert.ok(waMsg.includes('الملف المرفوع: tasmeem.png'), 'Arabic upload file name missing');

    const money380 = env.eval('money(380)');
    const money35 = env.eval('money(35)');
    const money415 = env.eval('money(415)');

    assert.ok(waMsg.includes(`*المجموع الفرعي:* ${money380}`), `Arabic subtotal mismatch: ${waMsg}`);
    assert.ok(waMsg.includes(`*التوصيل:* ${money35}`), `Arabic delivery mismatch: ${waMsg}`);
    assert.ok(waMsg.includes(`*السعر الإجمالي:* ${money415}`), `Arabic total mismatch: ${waMsg}`);
  });

  // ==========================================================================
  // SECTION 5: PROPERTY-BASED RANDOM MIXED CART STRESS (1,000 CARTS)
  // ==========================================================================
  console.log('\n--- SECTION 5: Property-Based Random Mixed Cart Stress (1,000 Carts) ---');

  check('1,000 Randomized Mixed Carts satisfy exact pricing invariants and WhatsApp match', () => {
    const env = createEnv();
    const state = env.getState();
    const catalog = env.getProducts().filter(p => !p.isCustom);
    const sizeMap = {
      '20x30': 180,
      '30x40': 200,
      '40x50': 250,
      '50x70': 300
    };
    const sizes = ['20x30', '30x40', '40x50', '50x70'];
    const frames = ['Black', 'White', 'Transparent', 'None'];

    state.confirmedForm = {
      customerName: 'Random Shopper',
      customerPhone: '01000000000',
      customerAddress: 'Random Street, Cairo',
      paymentMethod: 'VF-Cash'
    };

    for (let iteration = 0; iteration < 1000; iteration++) {
      // Pick random number of items between 1 and 8
      const itemCount = (iteration % 8) + 1;
      const cart = [];
      let expectedSubtotal = 0;

      for (let j = 0; j < itemCount; j++) {
        const isCustom = ((iteration * 7 + j) % 3 === 0); // ~33% custom items
        const size = sizes[(iteration + j) % sizes.length];
        const frame = frames[(iteration * 3 + j) % frames.length];
        const qty = ((iteration + j) % 5) + 1; // 1 to 5
        const unitPrice = sizeMap[size];

        if (isCustom) {
          cart.push({
            key: `custom-${iteration}-${j}`,
            productId: 'custom-design',
            size: size,
            frame: frame,
            quantity: qty,
            upload: { name: `file_${iteration}_${j}.png` }
          });
        } else {
          const prod = catalog[(iteration * 17 + j) % catalog.length];
          cart.push({
            key: `${prod.id}-${size}-${frame}`,
            productId: prod.id,
            size: size,
            frame: frame,
            quantity: qty
          });
        }

        expectedSubtotal += unitPrice * qty;
      }

      state.cart = cart;

      // Invariant 1: cartSubtotal() must equal exact arithmetic sum
      const actualSubtotal = env.eval('cartSubtotal()');
      assert.strictEqual(actualSubtotal, expectedSubtotal,
        `Iter ${iteration}: Subtotal mismatch: actual ${actualSubtotal}, expected ${expectedSubtotal}`);

      // Invariant 2: orderDeliveryFee() must be 35
      const actualDelivery = env.eval('orderDeliveryFee()');
      assert.strictEqual(actualDelivery, 35,
        `Iter ${iteration}: Delivery fee mismatch: actual ${actualDelivery}, expected 35`);

      // Invariant 3: cartGrandTotal() must be subtotal + 35
      const actualGrandTotal = env.eval('cartGrandTotal()');
      assert.strictEqual(actualGrandTotal, expectedSubtotal + 35,
        `Iter ${iteration}: Grand total mismatch: actual ${actualGrandTotal}, expected ${expectedSubtotal + 35}`);

      // Invariant 4: WhatsApp message contains the exact money formatted grand total
      if (iteration % 50 === 0) {
        const order = env.eval('createOrder(state.confirmedForm)');
        const waMsg = env.eval('buildWhatsAppMessage(window.lastOrder || createOrder(state.confirmedForm))');
        const expectedTotalStr = env.eval(`money(${expectedSubtotal + 35})`);
        assert.ok(waMsg.includes(expectedTotalStr),
          `Iter ${iteration}: WhatsApp message missing expected total ${expectedTotalStr}`);
      }
    }
  });

  // ==========================================================================
  // SECTION 6: PRODUCTION MINIFIED ASSET PARITY (script.min.js)
  // ==========================================================================
  console.log('\n--- SECTION 6: Production Minified Asset Parity (script.min.js) ---');

  check('script.min.js executes custom upload cart, line total, and grand total identically', () => {
    const minEnv = createEnv(true); // Load script.min.js!
    const minState = minEnv.getState();

    // Verify custom-design product definition in minified runtime
    const customProd = minEnv.eval('getProduct("custom-design")');
    assert.ok(customProd, 'custom-design must be retrievable in minified bundle');
    assert.strictEqual(customProd.basePrice, 180);
    assert.deepStrictEqual(JSON.parse(JSON.stringify(customProd.sizes)), { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 });

    // Verify itemUnitPrice across all sizes in minified runtime
    assert.strictEqual(minEnv.eval('itemUnitPrice(getProduct("custom-design"), "20x30", "Black")'), 180);
    assert.strictEqual(minEnv.eval('itemUnitPrice(getProduct("custom-design"), "30x40", "White")'), 200);
    assert.strictEqual(minEnv.eval('itemUnitPrice(getProduct("custom-design"), "40x50", "Transparent")'), 250);
    assert.strictEqual(minEnv.eval('itemUnitPrice(getProduct("custom-design"), "50x70", "None")'), 300);

    // Verify mixed cart execution in minified runtime
    minState.cart = [
      { key: 'min-1', productId: 'football-001', size: '20x30', frame: 'Black', quantity: 1 },
      { key: 'min-2', productId: 'custom-design', size: '40x50', frame: 'White', quantity: 2, upload: { name: 'art.png' } }
    ];
    // Expected: 180 + (2 * 250) = 680 EGP subtotal, 35 delivery, 715 grand total
    assert.strictEqual(minEnv.eval('cartSubtotal()'), 680);
    assert.strictEqual(minEnv.eval('orderDeliveryFee()'), 35);
    assert.strictEqual(minEnv.eval('cartGrandTotal()'), 715);

    // Verify WhatsApp generation in minified runtime
    minState.confirmedForm = {
      customerName: 'Minified User',
      customerPhone: '01011112222',
      customerAddress: 'Alexandria',
      paymentMethod: 'VF-Cash'
    };
    const minOrder = minEnv.eval('window.minOrder = createOrder(state.confirmedForm); window.minOrder');
    assert.strictEqual(minOrder.total, 715);

    const minWa = minEnv.eval('buildWhatsAppMessage(window.minOrder)');
    assert.ok(minWa.includes(minEnv.eval('money(680)')));
    assert.ok(minWa.includes(minEnv.eval('money(35)')));
    assert.ok(minWa.includes(minEnv.eval('money(715)')));
  });

  // ==========================================================================
  // SUMMARY & VERDICT
  // ==========================================================================
  console.log('\n======================================================================');
  console.log(` RESULTS: ${passedChecks}/${totalChecks} Checks Passed (${failedChecks} Failures)`);
  console.log('======================================================================');

  if (failedChecks > 0) {
    console.error('\nFAILURES DETECTED:');
    failures.forEach((f, i) => {
      console.error(`\n[${i+1}] ${f.title}`);
      console.error(`    ${f.error}`);
    });
    console.log('\nVERDICT: REJECT');
    process.exit(1);
  } else {
    console.log('\nVERDICT: APPROVE');
    console.log('Empirical verification confirms custom upload checkout, bulk ordering, mixed cart math, and WhatsApp payload fidelity strictly conform to Milestone 1 specifications.');
    process.exit(0);
  }
}

runAdversarialSuite();

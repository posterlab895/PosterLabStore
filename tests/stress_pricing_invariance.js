/**
 * tests/stress_pricing_invariance.js
 * 
 * Empirical Adversarial Challenger Test Suite for Milestone 1:
 * Product Pricing Structure & Data Consistency
 * 
 * Tests:
 * 1. Catalog Integrity & Exhaustive Price Invariance across all 1,019 products
 * 2. Combinatorial Evaluation (1,019 products x 4 sizes x 16 frame variants = 65,216 checks)
 * 3. Runtime Storefront Product Resolution (getMergedProducts & getProduct)
 * 4. Listing Card Price Fallback Formula Invariance
 * 5. Adversarial Boundary & Defensive Fallback Testing
 * 6. Property-Based Fuzzing / Random Sampling of Cart Mathematics (10,000 randomized carts)
 * 7. Legacy Price Extinction Scan across all production code & templates
 * 8. Cloud Firestore Remote Pricing Verification
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const vm = require('vm');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;
const failureDetails = [];

function check(desc, condition, details = '') {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
  } else {
    failedAssertions++;
    const msg = `FAIL: ${desc} ${details ? '(' + details + ')' : ''}`;
    failureDetails.push(msg);
    console.error(`  ✖ ${msg}`);
  }
}

console.log('======================================================================');
console.log('   EMPIRICAL ADVERSARIAL STRESS TEST: PRICING INVARIANCE (M1)');
console.log('======================================================================\n');

// -----------------------------------------------------------------------------
// SECTION 1: Catalog Integrity & Exhaustive Data Structure Verification
// -----------------------------------------------------------------------------
console.log('[SECTION 1] Catalog Integrity: Inspecting all 1,019 products in bundle & files');

// Load products-bundle.js
const bundlePath = path.join(ROOT_DIR, 'products-bundle.js');
const bundleCode = fs.readFileSync(bundlePath, 'utf8');
const bundleSandbox = { window: {}, globalThis: {} };
vm.runInNewContext(bundleCode, bundleSandbox);
const products = bundleSandbox.window.products || bundleSandbox.globalThis.products;

check('Bundle loads a valid array of products', Array.isArray(products));
check('Total products in catalog is exactly 1,019', products.length === 1019, `Got ${products.length}`);

const REQUIRED_TIERS = {
  "20x30": 180,
  "30x40": 200,
  "40x50": 250,
  "50x70": 300
};

const LEGACY_PRICES = [60, 80, 100, 120, 370, 420];

let catalogLegacyPriceViolations = 0;
let basePriceMismatchCount = 0;
let sizeTierMismatchCount = 0;
const checkedIds = new Set();
let duplicateIdCount = 0;

for (const p of products) {
  if (checkedIds.has(p.id)) {
    duplicateIdCount++;
  }
  checkedIds.add(p.id);

  if (p.basePrice !== 180) {
    basePriceMismatchCount++;
  }

  if (!p.sizes) {
    sizeTierMismatchCount++;
    continue;
  }

  for (const [tier, expectedPrice] of Object.entries(REQUIRED_TIERS)) {
    if (p.sizes[tier] !== expectedPrice) {
      sizeTierMismatchCount++;
    }
    if (LEGACY_PRICES.includes(p.sizes[tier])) {
      catalogLegacyPriceViolations++;
    }
  }

  if (LEGACY_PRICES.includes(p.basePrice)) {
    catalogLegacyPriceViolations++;
  }
}

check('Zero duplicate product IDs across all 1,019 products', duplicateIdCount === 0, `Duplicates: ${duplicateIdCount}`);
check('All 1,019 products in bundle have basePrice === 180', basePriceMismatchCount === 0, `Mismatches: ${basePriceMismatchCount}`);
check('All 1,019 products in bundle have exact sizes { 20x30:180, 30x40:200, 40x50:250, 50x70:300 }', sizeTierMismatchCount === 0, `Mismatches: ${sizeTierMismatchCount}`);
check('Zero legacy prices (60, 80, 100, 120, 370, 420) in bundle product data', catalogLegacyPriceViolations === 0, `Violations: ${catalogLegacyPriceViolations}`);

// -----------------------------------------------------------------------------
// SECTION 2: Exhaustive Combinatorial Evaluation (itemUnitPrice & script.js)
// -----------------------------------------------------------------------------
console.log('\n[SECTION 2] Exhaustive Combinatorial Evaluation of itemUnitPrice');

// Extract frameOptions and itemUnitPrice from script.js
const scriptCode = fs.readFileSync(path.join(ROOT_DIR, 'script.js'), 'utf8');

// Isolate frameOptions
const frameOptMatch = scriptCode.match(/const frameOptions\s*=\s*(\{[\s\S]*?\n\};)/);
check('frameOptions object found in script.js', !!frameOptMatch);
const frameOptions = vm.runInNewContext('(' + frameOptMatch[1].replace(/;\s*$/, '') + ')', {});

check('frameOptions.Black price is 0 EGP', frameOptions.Black?.price === 0);
check('frameOptions.White price is 0 EGP', frameOptions.White?.price === 0);
check('frameOptions.Transparent price is 0 EGP', frameOptions.Transparent?.price === 0);
check('frameOptions.None price is 0 EGP', frameOptions.None?.price === 0);

// Extract itemUnitPrice function
const fnMatch = scriptCode.match(/function itemUnitPrice\(product,\s*size,\s*frame\)\s*\{([\s\S]*?)\n\}/);
check('itemUnitPrice function definition found in script.js', !!fnMatch);
const itemUnitPrice = new Function('product', 'size', 'frame', 'frameOptions', fnMatch[1]);

// Test dimensions and adversarial frame inputs
const testDimensions = ["20x30", "30x40", "40x50", "50x70"];
const standardFrames = ["Black", "White", "Transparent", "None"];
const adversarialFrames = [
  "",
  null,
  undefined,
  "Gold",
  "Oak Wood",
  123,
  "NaN",
  true,
  false,
  {},
  "__proto__",
  "<script>alert(1)</script>"
];
const allFrames = [...standardFrames, ...adversarialFrames];

let totalCombinationsTested = 0;
let pricingInvariantViolations = 0;
let legacyPriceEvaluations = 0;
let uncaughtExceptions = 0;

for (const p of products) {
  for (const dim of testDimensions) {
    const expected = REQUIRED_TIERS[dim];
    for (const f of allFrames) {
      totalCombinationsTested++;
      try {
        const calculated = itemUnitPrice(p, dim, f, frameOptions);
        if (calculated !== expected) {
          pricingInvariantViolations++;
        }
        if (LEGACY_PRICES.includes(calculated)) {
          legacyPriceEvaluations++;
        }
      } catch (err) {
        uncaughtExceptions++;
      }
    }
  }
}

check(`Tested ${totalCombinationsTested} product/size/frame combinations`, totalCombinationsTested === 1019 * 4 * 16);
check('Zero invariant violations across all 65,216 combinations', pricingInvariantViolations === 0, `Violations: ${pricingInvariantViolations}`);
check('Zero combinations ever evaluated to legacy prices (60, 80, 370, 420)', legacyPriceEvaluations === 0, `Legacy hits: ${legacyPriceEvaluations}`);
check('Zero uncaught exceptions when evaluating adversarial frames', uncaughtExceptions === 0, `Exceptions: ${uncaughtExceptions}`);

// -----------------------------------------------------------------------------
// SECTION 3: Storefront Runtime Product Resolution (getMergedProducts & getProduct)
// -----------------------------------------------------------------------------
console.log('\n[SECTION 3] Storefront Runtime Product Resolution (getMergedProducts in script.js)');

const pBlockMatch = scriptCode.match(/const products\s*=\s*\[[\s\S]*?\n\];/);
const getMergedMatch = scriptCode.match(/function getMergedProducts\(\)\s*\{[\s\S]*?\n\}/);

check('script.js declares fallback products array', !!pBlockMatch);
check('script.js declares getMergedProducts function', !!getMergedMatch);

let runtimeCustomDesign = null;
if (pBlockMatch && getMergedMatch) {
  const runtimeCtx = {
    LOCAL_STORAGE_PRODUCTS_KEY: 'pls-products',
    lsGet: () => []
  };
  try {
    vm.runInNewContext(pBlockMatch[0] + '\n' + getMergedMatch[0] + '\nvar res = getMergedProducts();', runtimeCtx);
    runtimeCustomDesign = runtimeCtx.res?.find(p => p.id === 'custom-design');
  } catch (e) {
    console.error('Error evaluating runtime getMergedProducts:', e.message);
  }
}

check('Runtime getMergedProducts resolves custom-design product', !!runtimeCustomDesign);
if (runtimeCustomDesign) {
  check('Runtime custom-design basePrice is 180 EGP (not legacy 60 EGP)', runtimeCustomDesign.basePrice === 180, `Actual basePrice: ${runtimeCustomDesign.basePrice}`);
  check('Runtime custom-design 20x30 size is 180 EGP (not legacy 60 EGP)', runtimeCustomDesign.sizes?.['20x30'] === 180, `Actual 20x30: ${runtimeCustomDesign.sizes?.['20x30']}`);
  check('Runtime custom-design 30x40 size is 200 EGP (not legacy 80 EGP)', runtimeCustomDesign.sizes?.['30x40'] === 200, `Actual 30x40: ${runtimeCustomDesign.sizes?.['30x40']}`);
  check('Runtime custom-design 40x50 size is 250 EGP', runtimeCustomDesign.sizes?.['40x50'] === 250, `Actual 40x50: ${runtimeCustomDesign.sizes?.['40x50']}`);
  check('Runtime custom-design 50x70 size is 300 EGP', runtimeCustomDesign.sizes?.['50x70'] === 300, `Actual 50x70: ${runtimeCustomDesign.sizes?.['50x70']}`);
  
  // Test unit price calculation on the runtime custom-design product!
  const price20x30 = itemUnitPrice(runtimeCustomDesign, '20x30', 'Black', frameOptions);
  const price30x40 = itemUnitPrice(runtimeCustomDesign, '30x40', 'Black', frameOptions);
  check('itemUnitPrice for runtime custom-design 20x30 evaluates to 180 EGP', price20x30 === 180, `Evaluated to: ${price20x30}`);
  check('itemUnitPrice for runtime custom-design 30x40 evaluates to 200 EGP', price30x40 === 200, `Evaluated to: ${price30x40}`);
}

// -----------------------------------------------------------------------------
// SECTION 4: Listing Card Price Fallback Formula Verification
// -----------------------------------------------------------------------------
console.log('\n[SECTION 4] Listing Card Price Fallback Formula Invariance');

// The listing card price snippet in script.js:
// product.sizes?.["20x30"] || product.basePrice || 180
let cardListingPriceMismatches = 0;
let cardListingLegacyHits = 0;

for (const p of products) {
  const cardPrice = p.sizes?.["20x30"] || p.basePrice || 180;
  if (cardPrice !== 180) {
    cardListingPriceMismatches++;
  }
  if (LEGACY_PRICES.includes(cardPrice)) {
    cardListingLegacyHits++;
  }
}

check('All 1,019 products evaluate to exactly 180 EGP on catalog listing cards', cardListingPriceMismatches === 0, `Mismatches: ${cardListingPriceMismatches}`);
check('No catalog listing card evaluates to a legacy price', cardListingLegacyHits === 0, `Hits: ${cardListingLegacyHits}`);

// -----------------------------------------------------------------------------
// SECTION 5: Adversarial Boundary & Malformed Input Robustness
// -----------------------------------------------------------------------------
console.log('\n[SECTION 5] Adversarial Boundary & Defensive Fallback Testing');

// Edge cases for itemUnitPrice
check('Null product returns safe default 180 EGP', itemUnitPrice(null, "20x30", "Black", frameOptions) === 180);
check('Undefined product returns safe default 180 EGP', itemUnitPrice(undefined, "30x40", "White", frameOptions) === 180);
check('Product with empty object returns safe default 180 EGP', itemUnitPrice({}, "40x50", "Transparent", frameOptions) === 180);
check('Product with sizes=null falls back to basePrice or 180', itemUnitPrice({ basePrice: 180, sizes: null }, "20x30", "Black", frameOptions) === 180);
check('Product with sizes={} falls back to basePrice or 180', itemUnitPrice({ basePrice: 180, sizes: {} }, "20x30", "Black", frameOptions) === 180);
check('Missing requested size falls back to 20x30 price', itemUnitPrice({ sizes: { "20x30": 180 } }, "unknown_size", "Black", frameOptions) === 180);
check('Unknown size with missing 20x30 falls back to basePrice', itemUnitPrice({ basePrice: 200, sizes: {} }, "unknown_size", "Black", frameOptions) === 200);

// Frame option lookup safety
check('Unexpected frame string does not throw and has 0 surcharge', itemUnitPrice(products[0], "20x30", "ExoticWood", frameOptions) === 180);
check('Numeric frame does not throw and has 0 surcharge', itemUnitPrice(products[0], "30x40", 999, frameOptions) === 200);
check('Object as frame does not throw and has 0 surcharge', itemUnitPrice(products[0], "40x50", {}, frameOptions) === 250);
check('Empty frame string has 0 surcharge', itemUnitPrice(products[0], "50x70", "", frameOptions) === 300);

// -----------------------------------------------------------------------------
// SECTION 6: Property-Based Fuzzing of Cart Calculations (10,000 Random Carts)
// -----------------------------------------------------------------------------
console.log('\n[SECTION 6] Property-Based Random Sampling (10,000 Randomized Carts)');

let seed = 0x12345678;
function rng() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}

function randInt(min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randChoice(arr) {
  return arr[randInt(0, arr.length - 1)];
}

const DELIVERY_FEE = 35;

function simulateCartCalculation(cartItems, coupon) {
  let subtotal = 0;
  for (const item of cartItems) {
    const unitPrice = itemUnitPrice(item.product, item.size, item.frame, frameOptions);
    subtotal += unitPrice * item.quantity;
  }

  const deliveryFee = cartItems.length ? DELIVERY_FEE : 0;

  let discount = 0;
  if (coupon) {
    if (coupon.type === 'percent') {
      discount = subtotal * (coupon.value / 100);
    } else if (coupon.type === 'fixed') {
      discount = coupon.value;
    }
    // Application rule from script.js line 1759:
    if (discount > subtotal) discount = subtotal;
    if (discount < 0) discount = 0;
  }

  const discountedSubtotal = subtotal - discount;
  const grandTotal = discountedSubtotal + deliveryFee;

  return {
    subtotal,
    deliveryFee,
    discount,
    discountedSubtotal,
    grandTotal
  };
}

let fuzzViolations = 0;
let fuzzNanCount = 0;
let fuzzNegativeTotalCount = 0;
let fuzzDeliveryMismatchCount = 0;
let fuzzSubtotalBoundCount = 0;

const NUM_FUZZ_CARTS = 10000;

for (let i = 0; i < NUM_FUZZ_CARTS; i++) {
  const numItems = randInt(1, 15);
  const cartItems = [];
  let totalUnits = 0;

  for (let j = 0; j < numItems; j++) {
    const prod = randChoice(products);
    const size = randChoice(testDimensions);
    const frame = randChoice(allFrames);
    const quantity = randInt(1, 20);
    totalUnits += quantity;
    cartItems.push({ product: prod, size, frame, quantity });
  }

  const couponMode = randInt(0, 4);
  let coupon = null;
  if (couponMode === 1) {
    coupon = { type: 'percent', value: randInt(5, 50) };
  } else if (couponMode === 2) {
    coupon = { type: 'percent', value: randChoice([0, 100, 150]) }; // boundary
  } else if (couponMode === 3) {
    coupon = { type: 'fixed', value: randInt(20, 500) };
  } else if (couponMode === 4) {
    coupon = { type: 'fixed', value: randChoice([0, 5000, 99999]) }; // large fixed
  }

  const res = simulateCartCalculation(cartItems, coupon);

  // Property 1: No NaN or Infinity
  if (!Number.isFinite(res.subtotal) || !Number.isFinite(res.grandTotal) || !Number.isFinite(res.discount)) {
    fuzzNanCount++;
    fuzzViolations++;
  }

  // Property 2: Subtotal lower bound = 180 * units, upper bound = 300 * units
  if (res.subtotal < 180 * totalUnits || res.subtotal > 300 * totalUnits) {
    fuzzSubtotalBoundCount++;
    fuzzViolations++;
  }

  // Property 3: Delivery fee is strictly 35 EGP for non-empty carts
  if (res.deliveryFee !== DELIVERY_FEE) {
    fuzzDeliveryMismatchCount++;
    fuzzViolations++;
  }

  // Property 4: Discount is clamped: 0 <= discount <= subtotal
  if (res.discount < 0 || res.discount > res.subtotal) {
    fuzzViolations++;
  }

  // Property 5: Discounted subtotal and grand total are strictly non-negative
  if (res.discountedSubtotal < 0 || res.grandTotal < DELIVERY_FEE) {
    fuzzNegativeTotalCount++;
    fuzzViolations++;
  }

  // Property 6: Grand total arithmetic identity
  if (Math.abs(res.grandTotal - (res.discountedSubtotal + res.deliveryFee)) > 1e-9) {
    fuzzViolations++;
  }
}

check(`Tested ${NUM_FUZZ_CARTS} property-based random cart configurations`, true);
check('Zero NaN or non-finite arithmetic values in cart math', fuzzNanCount === 0);
check('Subtotal strictly bounded within [180 * Q, 300 * Q]', fuzzSubtotalBoundCount === 0);
check('Delivery fee strictly 35 EGP across all non-empty carts', fuzzDeliveryMismatchCount === 0);
check('Zero negative discounted subtotals or grand totals', fuzzNegativeTotalCount === 0);
check('Zero arithmetic or property violations across 10,000 cart fuzz runs', fuzzViolations === 0, `Violations: ${fuzzViolations}`);

// -----------------------------------------------------------------------------
// SECTION 7: Legacy String Extinction Scan in Production Code
// -----------------------------------------------------------------------------
console.log('\n[SECTION 7] Legacy String Extinction Scan in Active Storefront Files');

const filesToScan = [
  'script.js',
  'script.min.js',
  'admin-panel.js',
  'admin-panel.min.js',
  'admin/panel.html',
  'admin/index.html',
  'index.html',
  'product.html',
  'our-work.html',
  'faq.html',
  'build-products.js',
  'products-bundle.js',
  'products-bundle.min.js',
  'admin/products-bundle.js',
  'admin/products-bundle.min.js'
];

// Add all 18 category files
const catFiles = fs.readdirSync(ROOT_DIR).filter(f => f.endsWith('-products.js') && f !== 'build-products.js' && f !== 'products-bundle.js');
filesToScan.push(...catFiles);

const legacyPatterns = [
  { name: 'basePrice 60', regex: /(["']?basePrice["']?)\s*:\s*60\b/ },
  { name: '20x30 at 60', regex: /['"]20x30['"]\s*:\s*60\b/ },
  { name: '30x40 at 80', regex: /['"]30x40['"]\s*:\s*80\b/ },
  { name: 'frameOptions Black 120 surcharge', regex: /Black\s*:\s*\{[^}]*price\s*:\s*120/ },
  { name: 'frameOptions White 120 surcharge', regex: /White\s*:\s*\{[^}]*price\s*:\s*120/ },
  { name: 'Legacy listing +120 adder', regex: /product\.sizes\["20x30"\]\s*\|\|\s*60\)\s*\+\s*\(frameOptions\.Black\?\.price\s*\|\|\s*120\)/ },
  { name: 'Legacy admin sizes placeholder 60/80', regex: /placeholder="20x30=60,\s*30x40=80/ },
  { name: 'Legacy FAQ frame adder string (120)', regex: /Frames add EGP 120/i }
];

let extinctionViolations = 0;

for (const rel of filesToScan) {
  const full = path.join(ROOT_DIR, rel);
  if (!fs.existsSync(full)) {
    check(`Scanned file exists: ${rel}`, false, 'File missing');
    continue;
  }
  const content = fs.readFileSync(full, 'utf8');
  for (const lp of legacyPatterns) {
    if (lp.regex.test(content)) {
      extinctionViolations++;
      check(`Extinction check: ${rel} contains NO ${lp.name}`, false, `Found pattern ${lp.regex}`);
    }
  }
}

check(`Scanned ${filesToScan.length} production files for legacy pricing patterns`, true);
check('Zero legacy pricing patterns found in any production file', extinctionViolations === 0, `Violations: ${extinctionViolations}`);

// -----------------------------------------------------------------------------
// SECTION 8: Remote Cloud Firestore Verification
// -----------------------------------------------------------------------------
console.log('\n[SECTION 8] Remote Cloud Firestore Product Document Verification');

async function verifyFirestoreRemote() {
  return new Promise((resolve) => {
    const url = 'https://firestore.googleapis.com/v1/projects/poster-labstore/databases/(default)/documents/products/football-001';
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const doc = JSON.parse(data);
          if (!doc.fields) {
            check('Firestore football-001 document has fields', false, `Response: ${data.slice(0, 100)}`);
            return resolve();
          }
          const basePrice = doc.fields.basePrice?.integerValue;
          const sizes = doc.fields.sizes?.mapValue?.fields;
          
          check('Firestore football-001 basePrice is 180', basePrice === '180', `Got ${basePrice}`);
          check('Firestore football-001 20x30 is 180', sizes?.['20x30']?.integerValue === '180');
          check('Firestore football-001 30x40 is 200', sizes?.['30x40']?.integerValue === '200');
          check('Firestore football-001 40x50 is 250', sizes?.['40x50']?.integerValue === '250');
          check('Firestore football-001 50x70 is 300', sizes?.['50x70']?.integerValue === '300');
        } catch (e) {
          check('Parse Firestore response', false, e.message);
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      check('Fetch Firestore document via REST', false, err.message);
      resolve();
    });

    req.setTimeout(8000, () => {
      req.destroy(new Error('Firestore REST request timed out'));
    });
  });
}

// -----------------------------------------------------------------------------
// Summary & Verdict
// -----------------------------------------------------------------------------
async function main() {
  await verifyFirestoreRemote();

  console.log('\n' + '='.repeat(70));
  console.log('   EMPIRICAL STRESS TEST SUITE EXECUTION SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Assertions Checked : ${totalAssertions}`);
  console.log(`Passed Assertions        : ${passedAssertions}`);
  console.log(`Failed Assertions        : ${failedAssertions}`);
  console.log('='.repeat(70));

  if (failureDetails.length > 0) {
    console.error('\nFAILURE BREAKDOWN:');
    failureDetails.forEach(f => console.error(f));
    console.error('\nVERDICT: REJECT');
    process.exit(1);
  } else {
    console.log('\nVERDICT: APPROVE');
    console.log('Milestone 1 Pricing Structure & Data Consistency is empirically verified.');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});

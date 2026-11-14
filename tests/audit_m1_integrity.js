/**
 * tests/audit_m1_integrity.js
 * Independent Forensic Audit Test Suite for Milestone 1
 * Poster Lab Store — Product Pricing Structure & Data Consistency
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const https = require('https');
const { execSync } = require('child_process');

const results = {
  passed: [],
  failed: [],
  observations: []
};

function logObservation(phase, description, details) {
  results.observations.push({ phase, description, details });
  console.log(`[OBSERVATION] [${phase}] ${description}`);
  if (details) console.log(`              ${details}`);
}

function assertAudit(phase, checkName, condition, failDetails) {
  if (condition) {
    results.passed.push({ phase, checkName });
    console.log(`  [PASS] [${phase}] ${checkName}`);
  } else {
    results.failed.push({ phase, checkName, failDetails });
    console.error(`  [FAIL] [${phase}] ${checkName}: ${failDetails}`);
  }
}

async function runForensicAudit() {
  console.log('===============================================================');
  console.log(' FORENSIC INTEGRITY AUDIT — MILESTONE 1');
  console.log('===============================================================\n');

  // -------------------------------------------------------------
  // PHASE 1: Source Code Analysis — 18 Product Category Files
  // -------------------------------------------------------------
  console.log('--- Phase 1.1: 18 Category Product Files ---');
  const catFiles = fs.readdirSync('.').filter(f => f.endsWith('-products.js') && f !== 'build-products.js' && f !== 'products-bundle.js');
  
  assertAudit('Phase 1.1', 'Exactly 18 category files present', catFiles.length === 18, `Found ${catFiles.length}`);

  let totalProducts = 0;
  let productsWithOldPrices = 0;
  let productsWithMissingPrices = 0;
  let nonLiteralProducts = 0;
  const categoryBreakdown = {};

  for (const file of catFiles) {
    const raw = fs.readFileSync(file, 'utf8');

    // Check for raw literal presence of old prices
    if (raw.includes('"basePrice":60') || raw.includes('"basePrice": 60') ||
        raw.includes('"20x30":60') || raw.includes('"20x30": 60') ||
        raw.includes('"30x40":80') || raw.includes('"30x40": 80')) {
      productsWithOldPrices++;
      logObservation('Phase 1.1', `Old price literal found in ${file}`, 'Found 60 or 80 pricing literal');
    }

    // Identify variable name (e.g. const footballProducts =)
    const varMatch = raw.match(/const\s+(\w+Products)\s*=/);
    if (!varMatch) {
      assertAudit('Phase 1.1', `${file} variable match`, false, 'Could not find variable name');
      continue;
    }
    const varName = varMatch[1];

    // Verify AST / VM execution
    const sandbox = { globalThis: {} };
    try {
      vm.runInNewContext(raw + `\nglobalThis.__res = ${varName};`, sandbox);
      const list = sandbox.globalThis.__res;
      if (!Array.isArray(list)) {
        assertAudit('Phase 1.1', `${file} defines array`, false, 'No array exported in sandbox');
        continue;
      }
      categoryBreakdown[file] = list.length;
      totalProducts += list.length;

      for (const p of list) {
        if (!p.id || typeof p.id !== 'string') {
          assertAudit('Phase 1.1', `${file} product id validity`, false, `Invalid product: ${JSON.stringify(p)}`);
        }
        if (p.basePrice !== 180) {
          productsWithMissingPrices++;
        }
        if (!p.sizes || p.sizes['20x30'] !== 180 || p.sizes['30x40'] !== 200 || p.sizes['40x50'] !== 250 || p.sizes['50x70'] !== 300) {
          productsWithMissingPrices++;
        }
        // Verify genuine object property (not getter/proxy)
        const descBase = Object.getOwnPropertyDescriptor(p, 'basePrice');
        const descSizes = Object.getOwnPropertyDescriptor(p, 'sizes');
        if (descBase.get || descSizes.get) {
          nonLiteralProducts++;
        }
      }
    } catch (e) {
      assertAudit('Phase 1.1', `Syntax parse of ${file}`, false, e.message);
    }
  }

  assertAudit('Phase 1.1', 'Zero products contain legacy 60/80 price literals', productsWithOldPrices === 0, `${productsWithOldPrices} files contain old price literals`);
  assertAudit('Phase 1.1', 'Total category products count is exactly 1,018', totalProducts === 1018, `Expected 1018, found ${totalProducts}`);
  assertAudit('Phase 1.1', 'All 1,018 products have genuine basePrice:180 & sizes: {180, 200, 250, 300}', productsWithMissingPrices === 0, `${productsWithMissingPrices} products failed pricing check`);
  assertAudit('Phase 1.1', 'No facade getters or Proxy interceptors detected in product definitions', nonLiteralProducts === 0, `${nonLiteralProducts} products use getters/proxies`);
  logObservation('Phase 1.1', `Category count: 18 files, 1,018 products audited`, JSON.stringify(categoryBreakdown));

  // -------------------------------------------------------------
  // PHASE 1.2: build-products.js & Custom Upload Product
  // -------------------------------------------------------------
  console.log('\n--- Phase 1.2: build-products.js & Custom Product ---');
  const buildProductsRaw = fs.readFileSync('build-products.js', 'utf8');
  assertAudit('Phase 1.2', 'build-products.js custom-design has basePrice: 180', buildProductsRaw.includes('basePrice: 180'), 'Missing basePrice: 180 in build-products.js');
  assertAudit('Phase 1.2', 'build-products.js custom-design has sizes 180, 200, 250, 300', buildProductsRaw.includes("'20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300"), 'Missing sizes tier in build-products.js');

  // -------------------------------------------------------------
  // PHASE 1.3: Bundle Reproducibility & Integrity Check
  // -------------------------------------------------------------
  console.log('\n--- Phase 1.3: Bundle Reproducibility & Build Execution ---');
  // Read current products-bundle.js
  const existingBundle = fs.readFileSync('products-bundle.js', 'utf8');
  const existingAdminBundle = fs.readFileSync('admin/products-bundle.js', 'utf8');
  assertAudit('Phase 1.3', 'admin/products-bundle.js is identical to root products-bundle.js', existingBundle === existingAdminBundle, 'admin bundle differs from root bundle');

  // Test rebuilding from scratch to verify build output is 100% reproducible and genuine
  try {
    const buildOutput = execSync('node build-products.js', { encoding: 'utf8' });
    logObservation('Phase 1.3', 'build-products.js executed cleanly', buildOutput.trim());
    assertAudit('Phase 1.3', 'build-products.js exit 0', true);
  } catch (err) {
    assertAudit('Phase 1.3', 'build-products.js execution', false, err.message);
  }

  // Verify rebuilt products-bundle.js (stripping volatile ISO timestamp comment)
  const rebuiltBundle = fs.readFileSync('products-bundle.js', 'utf8');
  const existingBody = existingBundle.replace(/\/\/ Generated[^\n]*\n/, '');
  const rebuiltBody = rebuiltBundle.replace(/\/\/ Generated[^\n]*\n/, '');
  assertAudit('Phase 1.3', 'products-bundle.js is 100% reproducible from source category files', existingBody === rebuiltBody, 'Rebuilt bundle content diverges from committed bundle');

  // Evaluate the bundle in an isolated VM
  const bundleSandbox = { window: {}, globalThis: {} };
  vm.runInNewContext(rebuiltBundle, bundleSandbox);
  const bundleProducts = bundleSandbox.window.products;
  assertAudit('Phase 1.3', 'Bundle defines exactly 1,019 products (1,018 category + 1 custom)', bundleProducts && bundleProducts.length === 1019, `Bundle product count: ${bundleProducts?.length}`);
  
  let invalidBundleProducts = 0;
  for (const p of (bundleProducts || [])) {
    if (p.basePrice !== 180 || p.sizes['20x30'] !== 180 || p.sizes['30x40'] !== 200 || p.sizes['40x50'] !== 250 || p.sizes['50x70'] !== 300) {
      invalidBundleProducts++;
    }
  }
  assertAudit('Phase 1.3', 'All 1,019 bundle products have valid 180/200/250/300 prices', invalidBundleProducts === 0, `${invalidBundleProducts} bundle products failed pricing`);

  // Check products-bundle.min.js
  const minBundle = fs.readFileSync('products-bundle.min.js', 'utf8');
  const adminMinBundle = fs.readFileSync('admin/products-bundle.min.js', 'utf8');
  assertAudit('Phase 1.3', 'products-bundle.min.js matches admin/products-bundle.min.js', minBundle === adminMinBundle, 'Minified bundles out of sync');
  assertAudit('Phase 1.3', 'products-bundle.min.js is non-empty (>400KB)', minBundle.length > 400000, `Size is ${minBundle.length}`);

  // -------------------------------------------------------------
  // PHASE 1.4: script.js Forensic Code Inspection
  // -------------------------------------------------------------
  console.log('\n--- Phase 1.4: script.js Forensic Code Analysis ---');
  const scriptRaw = fs.readFileSync('script.js', 'utf8');

  // Check 1: No hardcoded test condition / bypass
  const hardcodedCheckPatterns = [
    /if\s*\([^)]*__test[^)]*\)/i,
    /if\s*\([^)]*process\.env/i,
    /if\s*\([^)]*product\.id\s*===\s*['"]test/i,
    /if\s*\([^)]*size\s*===\s*['"]20x30['"]\s*\)\s*return\s*180/i
  ];
  let foundBypasses = [];
  for (const pat of hardcodedCheckPatterns) {
    if (pat.test(scriptRaw)) {
      foundBypasses.push(pat.toString());
    }
  }
  assertAudit('Phase 1.4', 'No test condition bypasses or product-specific hardcoding in script.js', foundBypasses.length === 0, `Found patterns: ${foundBypasses.join(', ')}`);

  // Check 2: frameOptions definition
  const foMatch = scriptRaw.match(/const frameOptions = (\{[\s\S]*?\n\};)/);
  assertAudit('Phase 1.4', 'frameOptions object found in script.js', !!foMatch, 'frameOptions not found');
  let foObj = null;
  if (foMatch) {
    foObj = eval('(' + foMatch[1].replace(/;\s*$/, '') + ')');
    assertAudit('Phase 1.4', 'frameOptions.Black price is 0', foObj.Black?.price === 0, `Black price: ${foObj.Black?.price}`);
    assertAudit('Phase 1.4', 'frameOptions.White price is 0', foObj.White?.price === 0, `White price: ${foObj.White?.price}`);
    assertAudit('Phase 1.4', 'frameOptions.Transparent price is 0', foObj.Transparent?.price === 0, `Transparent price: ${foObj.Transparent?.price}`);
    assertAudit('Phase 1.4', 'frameOptions.None price is 0', foObj.None?.price === 0, `None price: ${foObj.None?.price}`);
  }

  // Check 3: itemUnitPrice implementation
  const unitPriceMatch = scriptRaw.match(/function itemUnitPrice\(product, size, frame\) \{([\s\S]*?)\n\}/);
  assertAudit('Phase 1.4', 'itemUnitPrice function found in script.js', !!unitPriceMatch, 'itemUnitPrice not found');
  if (unitPriceMatch) {
    const fnBody = unitPriceMatch[1];
    logObservation('Phase 1.4', 'itemUnitPrice implementation snippet', fnBody.replace(/\s+/g, ' ').trim());
    
    // Test that calculation is genuine arithmetic sizePrice + framePrice
    assertAudit('Phase 1.4', 'itemUnitPrice contains arithmetic return sizePrice + framePrice', fnBody.includes('return sizePrice + framePrice;'), 'Missing genuine arithmetic return');
  }

  // Check 4: Absence of old frame adder (+ 120) across entire script.js
  const occurrencesOf120Adder = [];
  const lines = scriptRaw.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('120') && (line.includes('frame') || line.includes('price')) && !line.includes('faq')) {
      occurrencesOf120Adder.push(`Line ${idx + 1}: ${line.trim()}`);
    }
  });
  assertAudit('Phase 1.4', 'No +120 frame adder logic left in script.js', occurrencesOf120Adder.length === 0, `Found 120 price logic: ${occurrencesOf120Adder.join('; ')}`);

  // Check 5: addToCart default parameters
  assertAudit('Phase 1.4', 'addToCart defaults to size "20x30"', scriptRaw.includes('async function addToCart(productId, size = "20x30", frame = "Black"'), 'addToCart default size is not 20x30');

  // -------------------------------------------------------------
  // PHASE 1.5: admin-panel.js & admin/panel.html Forensic Inspection
  // -------------------------------------------------------------
  console.log('\n--- Phase 1.5: admin-panel.js & admin/panel.html Analysis ---');
  const adminJsRaw = fs.readFileSync('admin-panel.js', 'utf8');
  const adminHtmlRaw = fs.readFileSync('admin/panel.html', 'utf8');

  // Verify fallbacks
  assertAudit('Phase 1.5', 'admin-panel.js fallback string has 20x30=180, 30x40=200, 40x50=250, 50x70=300', adminJsRaw.includes("'20x30=180, 30x40=200, 40x50=250, 50x70=300'"), 'admin-panel.js fallback string missing or incorrect');
  assertAudit('Phase 1.5', 'admin-panel.js fallback object has 180, 200, 250, 300', adminJsRaw.includes("{ '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 }"), 'admin-panel.js fallback object missing or incorrect');
  assertAudit('Phase 1.5', 'admin/panel.html placeholder has 20x30=180, 30x40=200, 40x50=250, 50x70=300', adminHtmlRaw.includes('placeholder="20x30=180, 30x40=200, 40x50=250, 50x70=300"'), 'admin/panel.html placeholder missing or incorrect');

  // Check admin size parsing logic
  const parseSnippet = adminJsRaw.slice(adminJsRaw.indexOf('const sizesStr ='), adminJsRaw.indexOf('const framesStr ='));
  logObservation('Phase 1.5', 'Admin sizes parsing code snippet', parseSnippet.replace(/\s+/g, ' ').trim());
  assertAudit('Phase 1.5', 'Admin size parsing parses custom size=price pairs without hardcoded filters', parseSnippet.includes('sizesStr.split') && parseSnippet.includes('parseFloat(kv[1].trim())'), 'Admin parsing is not genuine');

  // -------------------------------------------------------------
  // PHASE 2: Behavioral & Adversarial Verification
  // -------------------------------------------------------------
  console.log('\n--- Phase 2: Behavioral & Adversarial Stress Testing ---');

  // Create isolated evaluator for itemUnitPrice
  const evalItemUnitPrice = new Function('product', 'size', 'frame', 'frameOptions', unitPriceMatch[1]);

  // Test standard pricing combinations
  const testProduct = {
    id: "test-item",
    basePrice: 180,
    sizes: { "20x30": 180, "30x40": 200, "40x50": 250, "50x70": 300 }
  };

  const framesToTest = ['Black', 'White', 'Transparent', 'None'];
  for (const frame of framesToTest) {
    assertAudit('Phase 2', `itemUnitPrice 20x30 with ${frame} is 180`, evalItemUnitPrice(testProduct, '20x30', frame, foObj) === 180, `Got ${evalItemUnitPrice(testProduct, '20x30', frame, foObj)}`);
    assertAudit('Phase 2', `itemUnitPrice 30x40 with ${frame} is 200`, evalItemUnitPrice(testProduct, '30x40', frame, foObj) === 200, `Got ${evalItemUnitPrice(testProduct, '30x40', frame, foObj)}`);
    assertAudit('Phase 2', `itemUnitPrice 40x50 with ${frame} is 250`, evalItemUnitPrice(testProduct, '40x50', frame, foObj) === 250, `Got ${evalItemUnitPrice(testProduct, '40x50', frame, foObj)}`);
    assertAudit('Phase 2', `itemUnitPrice 50x70 with ${frame} is 300`, evalItemUnitPrice(testProduct, '50x70', frame, foObj) === 300, `Got ${evalItemUnitPrice(testProduct, '50x70', frame, foObj)}`);
  }

  // Adversarial stress test 1: null / undefined product
  assertAudit('Phase 2', 'Adversarial: null product returns default 180 without exception', evalItemUnitPrice(null, '20x30', 'Black', foObj) === 180);
  assertAudit('Phase 2', 'Adversarial: undefined product returns default 180 without exception', evalItemUnitPrice(undefined, '20x30', 'Black', foObj) === 180);

  // Adversarial stress test 2: unknown / malformed frame
  assertAudit('Phase 2', 'Adversarial: unknown frame defaults to 0 frame surcharge safely', evalItemUnitPrice(testProduct, '30x40', 'SuperTitaniumFrame', foObj) === 200);
  assertAudit('Phase 2', 'Adversarial: undefined frame defaults to 0 frame surcharge safely', evalItemUnitPrice(testProduct, '30x40', undefined, foObj) === 200);
  assertAudit('Phase 2', 'Adversarial: null frame defaults to 0 frame surcharge safely', evalItemUnitPrice(testProduct, '30x40', null, foObj) === 200);

  // Adversarial stress test 3: unknown size falls back safely
  assertAudit('Phase 2', 'Adversarial: unknown size falls back to 20x30 price (180)', evalItemUnitPrice(testProduct, '100x200', 'Black', foObj) === 180);

  // Adversarial stress test 4: product with only basePrice and no sizes object
  const legacyProductNoSizes = { id: 'legacy-p', basePrice: 220 };
  assertAudit('Phase 2', 'Adversarial: product without sizes falls back to basePrice safely', evalItemUnitPrice(legacyProductNoSizes, '20x30', 'Black', foObj) === 220);

  // -------------------------------------------------------------
  // PHASE 3: Firestore Remote Consistency Verification
  // -------------------------------------------------------------
  console.log('\n--- Phase 3: Live Remote Firestore Verification ---');
  let firestoreVerified = false;
  try {
    const fsData = await new Promise((resolve, reject) => {
      const req = https.get('https://firestore.googleapis.com/v1/projects/poster-labstore/databases/(default)/documents/products/football-001', res => {
        let b = '';
        res.on('data', c => b += c);
        res.on('end', () => {
          try { resolve(JSON.parse(b)); } catch (e) { reject(e); }
        });
      });
      req.on('error', reject);
      req.setTimeout(8000, () => req.destroy(new Error('Timeout')));
    });

    if (fsData && fsData.fields) {
      const bp = fsData.fields.basePrice?.integerValue;
      const s = fsData.fields.sizes?.mapValue?.fields;
      assertAudit('Phase 3', 'Firestore football-001 has basePrice 180', bp === '180', `Firestore basePrice is ${bp}`);
      assertAudit('Phase 3', 'Firestore football-001 has 20x30=180', s?.['20x30']?.integerValue === '180', `20x30 is ${s?.['20x30']?.integerValue}`);
      assertAudit('Phase 3', 'Firestore football-001 has 30x40=200', s?.['30x40']?.integerValue === '200', `30x40 is ${s?.['30x40']?.integerValue}`);
      assertAudit('Phase 3', 'Firestore football-001 has 40x50=250', s?.['40x50']?.integerValue === '250', `40x50 is ${s?.['40x50']?.integerValue}`);
      assertAudit('Phase 3', 'Firestore football-001 has 50x70=300', s?.['50x70']?.integerValue === '300', `50x70 is ${s?.['50x70']?.integerValue}`);
      firestoreVerified = true;
      logObservation('Phase 3', 'Remote Firestore document verified', JSON.stringify({ basePrice: bp, sizes: s }));
    } else {
      assertAudit('Phase 3', 'Firestore document football-001 response valid', false, JSON.stringify(fsData));
    }
  } catch (err) {
    assertAudit('Phase 3', 'Firestore document query', false, err.message);
  }

  // -------------------------------------------------------------
  // PHASE 4: Build Pipeline & Minification Verification
  // -------------------------------------------------------------
  console.log('\n--- Phase 4: Build Assets Execution ---');
  try {
    const buildAssetsOut = execSync('node build-assets.js', { encoding: 'utf8' });
    logObservation('Phase 4', 'build-assets.js executed cleanly', buildAssetsOut.trim());
    assertAudit('Phase 4', 'build-assets.js completes with code 0', true);
  } catch (err) {
    assertAudit('Phase 4', 'build-assets.js execution', false, err.message);
  }

  // Verify script.min.js is in sync with script.js
  const scriptMin = fs.readFileSync('script.min.js', 'utf8');
  assertAudit('Phase 4', 'script.min.js includes frameOptions price 0', scriptMin.includes('Black:{label:"Black frame",price:0') || scriptMin.includes('price:0'), 'script.min.js does not reflect updated frameOptions');
  assertAudit('Phase 4', 'script.min.js does not include old +120 adder', !scriptMin.includes('frameOptions.Black?.price||120'), 'Old +120 adder found in script.min.js');

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(` AUDIT RESULTS: ${results.passed.length} Passed, ${results.failed.length} Failed`);
  console.log('===============================================================');

  if (results.failed.length > 0) {
    console.error('\nFAILED CHECKS:');
    for (const f of results.failed) {
      console.error(`- [${f.phase}] ${f.checkName}: ${f.failDetails}`);
    }
    process.exit(1);
  } else {
    console.log('\nALL FORENSIC AUDIT CHECKS PASSED EMPIRICALLY WITH ZERO VIOLATIONS.');
    process.exit(0);
  }
}

runForensicAudit().catch(e => {
  console.error('Audit exception:', e);
  process.exit(1);
});

/**
 * tests/e2e/tier1-features/f01_f04_pricing_tiers.test.js
 * Tier 1: Feature Coverage for Features 1, 2, 3, 4:
 * - Feature 1: 20x30 cm Pricing (180 EGP) - ORIGINAL_REQUEST R1
 * - Feature 2: 30x40 cm Pricing (200 EGP) - ORIGINAL_REQUEST R1
 * - Feature 3: 40x50 cm Pricing (250 EGP) - ORIGINAL_REQUEST R1
 * - Feature 4: 50x70 cm Pricing (300 EGP) - ORIGINAL_REQUEST R1
 * Authoritative Source: ORIGINAL_REQUEST.md R1 & PROJECT.md Interface Contract
 */

const {
  describe,
  test,
  assertEqual,
  assertDeepEqual,
  assertMatch,
  assert,
  readProjectFile,
  AuthoritativePricing
} = require('../../harness');
const vm = require('vm');

describe('Tier 1: Feature 1 — 20x30 cm Pricing (180 EGP)', () => {
  test('F1-1: Authoritative pricing contract sets 20x30 cm to 180 EGP', () => {
    assertEqual(AuthoritativePricing.tiers["20x30"], 180, '20x30 cm tier must be 180 EGP');
  });

  test('F1-2: Catalog products basePrice equals 20x30 cm price (180 EGP)', () => {
    const content = readProjectFile('art-products.js');
    const sandbox = { globalThis: {} };
    vm.runInNewContext(content + '\nglobalThis.__res = artProducts;', sandbox);
    const products = sandbox.globalThis.__res;
    assert(Array.isArray(products) && products.length > 0, 'artProducts array must exist');
    const firstProduct = products[0];
    assertEqual(firstProduct.sizes["20x30"], 180, `Expected 20x30 cm to be 180 in ${firstProduct.id}`);
    assertEqual(firstProduct.basePrice, 180, `Expected basePrice to be 180 in ${firstProduct.id}`);
  });

  test('F1-3: Products bundle default custom upload product has 20x30 price as 180 EGP', () => {
    const bundleContent = readProjectFile('products-bundle.js');
    const sandbox = { window: {}, globalThis: {} };
    vm.runInNewContext(bundleContent, sandbox);
    const products = sandbox.window.products || sandbox.globalThis.products;
    assert(Array.isArray(products), 'Products array must be assembled in bundle');
    const custom = products.find(p => p.id === 'custom-design');
    assert(custom, 'Custom design product must exist');
    assertEqual(custom.sizes["20x30"], 180, 'Custom design 20x30 cm size must be 180 EGP');
    assertEqual(custom.basePrice, 180, 'Custom design basePrice must be 180 EGP');
  });

  test('F1-4: Unit price calculation for 20x30 cm yields 180 EGP with zero frame adder', () => {
    const calcPrice = AuthoritativePricing.calculateItemPrice("20x30", "Black");
    assertEqual(calcPrice, 180, '20x30 cm with Black frame must cost 180 EGP total');
  });

  test('F1-5: Build script (build-products.js) sets custom upload 20x30 cm to 180 EGP', () => {
    const buildScript = readProjectFile('build-products.js');
    assertMatch(buildScript, /['"]20x30['"]\s*:\s*180/, 'build-products.js must specify 20x30 as 180');
  });
});

describe('Tier 1: Feature 2 — 30x40 cm Pricing (200 EGP)', () => {
  test('F2-1: Authoritative pricing contract sets 30x40 cm to 200 EGP', () => {
    assertEqual(AuthoritativePricing.tiers["30x40"], 200, '30x40 cm tier must be 200 EGP');
  });

  test('F2-2: Catalog products specify 30x40 cm at 200 EGP in car-products', () => {
    const content = readProjectFile('cars-products.js');
    const sandbox = { globalThis: {} };
    vm.runInNewContext(content + '\nglobalThis.__res = typeof carProducts !== "undefined" ? carProducts : carsProducts;', sandbox);
    const products = sandbox.globalThis.__res;
    assert(Array.isArray(products) && products.length > 0, 'carProducts array must exist');
    const firstProduct = products[0];
    assertEqual(firstProduct.sizes["30x40"], 200, `Expected 30x40 cm to be 200 in ${firstProduct.id}`);
  });

  test('F2-3: Unit price calculation for 30x40 cm yields 200 EGP with zero frame adder', () => {
    const calcPrice = AuthoritativePricing.calculateItemPrice("30x40", "White");
    assertEqual(calcPrice, 200, '30x40 cm with White frame must cost 200 EGP total');
  });

  test('F2-4: Products bundle custom upload product has 30x40 price as 200 EGP', () => {
    const bundleContent = readProjectFile('products-bundle.js');
    const sandbox = { window: {}, globalThis: {} };
    vm.runInNewContext(bundleContent, sandbox);
    const products = sandbox.window.products || sandbox.globalThis.products;
    const custom = products.find(p => p.id === 'custom-design');
    assert(custom, 'Custom design product must exist');
    assertEqual(custom.sizes["30x40"], 200, 'Custom design 30x40 cm size must be 200 EGP');
  });

  test('F2-5: Build script (build-products.js) sets custom upload 30x40 cm to 200 EGP', () => {
    const buildScript = readProjectFile('build-products.js');
    assertMatch(buildScript, /['"]30x40['"]\s*:\s*200/, 'build-products.js must specify 30x40 as 200');
  });
});

describe('Tier 1: Feature 3 — 40x50 cm Pricing (250 EGP)', () => {
  test('F3-1: Authoritative pricing contract sets 40x50 cm to 250 EGP', () => {
    assertEqual(AuthoritativePricing.tiers["40x50"], 250, '40x50 cm tier must be 250 EGP');
  });

  test('F3-2: Catalog products specify 40x50 cm at 250 EGP in football-products', () => {
    const content = readProjectFile('football-products.js');
    const sandbox = { globalThis: {} };
    vm.runInNewContext(content + '\nglobalThis.__res = footballProducts;', sandbox);
    const products = sandbox.globalThis.__res;
    assert(Array.isArray(products) && products.length > 0, 'footballProducts array must exist');
    const firstProduct = products[0];
    assertEqual(firstProduct.sizes["40x50"], 250, `Expected 40x50 cm to be 250 in ${firstProduct.id}`);
  });

  test('F3-3: Unit price calculation for 40x50 cm yields 250 EGP with zero frame adder', () => {
    const calcPrice = AuthoritativePricing.calculateItemPrice("40x50", "Transparent");
    assertEqual(calcPrice, 250, '40x50 cm with Transparent frame must cost 250 EGP total');
  });

  test('F3-4: Products bundle custom upload product has 40x50 price as 250 EGP', () => {
    const bundleContent = readProjectFile('products-bundle.js');
    const sandbox = { window: {}, globalThis: {} };
    vm.runInNewContext(bundleContent, sandbox);
    const products = sandbox.window.products || sandbox.globalThis.products;
    const custom = products.find(p => p.id === 'custom-design');
    assert(custom, 'Custom design product must exist');
    assertEqual(custom.sizes["40x50"], 250, 'Custom design 40x50 cm size must be 250 EGP');
  });

  test('F3-5: Build script (build-products.js) sets custom upload 40x50 cm to 250 EGP', () => {
    const buildScript = readProjectFile('build-products.js');
    assertMatch(buildScript, /['"]40x50['"]\s*:\s*250/, 'build-products.js must specify 40x50 as 250');
  });
});

describe('Tier 1: Feature 4 — 50x70 cm Pricing (300 EGP)', () => {
  test('F4-1: Authoritative pricing contract sets 50x70 cm to 300 EGP', () => {
    assertEqual(AuthoritativePricing.tiers["50x70"], 300, '50x70 cm tier must be 300 EGP');
  });

  test('F4-2: Catalog products specify 50x70 cm at 300 EGP in anime-products', () => {
    const content = readProjectFile('anime-products.js');
    const sandbox = { globalThis: {} };
    vm.runInNewContext(content + '\nglobalThis.__res = animeProducts;', sandbox);
    const products = sandbox.globalThis.__res;
    assert(Array.isArray(products) && products.length > 0, 'animeProducts array must exist');
    const firstProduct = products[0];
    assertEqual(firstProduct.sizes["50x70"], 300, `Expected 50x70 cm to be 300 in ${firstProduct.id}`);
  });

  test('F4-3: Unit price calculation for 50x70 cm yields 300 EGP with zero frame adder', () => {
    const calcPrice = AuthoritativePricing.calculateItemPrice("50x70", "Black");
    assertEqual(calcPrice, 300, '50x70 cm with Black frame must cost 300 EGP total');
  });

  test('F4-4: Products bundle custom upload product has 50x70 price as 300 EGP', () => {
    const bundleContent = readProjectFile('products-bundle.js');
    const sandbox = { window: {}, globalThis: {} };
    vm.runInNewContext(bundleContent, sandbox);
    const products = sandbox.window.products || sandbox.globalThis.products;
    const custom = products.find(p => p.id === 'custom-design');
    assert(custom, 'Custom design product must exist');
    assertEqual(custom.sizes["50x70"], 300, 'Custom design 50x70 cm size must be 300 EGP');
  });

  test('F4-5: Build script (build-products.js) sets custom upload 50x70 cm to 300 EGP', () => {
    const buildScript = readProjectFile('build-products.js');
    assertMatch(buildScript, /['"]50x70['"]\s*:\s*300/, 'build-products.js must specify 50x70 as 300');
  });
});

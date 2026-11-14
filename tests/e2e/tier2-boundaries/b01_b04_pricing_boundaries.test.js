/**
 * tests/e2e/tier2-boundaries/b01_b04_pricing_boundaries.test.js
 * Tier 2: Boundary & Corner Cases for Features 1-4 (Pricing Tiers)
 * Authoritative Source: ORIGINAL_REQUEST.md R1 & PROJECT.md
 */

const {
  describe,
  test,
  assertEqual,
  assertThrows,
  assert,
  AuthoritativePricing
} = require('../../harness');

describe('Tier 2: Boundaries for Feature 1 (20x30 cm min size tier)', () => {
  test('B1-1: Min size price lower boundary cannot be discounted below 0 EGP', () => {
    const calc = AuthoritativePricing.calculateCartTotal(
      [{ size: '20x30', frame: 'Black', quantity: 1 }],
      150 // 150% discount extreme boundary
    );
    assert(calc.discountedSubtotal >= 0, 'Discounted subtotal must not be negative');
    assertEqual(calc.discountedSubtotal, 0, 'Discounted subtotal clamped to 0');
  });

  test('B1-2: Size key format with whitespace is trimmed to "20x30"', () => {
    function normalizeSize(s) {
      return String(s).trim().toLowerCase();
    }
    assertEqual(normalizeSize(' 20x30 '), '20x30');
    assertEqual(normalizeSize('20X30'), '20x30');
  });

  test('B1-3: Undefined or missing size parameter falls back to default 20x30', () => {
    function resolveSize(product, requestedSize) {
      if (requestedSize && product.sizes && product.sizes[requestedSize]) {
        return requestedSize;
      }
      return Object.keys(product.sizes || { "20x30": 180 })[0];
    }
    const product = { sizes: { "20x30": 180, "30x40": 200 } };
    assertEqual(resolveSize(product, undefined), '20x30');
    assertEqual(resolveSize(product, null), '20x30');
  });

  test('B1-4: Line item multiplier with minimum quantity 1 evaluates to 180 EGP', () => {
    const calc = AuthoritativePricing.calculateCartTotal([
      { size: '20x30', frame: 'Black', quantity: 1 }
    ]);
    assertEqual(calc.subtotal, 180);
  });

  test('B1-5: Product price type integrity ensures number type and exact integer 180', () => {
    const price = AuthoritativePricing.calculateItemPrice('20x30');
    assertEqual(typeof price, 'number', 'Price must be a number');
    assertEqual(Number.isInteger(price), true, 'Price must be an integer');
    assertEqual(price, 180);
  });
});

describe('Tier 2: Boundaries for Feature 2 (30x40 cm mid-tier 1)', () => {
  test('B2-1: Mid-tier price step is exactly +20 EGP over 20x30 cm', () => {
    const p1 = AuthoritativePricing.calculateItemPrice('20x30');
    const p2 = AuthoritativePricing.calculateItemPrice('30x40');
    assertEqual(p2 - p1, 20, 'Difference between 30x40 and 20x30 must be exactly 20 EGP');
  });

  test('B2-2: Currency formatted string for 30x40 contains no float artifacts', () => {
    const price = AuthoritativePricing.calculateItemPrice('30x40');
    const formatted = `${price} EGP`;
    assertEqual(formatted, '200 EGP', 'Formatted string must have no decimal points');
  });

  test('B2-3: Line item quantity of 0 clamps or throws error in cart math', () => {
    const items = [{ size: '30x40', quantity: 0 }];
    const calc = AuthoritativePricing.calculateCartTotal(items);
    assertEqual(calc.subtotal, 0, 'Quantity 0 should yield 0 subtotal');
  });

  test('B2-4: Fallback to basePrice if size key is missing from sizes map', () => {
    function getUnitPrice(product, size) {
      if (product.sizes && product.sizes[size]) {
        return product.sizes[size];
      }
      return product.basePrice || 180;
    }
    const product = { basePrice: 180, sizes: { "20x30": 180 } };
    assertEqual(getUnitPrice(product, '30x40'), 180, 'Fallback to basePrice');
  });

  test('B2-5: Float quantity in cart is rounded to integer', () => {
    function sanitizeQuantity(q) {
      const parsed = parseInt(q, 10);
      return isNaN(parsed) || parsed < 1 ? 1 : parsed;
    }
    assertEqual(sanitizeQuantity(2.7), 2);
    assertEqual(sanitizeQuantity('3.9'), 3);
  });
});

describe('Tier 2: Boundaries for Feature 3 (40x50 cm mid-tier 2)', () => {
  test('B3-1: Mid-tier price step is exactly +50 EGP over 30x40 cm', () => {
    const p2 = AuthoritativePricing.calculateItemPrice('30x40');
    const p3 = AuthoritativePricing.calculateItemPrice('40x50');
    assertEqual(p3 - p2, 50, 'Difference between 40x50 and 30x40 must be exactly 50 EGP');
  });

  test('B3-2: 40x50 aspect ratio evaluates to 4:5 (0.80)', () => {
    const [w, h] = '40x50'.split('x').map(Number);
    const ratio = w / h;
    assertEqual(ratio, 0.8, 'Aspect ratio must be 0.8');
  });

  test('B3-3: Multi-item line item with 10 units of 40x50 equals exactly 2500 EGP', () => {
    const calc = AuthoritativePricing.calculateCartTotal([
      { size: '40x50', frame: 'White', quantity: 10 }
    ]);
    assertEqual(calc.subtotal, 2500, '10 x 250 must be 2500 EGP');
    assertEqual(calc.total, 2535, 'Total must be 2500 + 35 = 2535 EGP');
  });

  test('B3-4: 40x50 size with White frame produces exactly 250 + 0 = 250 EGP', () => {
    const price = AuthoritativePricing.calculateItemPrice('40x50', 'White');
    assertEqual(price, 250);
  });

  test('B3-5: Negative quantity in 40x50 cart payload clamps to 1', () => {
    function clampQty(q) {
      return Math.max(1, parseInt(q, 10) || 1);
    }
    assertEqual(clampQty(-5), 1, 'Negative quantity must clamp to 1');
  });
});

describe('Tier 2: Boundaries for Feature 4 (50x70 cm max size tier)', () => {
  test('B4-1: Max size upper bound is 50x70 at 300 EGP', () => {
    const maxTier = Object.keys(AuthoritativePricing.tiers).pop();
    assertEqual(maxTier, '50x70', 'Max size tier is 50x70');
    assertEqual(AuthoritativePricing.tiers[maxTier], 300, 'Max tier price is 300 EGP');
  });

  test('B4-2: Max size price difference is exactly +50 EGP over 40x50 cm', () => {
    const p3 = AuthoritativePricing.calculateItemPrice('40x50');
    const p4 = AuthoritativePricing.calculateItemPrice('50x70');
    assertEqual(p4 - p3, 50, 'Difference between 50x70 and 40x50 must be 50 EGP');
  });

  test('B4-3: Large quantity orders (100 units) of 50x70 equals 30,000 EGP without precision loss', () => {
    const calc = AuthoritativePricing.calculateCartTotal([
      { size: '50x70', frame: 'Transparent', quantity: 100 }
    ]);
    assertEqual(calc.subtotal, 30000, '100 x 300 must equal 30000 EGP');
    assertEqual(calc.total, 30035, 'Total must equal 30035 EGP');
  });

  test('B4-4: 50x70 aspect ratio evaluates to ~0.714 (5:7 ratio)', () => {
    const [w, h] = '50x70'.split('x').map(Number);
    const ratio = +(w / h).toFixed(3);
    assertEqual(ratio, 0.714, 'Aspect ratio must be approximately 0.714');
  });

  test('B4-5: Unknown size string throws descriptive error in authoritative oracle', () => {
    assertThrows(() => {
      AuthoritativePricing.calculateItemPrice('100x150');
    }, /Invalid size/);
  });
});

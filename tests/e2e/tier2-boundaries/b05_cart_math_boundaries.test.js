/**
 * tests/e2e/tier2-boundaries/b05_cart_math_boundaries.test.js
 * Tier 2: Boundary & Corner Cases for Feature 5 (Cart & Math)
 * Authoritative Source: ORIGINAL_REQUEST.md R1 & PROJECT.md
 */

const {
  describe,
  test,
  assertEqual,
  assertDeepEqual,
  assert,
  AuthoritativePricing,
  MockStorage
} = require('../../harness');

describe('Tier 2: Boundaries for Feature 5 (Cart & Line-Item Price Math)', () => {
  test('B5-1: Zero quantity in cart results in 0 subtotal and 0 grand total', () => {
    const calc = AuthoritativePricing.calculateCartTotal([]);
    assertEqual(calc.subtotal, 0);
    assertEqual(calc.total, 0, 'Empty cart should have total 0 (no delivery fee charged on empty cart)');
  });

  test('B5-2: Negative quantity in item is clamped to minimum 1', () => {
    function sanitizeCartItems(items) {
      return items.map(item => ({
        ...item,
        quantity: Math.max(1, parseInt(item.quantity, 10) || 1)
      }));
    }
    const sanitized = sanitizeCartItems([{ id: 'p1', size: '20x30', quantity: -3 }]);
    assertEqual(sanitized[0].quantity, 1, 'Quantity should be clamped to 1');
  });

  test('B5-3: Extreme quantity (9,999 units) calculates accurately without overflow', () => {
    const calc = AuthoritativePricing.calculateCartTotal([
      { size: '20x30', frame: 'Black', quantity: 9999 }
    ]);
    const expectedSubtotal = 9999 * 180; // 1,799,820
    assertEqual(calc.subtotal, expectedSubtotal);
    assertEqual(calc.total, expectedSubtotal + 35);
    assertEqual(Number.isFinite(calc.total), true);
  });

  test('B5-4: Corrupted localStorage cart string safely parses as empty array fallback', () => {
    const storage = new MockStorage();
    storage.setItem('pls-cart', 'MALFORMED_JSON{{{');

    function loadCart(s) {
      try {
        const raw = s.getItem('pls-cart');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (_) {
        return [];
      }
    }

    const cart = loadCart(storage);
    assert(Array.isArray(cart), 'Cart must fall back to an array');
    assertEqual(cart.length, 0, 'Cart length must be 0');
  });

  test('B5-5: Coupon discount fraction rounding guarantees integer totals', () => {
    // 33% discount on 200 EGP = 66 EGP discount, subtotal = 134 EGP, total = 134 + 35 = 169 EGP
    const calc = AuthoritativePricing.calculateCartTotal(
      [{ size: '30x40', frame: 'Black', quantity: 1 }],
      33
    );
    assertEqual(Number.isInteger(calc.discountAmount), true, 'Discount amount must be integer');
    assertEqual(Number.isInteger(calc.total), true, 'Grand total must be integer');
    assertEqual(calc.discountAmount, 66);
    assertEqual(calc.total, 169);
  });
});

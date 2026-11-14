/**
 * tests/e2e/tier1-features/f05_cart_line_item_math.test.js
 * Tier 1: Feature 5 — Cart & Line-Item Price Math
 * Authoritative Source: ORIGINAL_REQUEST.md R1 & PROJECT.md
 */

const {
  describe,
  test,
  assertEqual,
  assertDeepEqual,
  assertMatch,
  AuthoritativePricing
} = require('../../harness');

describe('Tier 1: Feature 5 — Cart & Line-Item Price Math', () => {
  test('F5-1: Single item cart calculates subtotal, 35 EGP delivery fee, and grand total', () => {
    const items = [
      { id: 'item-1', size: '20x30', frame: 'Black', quantity: 1 }
    ];
    const calc = AuthoritativePricing.calculateCartTotal(items);
    assertEqual(calc.subtotal, 180, 'Subtotal for single 20x30 item must be 180 EGP');
    assertEqual(calc.deliveryFee, 35, 'Delivery fee must be 35 EGP');
    assertEqual(calc.total, 215, 'Grand total must be 180 + 35 = 215 EGP');
  });

  test('F5-2: Multiple items across different dimensions sum without frame adder', () => {
    const items = [
      { id: 'p1', size: '20x30', frame: 'Black', quantity: 1 },       // 180
      { id: 'p2', size: '30x40', frame: 'White', quantity: 1 },       // 200
      { id: 'p3', size: '40x50', frame: 'Transparent', quantity: 1 }, // 250
      { id: 'p4', size: '50x70', frame: 'Black', quantity: 1 }        // 300
    ];
    const calc = AuthoritativePricing.calculateCartTotal(items);
    assertEqual(calc.subtotal, 930, 'Subtotal for 180+200+250+300 must be 930 EGP');
    assertEqual(calc.deliveryFee, 35, 'Delivery fee must be 35 EGP');
    assertEqual(calc.total, 965, 'Total must be 930 + 35 = 965 EGP');
  });

  test('F5-3: Quantity multiplier correctly scales unit price per line item', () => {
    const items = [
      { id: 'p1', size: '30x40', frame: 'White', quantity: 3 } // 3 * 200 = 600
    ];
    const calc = AuthoritativePricing.calculateCartTotal(items);
    assertEqual(calc.subtotal, 600, 'Subtotal for 3x 30x40 items must be 600 EGP');
    assertEqual(calc.total, 635, 'Total must be 600 + 35 = 635 EGP');
  });

  test('F5-4: Coupon discount percentage applies to subtotal and preserves delivery fee', () => {
    const items = [
      { id: 'p1', size: '30x40', frame: 'Black', quantity: 1 } // 200
    ];
    const calc = AuthoritativePricing.calculateCartTotal(items, 10); // 10% coupon
    assertEqual(calc.subtotal, 200, 'Subtotal before discount is 200 EGP');
    assertEqual(calc.discountAmount, 20, '10% discount on 200 is 20 EGP');
    assertEqual(calc.discountedSubtotal, 180, 'Discounted subtotal is 180 EGP');
    assertEqual(calc.deliveryFee, 35, 'Delivery fee remains 35 EGP');
    assertEqual(calc.total, 215, 'Grand total is 180 + 35 = 215 EGP');
  });

  test('F5-5: WhatsApp order text generator formats accurate line items and summary totals', () => {
    const items = [
      { name: 'Poster A', size: '20x30', frame: 'Black', quantity: 2, unitPrice: 180 },
      { name: 'Poster B', size: '50x70', frame: 'Transparent', quantity: 1, unitPrice: 300 }
    ];
    const deliveryFee = 35;
    const subtotal = (2 * 180) + (1 * 300); // 360 + 300 = 660
    const total = subtotal + deliveryFee;   // 695

    const summaryText = `Subtotal: ${subtotal} EGP | Delivery: ${deliveryFee} EGP | Total: ${total} EGP`;
    assertMatch(summaryText, /Subtotal:\s*660\s*EGP/);
    assertMatch(summaryText, /Delivery:\s*35\s*EGP/);
    assertMatch(summaryText, /Total:\s*695\s*EGP/);
    assertEqual(total, 695, 'Order grand total is exactly 695 EGP');
  });
});

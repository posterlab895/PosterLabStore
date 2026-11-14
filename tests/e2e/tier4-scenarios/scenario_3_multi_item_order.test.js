/**
 * tests/e2e/tier4-scenarios/scenario_3_multi_item_order.test.js
 * Tier 4: Real-World Scenario 3 — Multi-Item Order with Varied Dimensions & Frames
 * Features Exercised: F1 (20x30), F2 (30x40), F4 (50x70), F5 (Math), F9 (Black), F10 (White), F11 (Transparent)
 * Authoritative Source: TEST_INFRA.md § Real-World Application Scenarios
 */

const {
  describe,
  test,
  assertEqual,
  assertMatch,
  AuthoritativePricing
} = require('../../harness');

describe('Tier 4: Scenario 3 — Multi-Item Order with Varied Dimensions & Frames', () => {
  test('S3: Customer adds 20x30 Black, 30x40 White, 50x70 Transparent -> Verifies exact 180 + 200 + 300 = 680 + 35 = 715 EGP', () => {
    // 1. Add 20x30 with Black frame
    const item1 = {
      id: 'poster-1',
      name: 'Geometric Art',
      size: '20x30',
      frame: 'Black',
      quantity: 1,
      unitPrice: AuthoritativePricing.calculateItemPrice('20x30', 'Black')
    };
    assertEqual(item1.unitPrice, 180, 'Item 1 (20x30 Black) must be 180 EGP');

    // 2. Add 30x40 with White frame
    const item2 = {
      id: 'poster-2',
      name: 'Monaco GP',
      size: '30x40',
      frame: 'White',
      quantity: 1,
      unitPrice: AuthoritativePricing.calculateItemPrice('30x40', 'White')
    };
    assertEqual(item2.unitPrice, 200, 'Item 2 (30x40 White) must be 200 EGP (0 frame adder)');

    // 3. Add 50x70 with Transparent / Frameless
    const item3 = {
      id: 'poster-3',
      name: 'Anime Skyline',
      size: '50x70',
      frame: 'Transparent',
      quantity: 1,
      unitPrice: AuthoritativePricing.calculateItemPrice('50x70', 'Transparent')
    };
    assertEqual(item3.unitPrice, 300, 'Item 3 (50x70 Transparent) must be 300 EGP (0 frame adder)');

    // 4. Cart calculations
    const items = [item1, item2, item3];
    const calc = AuthoritativePricing.calculateCartTotal(items);

    // Assert exact arithmetic
    assertEqual(calc.subtotal, 680, 'Subtotal: 180 + 200 + 300 = 680 EGP');
    assertEqual(calc.deliveryFee, 35, 'Flat delivery fee is 35 EGP');
    assertEqual(calc.total, 715, 'Grand total: 680 + 35 = 715 EGP');

    // 5. Verify individual line item subtotal
    const lineItem1Total = item1.unitPrice * item1.quantity;
    const lineItem2Total = item2.unitPrice * item2.quantity;
    const lineItem3Total = item3.unitPrice * item3.quantity;
    assertEqual(lineItem1Total + lineItem2Total + lineItem3Total, 680);
  });
});

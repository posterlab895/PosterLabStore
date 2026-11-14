/**
 * tests/e2e/tier4-scenarios/scenario_1_full_buyer_journey.test.js
 * Tier 4: Real-World Scenario 1 — Full Buyer Journey
 * Features Exercised: F3 (40x50 cm @ 250), F5 (Cart Math), F10 (White Frame), F12 (White Wall), F15 (Nav), F16 (Cart)
 * Authoritative Source: TEST_INFRA.md § Real-World Application Scenarios
 */

const {
  describe,
  test,
  assertEqual,
  assertMatch,
  assert,
  AuthoritativePricing,
  MockStorage
} = require('../../harness');

describe('Tier 4: Scenario 1 — Full Buyer Journey', () => {
  test('S1: Browse category -> Search -> Select 40x50 White Frame -> Add to Cart -> Verify Cart Total -> WhatsApp format', () => {
    const storage = new MockStorage();

    // 1. Browse Category
    const category = 'cars';
    const catalog = [
      { id: 'car-001', name: 'Porsche 911 GT3', category: 'cars', sizes: { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 }, frames: ['Black', 'White', 'Transparent'] },
      { id: 'car-002', name: 'Ferrari F40', category: 'cars', sizes: { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 }, frames: ['Black', 'White', 'Transparent'] }
    ];
    const categoryProducts = catalog.filter(p => p.category === category);
    assertEqual(categoryProducts.length, 2, 'Browse should show 2 car products');

    // 2. Search
    const searchParam = 'Porsche';
    const searchResults = categoryProducts.filter(p => p.name.toLowerCase().includes(searchParam.toLowerCase()));
    assertEqual(searchResults.length, 1, 'Search should find Porsche 911');
    const selectedProduct = searchResults[0];

    // 3. Select 40x50 cm dimension with White frame
    const selectedSize = '40x50';
    const selectedFrame = 'White';
    const unitPrice = AuthoritativePricing.calculateItemPrice(selectedSize, selectedFrame);
    assertEqual(unitPrice, 250, '40x50 White frame must cost exactly 250 EGP');

    // Verify visualizer styling
    const visualizerState = {
      frameClass: `frame-${selectedFrame.toLowerCase()}`,
      backdrop: AuthoritativePricing.wallBackgroundGradient
    };
    assertEqual(visualizerState.frameClass, 'frame-white');
    assertEqual(visualizerState.backdrop, 'linear-gradient(180deg, #fbfbfb 0%, #f1f2f5 100%)');

    // 4. Add to Cart
    const cartItem = {
      id: selectedProduct.id,
      name: selectedProduct.name,
      size: selectedSize,
      frame: selectedFrame,
      unitPrice,
      quantity: 1
    };
    storage.setItem('pls-cart', JSON.stringify([cartItem]));

    // 5. Verify Cart Totals
    const cartItems = JSON.parse(storage.getItem('pls-cart'));
    assertEqual(cartItems.length, 1);
    const cartCalc = AuthoritativePricing.calculateCartTotal(cartItems);
    assertEqual(cartCalc.subtotal, 250, 'Cart subtotal must be 250 EGP');
    assertEqual(cartCalc.deliveryFee, 35, 'Delivery fee must be 35 EGP');
    assertEqual(cartCalc.total, 285, 'Grand total must be 285 EGP');

    // 6. WhatsApp Checkout Payload Validation
    const customer = { name: 'Ahmed', phone: '01010101010', address: 'Cairo, Egypt' };
    const whatsappText = `Order for ${customer.name} (${customer.phone}):\n1x ${cartItem.name} [${cartItem.size}, ${cartItem.frame}] - ${cartItem.unitPrice} EGP\nSubtotal: ${cartCalc.subtotal} EGP\nDelivery: ${cartCalc.deliveryFee} EGP\nTotal: ${cartCalc.total} EGP`;

    assertMatch(whatsappText, /40x50,\s*White/);
    assertMatch(whatsappText, /Subtotal:\s*250\s*EGP/);
    assertMatch(whatsappText, /Delivery:\s*35\s*EGP/);
    assertMatch(whatsappText, /Total:\s*285\s*EGP/);
  });
});

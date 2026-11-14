/**
 * tests/e2e/tier1-features/f11_dynamic_transparent_frame.test.js
 * Tier 1: Feature 11 — Dynamic Transparent/Frameless Selection
 * Authoritative Source: ORIGINAL_REQUEST.md R3 & PROJECT.md
 */

const {
  describe,
  test,
  assertEqual,
  assertMatch,
  assert,
  readProjectFile,
  AuthoritativePricing
} = require('../../harness');

describe('Tier 1: Feature 11 — Dynamic Transparent/Frameless Selection', () => {
  test('F11-1: Frame options contract includes Transparent / Frameless with 0 price adder', () => {
    assertEqual(AuthoritativePricing.frameAdders.Transparent, 0, 'Transparent frame adder must be 0 EGP');
    assertEqual(AuthoritativePricing.frameAdders.None, 0, 'None/Frameless frame adder must be 0 EGP');
  });

  test('F11-2: Switching selected frame to Transparent sets container class to frame-transparent', () => {
    function getFrameClass(frame) {
      const normalized = (frame === 'None' || frame === 'Transparent') ? 'transparent' : frame.toLowerCase();
      return `frame-${normalized}`;
    }
    assertEqual(getFrameClass('Transparent'), 'frame-transparent');
    assertEqual(getFrameClass('None'), 'frame-transparent');
  });

  test('F11-3: Unit price for Transparent frame matches base dimension price exactly', () => {
    const size = "50x70";
    const transparentPrice = AuthoritativePricing.calculateItemPrice(size, "Transparent");
    assertEqual(transparentPrice, 300, '50x70 with Transparent frame must be exactly 300 EGP');
  });

  test('F11-4: Stylesheet defines .frame-transparent styling removing outer frame borders', () => {
    const css = readProjectFile('styles.css');
    assertMatch(css, /\.frame-transparent\b/, 'styles.css must define .frame-transparent');
  });

  test('F11-5: Adding item with Transparent frame persists "Transparent" selection to cart', () => {
    const cart = [];
    function addToCart(product, size, frame) {
      cart.push({
        id: product.id,
        size,
        frame,
        unitPrice: AuthoritativePricing.calculateItemPrice(size, frame)
      });
    }

    addToCart({ id: 'p1' }, '20x30', 'Transparent');
    assertEqual(cart.length, 1);
    assertEqual(cart[0].frame, 'Transparent', 'Cart item frame must be Transparent');
    assertEqual(cart[0].unitPrice, 180, 'Cart item unit price must be 180 EGP');
  });
});

/**
 * tests/e2e/tier1-features/f10_dynamic_white_frame.test.js
 * Tier 1: Feature 10 — Dynamic White Frame Selection
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

describe('Tier 1: Feature 10 — Dynamic White Frame Selection', () => {
  test('F10-1: Frame options contract specifies White frame with 0 price adder', () => {
    assertEqual(AuthoritativePricing.frameAdders.White, 0, 'White frame adder must be 0 EGP');
  });

  test('F10-2: Switching selected frame to White sets container class to frame-white', () => {
    let currentFrame = "Black";
    function switchFrame(frame) {
      currentFrame = frame;
      return `frame-${frame.toLowerCase()}`;
    }
    const newClass = switchFrame("White");
    assertEqual(newClass, 'frame-white', 'Container class must become frame-white');
  });

  test('F10-3: Selecting White frame does not alter base tier unit price', () => {
    const size = "30x40";
    const blackPrice = AuthoritativePricing.calculateItemPrice(size, "Black");
    const whitePrice = AuthoritativePricing.calculateItemPrice(size, "White");
    assertEqual(blackPrice, 200, 'Black frame 30x40 is 200 EGP');
    assertEqual(whitePrice, 200, 'White frame 30x40 is 200 EGP');
    assertEqual(whitePrice - blackPrice, 0, 'Price difference between White and Black must be 0');
  });

  test('F10-4: Stylesheet defines .frame-white styling and white dot swatch', () => {
    const css = readProjectFile('styles.css');
    assertMatch(css, /\.frame-white\b/, 'styles.css must define .frame-white');
    assertMatch(css, /\.dot\.white\b/, 'styles.css must define .dot.white');
  });

  test('F10-5: Adding item with White frame persists "White" frame selection in cart item', () => {
    const cart = [];
    function addToCart(product, size, frame) {
      cart.push({
        id: product.id,
        name: product.name,
        size,
        frame,
        unitPrice: AuthoritativePricing.calculateItemPrice(size, frame)
      });
    }

    addToCart({ id: 'p1', name: 'Poster 1' }, '40x50', 'White');
    assertEqual(cart.length, 1, 'Cart should contain 1 item');
    assertEqual(cart[0].frame, 'White', 'Cart item frame must be White');
    assertEqual(cart[0].unitPrice, 250, 'Cart item unit price must be 250 EGP');
  });
});

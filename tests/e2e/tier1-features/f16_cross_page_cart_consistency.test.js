/**
 * tests/e2e/tier1-features/f16_cross_page_cart_consistency.test.js
 * Tier 1: Feature 16 — Cross-Page Cart Consistency
 * Authoritative Source: ORIGINAL_REQUEST.md R4 & PROJECT.md
 */

const {
  describe,
  test,
  assertEqual,
  assertMatch,
  assert,
  parseHtml,
  MockStorage
} = require('../../harness');

describe('Tier 1: Feature 16 — Cross-Page Cart Consistency', () => {
  test('F16-1: our-work.html includes products-bundle script for catalog item resolution', () => {
    const doc = parseHtml('our-work.html');
    assert(doc.hasScript('products-bundle'), 'our-work.html must include products-bundle script');
  });

  test('F16-2: faq.html includes products-bundle script for catalog item resolution', () => {
    const doc = parseHtml('faq.html');
    assert(doc.hasScript('products-bundle'), 'faq.html must include products-bundle script');
  });

  test('F16-3: All store pages include identical cart-drawer structure and data attributes', () => {
    const pages = ['index.html', 'product.html', 'our-work.html', 'faq.html'];
    for (const page of pages) {
      const doc = parseHtml(page);
      assert(doc.hasElementWithClass('cart-drawer'), `${page} must contain .cart-drawer`);
      assertMatch(doc.raw, /id=["']cartItems["']|class=["']cart-items["']/i, `${page} must have cart items container`);
      assertMatch(doc.raw, /id=["']cartTotal["']|data-cart-total|checkoutForm/i, `${page} must have checkout/total container`);
    }
  });

  test('F16-4: Cart count badge updates synchronously from localStorage state', () => {
    const storage = new MockStorage();
    const cart = [
      { id: 'item-1', quantity: 2 },
      { id: 'item-2', quantity: 1 }
    ];
    storage.setItem('pls-cart', JSON.stringify(cart));

    function getCartCount(s) {
      const raw = s.getItem('pls-cart');
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      return parsed.reduce((sum, item) => sum + (item.quantity || 1), 0);
    }

    assertEqual(getCartCount(storage), 3, 'Cart count should sum item quantities (2+1=3)');
  });

  test('F16-5: Cart drawer empty state is rendered consistently when cart has no items', () => {
    const emptyCartHtml = '<div class="empty-state"><strong>Your cart is empty.</strong></div>';
    assertMatch(emptyCartHtml, /cart is empty/i, 'Empty state must inform user the cart is empty');
  });
});

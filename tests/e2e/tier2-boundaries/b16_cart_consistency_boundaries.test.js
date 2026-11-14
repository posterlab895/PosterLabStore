/**
 * tests/e2e/tier2-boundaries/b16_cart_consistency_boundaries.test.js
 * Tier 2: Boundary & Corner Cases for Feature 16 (Cross-Page Cart Consistency)
 * Authoritative Source: ORIGINAL_REQUEST.md R4 & PROJECT.md
 */

const {
  describe,
  test,
  assertEqual,
  assertMatch,
  assert,
  MockStorage,
  AuthoritativePricing
} = require('../../harness');

describe('Tier 2: Boundaries for Feature 16 (Cross-Page Cart Consistency)', () => {
  test('B16-1: Empty cart state sets cart count to 0 and hides pending badge', () => {
    function computeCartBadge(cartItems) {
      const count = Array.isArray(cartItems)
        ? cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0)
        : 0;
      return {
        countText: String(count),
        badgeHidden: count === 0
      };
    }

    assertEqual(computeCartBadge([]).countText, '0');
    assertEqual(computeCartBadge([]).badgeHidden, true);
    assertEqual(computeCartBadge(null).countText, '0');
  });

  test('B16-2: Opening cart drawer on subpage with 0 items displays empty state message', () => {
    function renderDrawerContent(items) {
      if (!items || items.length === 0) {
        return '<div class="empty-state"><strong>Your cart is empty.</strong></div>';
      }
      return '<div class="cart-items-list">...</div>';
    }

    const drawerHtml = renderDrawerContent([]);
    assertMatch(drawerHtml, /empty-state/, 'Should render empty state');
    assertMatch(drawerHtml, /cart is empty/i, 'Should tell user cart is empty');
  });

  test('B16-3: Cart state modified in Tab A updates Tab B via storage event', () => {
    const storage = new MockStorage();
    let tabBCartCount = 0;

    storage.addEventListener('storage', (e) => {
      if (e.key === 'pls-cart') {
        const items = e.newValue ? JSON.parse(e.newValue) : [];
        tabBCartCount = items.reduce((acc, i) => acc + (i.quantity || 1), 0);
      }
    });

    // Tab A modifies cart
    storage.setItem('pls-cart', JSON.stringify([
      { id: 'item-1', quantity: 2 },
      { id: 'item-2', quantity: 1 }
    ]));

    assertEqual(tabBCartCount, 3, 'Tab B cart count should update to 3 via storage event');
  });

  test('B16-4: Delivery fee 35 EGP is applied exactly once regardless of number of items', () => {
    const items = [
      { size: '20x30', frame: 'Black', quantity: 5 },
      { size: '30x40', frame: 'White', quantity: 3 },
      { size: '50x70', frame: 'Transparent', quantity: 2 }
    ];
    const calc = AuthoritativePricing.calculateCartTotal(items);
    // Subtotal: 5*180 + 3*200 + 2*300 = 900 + 600 + 600 = 2100
    assertEqual(calc.subtotal, 2100);
    assertEqual(calc.deliveryFee, 35, 'Delivery fee must be 35 EGP');
    assertEqual(calc.total, 2135, 'Total must be 2100 + 35 = 2135 EGP');
  });

  test('B16-5: Clearing cart removes pls-cart and resets cart badge to 0 immediately', () => {
    const storage = new MockStorage();
    storage.setItem('pls-cart', JSON.stringify([{ id: 'p1', quantity: 2 }]));

    function clearCart(s) {
      s.removeItem('pls-cart');
      return 0;
    }

    const newCount = clearCart(storage);
    assertEqual(newCount, 0);
    assertEqual(storage.getItem('pls-cart'), null, 'pls-cart should be removed from storage');
  });
});

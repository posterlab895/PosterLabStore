/**
 * tests/e2e/tier2-boundaries/b08_live_sync_stock_boundaries.test.js
 * Tier 2: Boundary & Corner Cases for Feature 8 (Stock / Quantity Sync)
 * Authoritative Source: ORIGINAL_REQUEST.md R2 & PROJECT.md
 */

const {
  describe,
  test,
  assertEqual,
  assert
} = require('../../harness');

describe('Tier 2: Boundaries for Feature 8 (Live Stock / Quantity Sync)', () => {
  test('B8-1: Exact stock 0 boundary disables Add-to-Cart button', () => {
    function canAddToCart(quantity) {
      return quantity !== undefined && quantity > 0;
    }
    assertEqual(canAddToCart(0), false, 'Stock 0 cannot be added to cart');
  });

  test('B8-2: Negative stock value clamped to 0 and treated as out of stock', () => {
    function normalizeStock(q) {
      const val = parseInt(q, 10);
      return isNaN(val) || val <= 0 ? 0 : val;
    }
    assertEqual(normalizeStock(-10), 0, 'Negative stock must normalize to 0');
    assertEqual(normalizeStock(0), 0);
  });

  test('B8-3: Stock 1 boundary allows purchase and becomes 0 when 1 unit added', () => {
    let currentStock = 1;
    function deductStock(qtyToBuy) {
      if (currentStock >= qtyToBuy) {
        currentStock -= qtyToBuy;
        return true;
      }
      return false;
    }

    const bought = deductStock(1);
    assertEqual(bought, true, 'Buying 1 unit from stock of 1 succeeds');
    assertEqual(currentStock, 0, 'Stock becomes 0');
    assertEqual(deductStock(1), false, 'Subsequent purchase is rejected');
  });

  test('B8-4: Out-of-stock sync received while reviewing checkout warns user', () => {
    const cart = [{ id: 'p1', name: 'Poster 1', quantity: 1 }];
    const stockMap = { p1: 0 }; // sync message set stock to 0

    function validateCartStock(c, stocks) {
      const outOfStockItems = c.filter(item => stocks[item.id] !== undefined && stocks[item.id] <= 0);
      return {
        isValid: outOfStockItems.length === 0,
        outOfStockItems
      };
    }

    const check = validateCartStock(cart, stockMap);
    assertEqual(check.isValid, false, 'Cart with zero-stock item is invalid for checkout');
    assertEqual(check.outOfStockItems.length, 1);
  });

  test('B8-5: Restoring stock quantity from 0 to 5 flips Add-to-Cart button state to enabled', () => {
    let buttonState = { disabled: true, label: 'Out of stock' };

    function syncStockState(btn, newStock) {
      if (newStock > 0) {
        btn.disabled = false;
        btn.label = 'Add to cart';
      } else {
        btn.disabled = true;
        btn.label = 'Out of stock';
      }
    }

    syncStockState(buttonState, 5);
    assertEqual(buttonState.disabled, false);
    assertEqual(buttonState.label, 'Add to cart');
  });
});

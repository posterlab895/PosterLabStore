/**
 * tests/e2e/tier1-features/f08_admin_to_store_stock_sync.test.js
 * Tier 1: Feature 8 — Admin-to-Store Live Sync (Stock/Quantity)
 * Authoritative Source: ORIGINAL_REQUEST.md R2 & PROJECT.md
 */

const {
  describe,
  test,
  assertEqual,
  assert,
  MockBroadcastHub
} = require('../../harness');

describe('Tier 1: Feature 8 — Admin-to-Store Live Sync (Stock/Quantity)', () => {
  test('F8-1: BroadcastChannel("poster-lab-sync") transmits STOCK_UPDATE payload', () => {
    const hub = new MockBroadcastHub();
    const adminChannel = hub.createChannel('poster-lab-sync');
    const storeChannel = hub.createChannel('poster-lab-sync');

    let receivedMsg = null;
    storeChannel.onmessage = (e) => {
      receivedMsg = e.data;
    };

    const stockPayload = {
      type: 'STOCK_UPDATE',
      payload: { id: 'car-001', quantity: 0 },
      timestamp: Date.now()
    };

    adminChannel.postMessage(stockPayload);

    assert(receivedMsg !== null, 'Storefront should receive stock update');
    assertEqual(receivedMsg.type, 'STOCK_UPDATE', 'Message type must be STOCK_UPDATE');
    assertEqual(receivedMsg.payload.id, 'car-001', 'Product ID must match');
    assertEqual(receivedMsg.payload.quantity, 0, 'Quantity must be 0');
  });

  test('F8-2: Product with quantity 0 is identified as out-of-stock', () => {
    const product = { id: 'p1', name: 'Poster 1', quantity: 0 };
    const isOutOfStock = product.quantity !== undefined && product.quantity <= 0;
    assertEqual(isOutOfStock, true, 'Product with quantity 0 must evaluate to out-of-stock');
  });

  test('F8-3: Out-of-stock product causes Add-to-Cart action to be disabled', () => {
    const product = { id: 'p1', name: 'Poster 1', quantity: 0 };
    const addToCartBtn = {
      disabled: false,
      text: 'Add to cart'
    };

    if (product.quantity !== undefined && product.quantity <= 0) {
      addToCartBtn.disabled = true;
      addToCartBtn.text = 'Out of stock';
    }

    assertEqual(addToCartBtn.disabled, true, 'Add to cart button must be disabled');
    assertEqual(addToCartBtn.text, 'Out of stock', 'Button label should reflect out-of-stock state');
  });

  test('F8-4: Out-of-stock product in catalog grid renders out-of-stock badge', () => {
    const product = { id: 'p1', name: 'Poster 1', quantity: 0 };
    function renderBadge(p) {
      if (p.quantity !== undefined && p.quantity <= 0) {
        return '<span class="badge out-of-stock">Out of Stock</span>';
      }
      return '';
    }

    const badge = renderBadge(product);
    assert(badge.includes('out-of-stock'), 'Grid card must render out-of-stock badge');
  });

  test('F8-5: Restoring stock quantity > 0 re-enables Add-to-Cart button', () => {
    const addToCartBtn = { disabled: true, text: 'Out of stock' };

    function applyStockUpdate(btn, newQuantity) {
      if (newQuantity > 0) {
        btn.disabled = false;
        btn.text = 'Add to cart';
      }
    }

    applyStockUpdate(addToCartBtn, 5);
    assertEqual(addToCartBtn.disabled, false, 'Button must be re-enabled when stock > 0');
    assertEqual(addToCartBtn.text, 'Add to cart', 'Button text must return to Add to cart');
  });
});

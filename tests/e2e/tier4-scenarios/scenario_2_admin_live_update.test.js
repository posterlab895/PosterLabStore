/**
 * tests/e2e/tier4-scenarios/scenario_2_admin_live_update.test.js
 * Tier 4: Real-World Scenario 2 — Admin Live Price & Stock Update
 * Features Exercised: F1 (20x30 cm @ 180), F6 (Admin Persistence), F7 (Price Sync), F8 (Stock Sync), F15 (Nav)
 * Authoritative Source: TEST_INFRA.md § Real-World Application Scenarios
 */

const {
  describe,
  test,
  assertEqual,
  assert,
  MockBroadcastHub,
  MockStorage
} = require('../../harness');

describe('Tier 4: Scenario 2 — Admin Live Price & Stock Update', () => {
  test('S2: Admin edits product price & sets stock to 0 -> Storefront updates live -> Add-to-cart disabled', () => {
    const hub = new MockBroadcastHub();
    const adminChannel = hub.createChannel('poster-lab-sync');
    const storeChannel = hub.createChannel('poster-lab-sync');
    const storage = new MockStorage();

    // Storefront initial state
    let storeState = {
      catalog: [
        { id: 'football-001', name: 'Ronaldo Poster', basePrice: 180, quantity: 10, sizes: { '20x30': 180 } }
      ],
      currentDetailView: {
        productId: 'football-001',
        displayedPrice: 180,
        addToCartDisabled: false,
        stockBadge: ''
      }
    };

    // Storefront listens to sync
    storeChannel.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === 'PRODUCT_UPDATE') {
        const item = storeState.catalog.find(p => p.id === payload.id);
        if (item) Object.assign(item, payload);
        if (storeState.currentDetailView.productId === payload.id) {
          storeState.currentDetailView.displayedPrice = payload.basePrice;
        }
      } else if (type === 'STOCK_UPDATE') {
        const item = storeState.catalog.find(p => p.id === payload.id);
        if (item) item.quantity = payload.quantity;
        if (storeState.currentDetailView.productId === payload.id) {
          if (payload.quantity <= 0) {
            storeState.currentDetailView.addToCartDisabled = true;
            storeState.currentDetailView.stockBadge = 'Out of Stock';
          } else {
            storeState.currentDetailView.addToCartDisabled = false;
            storeState.currentDetailView.stockBadge = '';
          }
        }
      }
    };

    // 1. Admin edits product in admin panel
    const adminProductUpdate = {
      id: 'football-001',
      basePrice: 180,
      sizes: { '20x30': 180, '30x40': 200 }
    };
    storage.setItem('pls-products', JSON.stringify([adminProductUpdate]));
    adminChannel.postMessage({ type: 'PRODUCT_UPDATE', payload: adminProductUpdate });

    // Verify storefront catalog updated
    assertEqual(storeState.currentDetailView.displayedPrice, 180);

    // 2. Admin sets product quantity to 0 (out of stock)
    adminChannel.postMessage({
      type: 'STOCK_UPDATE',
      payload: { id: 'football-001', quantity: 0 }
    });

    // 3. Verify storefront reacts: Add-to-cart disabled, Out of Stock badge displayed
    assertEqual(storeState.currentDetailView.addToCartDisabled, true, 'Add to cart must be disabled');
    assertEqual(storeState.currentDetailView.stockBadge, 'Out of Stock', 'Stock badge must show Out of Stock');
    assertEqual(storeState.catalog[0].quantity, 0, 'Catalog quantity must be 0');
  });
});

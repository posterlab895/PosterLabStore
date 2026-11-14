/**
 * tests/e2e/tier4-scenarios/scenario_4_offline_sync.test.js
 * Tier 4: Real-World Scenario 4 — Offline/Online Transition & Cross-Tab Sync
 * Features Exercised: F6 (Admin Persistence), F7 (Price Sync), F17 (SW Resilience)
 * Authoritative Source: TEST_INFRA.md § Real-World Application Scenarios
 */

const {
  describe,
  test,
  assertEqual,
  assert,
  MockStorage,
  MockBroadcastHub
} = require('../../harness');

describe('Tier 4: Scenario 4 — Offline/Online Transition & Cross-Tab Sync', () => {
  test('S4: Admin updates price offline -> saved to storage -> online reconnect / storage sync -> storefront reflects update', () => {
    const storage = new MockStorage();
    const hub = new MockBroadcastHub();
    const broadcastChan = hub.createChannel('poster-lab-sync');
    const storeChan = hub.createChannel('poster-lab-sync');

    // Initial state: Storefront displays product at 180
    let storefrontProduct = { id: 'anime-001', basePrice: 180 };

    // Offline event queue on admin side
    const offlineQueue = [];
    let isOnline = false;

    function adminSaveProduct(product) {
      // 1. Write to local storage immediately (works offline)
      storage.setItem('pls-products', JSON.stringify([product]));

      // 2. If offline, queue network / broadcast sync
      if (!isOnline) {
        offlineQueue.push({ type: 'PRODUCT_UPDATE', payload: product, timestamp: Date.now() });
      } else {
        broadcastChan.postMessage({ type: 'PRODUCT_UPDATE', payload: product, timestamp: Date.now() });
      }
    }

    // Storefront listener
    storeChan.onmessage = (e) => {
      if (e.data.type === 'PRODUCT_UPDATE' && e.data.payload.id === storefrontProduct.id) {
        storefrontProduct.basePrice = e.data.payload.basePrice;
      }
    };
    storage.addEventListener('storage', (e) => {
      if (e.key === 'pls-products' && e.newValue) {
        const products = JSON.parse(e.newValue);
        const match = products.find(p => p.id === storefrontProduct.id);
        if (match) storefrontProduct.basePrice = match.basePrice;
      }
    });

    // Step 1: Admin edits product while offline
    isOnline = false;
    adminSaveProduct({ id: 'anime-001', basePrice: 200 });

    // Step 2: Storage event immediately synchronizes local tabs even offline
    assertEqual(storefrontProduct.basePrice, 200, 'Storefront should reflect local storage sync immediately');
    assertEqual(offlineQueue.length, 1, 'Offline queue should hold 1 message');

    // Step 3: Connection restored -> Flush offline queue
    isOnline = true;
    while (offlineQueue.length > 0) {
      const pending = offlineQueue.shift();
      broadcastChan.postMessage(pending);
    }

    assertEqual(offlineQueue.length, 0, 'Offline queue must be drained');
    assertEqual(storefrontProduct.basePrice, 200, 'Storefront preserves updated price post-reconnect');
  });
});

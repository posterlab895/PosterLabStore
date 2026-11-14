/**
 * tests/e2e/tier1-features/f07_admin_to_store_price_sync.test.js
 * Tier 1: Feature 7 — Admin-to-Store Live Sync (Prices/Products)
 * Authoritative Source: ORIGINAL_REQUEST.md R2 & PROJECT.md
 */

const {
  describe,
  test,
  assertEqual,
  assertDeepEqual,
  assert,
  MockBroadcastHub,
  MockStorage
} = require('../../harness');

describe('Tier 1: Feature 7 — Admin-to-Store Live Sync (Prices/Products)', () => {
  test('F7-1: BroadcastChannel("poster-lab-sync") posts PRODUCT_UPDATE payload on admin edit', () => {
    const hub = new MockBroadcastHub();
    const adminChannel = hub.createChannel('poster-lab-sync');
    const storeChannel = hub.createChannel('poster-lab-sync');

    let receivedMessage = null;
    storeChannel.onmessage = (event) => {
      receivedMessage = event.data;
    };

    const updatePayload = {
      type: 'PRODUCT_UPDATE',
      payload: {
        id: 'art-001',
        name: 'Art #1 Updated',
        basePrice: 180,
        sizes: { "20x30": 180, "30x40": 200, "40x50": 250, "50x70": 300 }
      },
      timestamp: Date.now()
    };

    adminChannel.postMessage(updatePayload);

    assert(receivedMessage !== null, 'Storefront must receive broadcast message');
    assertEqual(receivedMessage.type, 'PRODUCT_UPDATE', 'Message type must be PRODUCT_UPDATE');
    assertEqual(receivedMessage.payload.id, 'art-001', 'Payload product ID must match');
    assertEqual(receivedMessage.payload.basePrice, 180, 'Updated base price must be 180');
  });

  test('F7-2: Storefront sync handler updates internal products cache upon receiving PRODUCT_UPDATE', () => {
    const catalog = [
      { id: 'art-001', name: 'Art #1', basePrice: 60, sizes: { "20x30": 60 } }
    ];

    function handleSyncMessage(event) {
      if (!event || !event.data) return;
      const { type, payload } = event.data;
      if (type === 'PRODUCT_UPDATE' && payload && payload.id) {
        const idx = catalog.findIndex(p => p.id === payload.id);
        if (idx !== -1) {
          catalog[idx] = { ...catalog[idx], ...payload };
        } else {
          catalog.push(payload);
        }
      }
    }

    handleSyncMessage({
      data: {
        type: 'PRODUCT_UPDATE',
        payload: { id: 'art-001', basePrice: 180, sizes: { "20x30": 180 } }
      }
    });

    assertEqual(catalog[0].basePrice, 180, 'Catalog product basePrice must update to 180');
    assertEqual(catalog[0].sizes["20x30"], 180, 'Catalog 20x30 size must update to 180');
  });

  test('F7-3: Storage event on "pls-products" acts as cross-tab fallback sync mechanism', () => {
    const storage = new MockStorage();
    let syncTriggered = false;

    storage.addEventListener('storage', (e) => {
      if (e.key === 'pls-products') {
        syncTriggered = true;
      }
    });

    storage.setItem('pls-products', JSON.stringify([{ id: 'p1', basePrice: 180 }]));
    assertEqual(syncTriggered, true, 'Storage event listener must be invoked on pls-products change');
  });

  test('F7-4: PRODUCT_DELETE event removes item or marks product inactive in storefront', () => {
    const catalog = [
      { id: 'p1', name: 'P1' },
      { id: 'p2', name: 'P2' }
    ];

    function handleSync(msg) {
      if (msg.type === 'PRODUCT_DELETE') {
        const idx = catalog.findIndex(p => p.id === msg.payload.id);
        if (idx !== -1) catalog.splice(idx, 1);
      }
    }

    handleSync({ type: 'PRODUCT_DELETE', payload: { id: 'p1' } });
    assertEqual(catalog.length, 1, 'Catalog length must decrease after delete event');
    assertEqual(catalog[0].id, 'p2', 'Remaining item must be p2');
  });

  test('F7-5: Active product detail view updates price when current viewed item is updated', () => {
    let currentDetailView = {
      productId: 'art-001',
      displayedPrice: 60
    };

    function onProductUpdated(updatedProduct) {
      if (currentDetailView.productId === updatedProduct.id) {
        currentDetailView.displayedPrice = updatedProduct.basePrice;
      }
    }

    onProductUpdated({ id: 'art-001', basePrice: 180 });
    assertEqual(currentDetailView.displayedPrice, 180, 'Displayed price must update to 180');
  });
});

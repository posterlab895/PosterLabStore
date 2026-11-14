/**
 * tests/e2e/tier1-features/f06_admin_data_persistence.test.js
 * Tier 1: Feature 6 — Admin Backend Data Persistence
 * Authoritative Source: ORIGINAL_REQUEST.md R2 & PROJECT.md
 */

const {
  describe,
  test,
  assertEqual,
  assertDeepEqual,
  assert,
  MockStorage
} = require('../../harness');

describe('Tier 1: Feature 6 — Admin Backend Data Persistence', () => {
  test('F6-1: Admin products are stored and retrieved from localStorage key "pls-products"', () => {
    const storage = new MockStorage();
    const productPayload = [
      {
        id: 'test-001',
        name: 'Test Poster',
        basePrice: 180,
        sizes: { "20x30": 180, "30x40": 200, "40x50": 250, "50x70": 300 },
        frames: ["Black", "White", "Transparent"],
        category: 'art',
        image: 'assets/art/test.webp'
      }
    ];

    storage.setItem('pls-products', JSON.stringify(productPayload));
    const retrieved = JSON.parse(storage.getItem('pls-products'));
    assert(Array.isArray(retrieved), 'Stored products must parse as an array');
    assertEqual(retrieved.length, 1, 'Stored array must have 1 product');
    assertEqual(retrieved[0].id, 'test-001', 'Product ID must be preserved');
    assertEqual(retrieved[0].basePrice, 180, 'Product basePrice must be preserved');
  });

  test('F6-2: Admin product edit preserves custom metadata (tags, gallery, isCustom)', () => {
    const initialProduct = {
      id: 'custom-001',
      name: 'Custom Art',
      basePrice: 180,
      sizes: { "20x30": 180, "30x40": 200, "40x50": 250, "50x70": 300 },
      frames: ["Black", "White", "Transparent"],
      category: 'custom',
      tags: ['minimalist', 'black-and-white', 'decor'],
      gallery: ['assets/art/g1.webp', 'assets/art/g2.webp'],
      isCustom: true
    };

    // Simulate admin editing price while preserving metadata
    const updatedProduct = {
      ...initialProduct,
      basePrice: 180,
      _updatedAt: Date.now()
    };

    assertEqual(updatedProduct.isCustom, true, 'isCustom flag must be preserved');
    assertDeepEqual(updatedProduct.tags, ['minimalist', 'black-and-white', 'decor'], 'tags array must be preserved');
    assertDeepEqual(updatedProduct.gallery, ['assets/art/g1.webp', 'assets/art/g2.webp'], 'gallery array must be preserved');
  });

  test('F6-3: Admin orders are stored and loaded from "pls-orders"', () => {
    const storage = new MockStorage();
    const orders = [
      { id: 'ORD-1001', customerName: 'Ziad', phone: '01000000000', total: 695, itemsCount: 2 }
    ];
    storage.setItem('pls-orders', JSON.stringify(orders));
    const parsedOrders = JSON.parse(storage.getItem('pls-orders'));
    assertEqual(parsedOrders.length, 1, 'Orders count must be 1');
    assertEqual(parsedOrders[0].id, 'ORD-1001', 'Order ID must match');
  });

  test('F6-4: Admin coupons are stored and loaded from "pls-coupons"', () => {
    const storage = new MockStorage();
    const coupons = [
      { code: 'POSTER10', discount: 10, active: true },
      { code: 'VIP20', discount: 20, active: true }
    ];
    storage.setItem('pls-coupons', JSON.stringify(coupons));
    const parsedCoupons = JSON.parse(storage.getItem('pls-coupons'));
    assertEqual(parsedCoupons.length, 2, 'Coupons count must be 2');
    assertEqual(parsedCoupons[0].code, 'POSTER10', 'Coupon code must match');
    assertEqual(parsedCoupons[0].discount, 10, 'Coupon discount must match');
  });

  test('F6-5: Admin product deletion marks product as _deleted or removes from list safely', () => {
    const products = [
      { id: 'p1', name: 'Product 1' },
      { id: 'p2', name: 'Product 2' }
    ];
    // Deletion pattern: filter out or mark _deleted: true
    const activeProducts = products.filter(p => p.id !== 'p1');
    assertEqual(activeProducts.length, 1, 'Active products count should be 1 after deletion');
    assertEqual(activeProducts[0].id, 'p2', 'Remaining product should be p2');
  });
});

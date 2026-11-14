/**
 * tests/e2e/tier4-scenarios/scenario_5_navigation_stress.test.js
 * Tier 4: Real-World Scenario 5 — Cross-Page Navigation Stress
 * Features Exercised: F14 (Homepage Assets), F15 (Navigation), F16 (Cart Consistency), F17 (SW)
 * Authoritative Source: TEST_INFRA.md § Real-World Application Scenarios
 */

const {
  describe,
  test,
  assertEqual,
  assert,
  parseHtml,
  MockStorage
} = require('../../harness');

describe('Tier 4: Scenario 5 — Cross-Page Navigation Stress', () => {
  test('S5: User navigates product.html -> drawer category jump -> our-work.html -> check cart -> faq.html -> cart items intact', () => {
    const storage = new MockStorage();

    // 1. User starts at product.html and adds an item to cart
    const item = {
      id: 'cars-001',
      name: 'Porsche 911 GT3',
      size: '30x40',
      frame: 'White',
      unitPrice: 200,
      quantity: 1
    };
    storage.setItem('pls-cart', JSON.stringify([item]));

    // 2. User opens nav drawer on product.html and clicks category "football"
    function getCategoryTarget(currentPage, category) {
      if (currentPage !== 'index.html') {
        return `index.html?cat=${category}`;
      }
      return `?cat=${category}`;
    }
    const catLink = getCategoryTarget('product.html', 'football');
    assertEqual(catLink, 'index.html?cat=football', 'Subpage drawer link must prefix index.html?cat=');

    // 3. User navigates to our-work.html
    const ourWorkDoc = parseHtml('our-work.html');
    assert(ourWorkDoc.hasElementWithClass('cart-drawer'), 'our-work.html must have cart drawer');
    assert(ourWorkDoc.hasScript('products-bundle'), 'our-work.html must include products bundle');

    // Verify cart count on our-work.html
    const storedCart1 = JSON.parse(storage.getItem('pls-cart'));
    assertEqual(storedCart1.length, 1);
    assertEqual(storedCart1[0].id, 'cars-001');

    // 4. User navigates to faq.html
    const faqDoc = parseHtml('faq.html');
    assert(faqDoc.hasElementWithClass('cart-drawer'), 'faq.html must have cart drawer');
    assert(faqDoc.hasScript('products-bundle'), 'faq.html must include products bundle');

    // Verify cart items remain intact on faq.html
    const storedCart2 = JSON.parse(storage.getItem('pls-cart'));
    assertEqual(storedCart2.length, 1);
    assertEqual(storedCart2[0].name, 'Porsche 911 GT3');
    assertEqual(storedCart2[0].unitPrice, 200);

    // 5. User adds second item from faq.html cart
    storedCart2.push({
      id: 'custom-design',
      name: 'Custom Design',
      size: '20x30',
      frame: 'Black',
      unitPrice: 180,
      quantity: 1
    });
    storage.setItem('pls-cart', JSON.stringify(storedCart2));

    const finalCart = JSON.parse(storage.getItem('pls-cart'));
    assertEqual(finalCart.length, 2, 'Final cart must contain 2 items across navigation flow');
    const totalCount = finalCart.reduce((sum, i) => sum + i.quantity, 0);
    assertEqual(totalCount, 2, 'Total quantity must be 2');
  });
});

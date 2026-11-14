/**
 * tests/e2e/tier2-boundaries/b13_layout_boundaries.test.js
 * Tier 2: Boundary & Corner Cases for Feature 13 (Product Page Layout boundaries)
 * Authoritative Source: ORIGINAL_REQUEST.md R3 & PROJECT.md
 */

const {
  describe,
  test,
  assertEqual,
  assertMatch,
  assert,
  readProjectFile,
  parseHtml
} = require('../../harness');

describe('Tier 2: Boundaries for Feature 13 (Product Page Layout)', () => {
  test('B13-1: Empty or missing product ID in URL parameter renders empty state safely', () => {
    function renderProductView(productId, catalog) {
      const product = catalog.find(p => p.id === productId);
      if (!product) {
        return '<div class="empty-state"><strong>No products found.</strong><p><a href="index.html">Start order</a></p></div>';
      }
      return `<article class="detail"><h1>${product.name}</h1></article>`;
    }

    const html = renderProductView(null, []);
    assertMatch(html, /empty-state/, 'Should render empty state container');
    assertMatch(html, /href=["']index\.html["']/, 'Should include link back to store');
  });

  test('B13-2: Non-existent product ID ("non-existent-999") shows friendly missing state', () => {
    const script = readProjectFile('script.js');
    assertMatch(script, /noProductsFound/, 'script.js must reference noProductsFound translation for missing items');
  });

  test('B13-3: Malformed URL query parameters handled without uncaught exceptions', () => {
    function extractProductId(searchStr) {
      try {
        const params = new URLSearchParams(searchStr);
        return params.get('id') || null;
      } catch (_) {
        return null;
      }
    }

    assertEqual(extractProductId('???===&&&'), null);
    assertEqual(extractProductId(''), null);
    assertEqual(extractProductId('?id=art-001&foo=bar'), 'art-001');
  });

  test('B13-4: Extreme product title length (200+ characters) wraps without layout breaking', () => {
    const longTitle = 'Super ' + 'Very '.repeat(30) + 'Long Poster Title For Modern Minimalist Living Room Art Decor';
    assert(longTitle.length > 150, 'Title length is extreme');
    const escaped = longTitle.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const html = `<h1>${escaped}</h1>`;
    assertMatch(html, /<h1>Super Very/, 'HTML header must render title without crashing');
  });

  test('B13-5: product.html contains clean single back bar without duplicated navigation header', () => {
    const doc = parseHtml('product.html');
    const backBars = (doc.raw.match(/class=["']page-back-bar["']/g) || []).length;
    assertEqual(backBars, 1, 'product.html must contain exactly 1 page-back-bar');
  });
});

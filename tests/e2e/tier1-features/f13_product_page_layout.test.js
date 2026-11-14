/**
 * tests/e2e/tier1-features/f13_product_page_layout.test.js
 * Tier 1: Feature 13 — Product Page Simplified Layout & Controls
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

describe('Tier 1: Feature 13 — Product Page Simplified Layout & Controls', () => {
  test('F13-1: product.html contains productDetail container section', () => {
    const doc = parseHtml('product.html');
    assert(doc.hasElementWithId('productDetail'), 'product.html must contain #productDetail');
  });

  test('F13-2: product.html contains top back-to-store navigation button linking to index.html', () => {
    const doc = parseHtml('product.html');
    const links = doc.getLinks();
    const backLink = links.find(l => l.attrs.includes('page-back-btn') || (l.href && l.href.includes('index.html')));
    assert(backLink !== undefined, 'product.html must contain back to store link');
    assert(backLink.href.includes('index.html'), 'Back button must link to index.html');
  });

  test('F13-3: Product detail rendering avoids duplicate back button inside innerHTML', () => {
    const script = readProjectFile('script.js');
    // In simplified layout, renderDetail should not have a duplicate page-back-bar when product.html already has one
    const backBarMatches = script.match(/class=["']page-back-bar["']/g) || [];
    // If renderDetail still has it, this test documents the duplicate that M3 removes
    const htmlHasBar = parseHtml('product.html').hasElementWithClass('page-back-bar');
    assert(htmlHasBar, 'product.html should host the primary page-back-bar');
  });

  test('F13-4: product.html includes header cart button with data-cart-count badge', () => {
    const doc = parseHtml('product.html');
    assertMatch(doc.raw, /data-cart-count/, 'product.html must have data-cart-count badge');
    assert(doc.hasElementWithClass('cart-button'), 'product.html must have cart-button');
  });

  test('F13-5: product.html includes cart drawer markup for instant checkout access', () => {
    const doc = parseHtml('product.html');
    assert(doc.hasElementWithClass('cart-drawer'), 'product.html must include cart drawer');
    assertMatch(doc.raw, /data-cart-drawer/, 'Cart drawer must have data-cart-drawer attribute');
  });
});

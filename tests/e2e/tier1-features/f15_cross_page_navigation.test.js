/**
 * tests/e2e/tier1-features/f15_cross_page_navigation.test.js
 * Tier 1: Feature 15 — Cross-Page Navigation & Drawer Integrity
 * Authoritative Source: ORIGINAL_REQUEST.md R4 & PROJECT.md
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

describe('Tier 1: Feature 15 — Cross-Page Navigation & Drawer Integrity', () => {
  test('F15-1: script.js prefixes category links with index.html?cat= for cross-page compatibility', () => {
    const script = readProjectFile('script.js');
    // Navigation drawer category items must target index.html?cat= so navigating from subpages works
    assertMatch(script, /index\.html\?cat=|\?cat=/, 'Category navigation links should support query parameter routing');
  });

  test('F15-2: All store pages (index, product, our-work, faq) include nav-drawer aside markup', () => {
    const pages = ['index.html', 'product.html', 'our-work.html', 'faq.html'];
    for (const page of pages) {
      const doc = parseHtml(page);
      assert(doc.hasElementWithClass('nav-drawer'), `${page} must contain .nav-drawer`);
      assertMatch(doc.raw, /data-nav-drawer/, `${page} must contain data-nav-drawer attribute`);
    }
  });

  test('F15-3: All store pages provide hamburger button wired with data-open-nav', () => {
    const pages = ['index.html', 'product.html', 'our-work.html', 'faq.html'];
    for (const page of pages) {
      const doc = parseHtml(page);
      assertMatch(doc.raw, /data-open-nav/, `${page} must have data-open-nav button`);
    }
  });

  test('F15-4: Nav drawer includes close button wired with data-close-nav', () => {
    const pages = ['index.html', 'product.html', 'our-work.html', 'faq.html'];
    for (const page of pages) {
      const doc = parseHtml(page);
      assertMatch(doc.raw, /data-close-nav/, `${page} must have data-close-nav button`);
    }
  });

  test('F15-5: Brand link in header leads back to index.html on every page', () => {
    const pages = ['index.html', 'product.html', 'our-work.html', 'faq.html'];
    for (const page of pages) {
      const doc = parseHtml(page);
      assertMatch(doc.raw, /href=["']index\.html["']/, `${page} brand mark must link to index.html`);
    }
  });
});

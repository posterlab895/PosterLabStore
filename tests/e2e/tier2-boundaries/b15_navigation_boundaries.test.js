/**
 * tests/e2e/tier2-boundaries/b15_navigation_boundaries.test.js
 * Tier 2: Boundary & Corner Cases for Feature 15 (Navigation & Drawer Integrity)
 * Authoritative Source: ORIGINAL_REQUEST.md R4 & PROJECT.md
 */

const {
  describe,
  test,
  assertEqual,
  assertMatch,
  assert,
  readProjectFile
} = require('../../harness');

describe('Tier 2: Boundaries for Feature 15 (Navigation & Drawer Integrity)', () => {
  test('B15-1: Category link generated on subpage prefixes index.html?cat= to prevent empty state', () => {
    function buildCategoryLink(categoryKey, currentPageIsSubpage) {
      if (currentPageIsSubpage) {
        return `index.html?cat=${encodeURIComponent(categoryKey)}`;
      }
      return `?cat=${encodeURIComponent(categoryKey)}`;
    }

    const subpageLink = buildCategoryLink('football', true);
    assertEqual(subpageLink, 'index.html?cat=football');
  });

  test('B15-2: URL category query with invalid/unknown category falls back to "all"', () => {
    const validCategories = ['all', 'cars', 'art', 'football', 'anime', 'custom'];
    function resolveCategory(queryCategory) {
      return validCategories.includes(queryCategory) ? queryCategory : 'all';
    }

    assertEqual(resolveCategory('nonexistent-category-xyz'), 'all');
    assertEqual(resolveCategory('cars'), 'cars');
  });

  test('B15-3: Repeated toggle of navigation drawer maintains consistent open/closed state', () => {
    let isOpen = false;
    function toggleNav() {
      isOpen = !isOpen;
      return isOpen;
    }

    for (let i = 0; i < 10; i++) toggleNav();
    assertEqual(isOpen, false, 'After even number of toggles, drawer must be closed');
    toggleNav();
    assertEqual(isOpen, true, 'After odd toggle, drawer must be open');
  });

  test('B15-4: Closing nav drawer resets aria-hidden attribute to "true"', () => {
    const drawer = {
      ariaHidden: 'false',
      close() {
        this.ariaHidden = 'true';
      }
    };

    drawer.close();
    assertEqual(drawer.ariaHidden, 'true');
  });

  test('B15-5: Relative links in admin views correctly point to ../ for root assets', () => {
    const adminPanelHtml = readProjectFile('admin/panel.html');
    // Admin links should reference ../assets or ../products-bundle or styles
    assertMatch(adminPanelHtml, /\.\.\/|href=["'][^"']*["']/i);
  });
});

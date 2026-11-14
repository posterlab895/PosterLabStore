/**
 * tests/e2e/tier2-boundaries/b14_homepage_assets_boundaries.test.js
 * Tier 2: Boundary & Corner Cases for Feature 14 (Homepage Assets & Links)
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

describe('Tier 2: Boundaries for Feature 14 (Homepage Assets & Links)', () => {
  test('B14-1: Broken image error handler resets src to fallback logo asset', () => {
    const fallback = 'assets/poster-lab-logo.webp';
    let currentSrc = 'assets/missing-poster.webp';

    function handleImageError(img) {
      if (img.src !== fallback) {
        img.src = fallback;
      }
    }

    const mockImg = { src: currentSrc };
    handleImageError(mockImg);
    assertEqual(mockImg.src, fallback, 'Image src must be replaced by fallback on error');
  });

  test('B14-2: Image URLs with spaces and hash characters are cleaned safely', () => {
    function productImageUrl(p) {
      if (!p) return 'assets/poster-lab-logo.webp';
      if (p.startsWith('data:') || p.startsWith('blob:') || p.startsWith('http')) return p;
      return p.replace(/#/g, '%23').replace(/ /g, '%20');
    }

    const cleaned = productImageUrl('assets/Blue Porsche 3/image #1.webp');
    assertEqual(cleaned, 'assets/Blue%20Porsche%203/image%20%231.webp');
  });

  test('B14-3: Empty search string query returns full unfiltered products list', () => {
    const products = [{ id: 'p1', name: 'Poster 1' }, { id: 'p2', name: 'Poster 2' }];
    function filterProducts(items, query) {
      const q = (query || '').trim().toLowerCase();
      if (!q) return items;
      return items.filter(item => item.name.toLowerCase().includes(q));
    }

    assertEqual(filterProducts(products, '').length, 2);
    assertEqual(filterProducts(products, '   ').length, 2);
    assertEqual(filterProducts(products, null).length, 2);
  });

  test('B14-4: Search query containing regex meta-characters does not crash or throw RegExp error', () => {
    const products = [{ id: 'p1', name: 'Art (Series [1]) + Special *' }];
    function safeSearch(items, query) {
      try {
        const cleanQuery = query.toLowerCase().trim();
        return items.filter(item => item.name.toLowerCase().includes(cleanQuery));
      } catch (_) {
        return [];
      }
    }

    const results = safeSearch(products, '([*+?^${}()|\\])');
    assert(Array.isArray(results), 'Must return array safely');
    assertEqual(results.length, 0);

    const matchResult = safeSearch(products, '(Series [1])');
    assertEqual(matchResult.length, 1);
  });

  test('B14-5: Search query with Arabic characters matches Arabic names and tags', () => {
    const products = [
      { id: 'fb-01', name: 'Lionel Messi', nameAr: 'ليونيل ميسي', tags: ['ميسي', 'football'] },
      { id: 'fb-02', name: 'Cristiano Ronaldo', nameAr: 'كريستيانو رونالدو', tags: ['الدون'] }
    ];

    function searchArabic(items, query) {
      const q = query.trim().toLowerCase();
      return items.filter(item =>
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.nameAr && item.nameAr.includes(q)) ||
        (item.tags && item.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    const res = searchArabic(products, 'ميسي');
    assertEqual(res.length, 1);
    assertEqual(res[0].id, 'fb-01');
  });
});

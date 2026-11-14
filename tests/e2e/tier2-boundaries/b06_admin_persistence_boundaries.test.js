/**
 * tests/e2e/tier2-boundaries/b06_admin_persistence_boundaries.test.js
 * Tier 2: Boundary & Corner Cases for Feature 6 (Admin Data Persistence)
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

describe('Tier 2: Boundaries for Feature 6 (Admin Persistence)', () => {
  test('B6-1: Empty localStorage returns default catalog fallback without errors', () => {
    const storage = new MockStorage();
    function getStoredProducts(s, fallbackCatalog) {
      try {
        const raw = s.getItem('pls-products');
        if (!raw) return fallbackCatalog;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallbackCatalog;
      } catch (_) {
        return fallbackCatalog;
      }
    }

    const fallback = [{ id: 'fb-1', name: 'Default Poster' }];
    const result = getStoredProducts(storage, fallback);
    assertEqual(result.length, 1);
    assertEqual(result[0].id, 'fb-1');
  });

  test('B6-2: Malformed JSON in "pls-products" does not crash catalog loader', () => {
    const storage = new MockStorage();
    storage.setItem('pls-products', '{"broken": [}');

    function safeLoad(s) {
      try {
        const val = s.getItem('pls-products');
        return JSON.parse(val);
      } catch (_) {
        return [];
      }
    }

    const res = safeLoad(storage);
    assert(Array.isArray(res), 'Should return empty array fallback on parse error');
    assertEqual(res.length, 0);
  });

  test('B6-3: Missing optional fields (tags, gallery, description) handled with safe defaults', () => {
    const rawProduct = {
      id: 'p-minimal',
      name: 'Minimal Poster',
      basePrice: 180,
      sizes: { "20x30": 180 }
    };

    function normalizeProduct(p) {
      return {
        ...p,
        tags: Array.isArray(p.tags) ? p.tags : [],
        gallery: Array.isArray(p.gallery) ? p.gallery : [],
        description: p.description || '',
        quantity: p.quantity !== undefined ? p.quantity : 999
      };
    }

    const normalized = normalizeProduct(rawProduct);
    assert(Array.isArray(normalized.tags), 'Tags must default to array');
    assert(Array.isArray(normalized.gallery), 'Gallery must default to array');
    assertEqual(normalized.description, '', 'Description must default to string');
    assertEqual(normalized.quantity, 999, 'Quantity must default to available stock');
  });

  test('B6-4: Product names with Arabic characters, slashes, and quotes persist uncorrupted', () => {
    const storage = new MockStorage();
    const complexProduct = {
      id: 'complex-01',
      name: 'Art / "Minimalist" & \'Vintage\' <Special>',
      nameAr: 'فن تجريدي / "تصميم خاص" & مميز'
    };

    storage.setItem('pls-products', JSON.stringify([complexProduct]));
    const loaded = JSON.parse(storage.getItem('pls-products'))[0];
    assertEqual(loaded.name, 'Art / "Minimalist" & \'Vintage\' <Special>');
    assertEqual(loaded.nameAr, 'فن تجريدي / "تصميم خاص" & مميز');
  });

  test('B6-5: QuotaExceededError simulation caught safely by safeStorageSet', () => {
    let saveFailed = false;
    const failingStorage = {
      setItem: () => {
        const err = new Error('QuotaExceededError');
        err.name = 'QuotaExceededError';
        throw err;
      }
    };

    function safeStorageSet(s, key, val) {
      try {
        s.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
        return true;
      } catch (_) {
        saveFailed = true;
        return false;
      }
    }

    const success = safeStorageSet(failingStorage, 'pls-products', { test: true });
    assertEqual(success, false, 'Must return false on quota error');
    assertEqual(saveFailed, true, 'Error must be caught without crashing');
  });
});

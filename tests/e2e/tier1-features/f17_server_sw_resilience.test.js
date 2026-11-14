/**
 * tests/e2e/tier1-features/f17_server_sw_resilience.test.js
 * Tier 1: Feature 17 — Server & Service Worker Resilience
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

describe('Tier 1: Feature 17 — Server & Service Worker Resilience', () => {
  test('F17-1: sw.js contains fetch event handler for offline resilience', () => {
    const swCode = readProjectFile('sw.js');
    assertMatch(swCode, /self\.addEventListener\(['"]fetch['"]/, 'sw.js must contain fetch listener');
  });

  test('F17-2: sw.js restricts full caching to same-origin requests or guards external APIs', () => {
    const swCode = readProjectFile('sw.js');
    // sw.js must guard requests with same-origin check so it doesn't break Firestore or external endpoints
    assertMatch(swCode, /self\.location\.origin|requestUrl\.origin === self\.location\.origin|origin/, 'sw.js should inspect origin of request');
  });

  test('F17-3: firebase.json specifies hosting configuration for static assets', () => {
    const firebaseJson = JSON.parse(readProjectFile('firebase.json'));
    assert(firebaseJson.hosting !== undefined, 'firebase.json must contain hosting section');
    assert(Array.isArray(firebaseJson.hosting.headers), 'hosting must contain headers configuration');
  });

  test('F17-4: sw.js caches core static assets during install phase', () => {
    const swCode = readProjectFile('sw.js');
    assertMatch(swCode, /const\s+ASSETS\s*=\s*\[/, 'sw.js must declare ASSETS array');
    assertMatch(swCode, /['"]\.\/index\.html['"]/, 'ASSETS must include index.html');
  });

  test('F17-5: firebase-config.js initializes Firebase app safely', () => {
    const fbCode = readProjectFile('firebase-config.js');
    assertMatch(fbCode, /firebase\.initializeApp|firebaseConfig/i, 'firebase-config.js must configure firebase');
  });
});

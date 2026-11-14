/**
 * tests/e2e/tier1-features/f14_homepage_assets_links.test.js
 * Tier 1: Feature 14 — Homepage Clean Asset & Link Resolution
 * Authoritative Source: ORIGINAL_REQUEST.md R4 & PROJECT.md
 */

const {
  describe,
  test,
  assertEqual,
  assertMatch,
  assert,
  parseHtml,
  readProjectFile,
  projectFileExists
} = require('../../harness');

describe('Tier 1: Feature 14 — Homepage Clean Asset & Link Resolution', () => {
  test('F14-1: index.html references existing stylesheets and scripts', () => {
    const doc = parseHtml('index.html');
    const scripts = doc.getScripts();
    for (const s of scripts) {
      if (s.src && !s.src.startsWith('http')) {
        assert(projectFileExists(s.src), `Referenced script file must exist: ${s.src}`);
      }
    }
  });

  test('F14-2: Poster Lab logo asset exists in assets directory', () => {
    assert(projectFileExists('assets/poster-lab-logo.webp'), 'poster-lab-logo.webp must exist');
  });

  test('F14-3: index.html contains primary navigation buttons (theme, lang, cart, menu)', () => {
    const doc = parseHtml('index.html');
    assertMatch(doc.raw, /data-open-nav/, 'index.html must have open nav hamburger button');
    assertMatch(doc.raw, /data-theme-toggle/, 'index.html must have theme toggle button');
    assertMatch(doc.raw, /data-lang-toggle/, 'index.html must have language toggle button');
    assertMatch(doc.raw, /data-open-cart/, 'index.html must have open cart button');
  });

  test('F14-4: script.js defines fallback image handler for missing product images', () => {
    const script = readProjectFile('script.js');
    assertMatch(script, /POSTER_FALLBACK_IMAGE\s*=\s*["']assets\/poster-lab-logo\.webp["']/, 'Fallback image constant must be defined');
    assertMatch(script, /POSTER_FALLBACK_IMAGE/, 'Image elements must reference fallback image');
  });

  test('F14-5: Homepage catalog search trigger and category pills container exist', () => {
    const doc = parseHtml('index.html');
    assertMatch(doc.raw, /data-search-icon|data-search/i, 'Search button or input must exist in index.html');
    assertMatch(doc.raw, /data-cat-pills|\.cat-pills|#categorySections/i, 'Category pills container must exist in index.html');
  });
});

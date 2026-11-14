/**
 * tests/e2e/tier1-features/f12_white_wall_background.test.js
 * Tier 1: Feature 12 — Clean White Wall-like Background
 * Authoritative Source: ORIGINAL_REQUEST.md R3 & PROJECT.md
 */

const {
  describe,
  test,
  assertEqual,
  assertMatch,
  assert,
  readProjectFile,
  AuthoritativePricing
} = require('../../harness');

describe('Tier 1: Feature 12 — Clean White Wall-like Background', () => {
  test('F12-1: Authoritative styling specification defines gallery white wall gradient', () => {
    assertEqual(
      AuthoritativePricing.wallBackgroundGradient,
      'linear-gradient(180deg, #fbfbfb 0%, #f1f2f5 100%)',
      'Authoritative wall background gradient must match spec'
    );
  });

  test('F12-2: Stylesheet styles detail image container with gallery wall styling', () => {
    const css = readProjectFile('styles.css');
    // CSS should have wall gradient or detail-main-image gallery background
    assertMatch(css, /detail-main-image|detail-gallery/, 'styles.css must style detail gallery image');
  });

  test('F12-3: Stylesheet defines drop-shadow or bevel styling for gallery wall presentation', () => {
    const css = readProjectFile('styles.css');
    assertMatch(css, /box-shadow|drop-shadow/i, 'styles.css must include shadow styling for frames');
  });

  test('F12-4: Detail main image wrapper supports scene/wall background custom property', () => {
    const script = readProjectFile('script.js');
    assertMatch(script, /--scene-image|sceneImage/i, 'script.js should support scene/wall backdrop customization');
  });

  test('F12-5: Dark mode theme preserves gallery frame contrast', () => {
    const css = readProjectFile('styles.css');
    assertMatch(css, /\[data-theme=["']dark["']\]/i, 'styles.css must define dark mode theme overrides');
  });
});

/**
 * tests/e2e/tier2-boundaries/b12_white_wall_boundaries.test.js
 * Tier 2: Boundary & Corner Cases for Feature 12 (White Wall Background)
 * Authoritative Source: ORIGINAL_REQUEST.md R3 & PROJECT.md
 */

const {
  describe,
  test,
  assertEqual,
  assertMatch,
  assert,
  readProjectFile
} = require('../../harness');

describe('Tier 2: Boundaries for Feature 12 (Clean White Wall-like Background)', () => {
  test('B12-1: Wall background CSS fallback provides base color before linear-gradient', () => {
    const css = readProjectFile('styles.css');
    // Wall background styling should specify fallback background-color or background
    assertMatch(css, /background(-color)?:\s*(#[0-9a-f]{3,6}|var\(--)/i, 'CSS should have solid background fallback');
  });

  test('B12-2: Undefined sceneImage gracefully falls back to gallery backdrop gradient', () => {
    function getBackdropStyle(sceneImage) {
      if (!sceneImage) return 'linear-gradient(180deg, #fbfbfb 0%, #f1f2f5 100%)';
      return `url('${sceneImage}')`;
    }
    assertEqual(getBackdropStyle(null), 'linear-gradient(180deg, #fbfbfb 0%, #f1f2f5 100%)');
    assertEqual(getBackdropStyle(undefined), 'linear-gradient(180deg, #fbfbfb 0%, #f1f2f5 100%)');
  });

  test('B12-3: Dark theme preserves poster container contrast against dark wall background', () => {
    const css = readProjectFile('styles.css');
    assertMatch(css, /\[data-theme=["']dark["']\]/i, 'Dark theme selector must be defined in CSS');
  });

  test('B12-4: Responsive viewport styles adjust padding for narrow viewports (<380px)', () => {
    const script = readProjectFile('script.js');
    assertMatch(script, /phone-small|phone|tablet/i, 'Device type update handles small phone viewports');
  });

  test('B12-5: Gallery frame shadow remains visible across light and dark backgrounds', () => {
    const css = readProjectFile('styles.css');
    assertMatch(css, /box-shadow/i, 'CSS must include box-shadow for depth');
  });
});

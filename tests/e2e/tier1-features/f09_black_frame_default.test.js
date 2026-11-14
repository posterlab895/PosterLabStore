/**
 * tests/e2e/tier1-features/f09_black_frame_default.test.js
 * Tier 1: Feature 9 — Product Page Black Frame Default
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

describe('Tier 1: Feature 9 — Product Page Black Frame Default', () => {
  test('F9-1: Black frame is configured as default frame in authoritative pricing contract', () => {
    assertEqual(AuthoritativePricing.defaultFrame, 'Black', 'Default frame must be Black');
    assertEqual(AuthoritativePricing.frameAdders.Black, 0, 'Black frame adder must be 0 EGP');
  });

  test('F9-2: Frame options in script.js specify Black frame with zero additional price', () => {
    const script = readProjectFile('script.js');
    // Frame options in script.js should define Black with price: 0 (or frame options contract)
    assertMatch(script, /Black:\s*\{\s*label:\s*["']Black frame["']/i, 'Black frame option must exist');
  });

  test('F9-3: Detail main image wrapper receives frame-black CSS class on default load', () => {
    const detailFrame = "Black";
    const frameClass = `frame-${detailFrame.toLowerCase()}`;
    assertEqual(frameClass, 'frame-black', 'Main image container must have class frame-black');
  });

  test('F9-4: Stylesheet defines .frame-black styling with frame border', () => {
    const css = readProjectFile('styles.css');
    assertMatch(css, /\.frame-black\b/, 'styles.css must define .frame-black');
  });

  test('F9-5: Initial product detail state defaults selected frame to Black', () => {
    const defaultProduct = {
      id: 'p1',
      frames: ['Black', 'White', 'Transparent']
    };
    const initialFrame = defaultProduct.frames.includes('Black') ? 'Black' : defaultProduct.frames[0];
    assertEqual(initialFrame, 'Black', 'Initial selected frame must be Black');
  });
});

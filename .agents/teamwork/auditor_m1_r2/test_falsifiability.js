const assert = require('assert');
const fs = require('fs');

console.log('--- TESTING TEST FALSIFIABILITY ---');

// Verify that test_m1_pricing logic is capable of detecting a defect
const dummyCorruptScript = "const products = [{ id: 'custom-design', basePrice: 60, sizes: { '20x30': 60 } }];";

const customMatch = dummyCorruptScript.match(/id:\s*["']custom-design["'][\s\S]*?basePrice:\s*(\d+)[\s\S]*?sizes:\s*(\{[\s\S]*?\})/);
let detectedBasePrice = false;
try {
  const basePrice = parseInt(customMatch[1], 10);
  assert.strictEqual(basePrice, 180);
} catch (e) {
  detectedBasePrice = true;
  console.log('Falsifiability test 1 (basePrice 60 correctly rejected): PASS');
}

let detectedLegacyScan = false;
if (/(["']?basePrice["']?)\s*:\s*60\b/.test(dummyCorruptScript)) {
  detectedLegacyScan = true;
  console.log('Falsifiability test 2 (regex legacy detection correctly triggers): PASS');
}

if (detectedBasePrice && detectedLegacyScan) {
  console.log('Test logic is truly falsifiable and sensitive to regressions.');
} else {
  console.error('Test logic failed falsifiability!');
  process.exit(1);
}

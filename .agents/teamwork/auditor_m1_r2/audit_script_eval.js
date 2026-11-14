const fs = require('fs');

const script = fs.readFileSync('script.js', 'utf8');

// Find all occurrences of getProduct
console.log('--- getProduct definition and usages ---');
const gpMatches = script.match(/function\s+getProduct\b[^{]*\{[\s\S]*?\n\}/g) || [];
gpMatches.forEach(m => console.log(m.slice(0, 300)));

// Evaluate products array in isolated VM context directly from script.js
const vm = require('vm');
// Extract the products literal from script.js
const startPos = script.indexOf('const products = [');
const endPos = script.indexOf('];', startPos) + 2;
const snippet = script.slice(startPos, endPos);

const sandbox = {};
vm.createContext(sandbox);
const result = vm.runInContext(snippet + '\nproducts;', sandbox);

console.log('--- VM evaluation of products[0] (custom-design) ---');
console.log('Evaluated object:', JSON.stringify(result[0], null, 2));

// Test Property Descriptors
const descBasePrice = Object.getOwnPropertyDescriptor(result[0], 'basePrice');
const descSizes = Object.getOwnPropertyDescriptor(result[0], 'sizes');
console.log('basePrice descriptor:', descBasePrice);
console.log('sizes descriptor:', descSizes);

// Verify plain values
if (descBasePrice.value === 180 && !descBasePrice.get && !descBasePrice.set) {
  console.log('basePrice is a plain data property: PASS');
} else {
  console.log('basePrice is NOT a plain data property: FAIL');
}

if (typeof descSizes.value === 'object' && !descSizes.get && !descSizes.set) {
  console.log('sizes is a plain data property: PASS');
} else {
  console.log('sizes is NOT a plain data property: FAIL');
}
console.log('basePrice descriptor:', descBasePrice);
console.log('sizes descriptor:', descSizes);

// Verify plain values
if (descBasePrice.value === 180 && !descBasePrice.get && !descBasePrice.set) {
  console.log('basePrice is a plain data property: PASS');
} else {
  console.log('basePrice is NOT a plain data property: FAIL');
}

if (typeof descSizes.value === 'object' && !descSizes.get && !descSizes.set) {
  console.log('sizes is a plain data property: PASS');
} else {
  console.log('sizes is NOT a plain data property: FAIL');
}

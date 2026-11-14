const fs = require('fs');
const path = require('path');

const scriptPath = path.resolve('script.js');
const content = fs.readFileSync(scriptPath, 'utf8');
const lines = content.split(/\r?\n/);

console.log('--- LINE INSPECTION ---');
console.log('Line 381 (index 380):', lines[380]);
console.log('Line 382 (index 381):', lines[381]);
console.log('Line 383 (index 382):', lines[382]);
console.log('Line 384 (index 383):', lines[383]);

// Exact match checks
const line382Trimmed = lines[381].trim();
const line383Trimmed = lines[382].trim();

const isLine382Exact = line382Trimmed === 'basePrice: 180,';
const isLine383Exact = line383Trimmed === "sizes: { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 },";

console.log('Line 382 exact match:', isLine382Exact);
console.log('Line 383 exact match:', isLine383Exact);

// Check all occurrences of custom-design
console.log('--- OCCURRENCES OF custom-design ---');
let pos = 0;
while ((pos = content.indexOf('custom-design', pos)) !== -1) {
  const lineNum = content.slice(0, pos).split(/\r?\n/).length;
  console.log(`Pos ${pos} (line ${lineNum}): ...${content.slice(Math.max(0, pos - 20), pos + 40).replace(/\r?\n/g, ' ')}...`);
  pos += 'custom-design'.length;
}

// Check for any Proxy, defineProperty, getters, setters, prototypes
console.log('--- INTEGRITY & INTERCEPTION TRAPS CHECK ---');
const suspiciousPatterns = [
  { name: 'Proxy usage', regex: /\bnew\s+Proxy\b/ },
  { name: 'Object.defineProperty', regex: /Object\.defineProperty/ },
  { name: 'Object.defineProperties', regex: /Object\.defineProperties/ },
  { name: 'get <prop> syntax', regex: /(?:^|\s)get\s+[a-zA-Z0-9_$]+\s*\(\s*\)\s*\{/ },
  { name: 'set <prop> syntax', regex: /(?:^|\s)set\s+[a-zA-Z0-9_$]+\s*\([^)]*\)\s*\{/ },
  { name: '__defineGetter__', regex: /__defineGetter__/ },
  { name: '__defineSetter__', regex: /__defineSetter__/ },
  { name: 'Object.setPrototypeOf', regex: /Object\.setPrototypeOf/ },
  { name: '__proto__ override', regex: /\.__proto__\s*=/ },
  { name: 'Legacy basePrice 60', regex: /basePrice\s*:\s*60\b/ },
  { name: 'Legacy 20x30: 60', regex: /['"]?20x30['"]?\s*:\s*60\b/ },
  { name: 'Legacy 30x40: 80', regex: /['"]?30x40['"]?\s*:\s*80\b/ }
];

suspiciousPatterns.forEach(pat => {
  const matches = content.match(pat.regex);
  console.log(`Check [${pat.name}]:`, matches ? `FOUND (${matches.length})` : 'CLEAN (0)');
});

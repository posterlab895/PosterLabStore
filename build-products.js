const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const base = __dirname;
const files = fs.readdirSync(base).filter(f => f.endsWith('-products.js') && f !== 'build-products.js');
let bundle = '// Poster Lab Store — Products Bundle\n// Generated ' + new Date().toISOString() + '\n\n';
for (const f of files) {
  const code = fs.readFileSync(path.join(base, f), 'utf8');
  bundle += code.trimEnd() + '\n\n';
}
const out = path.join(base, 'products-bundle.js');
fs.writeFileSync(out, bundle);
console.log('✅ products-bundle.js (' + files.length + ' files, ' + (Buffer.byteLength(bundle) / 1024).toFixed(0) + ' KB)');
try {
  execSync('npx terser "' + out + '" -o "' + path.join(base, 'products-bundle.min.js') + '" -c passes=2 -m', { stdio: 'pipe' });
  const minSize = fs.statSync(path.join(base, 'products-bundle.min.js')).size;
  console.log('✅ products-bundle.min.js (' + (minSize / 1024).toFixed(0) + ' KB)');
} catch (e) {
  console.error('⚠ terser minification failed, .min not updated:', e.message);
}

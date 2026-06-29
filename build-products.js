const fs = require('fs');
const path = require('path');

const base = __dirname;
const files = fs.readdirSync(base).filter(f => f.endsWith('-products.js'));
let bundle = '// Poster Lab Store — Products Bundle\n// Generated ' + new Date().toISOString() + '\n\n';
for (const f of files) {
  const code = fs.readFileSync(path.join(base, f), 'utf8');
  bundle += code.trimEnd() + '\n\n';
}
fs.writeFileSync(path.join(base, 'products-bundle.js'), bundle);
console.log('✅ products-bundle.js (' + files.length + ' files, ' + (Buffer.byteLength(bundle) / 1024).toFixed(0) + ' KB)');

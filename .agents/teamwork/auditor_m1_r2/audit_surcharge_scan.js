const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === '.agents') continue;
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      searchDir(full);
    } else if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.css')) {
      const content = fs.readFileSync(full, 'utf8');
      if (/120/.test(content)) {
        const matches = content.match(/([^\n\r]{0,40}120[^\n\r]{0,40})/g) || [];
        matches.forEach(m => {
          if (/frame|adder|surcharge|add.*120/i.test(m)) {
            console.log('FLAG in ' + full + ': ' + m.trim());
          }
        });
      }
    }
  }
}

searchDir('.');
console.log('Search complete.');

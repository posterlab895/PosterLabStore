const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const base = __dirname;
const files = fs.readdirSync(base).filter(f => f.endsWith('-products.js') && f !== 'build-products.js' && f !== 'products-bundle.js');

let bundle = '// Poster Lab Store — Products Bundle\n// Generated ' + new Date().toISOString() + '\n\n';
for (const f of files) {
  const code = fs.readFileSync(path.join(base, f), 'utf8');
  bundle += code.trimEnd() + '\n\n';
}

// Append runtime assembly code so window.products and productImageUrl are guaranteed
const assemblyCode = `
// Assemble all categories into window.products for store & admin panel
(function() {
  function productImageUrl(p) {
    if (!p) return '../assets/poster-lab-logo.webp';
    if (p.startsWith('data:') || p.startsWith('blob:') || p.startsWith('http://') || p.startsWith('https://')) return p;
    var clean = p.replace(/#/g, '%23').replace(/ /g, '%20');
    if (typeof window !== 'undefined' && window.location && window.location.pathname.includes('/admin/')) {
      if (!clean.startsWith('../') && !clean.startsWith('/')) clean = '../' + clean;
    }
    return clean;
  }
  if (typeof window !== 'undefined') {
    window.productImageUrl = productImageUrl;
  }

  var allCats = [
    typeof footballProducts !== 'undefined' ? footballProducts : [],
    typeof carProducts !== 'undefined' ? carProducts : [],
    typeof clubProducts !== 'undefined' ? clubProducts : [],
    typeof movieArtistProducts !== 'undefined' ? movieArtistProducts : [],
    typeof albumArtistProducts !== 'undefined' ? albumArtistProducts : [],
    typeof gymProducts !== 'undefined' ? gymProducts : [],
    typeof artProducts !== 'undefined' ? artProducts : [],
    typeof animeProducts !== 'undefined' ? animeProducts : [],
    typeof girlsProducts !== 'undefined' ? girlsProducts : [],
    typeof gamesProducts !== 'undefined' ? gamesProducts : [],
    typeof islamicProducts !== 'undefined' ? islamicProducts : [],
    typeof citiesProducts !== 'undefined' ? citiesProducts : [],
    typeof quotesProducts !== 'undefined' ? quotesProducts : [],
    typeof nbaProducts !== 'undefined' ? nbaProducts : [],
    typeof meemesProducts !== 'undefined' ? meemesProducts : [],
    typeof pharaonicProducts !== 'undefined' ? pharaonicProducts : [],
    typeof rapSceneProducts !== 'undefined' ? rapSceneProducts : [],
    typeof jordanProducts !== 'undefined' ? jordanProducts : []
  ];

  var list = [
    {
      id: "custom-design",
      name: "Upload Your Custom Design",
      nameAr: "ارفع تصميمك الخاص",
      category: "custom",
      tag: "Custom upload",
      tagAr: "رفع خاص",
      isCustom: true,
      image: "assets/Custom/Upload-Your-Custom-Design.webp",
      gallery: ["assets/Custom/Upload-Your-Custom-Design.webp"],
      basePrice: 60,
      sizes: { '20x30': 60, '30x40': 80, '40x50': 250, '50x70': 300 },
      frames: ['None', 'Black', 'White'],
      description: "Upload any photo or design and we'll print it as a high-quality framed poster.",
      descriptionAr: "ارفع أي صورة أو تصميم وسنقوم بطباعته كبوستر مؤطر عالي الجودة."
    }
  ];

  for (var i = 0; i < allCats.length; i++) {
    for (var j = 0; j < allCats[i].length; j++) {
      list.push(allCats[i][j]);
    }
  }

  if (typeof window !== 'undefined') {
    window.products = list;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.products = list;
  }
})();
`;

bundle += '\n' + assemblyCode + '\n';

const out = path.join(base, 'products-bundle.js');
fs.writeFileSync(out, bundle, 'utf8');
console.log('✅ products-bundle.js (' + files.length + ' files, ' + (Buffer.byteLength(bundle) / 1024).toFixed(0) + ' KB)');

try {
  execSync('npx terser "' + out + '" -o "' + path.join(base, 'products-bundle.min.js') + '" -c passes=1 -m', { stdio: 'pipe' });
  const minSize = fs.statSync(path.join(base, 'products-bundle.min.js')).size;
  console.log('✅ products-bundle.min.js (' + (minSize / 1024).toFixed(0) + ' KB)');
  
  // Copy to admin/
  fs.copyFileSync(path.join(base, 'products-bundle.js'), path.join(base, 'admin', 'products-bundle.js'));
  fs.copyFileSync(path.join(base, 'products-bundle.min.js'), path.join(base, 'admin', 'products-bundle.min.js'));
  console.log('✅ Copied bundle files to admin/');
} catch (e) {
  console.error('⚠ terser minification failed:', e.message);
}

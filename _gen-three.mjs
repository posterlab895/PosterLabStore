import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const cats = [
  { name: 'nba', label: 'NBA', labelAr: 'NBA', icon: '\u{1F3C0}' },
  { name: 'meemes', label: 'Memes', labelAr: '\u{645}\u{64A}\u{645}\u{627}\u{62A}', icon: '\u{1F602}' },
  { name: 'pharaonic', label: 'Pharaonic', labelAr: '\u{641}\u{631}\u{639}\u{648}\u{646}\u{64A}', icon: '\u{1F3DB}\u{FE0F}' },
];

for (const cat of cats) {
  const dir = 'D:/Poster Lab Store - Copy - Copy/PosterLabStore/assets/' + cat.name;
  const files = fs.readdirSync(dir).filter(f => f.match(/\.(png|jpe?g)$/i)).sort();
  
  let out = 'const ' + cat.name + 'Products = [\n';
  files.forEach((f, i) => {
    const num = String(i + 1).padStart(3, '0');
    out += '  {\n';
    out += '    "id": "' + cat.name + '-' + num + '",\n';
    out += '    "name": "' + cat.label + ' #' + (i+1) + '",\n';
    out += '    "category": "' + cat.name + '",\n';
    out += '    "tag": "' + cat.label + '",\n';
    out += '    "tagAr": "' + cat.labelAr + '",\n';
    out += '    "image": "assets/' + cat.name + '/' + f + '",\n';
    out += '    "basePrice": 50,\n';
    out += '    "sizes": { "20x30": 50, "30x40": 60, "40x50": 70, "50x70": 90 },\n';
    out += '    "frames": ["None", "Black", "White"],\n';
    out += '    "description": ""\n';
    out += '  }';
    if (i < files.length - 1) out += ',\n';
  });
  out += '\n];\n';
  fs.writeFileSync('D:/Poster Lab Store - Copy - Copy/PosterLabStore/' + cat.name + '-products.js', out);
  console.log(cat.name + ': ' + files.length + ' products');

  files.forEach(f => {
    const webp = f.replace(/\.(png|jpe?g)$/i, '.webp');
    const dst = path.join(dir, webp);
    if (!fs.existsSync(dst)) {
      sharp(path.join(dir, f)).webp({ quality: 80 }).toFile(dst);
    }
  });
}

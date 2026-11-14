const fs = require('fs');
const crypto = require('crypto');
const { minify } = require('terser');

async function check() {
  console.log('--- AUDITING script.min.js AGAINST GENUINE TERSER COMPILATION ---');

  const scriptJs = fs.readFileSync('script.js', 'utf8');
  const existingMinJs = fs.readFileSync('script.min.js', 'utf8');

  const minified = await minify(scriptJs, {
    compress: {
      drop_console: false,
      drop_debugger: true,
      passes: 1
    },
    mangle: false,
    format: {
      comments: false
    }
  });

  const freshHash = crypto.createHash('sha256').update(minified.code).digest('hex');
  const diskHash = crypto.createHash('sha256').update(existingMinJs).digest('hex');

  console.log('Fresh compilation SHA-256:', freshHash);
  console.log('Disk script.min.js SHA-256:', diskHash);
  console.log('Exact byte-for-byte match :', freshHash === diskHash);

  if (freshHash !== diskHash) {
    console.log('Length difference:', minified.code.length, 'vs', existingMinJs.length);
    // Find where difference begins
    let diffIndex = -1;
    for (let i = 0; i < Math.max(minified.code.length, existingMinJs.length); i++) {
      if (minified.code[i] !== existingMinJs[i]) {
        diffIndex = i;
        break;
      }
    }
    console.log('Difference starts at index:', diffIndex);
    console.log('Fresh snippet:', minified.code.slice(diffIndex, diffIndex + 100));
    console.log('Disk snippet :', existingMinJs.slice(diffIndex, diffIndex + 100));
  }

  // Check custom-design definition in existing script.min.js
  const customIdx = existingMinJs.indexOf('custom-design');
  console.log('--- custom-design IN script.min.js ---');
  if (customIdx !== -1) {
    const slice = existingMinJs.slice(customIdx, customIdx + 200);
    console.log('Minified slice:', slice);
    const hasCorrectPricing = slice.includes('basePrice:180') && slice.includes('"20x30":180') && slice.includes('"30x40":200');
    console.log('Contains verified pricing:', hasCorrectPricing);
  } else {
    console.log('ERROR: custom-design not found in script.min.js!');
  }

  // Check for any legacy pricing in script.min.js
  const legacyMatches = [
    { label: 'basePrice:60', found: existingMinJs.includes('basePrice:60') },
    { label: '"20x30":60', found: existingMinJs.includes('"20x30":60') || existingMinJs.includes("'20x30':60") },
    { label: '"30x40":80', found: existingMinJs.includes('"30x40":80') || existingMinJs.includes("'30x40':80") }
  ];
  console.log('Legacy pricing check in script.min.js:', legacyMatches);
}

check().catch(err => {
  console.error('Error during Terser audit:', err);
  process.exit(1);
});

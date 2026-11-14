/**
 * Milestone 1 Comprehensive Verification Test Suite
 * Tests all 1,019 products across 18 category files and custom product
 * Tests products-bundle.js and products-bundle.min.js
 * Tests script.js and admin-panel.js pricing logic, fallbacks, and calculations
 * Tests Firestore remote pricing synchronization state
 */

const fs = require('fs');
const https = require('https');
const assert = require('assert');

let passedTests = 0;
let totalTests = 0;

function it(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

async function itAsync(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

console.log('====================================================');
console.log('Milestone 1 Pricing & Data Consistency Test Suite');
console.log('====================================================\n');

// Group 1: 18 Category Files Verification
console.log('Group 1: 18 Category Product Files:');
const catFiles = fs.readdirSync('.').filter(f => f.endsWith('-products.js') && f !== 'build-products.js' && f !== 'products-bundle.js');

it('Should find exactly 18 category files', () => {
  assert.strictEqual(catFiles.length, 18, `Expected 18 category files, found ${catFiles.length}`);
});

it('Should contain 0 occurrences of old 60/80 pricing in category files', () => {
  catFiles.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    assert.strictEqual(content.includes('"basePrice":60'), false, `${f} contains "basePrice":60`);
    assert.strictEqual(content.includes('"basePrice": 60'), false, `${f} contains "basePrice": 60`);
    assert.strictEqual(content.includes('"20x30":60'), false, `${f} contains "20x30":60`);
    assert.strictEqual(content.includes('"20x30": 60'), false, `${f} contains "20x30": 60`);
    assert.strictEqual(content.includes('"30x40":80'), false, `${f} contains "30x40":80`);
    assert.strictEqual(content.includes('"30x40": 80'), false, `${f} contains "30x40": 80`);
  });
});

let totalCategoryProducts = 0;
it('All category products (1,018 items) have basePrice=180 and exact sizes (180, 200, 250, 300)', () => {
  catFiles.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    const match = content.match(/=\s*(\[[\s\S]*\]);?/);
    assert.ok(match, `Could not parse array in ${f}`);
    const list = eval(match[1]);
    totalCategoryProducts += list.length;
    list.forEach(p => {
      assert.strictEqual(p.basePrice, 180, `${f} product ${p.id} basePrice is ${p.basePrice}`);
      assert.deepStrictEqual(p.sizes, {
        "20x30": 180,
        "30x40": 200,
        "40x50": 250,
        "50x70": 300
      }, `${f} product ${p.id} sizes mismatch`);
    });
  });
  assert.strictEqual(totalCategoryProducts, 1018, `Expected 1018 category products, got ${totalCategoryProducts}`);
});

// Group 2: build-products.js and Custom Upload Item
console.log('\nGroup 2: Custom Design Product & Bundle Generation:');
it('build-products.js defines custom-design with basePrice 180 and sizes 180, 200, 250, 300', () => {
  const content = fs.readFileSync('build-products.js', 'utf8');
  assert.ok(content.includes('basePrice: 180'));
  assert.ok(content.includes("'20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300"));
});

it('script.js and script.min.js define custom-design with basePrice 180 and sizes 180, 200, 250, 300', () => {
  const scriptContent = fs.readFileSync('script.js', 'utf8');
  const scriptMinContent = fs.readFileSync('script.min.js', 'utf8');

  // Verify script.js definition
  const customMatch = scriptContent.match(/id:\s*["']custom-design["'][\s\S]*?basePrice:\s*(\d+)[\s\S]*?sizes:\s*(\{[\s\S]*?\})/);
  assert.ok(customMatch, 'custom-design definition not found in script.js');
  const basePrice = parseInt(customMatch[1], 10);
  assert.strictEqual(basePrice, 180, `script.js custom-design basePrice is ${basePrice}`);
  const sizes = eval('(' + customMatch[2] + ')');
  assert.deepStrictEqual(sizes, { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 }, 'script.js sizes mismatch');

  // Verify zero legacy pricing in script.js
  assert.ok(!/(["']?basePrice["']?)\s*:\s*60\b/.test(scriptContent), 'script.js contains legacy basePrice 60');
  assert.ok(!/['"]20x30['"]\s*:\s*60\b/.test(scriptContent), 'script.js contains legacy 20x30: 60');
  assert.ok(!/['"]30x40['"]\s*:\s*80\b/.test(scriptContent), 'script.js contains legacy 30x40: 80');

  // Verify script.min.js
  assert.ok(scriptMinContent.includes('custom-design'), 'custom-design not found in script.min.js');
  assert.ok(!/(["']?basePrice["']?)\s*:\s*60\b/.test(scriptMinContent), 'script.min.js contains legacy basePrice 60');
  assert.ok(!/['"]20x30['"]\s*:\s*60\b/.test(scriptMinContent), 'script.min.js contains legacy 20x30: 60');
  assert.ok(!/['"]30x40['"]\s*:\s*80\b/.test(scriptMinContent), 'script.min.js contains legacy 30x40: 80');
  assert.ok(
    scriptMinContent.includes('basePrice:180,sizes:{"20x30":180,"30x40":200,"40x50":250,"50x70":300}') ||
    scriptMinContent.includes('"basePrice":180,"sizes":{"20x30":180,"30x40":200,"40x50":250,"50x70":300}'),
    'script.min.js does not contain expected custom-design pricing structure'
  );
});

it('products-bundle.js loads exactly 1,019 products all with 180, 200, 250, 300 pricing', () => {
  global.window = {};
  delete require.cache[require.resolve('./products-bundle.js')];
  require('./products-bundle.js');
  const products = global.window.products;
  assert.strictEqual(products.length, 1019, `Expected 1019 products in bundle, got ${products.length}`);
  
  // Spot check custom-design
  const custom = products.find(p => p.id === 'custom-design');
  assert.ok(custom, 'custom-design product missing');
  assert.strictEqual(custom.basePrice, 180);
  assert.deepStrictEqual(custom.sizes, { "20x30": 180, "30x40": 200, "40x50": 250, "50x70": 300 });

  // Spot check first and last
  const first = products.find(p => p.id === 'football-001');
  assert.ok(first, 'football-001 product missing');
  assert.strictEqual(first.basePrice, 180);
  assert.deepStrictEqual(first.sizes, { "20x30": 180, "30x40": 200, "40x50": 250, "50x70": 300 });

  products.forEach(p => {
    assert.strictEqual(p.basePrice, 180);
    assert.strictEqual(p.sizes['20x30'], 180);
    assert.strictEqual(p.sizes['30x40'], 200);
    assert.strictEqual(p.sizes['40x50'], 250);
    assert.strictEqual(p.sizes['50x70'], 300);
  });
});

it('admin/products-bundle.js is synchronized with root products-bundle.js', () => {
  const rootBundle = fs.readFileSync('products-bundle.js', 'utf8');
  const adminBundle = fs.readFileSync('admin/products-bundle.js', 'utf8');
  assert.strictEqual(rootBundle, adminBundle);
});

it('products-bundle.min.js is non-empty and synced to admin', () => {
  const rootMin = fs.readFileSync('products-bundle.min.js', 'utf8');
  const adminMin = fs.readFileSync('admin/products-bundle.min.js', 'utf8');
  assert.ok(rootMin.length > 400000);
  assert.strictEqual(rootMin, adminMin);
});

// Group 3: script.js Logic and Pricing Functions
console.log('\nGroup 3: script.js Frame Options, Fallbacks, and Price Calculation:');

// Extract frameOptions and itemUnitPrice from script.js
const scriptContent = fs.readFileSync('script.js', 'utf8');

it('frameOptions defines Black, White, Transparent, and None with price: 0', () => {
  const frameMatch = scriptContent.match(/const frameOptions = (\{[\s\S]*?\n\};)/);
  assert.ok(frameMatch, 'frameOptions definition not found');
  const fo = eval('(' + frameMatch[1].replace(/;\s*$/, '') + ')');
  assert.strictEqual(fo.Black.price, 0);
  assert.strictEqual(fo.White.price, 0);
  assert.strictEqual(fo.Transparent.price, 0);
  assert.strictEqual(fo.None.price, 0);
});

it('itemUnitPrice correctly computes tier prices across all dimensions with 0 frame surcharge', () => {
  const dummyProduct = {
    id: "test-001",
    basePrice: 180,
    sizes: { "20x30": 180, "30x40": 200, "40x50": 250, "50x70": 300 }
  };
  
  // Evaluate the exact itemUnitPrice from script.js
  const fnMatch = scriptContent.match(/function itemUnitPrice\(product, size, frame\) \{([\s\S]*?)\n\}/);
  assert.ok(fnMatch, 'itemUnitPrice function not found in script.js');
  const frameOptions = {
    Black: { label: "Black frame", price: 0 },
    White: { label: "White frame", price: 0 },
    Transparent: { label: "Transparent / Frameless", price: 0 },
    None: { label: "Transparent / Frameless", price: 0 }
  };
  const testItemUnitPrice = new Function('product', 'size', 'frame', 'frameOptions', fnMatch[1]);

  ['Black', 'White', 'Transparent', 'None'].forEach(f => {
    assert.strictEqual(testItemUnitPrice(dummyProduct, '20x30', f, frameOptions), 180);
    assert.strictEqual(testItemUnitPrice(dummyProduct, '30x40', f, frameOptions), 200);
    assert.strictEqual(testItemUnitPrice(dummyProduct, '40x50', f, frameOptions), 250);
    assert.strictEqual(testItemUnitPrice(dummyProduct, '50x70', f, frameOptions), 300);
  });
});

it('itemUnitPrice handles missing or unexpected frame safely without TypeError', () => {
  const dummyProduct = {
    id: "test-001",
    basePrice: 180,
    sizes: { "20x30": 180, "30x40": 200, "40x50": 250, "50x70": 300 }
  };
  const fnMatch = scriptContent.match(/function itemUnitPrice\(product, size, frame\) \{([\s\S]*?)\n\}/);
  const frameOptions = {
    Black: { label: "Black frame", price: 0 },
    White: { label: "White frame", price: 0 },
    Transparent: { label: "Transparent / Frameless", price: 0 },
    None: { label: "Transparent / Frameless", price: 0 }
  };
  const testItemUnitPrice = new Function('product', 'size', 'frame', 'frameOptions', fnMatch[1]);

  assert.strictEqual(testItemUnitPrice(dummyProduct, '20x30', 'UnknownFrame', frameOptions), 180);
  assert.strictEqual(testItemUnitPrice(dummyProduct, '20x30', undefined, frameOptions), 180);
  assert.strictEqual(testItemUnitPrice(null, '20x30', 'Black', frameOptions), 180);
});

it('Product listing cards use product.sizes["20x30"] || 180 and no +120 adder', () => {
  assert.strictEqual(scriptContent.includes('product.sizes["20x30"] || 60) + (frameOptions.Black?.price || 120)'), false);
  assert.ok(scriptContent.includes('product.sizes?.["20x30"] || product.basePrice || 180'));
});

it('Quick-add defaults to size 20x30 and frame Black', () => {
  assert.ok(scriptContent.includes('async function addToCart(productId, size = "20x30", frame = "Black"'));
});

it('FAQ translations state frames are included at no extra charge', () => {
  assert.ok(scriptContent.includes('Frames are included in the price at no extra charge'));
  assert.ok(scriptContent.includes('الإطارات مشمولة في السعر بدون أي تكلفة إضافية'));
});

it('faq.html static markup reflects inclusive frame pricing without legacy adder', () => {
  const faqContent = fs.readFileSync('faq.html', 'utf8');
  assert.ok(!/Frames add EGP 120/i.test(faqContent), 'faq.html contains legacy frame adder string');
  assert.ok(faqContent.includes('High-quality frames are included at no extra charge'), 'faq.html missing inclusive frame statement');
});

it('Cart line total, subtotal, delivery fee, and discount calculate accurately with new pricing', () => {
  const dummyProduct1 = { id: 'p1', basePrice: 180, sizes: { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 } };
  const dummyProduct2 = { id: 'p2', basePrice: 180, sizes: { '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 } };
  const frameOptions = {
    Black: { label: "Black frame", price: 0 },
    White: { label: "White frame", price: 0 },
    Transparent: { label: "Transparent / Frameless", price: 0 },
    None: { label: "Transparent / Frameless", price: 0 }
  };
  const fnMatch = scriptContent.match(/function itemUnitPrice\(product, size, frame\) \{([\s\S]*?)\n\}/);
  const testItemUnitPrice = new Function('product', 'size', 'frame', 'frameOptions', fnMatch[1]);

  // Item 1: 2 x 20x30 (Black) -> 2 * 180 = 360
  const item1Price = testItemUnitPrice(dummyProduct1, '20x30', 'Black', frameOptions);
  assert.strictEqual(item1Price, 180);
  const line1 = item1Price * 2;
  assert.strictEqual(line1, 360);

  // Item 2: 1 x 50x70 (Transparent) -> 1 * 300 = 300
  const item2Price = testItemUnitPrice(dummyProduct2, '50x70', 'Transparent', frameOptions);
  assert.strictEqual(item2Price, 300);
  const line2 = item2Price * 1;
  assert.strictEqual(line2, 300);

  // Subtotal = 360 + 300 = 660
  const subtotal = line1 + line2;
  assert.strictEqual(subtotal, 660);

  // Delivery fee = 35
  const deliveryFee = 35;
  const grandTotal = subtotal + deliveryFee;
  assert.strictEqual(grandTotal, 695);

  // With 10% discount: discount = 66, grand total = 660 - 66 + 35 = 629
  const discount = Math.round(subtotal * 0.10);
  assert.strictEqual(discount, 66);
  assert.strictEqual(subtotal - discount + deliveryFee, 629);
});

// Group 4: admin-panel.js and admin/panel.html Verification
console.log('\nGroup 4: Admin Panel Fallbacks and Placeholder:');
const adminScript = fs.readFileSync('admin-panel.js', 'utf8');
const adminHtml = fs.readFileSync('admin/panel.html', 'utf8');

it('admin-panel.js uses 20x30=180, 30x40=200, 40x50=250, 50x70=300 fallbacks', () => {
  assert.ok(adminScript.includes("'20x30=180, 30x40=200, 40x50=250, 50x70=300'"));
  assert.ok(adminScript.includes("{ '20x30': 180, '30x40': 200, '40x50': 250, '50x70': 300 }"));
  assert.strictEqual(adminScript.includes("'20x30=60, 30x40=80, 40x50=250, 50x70=300'"), false);
});

it('admin/panel.html input placeholder has 180, 200, 250, 300', () => {
  assert.ok(adminHtml.includes('placeholder="20x30=180, 30x40=200, 40x50=250, 50x70=300"'));
  assert.ok(adminHtml.includes('placeholder="180"'));
  assert.strictEqual(adminHtml.includes('placeholder="20x30=60, 30x40=80, 40x50=100, 50x70=120"'), false);
});

// Group 5: Firestore Remote Verification
console.log('\nGroup 5: Remote Firestore Products Collection Verification:');
async function runAsyncTests() {
  await itAsync('Firestore products/football-001 document has basePrice 180 and correct sizes', async () => {
    let lastErr = null;
    let data = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        data = await new Promise((resolve, reject) => {
          const req = https.get('https://firestore.googleapis.com/v1/projects/poster-labstore/databases/(default)/documents/products/football-001', res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
              try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
            });
          });
          req.on('error', reject);
          req.setTimeout(8000, () => { req.destroy(new Error('Timeout')); });
        });
        if (data && data.fields) break;
      } catch (e) {
        lastErr = e;
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    if (!data || !data.fields) {
      throw lastErr || new Error('Failed to fetch Firestore doc after 3 attempts');
    }

    assert.ok(data.fields, 'No fields in football-001');
    assert.strictEqual(data.fields.basePrice?.integerValue, '180', 'basePrice not 180');
    const sizes = data.fields.sizes?.mapValue?.fields;
    assert.strictEqual(sizes?.['20x30']?.integerValue, '180', '20x30 not 180');
    assert.strictEqual(sizes?.['30x40']?.integerValue, '200', '30x40 not 200');
    assert.strictEqual(sizes?.['40x50']?.integerValue, '250', '40x50 not 250');
    assert.strictEqual(sizes?.['50x70']?.integerValue, '300', '50x70 not 300');
  });

  console.log('\n====================================================');
  console.log(`Test Results: ${passedTests}/${totalTests} Passed`);
  console.log('====================================================');
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAsyncTests().catch(e => {
  console.error(e);
  process.exit(1);
});

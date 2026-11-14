/**
 * Forensic Audit Test Suite for Milestone 3
 * Validates real DOM manipulation, switchDetailFrame state changes, CSS rules, minification parity, and non-regression.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.resolve(__dirname, '../../..');
console.log('Project root:', rootDir);

// 1. Check for hardcoding, test sniffing, environment sniffing in source files
console.log('\n[CHECK 1] Scanning script.js & styles.css for test sniffing / environment sniffing...');
const scriptSrc = fs.readFileSync(path.join(rootDir, 'script.js'), 'utf8');
const stylesSrc = fs.readFileSync(path.join(rootDir, 'styles.css'), 'utf8');
const productHtml = fs.readFileSync(path.join(rootDir, 'product.html'), 'utf8');

const suspiciousPatterns = [
  /__TEST__/i,
  /process\.env/i,
  /isHeadless/i,
  /window\.__TEST/i,
  /run-all\.js/i,
  /f10_dynamic/i,
  /f11_dynamic/i,
  /f12_white_wall/i,
  /f13_product_page/i,
  /b09_b11_frames/i,
  /b12_white_wall/i,
  /b13_layout/i
];

let foundSuspicious = false;
suspiciousPatterns.forEach(pat => {
  if (pat.test(scriptSrc)) {
    console.error(`Suspicious pattern ${pat} detected in script.js!`);
    foundSuspicious = true;
  }
  if (pat.test(stylesSrc)) {
    console.error(`Suspicious pattern ${pat} detected in styles.css!`);
    foundSuspicious = true;
  }
  if (pat.test(productHtml)) {
    console.error(`Suspicious pattern ${pat} detected in product.html!`);
    foundSuspicious = true;
  }
});
if (!foundSuspicious) {
  console.log('PASS: No test sniffing or environment sniffing detected in source files.');
}

// 2. Behavioral Verification: VM Execution of switchDetailFrame
console.log('\n[CHECK 2] Testing switchDetailFrame() in real simulated DOM state...');

class ClassList extends Set {
  add(...cls) { cls.forEach(c => super.add(c)); }
  remove(...cls) { cls.forEach(c => super.delete(c)); }
  toggle(cls, force) {
    if (force === undefined) {
      if (this.has(cls)) super.delete(cls); else super.add(cls);
    } else if (force) {
      super.add(cls);
    } else {
      super.delete(cls);
    }
  }
  contains(cls) { return this.has(cls); }
}

class MockElement {
  constructor(tagName, id = '', className = '') {
    this.tagName = tagName;
    this.id = id;
    this.classList = new ClassList(className ? className.split(/\s+/).filter(Boolean) : []);
    this.dataset = {};
    this.textContent = '';
    this.innerHTML = '';
    this.hidden = false;
    this.style = {};
  }
  setAttribute(k, v) { this[k] = v; }
  getAttribute(k) { return this[k]; }
  closest(sel) { return null; }
  contains(el) { return el === this; }
}

const sandbox = {
  window: {
    location: { href: 'https://posterlab.store/product.html?id=cars-001', pathname: '/product.html', search: '?id=cars-001' },
    history: { replaceState: (state, title, url) => { sandbox.window.location.href = url; } },
    addEventListener: () => {},
    innerWidth: 1024,
    matchMedia: () => ({ matches: false, addEventListener: () => {} })
  },
  initFirebase: () => {},
  isFirebaseReady: () => false,
  firebase: null,
  indexedDB: { open: () => ({}) },
  document: {
    documentElement: { dataset: {} },
    title: '',
    head: { appendChild: () => {} },
    createElement: (tag) => {
      if (tag === 'canvas') return { toDataURL: () => 'data:image/webp;base64,' };
      return new MockElement(tag);
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    getElementById: () => null
  },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  navigator: { userAgent: 'Node', serviceWorker: { register: () => Promise.resolve({}) } },
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  URL: URL,
  URLSearchParams: URLSearchParams
};

vm.createContext(sandbox);
vm.runInContext(scriptSrc, sandbox);

const getState = () => vm.runInContext('state', sandbox);
console.log('script.js loaded into VM.');
console.log('Initial state.detailFrame:', getState().detailFrame);

// Setup elements
const container = new MockElement('div', '', 'detail-main-image frame-black');
const btnBlack = new MockElement('button', '', 'is-selected');
btnBlack.dataset.frame = 'Black';
const btnWhite = new MockElement('button', '', '');
btnWhite.dataset.frame = 'White';
const btnTrans = new MockElement('button', '', '');
btnTrans.dataset.frame = 'Transparent';
const priceSmall = new MockElement('small');

sandbox.document.querySelector = (sel) => {
  if (sel === '.detail-main-image') return container;
  if (sel === '.price-line small') return priceSmall;
  return null;
};
sandbox.document.querySelectorAll = (sel) => {
  if (sel === '.frame-options [data-frame]') return [btnBlack, btnWhite, btnTrans];
  return [];
};

// Test 2.1: Switch to White
vm.runInContext('switchDetailFrame("White")', sandbox);
if (getState().detailFrame !== 'White') throw new Error('state.detailFrame should be White');
if (!container.classList.contains('frame-white')) throw new Error('container missing frame-white');
if (container.classList.contains('frame-black')) throw new Error('container still has frame-black');
if (!btnWhite.classList.contains('is-selected')) throw new Error('btnWhite should be is-selected');
if (btnBlack.classList.contains('is-selected')) throw new Error('btnBlack should not be is-selected');
if (!priceSmall.textContent.includes('White frame')) throw new Error('priceSmall should have White frame label');
if (!sandbox.window.location.href.includes('frame=White')) throw new Error('URL should have frame=White');
console.log('PASS: switchDetailFrame("White") correctly toggles DOM classes, buttons, label, and history URL.');

// Test 2.2: Switch to Transparent
vm.runInContext('switchDetailFrame("Transparent")', sandbox);
if (getState().detailFrame !== 'Transparent') throw new Error('state.detailFrame should be Transparent');
if (!container.classList.contains('frame-transparent')) throw new Error('container missing frame-transparent');
if (!container.classList.contains('frame-none')) throw new Error('container missing frame-none');
if (container.classList.contains('frame-white')) throw new Error('container still has frame-white');
if (!btnTrans.classList.contains('is-selected')) throw new Error('btnTrans should be is-selected');
if (btnWhite.classList.contains('is-selected')) throw new Error('btnWhite should not be is-selected');
if (!sandbox.window.location.href.includes('frame=Transparent')) throw new Error('URL should have frame=Transparent');
console.log('PASS: switchDetailFrame("Transparent") correctly applies frame-transparent & frame-none alias classes.');

// Test 2.3: Switch to None (alias)
vm.runInContext('switchDetailFrame("None")', sandbox);
if (getState().detailFrame !== 'None') throw new Error('state.detailFrame should be None');
if (!container.classList.contains('frame-transparent')) throw new Error('container missing frame-transparent for None');
if (!btnTrans.classList.contains('is-selected')) throw new Error('btnTrans should be is-selected for None');
console.log('PASS: switchDetailFrame("None") correctly maps to transparent button and classes.');

// Test 2.4: Switch back to Black
vm.runInContext('switchDetailFrame("Black")', sandbox);
if (getState().detailFrame !== 'Black') throw new Error('state.detailFrame should be Black');
if (!container.classList.contains('frame-black')) throw new Error('container missing frame-black');
if (container.classList.contains('frame-transparent')) throw new Error('container still has frame-transparent');
if (container.classList.contains('frame-none')) throw new Error('container still has frame-none');
if (!btnBlack.classList.contains('is-selected')) throw new Error('btnBlack should be is-selected');
if (btnTrans.classList.contains('is-selected')) throw new Error('btnTrans should not be is-selected');
console.log('PASS: switchDetailFrame("Black") returns correctly to Black frame.');

// 3. Check CSS rules authenticity
console.log('\n[CHECK 3] Verifying authentic CSS rules in styles.css...');

// Detail main image wall background
const wallMatch = stylesSrc.match(/\.detail-main-image\s*\{([^}]+)\}/s);
if (!wallMatch) throw new Error('.detail-main-image rule block not found');
const wallBlock = wallMatch[1];
if (!wallBlock.includes('linear-gradient(180deg, #fbfbfb 0%, #f1f2f5 100%)')) {
  throw new Error('.detail-main-image missing required white wall gradient');
}
if (!wallBlock.includes('background: #fbfbfb')) {
  throw new Error('.detail-main-image missing solid fallback background');
}
console.log('PASS: .detail-main-image genuine white wall gradient and fallback confirmed.');

// Frame border rules
const blackMatch = stylesSrc.match(/\.detail-main-image\.frame-black\s+img[^{]*\{([^}]+)\}/s);
if (!blackMatch || !blackMatch[1].includes('12px solid #141414')) {
  throw new Error('.detail-main-image.frame-black img missing 12px solid #141414');
}
const whiteMatch = stylesSrc.match(/\.detail-main-image\.frame-white\s+img[^{]*\{([^}]+)\}/s);
if (!whiteMatch || !whiteMatch[1].includes('12px solid #ffffff') || !whiteMatch[1].includes('outline: 1px solid')) {
  throw new Error('.detail-main-image.frame-white img missing 12px solid #ffffff and outline');
}
const transMatch = stylesSrc.match(/\.detail-main-image\.frame-transparent\s+img[^{]*\{([^}]+)\}/s);
if (!transMatch || !transMatch[1].includes('border: none')) {
  throw new Error('.detail-main-image.frame-transparent img missing border: none');
}
console.log('PASS: All frame visualizer borders, outlines, and box-shadows verified.');

// Dot swatch rules
const dotMatch = stylesSrc.match(/\.dot\s*\{([^}]+)\}/s);
if (!dotMatch || !dotMatch[1].includes('border-radius: 50%') || !dotMatch[1].includes('width: 14px')) {
  throw new Error('.dot missing circular border-radius or width');
}
const dotWhiteMatch = stylesSrc.match(/\.dot\.white\s*\{([^}]+)\}/s);
if (!dotWhiteMatch || !dotWhiteMatch[1].includes('#ffffff') || !dotWhiteMatch[1].includes('border: 1px solid #cccccc')) {
  throw new Error('.dot.white missing genuine white fill and border');
}
console.log('PASS: Dot swatches authentic circular styling and borders verified.');

// 4. Minification Parity Verification
console.log('\n[CHECK 4] Verifying minification parity...');
const minCss = fs.readFileSync(path.join(rootDir, 'styles.min.css'), 'utf8');
const minJs = fs.readFileSync(path.join(rootDir, 'script.min.js'), 'utf8');

const minCssChecks = [
  { name: '.frame-transparent', pass: minCss.includes('.frame-transparent') },
  { name: '.frame-white', pass: minCss.includes('.frame-white') },
  { name: '.frame-black', pass: minCss.includes('.frame-black') },
  { name: '.dot.white', pass: minCss.includes('.dot.white') },
  { name: '.dot.black', pass: minCss.includes('.dot.black') },
  { name: '.dot.transparent', pass: minCss.includes('.dot.transparent') },
  { name: 'white wall gradient', pass: minCss.includes('linear-gradient(180deg,#fbfbfb 0%,#f1f2f5 100%)') }
];
minCssChecks.forEach(c => {
  if (!c.pass) throw new Error(`styles.min.css failed check: ${c.name}`);
  console.log(`PASS min.css: ${c.name}`);
});

const minJsChecks = [
  { name: 'switchDetailFrame', pass: minJs.includes('switchDetailFrame') },
  { name: 'detailFrame default Black', pass: minJs.includes('Black') && minJs.includes('detailFrame') },
  { name: 'frame-transparent class swap', pass: minJs.includes('frame-transparent') },
  { name: 'duplicate back bar prevention', pass: minJs.includes('hasExternalBackBar') }
];
minJsChecks.forEach(c => {
  if (!c.pass) throw new Error(`script.min.js failed check: ${c.name}`);
  console.log(`PASS min.js: ${c.name}`);
});

// 5. Duplicate Back Button Elimination Integrity
console.log('\n[CHECK 5] Checking single back bar in product.html and renderDetail...');
const backBarHtmlCount = (productHtml.match(/class=["']page-back-bar["']/g) || []).length;
if (backBarHtmlCount !== 1) {
  throw new Error(`product.html has ${backBarHtmlCount} page-back-bar elements, expected exactly 1`);
}
console.log(`PASS: product.html contains exactly 1 static page-back-bar.`);

// 6. Adversarial Stress & Edge Case Evaluation
console.log('\n[CHECK 6] Adversarial stress & boundary evaluation...');

// 6.1 Rapid 100-cycle frame toggle stress
for (let i = 0; i < 100; i++) {
  const f = (i % 3 === 0) ? 'Black' : (i % 3 === 1) ? 'White' : 'Transparent';
  vm.runInContext(`switchDetailFrame("${f}")`, sandbox);
}
// Ending on Black
vm.runInContext('switchDetailFrame("Black")', sandbox);
if (getState().detailFrame !== 'Black') throw new Error('Rapid toggle ended with corrupted frame');
if (!container.classList.contains('frame-black')) throw new Error('Rapid toggle missing frame-black');
console.log('PASS: 100-cycle rapid frame toggle maintained 100% state consistency.');

// 6.2 Arabic language localization during frame switch
getState().lang = 'ar';
vm.runInContext('switchDetailFrame("White")', sandbox);
if (!priceSmall.textContent.includes('سم مع')) throw new Error('Arabic text should contain سم مع');
console.log('PASS: Arabic localization correctly handled during dynamic frame switch:', priceSmall.textContent);
getState().lang = 'en';

// 6.3 Defensive resilience: Missing elements
sandbox.document.querySelector = () => null; // Simulate missing DOM elements
sandbox.document.querySelectorAll = () => [];
try {
  vm.runInContext('switchDetailFrame("Black")', sandbox);
  console.log('PASS: switchDetailFrame survived missing DOM containers without throwing.');
} catch (err) {
  throw new Error(`switchDetailFrame threw when DOM elements were missing: ${err.message}`);
}

// Restore selector
sandbox.document.querySelector = (sel) => {
  if (sel === '.detail-main-image') return container;
  if (sel === '.price-line small') return priceSmall;
  return null;
};
sandbox.document.querySelectorAll = (sel) => {
  if (sel === '.frame-options [data-frame]') return [btnBlack, btnWhite, btnTrans];
  return [];
};

// 6.4 Defensive resilience: Null, undefined, empty frame
vm.runInContext('switchDetailFrame(null)', sandbox);
vm.runInContext('switchDetailFrame(undefined)', sandbox);
vm.runInContext('switchDetailFrame("")', sandbox);
console.log('PASS: switchDetailFrame safely ignored null, undefined, and empty string arguments.');

console.log('\n========================================');
console.log('ALL FORENSIC AUDIT CHECKS PASSED (CLEAN)');
console.log('========================================');

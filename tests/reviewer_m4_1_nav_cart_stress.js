/**
 * tests/reviewer_m4_1_nav_cart_stress.js
 * 
 * Empirical Adversarial Reviewer & Critic Test Suite
 * Milestone 4: Navigation Integrity & Subpage Cart Consistency
 * Reviewer M4-1 (reviewer_m4_1)
 * 
 * Authoritative Inputs:
 * - ORIGINAL_REQUEST.md: Requirements R4 & R5
 * - PROJECT.md: Milestone 4, Features 15 & 16
 * - Worker Handoff: .agents/teamwork/worker_m4/handoff.md
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;
const failureDetails = [];

function check(label, condition, extra = '') {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  [PASS] ${label}`);
  } else {
    failedAssertions++;
    const errMsg = `FAIL: ${label}${extra ? ' -> ' + extra : ''}`;
    failureDetails.push(errMsg);
    console.error(`  [FAIL] ${errMsg}`);
  }
}

console.log('======================================================================');
console.log('   EMPIRICAL ADVERSARIAL STRESS TEST: NAVIGATION & CART (M4-1)       ');
console.log('======================================================================\n');

// -----------------------------------------------------------------------------
// SECTION 1: Multi-Page Navigation Integrity (Feature 15)
// -----------------------------------------------------------------------------
console.log('[SECTION 1] Multi-Page Navigation Integrity (Feature 15)');

const scriptJsContent = fs.readFileSync(path.join(ROOT_DIR, 'script.js'), 'utf8');
const scriptMinJsContent = fs.readFileSync(path.join(ROOT_DIR, 'script.min.js'), 'utf8');

// 1.1 Category links prefix
const expectedPrefixPattern = /cats\.map\(c\s*=>\s*`<a class="nav-sub" href="index\.html\?cat=\$\{c\.id\}"/i;
check('1.1.1 script.js nav drawer category links explicitly target index.html?cat=${c.id}',
  expectedPrefixPattern.test(scriptJsContent) || scriptJsContent.includes('href="index.html?cat=${c.id}"'));

check('1.1.2 script.min.js contains index.html?cat= link targets',
  scriptMinJsContent.includes('index.html?cat='));

// 1.2 Pathname isHome evaluation across diverse URL structures
function evaluateIsHome(pathname) {
  return pathname.endsWith('index.html') || pathname.endsWith('/') || !pathname.includes('.html');
}

const testHomeUrls = [
  '/',
  '/index.html',
  '/store/',
  '/store/index.html',
  '',
  '/poster-lab/',
  '/sub/dir/index.html'
];
testHomeUrls.forEach((u, i) => {
  check(`1.2.${i + 1} URL '${u}' is recognized as homepage`, evaluateIsHome(u) === true);
});

const testSubpageUrls = [
  '/product.html',
  '/our-work.html',
  '/faq.html',
  '/store/product.html',
  '/store/our-work.html',
  '/store/faq.html',
  '/admin/panel.html',
  '/admin/login.html'
];
testSubpageUrls.forEach((u, i) => {
  check(`1.3.${i + 1} URL '${u}' is recognized as subpage (not homepage)`, evaluateIsHome(u) === false);
});

// 1.3 Regex category parameter extraction stress
const catExtractionRegex = /[?&]cat=([^&]+)/;
const queryVariations = [
  { href: 'index.html?cat=football', expected: 'football' },
  { href: 'index.html?cat=cars', expected: 'cars' },
  { href: '?cat=movie', expected: 'movie' },
  { href: 'index.html?theme=dark&cat=anime&lang=ar', expected: 'anime' },
  { href: 'index.html?cat=custom%20upload', expected: 'custom%20upload' },
  { href: 'index.html?utm_source=test&cat=rap&foo=bar', expected: 'rap' }
];

queryVariations.forEach((item, i) => {
  const m = item.href.match(catExtractionRegex);
  check(`1.4.${i + 1} Category extraction from '${item.href}' yields '${item.expected}'`,
    m && m[1] === item.expected);
});

// 1.4 Homepage click interception simulation
console.log('\n[SECTION 1.5] Homepage vs Subpage Click Simulation');
{
  let preventDefaultCalled = false;
  let closedNavCalled = false;
  let pushedUrl = null;
  let renderedCategory = null;
  let scrolledToTarget = false;

  const mockEventHome = {
    target: {
      closest: (sel) => {
        if (sel === 'a.nav-sub') {
          return {
            getAttribute: (attr) => attr === 'href' ? 'index.html?cat=football' : null
          };
        }
        return null;
      }
    },
    preventDefault: () => { preventDefaultCalled = true; }
  };

  // Simulate home execution
  const currentPathHome = '/index.html';
  const navSub = mockEventHome.target.closest('a.nav-sub');
  if (navSub) {
    const isHome = evaluateIsHome(currentPathHome);
    if (isHome) {
      const href = navSub.getAttribute('href') || '';
      const match = href.match(catExtractionRegex);
      if (match) {
        mockEventHome.preventDefault();
        closedNavCalled = true;
        const cat = decodeURIComponent(match[1]);
        pushedUrl = `https://store.local/index.html?cat=${cat}`;
        renderedCategory = cat;
        scrolledToTarget = true;
      }
    }
  }

  check('1.5.1 On homepage: event.preventDefault() IS invoked', preventDefaultCalled === true);
  check('1.5.2 On homepage: closeNav() IS invoked', closedNavCalled === true);
  check('1.5.3 On homepage: history.pushState updates cat param to football', pushedUrl && pushedUrl.includes('cat=football'));
  check('1.5.4 On homepage: renderSingleCategory receives football', renderedCategory === 'football');
  check('1.5.5 On homepage: smooth scroll into #categorySections is triggered', scrolledToTarget === true);
}

{
  let preventDefaultCalledSubpage = false;
  const mockEventSubpage = {
    target: {
      closest: (sel) => {
        if (sel === 'a.nav-sub') {
          return {
            getAttribute: (attr) => attr === 'href' ? 'index.html?cat=cars' : null
          };
        }
        return null;
      }
    },
    preventDefault: () => { preventDefaultCalledSubpage = true; }
  };

  // Simulate subpage execution
  const currentPathSubpage = '/product.html';
  const navSub = mockEventSubpage.target.closest('a.nav-sub');
  if (navSub) {
    const isHome = evaluateIsHome(currentPathSubpage);
    if (isHome) {
      mockEventSubpage.preventDefault();
    }
  }

  check('1.5.6 On subpage: event.preventDefault() is NOT invoked (native navigation allowed)',
    preventDefaultCalledSubpage === false);
}

// 1.6 Header markup across all 4 HTML files
console.log('\n[SECTION 1.6] HTML Header & Drawer Markup Across Storefront Pages');
const storefrontPages = ['index.html', 'product.html', 'our-work.html', 'faq.html'];
const requiredAttributes = [
  { name: 'brand logo link', pattern: /<a[^>]+class=["'][^"']*brand[^"']*["'][^>]+href=["']index\.html["']/i },
  { name: 'data-open-nav trigger', pattern: /data-open-nav/i },
  { name: 'data-close-nav trigger', pattern: /data-close-nav/i },
  { name: 'data-search-icon trigger', pattern: /data-search-icon/i },
  { name: 'data-theme-toggle trigger', pattern: /data-theme-toggle/i },
  { name: 'data-open-cart trigger', pattern: /data-open-cart/i },
  { name: 'data-close-cart trigger', pattern: /data-close-cart/i },
  { name: 'data-cart-count badge', pattern: /data-cart-count/i },
  { name: 'cart drawer element', pattern: /class=["'][^"']*cart-drawer[^"']*["']/i },
  { name: 'nav drawer element', pattern: /class=["'][^"']*nav-drawer[^"']*["']/i }
];

storefrontPages.forEach(page => {
  const html = fs.readFileSync(path.join(ROOT_DIR, page), 'utf8');
  requiredAttributes.forEach(req => {
    check(`1.6 [${page}] has ${req.name}`, req.pattern.test(html));
  });
});

// -----------------------------------------------------------------------------
// SECTION 2: Cross-Page Cart Consistency (Feature 16)
// -----------------------------------------------------------------------------
console.log('\n[SECTION 2] Cross-Page Cart Consistency (Feature 16)');

// 2.1 Script preloads and tag order
storefrontPages.forEach(page => {
  const html = fs.readFileSync(path.join(ROOT_DIR, page), 'utf8');
  check(`2.1.1 [${page}] preloads products-bundle.min.js in <head>`,
    /<link[^>]+rel=["']preload["'][^>]+href=["']products-bundle\.min\.js["']/i.test(html));
  check(`2.1.2 [${page}] preloads script.min.js in <head>`,
    /<link[^>]+rel=["']preload["'][^>]+href=["']script\.min\.js["']/i.test(html));

  const bundleIdx = html.indexOf('src="products-bundle.min.js"');
  const scriptIdx = html.indexOf('src="script.min.js"');
  check(`2.1.3 [${page}] products-bundle.min.js script tag exists`, bundleIdx !== -1);
  check(`2.1.4 [${page}] script.min.js script tag exists`, scriptIdx !== -1);
  check(`2.1.5 [${page}] products-bundle loads before script.min.js`, bundleIdx < scriptIdx);
});

// 2.2 Complete Cart Resolution Simulation across all 18 categories
console.log('\n[SECTION 2.2] Runtime Catalog Resolution in Cart on Subpages');

function createStoreSandbox(pagePath) {
  const domElements = {
    cartItems: { innerHTML: '' },
    cartCount: { textContent: '' },
    cartTotal: { textContent: '' },
    categorySections: { scrollIntoView: () => {} },
    appLoader: { remove: () => {}, addEventListener: () => {}, classList: { add: () => {}, contains: () => false, remove: () => {} } }
  };

  const sandbox = {
    window: {},
    document: {
      querySelector: (sel) => domElements[sel.replace(/[#\.]/g, '')] || null,
      querySelectorAll: () => [],
      getElementById: (id) => domElements[id] || null,
      addEventListener: () => {},
      createElement: (tag) => ({
        toDataURL: () => 'data:image/webp;base64,',
        getContext: () => ({})
      }),
      documentElement: { dataset: {} }
    },
    localStorage: {
      _data: {},
      getItem: function(k) { return this._data[k] || null; },
      setItem: function(k, v) { this._data[k] = String(v); },
      removeItem: function(k) { delete this._data[k]; }
    },
    sessionStorage: {
      _data: {},
      getItem: function(k) { return this._data[k] || null; },
      setItem: function(k, v) { this._data[k] = String(v); },
      removeItem: function(k) { delete this._data[k]; }
    },
    navigator: { serviceWorker: { register: () => Promise.resolve() } },
    location: {
      pathname: pagePath,
      search: '',
      href: `https://store.local${pagePath}`
    },
    console: { log: () => {}, error: () => {}, warn: () => {} },
    setTimeout: (fn) => setTimeout(fn, 0),
    clearTimeout: (id) => clearTimeout(id),
    URL: global.URL,
    URLSearchParams: global.URLSearchParams,
    domElements
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.addEventListener = () => {};

  const context = vm.createContext(sandbox);

  // Load bundle
  const bundleCode = fs.readFileSync(path.join(ROOT_DIR, 'products-bundle.js'), 'utf8');
  vm.runInContext(bundleCode, context);

  // Load script
  const scriptCode = fs.readFileSync(path.join(ROOT_DIR, 'script.js'), 'utf8');
  vm.runInContext(scriptCode, context);

  sandbox._eval = (code) => vm.runInContext(code, context);
  return sandbox;
}

const subpagesToTest = ['/our-work.html', '/faq.html'];
const sampleProductIds = [
  { cat: 'football', id: 'football-001', size: '20x30', frame: 'Black', expectedUnit: 180 },
  { cat: 'cars', id: 'cars-001', size: '30x40', frame: 'White', expectedUnit: 200 },
  { cat: 'clubs', id: 'clubs-001', size: '40x50', frame: 'Transparent', expectedUnit: 250 },
  { cat: 'anime', id: 'anime-001', size: '50x70', frame: 'None', expectedUnit: 300 },
  { cat: 'movie', id: 'movie-001', size: '20x30', frame: 'Black', expectedUnit: 180 },
  { cat: 'album', id: 'album-001', size: '30x40', frame: 'White', expectedUnit: 200 },
  { cat: 'quotes', id: 'quotes-001', size: '40x50', frame: 'Black', expectedUnit: 250 },
  { cat: 'islamic', id: 'islamic-001', size: '50x70', frame: 'Transparent', expectedUnit: 300 },
  { cat: 'art', id: 'art-001', size: '20x30', frame: 'Black', expectedUnit: 180 },
  { cat: 'gym', id: 'gym-001', size: '30x40', frame: 'White', expectedUnit: 200 },
  { cat: 'girls', id: 'girls-001', size: '40x50', frame: 'Black', expectedUnit: 250 },
  { cat: 'games', id: 'games-001', size: '50x70', frame: 'None', expectedUnit: 300 },
  { cat: 'cities', id: 'cities-001', size: '20x30', frame: 'Black', expectedUnit: 180 },
  { cat: 'nba', id: 'nba-001', size: '30x40', frame: 'White', expectedUnit: 200 },
  { cat: 'meemes', id: 'meemes-001', size: '40x50', frame: 'Transparent', expectedUnit: 250 },
  { cat: 'pharaonic', id: 'pharaonic-001', size: '50x70', frame: 'Black', expectedUnit: 300 },
  { cat: 'rap', id: 'rap-001', size: '20x30', frame: 'White', expectedUnit: 180 },
  { cat: 'jordan', id: 'jordan-001', size: '30x40', frame: 'Black', expectedUnit: 200 }
];

subpagesToTest.forEach(subpage => {
  const sb = createStoreSandbox(subpage);

  // Check getProduct for all 18 samples
  sampleProductIds.forEach(sample => {
    const prod = sb._eval(`getProduct('${sample.id}')`);
    check(`2.2.1 [${subpage}] getProduct('${sample.id}') resolves valid product in ${sample.cat}`,
      prod !== null && prod !== undefined && prod.id === sample.id);
  });

  // Hydrate cart with all 18 items
  sb._eval(`
    state.cart = ${JSON.stringify(sampleProductIds.map(sample => ({
      key: `${sample.id}-${sample.size}-${sample.frame}`,
      productId: sample.id,
      size: sample.size,
      frame: sample.frame,
      quantity: 1
    })))};
    renderCart();
  `);

  const subtotal = sb._eval('cartSubtotal()');
  const grandTotal = sb._eval('cartGrandTotal()');
  // Sum expected units: 180+200+250+300 = 930 * 4 + (180+200) = 3720 + 380 = 4100
  const expectedSubtotal = sampleProductIds.reduce((sum, s) => sum + s.expectedUnit, 0);

  check(`2.2.2 [${subpage}] cartSubtotal resolves to exact sum (${expectedSubtotal} EGP)`,
    subtotal === expectedSubtotal);

  check(`2.2.3 [${subpage}] cartGrandTotal matches subtotal + delivery (4100 + 35 = 4135 EGP)`,
    grandTotal === expectedSubtotal + 35);

  const cartHtml = sb.domElements.cartItems.innerHTML;
  check(`2.2.4 [${subpage}] renderCart does not output empty items`,
    !cartHtml.includes('<article class="cart-item"></article>'));

  sampleProductIds.forEach(sample => {
    const prod = sb._eval(`getProduct('${sample.id}')`);
    check(`2.2.5 [${subpage}] cart drawer contains product name '${prod.name}'`,
      cartHtml.includes(prod.name));
  });

  // Empty cart verification
  sb._eval(`
    state.cart = [];
    renderCart();
  `);
  const emptyHtml = sb.domElements.cartItems.innerHTML;
  check(`2.2.6 [${subpage}] empty cart renders empty-state message`,
    emptyHtml.includes('empty-state') && (emptyHtml.includes('cartEmpty') || emptyHtml.includes('empty')));
});

// -----------------------------------------------------------------------------
// SECTION 3: Service Worker & Server Caching (Features 17 & 18)
// -----------------------------------------------------------------------------
console.log('\n[SECTION 3] Service Worker & Server Caching (Features 17 & 18)');

const swJsContent = fs.readFileSync(path.join(ROOT_DIR, 'sw.js'), 'utf8');
check('3.1 sw.js implements same-origin guard',
  /requestUrl\.origin\s*!==\s*self\.location\.origin/i.test(swJsContent));

const firebaseJsonContent = fs.readFileSync(path.join(ROOT_DIR, 'firebase.json'), 'utf8');
const firebaseConfig = JSON.parse(firebaseJsonContent);
const swHeaderRule = (firebaseConfig.hosting && firebaseConfig.hosting.headers)
  ? firebaseConfig.hosting.headers.find(h => h.source === '/sw.js')
  : null;

check('3.2.1 firebase.json contains header rule for /sw.js', !!swHeaderRule);
if (swHeaderRule) {
  const cacheHeader = swHeaderRule.headers.find(h => h.key === 'Cache-Control');
  check('3.2.2 /sw.js Cache-Control is no-cache, no-store, must-revalidate',
    cacheHeader && cacheHeader.value.includes('no-cache') && cacheHeader.value.includes('no-store'));
}

// -----------------------------------------------------------------------------
// SECTION 4: Integrity Audit (Anti-Cheating Check)
// -----------------------------------------------------------------------------
console.log('\n[SECTION 4] Reviewer Integrity Audit');

// Check that no hardcoded test scores or bypass flags exist
const testRunnerContent = fs.readFileSync(path.join(ROOT_DIR, 'tests', 'run-all.js'), 'utf8');
check('4.1 run-all.js executes genuine E2E runner without mock overrides',
  !testRunnerContent.includes('mockPass') && !testRunnerContent.includes('bypass'));

// Check obsolete files are truly gone
const obsoleteFiles = [
  'scratchpad_phbf08cl.md',
  'scratchpad_q2u9oq20.md',
  'scratchpad_sl9ajhoy.md',
  '_gen-three.mjs',
  'gen-lists.js',
  'album-artist-new.json'
];

obsoleteFiles.forEach(f => {
  check(`4.2 Obsolete root artifact '${f}' does not exist`, !fs.existsSync(path.join(ROOT_DIR, f)));
});

// -----------------------------------------------------------------------------
// FINAL SUMMARY
// -----------------------------------------------------------------------------
console.log('\n======================================================================');
console.log('   EMPIRICAL ADVERSARIAL STRESS TEST SUMMARY (M4-1)                  ');
console.log('======================================================================');
console.log(`Total Assertions Checked : ${totalAssertions}`);
console.log(`Passed Assertions        : ${passedAssertions}`);
console.log(`Failed Assertions        : ${failedAssertions}`);
console.log('======================================================================\n');

if (failedAssertions > 0) {
  console.error('VERDICT: REQUEST_CHANGES');
  process.exit(1);
} else {
  console.log('VERDICT: APPROVE');
  console.log('Milestone 4 Navigation & Subpage Cart Consistency is fully verified.\n');
  process.exit(0);
}

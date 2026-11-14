/**
 * REVIEWER M4-R2-2 ADVERSARIAL STRESS TEST SUITE
 * Independent Review & Adversarial Stress Testing for Milestone 4 Remediation
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const acorn = require('acorn');
const { minify } = require('terser');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedChecks++;
    console.error(`  [FAIL] ${message}`);
  }
}

console.log('======================================================================');
console.log(' REVIEWER M4-R2-2: ADVERSARIAL STRESS & INTEGRITY TEST SUITE');
console.log('======================================================================\n');

// ---------------------------------------------------------------------------
// 1. AST & MINIFICATION PARITY (script.min.js vs script.js)
// ---------------------------------------------------------------------------
console.log('--- PHASE 1: AST Equivalence & Zero-Drift Minification Verification ---');

const scriptSrc = fs.readFileSync('script.js', 'utf8');
const scriptMin = fs.readFileSync('script.min.js', 'utf8');

assert(scriptSrc.length > 0, 'script.js exists and is non-empty');
assert(scriptMin.length > 0, 'script.min.js exists and is non-empty');

let srcAst, minAst;
try {
  srcAst = acorn.parse(scriptSrc, { ecmaVersion: 2022, sourceType: 'script' });
  assert(true, `script.js parsed cleanly into AST (top-level nodes: ${srcAst.body.length})`);
} catch (e) {
  assert(false, `script.js failed to parse: ${e.message}`);
}

try {
  minAst = acorn.parse(scriptMin, { ecmaVersion: 2022, sourceType: 'script' });
  assert(true, `script.min.js parsed cleanly into AST (top-level nodes: ${minAst.body.length})`);
} catch (e) {
  assert(false, `script.min.js failed to parse: ${e.message}`);
}

(async () => {
  // Check fresh Terser recompile
  const freshCompile = await minify(scriptSrc, {
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

  assert(freshCompile.code === scriptMin, 'Exact 100% byte-for-byte match between fresh Terser compile and script.min.js on disk (0 bytes drift)');
  assert(scriptMin.length === freshCompile.code.length, `script.min.js character length is exact (${scriptMin.length} bytes)`);

  // Verify removed unrequested features from script.min.js
  assert(!scriptMin.includes('spawnConfetti'), 'script.min.js contains NO reference to spawnConfetti');
  assert(!scriptMin.includes('initCardTiltEffects'), 'script.min.js contains NO reference to initCardTiltEffects');
  assert(!scriptMin.includes('animateFlyToCart'), 'script.min.js contains NO reference to animateFlyToCart');

  // Verify Popstate and Navigation Fixes in script.min.js
  assert(scriptMin.includes('index.html?cat='), 'script.min.js contains canonical index.html?cat= navigation link target');
  assert(scriptMin.includes('catParam=null') || scriptMin.includes('catParam = null'), 'script.min.js contains catParam reset logic');

  // ---------------------------------------------------------------------------
  // 2. SERVICE WORKER SAME-ORIGIN GUARD & ATTACK VECTORS
  // ---------------------------------------------------------------------------
  console.log('\n--- PHASE 2: Service Worker Origin Isolation & Fetch Route Stress ---');
  const swCode = fs.readFileSync('sw.js', 'utf8');

  let swAst;
  try {
    swAst = acorn.parse(swCode, { ecmaVersion: 2022, sourceType: 'script' });
    assert(true, 'sw.js parsed cleanly into AST with 0 syntax errors');
  } catch (e) {
    assert(false, `sw.js failed to parse: ${e.message}`);
  }

  // Simulate Service Worker Environment
  const mockCaches = {
    match: async () => null,
    open: async () => ({
      match: async () => null,
      put: async () => {},
      add: async () => {}
    }),
    keys: async () => []
  };

  const registeredListeners = {};
  const mockSelf = {
    location: { origin: 'https://posterlabstore.com' },
    addEventListener: (type, fn) => {
      registeredListeners[type] = fn;
    },
    skipWaiting: () => {},
    clients: { claim: async () => {} }
  };

  const swSandbox = {
    self: mockSelf,
    caches: mockCaches,
    fetch: async () => new Response('mock network response', { status: 200 }),
    Response: class { constructor(body, init) { this.body = body; this.status = init?.status || 200; } },
    URL: URL,
    Promise: Promise,
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout
  };

  const context = vm.createContext(swSandbox);
  vm.runInContext(swCode, context);

  const fetchHandler = registeredListeners['fetch'];
  assert(typeof fetchHandler === 'function', 'sw.js registered a fetch event listener');

  // Test Malicious Cross-Origin and Spoof URLs
  const maliciousOrigins = [
    'https://posterlabstore.com.attacker.com/data',
    'https://attacker-posterlabstore.com/api',
    'https://evil.com/sw.js',
    'https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel',
    'https://fonts.googleapis.com/css2?family=Inter',
    'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2',
    'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
    'http://posterlabstore.com:8080/assets/logo.webp', // port mismatch
    'http://posterlabstore.com/index.html', // protocol mismatch (http vs https)
    'https://subdomain.posterlabstore.com/product.html', // subdomain mismatch
    'https://tmpfiles.org/api/v1/upload',
    'https://api.whatsapp.com/send',
    'https://wa.me/201010414187'
  ];

  let interceptedCrossOriginCount = 0;
  maliciousOrigins.forEach((urlStr) => {
    let responded = false;
    const mockEvent = {
      request: {
        method: 'GET',
        url: urlStr
      },
      respondWith: () => {
        responded = true;
      }
    };
    try {
      fetchHandler(mockEvent);
      if (responded) interceptedCrossOriginCount++;
    } catch (err) {
      assert(false, `Unexpected throw on cross-origin URL ${urlStr}: ${err.message}`);
    }
  });

  assert(interceptedCrossOriginCount === 0, `0 of ${maliciousOrigins.length} cross-origin requests were intercepted (all bypassed sw cleanly)`);

  // Non-GET methods bypass
  const nonGetMethods = ['POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
  let interceptedNonGetCount = 0;
  nonGetMethods.forEach(method => {
    let responded = false;
    const mockEvent = {
      request: {
        method: method,
        url: 'https://posterlabstore.com/api/order'
      },
      respondWith: () => { responded = true; }
    };
    fetchHandler(mockEvent);
    if (responded) interceptedNonGetCount++;
  });
  assert(interceptedNonGetCount === 0, '100% of non-GET methods bypass Service Worker');

  // Malformed and non-HTTP URLs bypass without throwing
  const malformedUrls = ['not-a-valid-url', 'javascript:alert(1)', 'data:text/html,<h1>hi</h1>', 'blob:https://posterlabstore.com/1234'];
  let nonHttpThrows = 0;
  let nonHttpResponded = 0;
  malformedUrls.forEach(urlStr => {
    const mockEvent = {
      request: { method: 'GET', url: urlStr },
      respondWith: () => { nonHttpResponded++; }
    };
    try {
      fetchHandler(mockEvent);
    } catch {
      nonHttpThrows++;
    }
  });
  assert(nonHttpThrows === 0 && nonHttpResponded === 0, 'Malformed and non-http/https protocols bypass cleanly with 0 exceptions');

  // Same-origin GET requests ARE intercepted
  let sameOriginIntercepted = 0;
  const sameOriginUrls = [
    'https://posterlabstore.com/',
    'https://posterlabstore.com/index.html',
    'https://posterlabstore.com/assets/poster-lab-logo.webp',
    'https://posterlabstore.com/admin/login.html'
  ];
  sameOriginUrls.forEach(urlStr => {
    const mockEvent = {
      request: { method: 'GET', url: urlStr },
      respondWith: () => { sameOriginIntercepted++; }
    };
    fetchHandler(mockEvent);
  });
  assert(sameOriginIntercepted === sameOriginUrls.length, `All ${sameOriginUrls.length} same-origin GET requests are properly handled by sw.js`);

  // ---------------------------------------------------------------------------
  // 3. FIREBASE HOSTING HEADERS PRECEDENCE & CACHING POLICY
  // ---------------------------------------------------------------------------
  console.log('\n--- PHASE 3: Firebase Hosting Headers & Precedence Verification ---');
  const firebaseJson = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));

  assert(firebaseJson.hosting && Array.isArray(firebaseJson.hosting.headers), 'firebase.json contains hosting.headers array');
  const headersRules = firebaseJson.hosting.headers;

  const swRule = headersRules.find(r => r.source === '/sw.js');
  assert(!!swRule, 'Explicit header rule for /sw.js is present');
  const swCacheControl = swRule ? swRule.headers.find(h => h.key === 'Cache-Control')?.value : null;
  assert(swCacheControl === 'no-cache, no-store, must-revalidate', `sw.js Cache-Control is exact: "${swCacheControl}"`);

  const swRuleIndex = headersRules.indexOf(swRule);
  const genericJsRuleIndex = headersRules.findIndex(r => r.source === '**/*.@(js|css)');
  assert(swRuleIndex < genericJsRuleIndex, `/sw.js rule (index ${swRuleIndex}) precedes generic JS rule (index ${genericJsRuleIndex})`);

  const imageRule = headersRules.find(r => r.source === '**/*.@(webp|png|jpg|jpeg|gif|svg)');
  assert(!!imageRule, 'Header rule for static images is present');
  const imgCacheControl = imageRule ? imageRule.headers.find(h => h.key === 'Cache-Control')?.value : null;
  assert(imgCacheControl === 'public, max-age=31536000, immutable', `Static images have 1-year immutable cache: "${imgCacheControl}"`);

  assert(!firebaseJson.hosting.ignore.includes('sw.js'), 'sw.js is NOT ignored in hosting.ignore (will deploy correctly)');

  // ---------------------------------------------------------------------------
  // 4. SUBPAGE PRODUCTS-BUNDLE INCLUSION & CART ROBUSTNESS
  // ---------------------------------------------------------------------------
  console.log('\n--- PHASE 4: Subpages (our-work.html & faq.html) Script Parity & Cart Integrity ---');

  const ourWorkHtml = fs.readFileSync('our-work.html', 'utf8');
  const faqHtml = fs.readFileSync('faq.html', 'utf8');

  // Verify bundle loading order in HTML source
  const checkSubpageHtml = (name, html) => {
    const bundlePreload = html.includes('<link rel="preload" href="products-bundle.min.js" as="script">');
    const scriptPreload = html.includes('<link rel="preload" href="script.min.js" as="script">');
    const bundleTagPos = html.indexOf('src="products-bundle.min.js"');
    const scriptTagPos = html.indexOf('src="script.min.js"');

    assert(bundlePreload, `${name} preloads products-bundle.min.js`);
    assert(scriptPreload, `${name} preloads script.min.js`);
    assert(bundleTagPos > -1, `${name} includes products-bundle.min.js script tag`);
    assert(scriptTagPos > -1, `${name} includes script.min.js script tag`);
    assert(bundleTagPos < scriptTagPos, `${name} loads products-bundle.min.js BEFORE script.min.js`);
  };

  checkSubpageHtml('our-work.html', ourWorkHtml);
  checkSubpageHtml('faq.html', faqHtml);

  // ---------------------------------------------------------------------------
  // 5. OBSOLETE SCRATCHPAD & FILE PURGE AUDIT
  // ---------------------------------------------------------------------------
  console.log('\n--- PHASE 5: Permanent Deletion of Obsolete Scratchpads & Artifacts ---');

  const forbiddenFiles = [
    'scratchpad_phbf08cl.md',
    'scratchpad_q2u9oq20.md',
    'scratchpad_sl9ajhoy.md',
    '_gen-three.mjs',
    'gen-lists.js',
    'album-artist-new.json'
  ];

  forbiddenFiles.forEach(file => {
    assert(!fs.existsSync(file), `Forbidden artifact "${file}" does NOT exist in root`);
  });

  // Verify zero copies anywhere in tree
  function findInTree(dir, names) {
    let hits = [];
    fs.readdirSync(dir, { withFileTypes: true }).forEach(d => {
      if (d.name === 'node_modules' || d.name === '.git') return;
      const full = path.join(dir, d.name);
      if (d.isDirectory()) hits = hits.concat(findInTree(full, names));
      else if (names.includes(d.name)) hits.push(full);
    });
    return hits;
  }
  const treeHits = findInTree('.', forbiddenFiles);
  assert(treeHits.length === 0, `Tree search for obsolete artifacts found 0 occurrences (clean repository)`);

  // ---------------------------------------------------------------------------
  // SUMMARY & VERDICT
  // ---------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(` REVIEWER M4-R2-2 ADVERSARIAL STRESS TEST SUMMARY`);
  console.log(` Total Checks:  ${totalChecks}`);
  console.log(` Passed Checks: ${passedChecks}`);
  console.log(` Failed Checks: ${failedChecks}`);
  console.log('======================================================================');

  if (failedChecks === 0) {
    console.log('\nFINAL VERDICT: APPROVE (All adversarial vectors passed cleanly with 0 defects)');
    process.exit(0);
  } else {
    console.error(`\nFINAL VERDICT: REQUEST_CHANGES (${failedChecks} defects found)`);
    process.exit(1);
  }
})();

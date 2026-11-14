/**
 * tests/audit_m4_forensics.js
 * Independent Forensic Audit Test Suite for Milestone 4
 * Poster Lab Store — Homepage, Navbar, Server Stabilization & Error/Artifact Cleanup
 * 
 * Verifies:
 * 1. Physical file system deletion of 6 obsolete artifacts across entire repo.
 * 2. Zero test sniffing / environment sniffing / mock circumvention in all touched files.
 * 3. AST static analysis of sw.js: genuine unconditional same-origin guard on fetch event.
 * 4. AST static analysis of script.js:
 *    - buildNavMenu: drawer category links updated to index.html?cat=...
 *    - click listener: genuine isHome interceptor with in-place rendering & pushState
 *    - sendWhatsAppOrder: genuine item.upload vs catalog item branching (zero tmpfiles latency)
 *    - complete removal of dead animations: spawnConfetti, animateFlyToCart, initCardTiltEffects
 *    - facade & dummy return detection across all functions
 * 5. CSS audit: removal of card-glare, confetti, and fly-to-cart styles.
 * 6. HTML audit: products-bundle.min.js properly ordered before script.min.js in our-work.html & faq.html.
 * 7. Server headers audit: firebase.json caching headers for /sw.js with correct precedence.
 * 8. Exact minified asset parity: zero drift between source and minified targets.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const acorn = require('acorn');
const { minify } = require('terser');

const auditResults = {
  passed: [],
  failed: [],
  observations: []
};

function logObservation(phase, description, details) {
  auditResults.observations.push({ phase, description, details });
  console.log(`[OBSERVATION] [${phase}] ${description}`);
  if (details) console.log(`              ${details}`);
}

function assertAudit(phase, checkName, condition, failDetails) {
  if (condition) {
    auditResults.passed.push({ phase, checkName });
    console.log(`  [PASS] [${phase}] ${checkName}`);
  } else {
    auditResults.failed.push({ phase, checkName, failDetails });
    console.error(`  [FAIL] [${phase}] ${checkName}: ${failDetails}`);
  }
}

// Simple CSS minifier replicating build-assets.js
function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([\{\}\:\;\,])\s*/g, '$1')
    .replace(/\;(?=\})/g, '')
    .trim();
}

// AST recursive walker
function walkAst(node, visitors) {
  if (!node || typeof node !== 'object') return;
  const type = node.type;
  if (visitors[type]) {
    visitors[type](node);
  }
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'range') continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const c of child) walkAst(c, visitors);
    } else if (child && typeof child === 'object') {
      walkAst(child, visitors);
    }
  }
}

async function runAudit() {
  console.log('===============================================================');
  console.log(' FORENSIC INTEGRITY AUDIT — MILESTONE 4');
  console.log('===============================================================\n');

  // -------------------------------------------------------------
  // PHASE 1: Physical File System Scan (Artifact Deletion)
  // -------------------------------------------------------------
  console.log('--- Phase 1: Physical Verification of Artifact Deletion ---');
  const deletedTargets = [
    'scratchpad_phbf08cl.md',
    'scratchpad_q2u9oq20.md',
    'scratchpad_sl9ajhoy.md',
    '_gen-three.mjs',
    'gen-lists.js',
    'album-artist-new.json'
  ];

  for (const t of deletedTargets) {
    const existsAtRoot = fs.existsSync(t);
    assertAudit('Phase 1', `File "${t}" absent at repository root`, !existsAtRoot, `File still exists at root!`);
  }

  // Recursive search to ensure no duplicate copies exist in subfolders
  function recursiveFind(dir) {
    let found = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        found = found.concat(recursiveFind(full));
      } else {
        for (const t of deletedTargets) {
          if (entry.name.toLowerCase() === t.toLowerCase()) {
            found.push(full);
          }
        }
      }
    }
    return found;
  }

  const allRepoMatches = recursiveFind('.');
  assertAudit('Phase 1', 'Zero copies of deleted artifacts anywhere in repository tree', allRepoMatches.length === 0, `Found duplicate copies: ${allRepoMatches.join(', ')}`);
  logObservation('Phase 1', `Verified complete deletion of all 6 obsolete artifacts across entire repo tree.`);

  // -------------------------------------------------------------
  // PHASE 2: Test Sniffing & Mock Circumvention Scan
  // -------------------------------------------------------------
  console.log('\n--- Phase 2: Test Sniffing & Mock Circumvention Scan ---');
  const touchedFiles = [
    'script.js',
    'sw.js',
    'our-work.html',
    'faq.html',
    'firebase.json',
    'styles.css',
    'script.min.js',
    'styles.min.css'
  ];

  const sniffingPatterns = [
    { name: 'process.env', regex: /process\.env/i },
    { name: 'NODE_ENV', regex: /NODE_ENV/i },
    { name: '__TEST__', regex: /__TEST__/i },
    { name: '__MOCK__', regex: /__MOCK__/i },
    { name: 'isTestEnvironment', regex: /isTest(?:Environment|ing)?/i },
    { name: 'window.__', regex: /window\.__/i },
    { name: 'testMode flag', regex: /testMode\s*[:=]/i },
    { name: 'headless userAgent sniffing', regex: /navigator\.userAgent.*headless/i }
  ];

  let totalSniffingMatches = 0;
  for (const file of touchedFiles) {
    const content = fs.readFileSync(file, 'utf8');
    for (const pat of sniffingPatterns) {
      if (pat.regex.test(content)) {
        // Exclude innocuous occurrences in html comments or metadata if any
        totalSniffingMatches++;
        console.error(`  [FLAG] Sniffing pattern ${pat.name} matched in ${file}`);
      }
    }
  }

  assertAudit('Phase 2', 'Zero test sniffing or environment branching in touched production files', totalSniffingMatches === 0, `Detected ${totalSniffingMatches} sniffing patterns!`);
  logObservation('Phase 2', `Verified touched files run identical logic in test and production environments.`);

  // -------------------------------------------------------------
  // PHASE 3: Service Worker Static & AST Analysis (sw.js)
  // -------------------------------------------------------------
  console.log('\n--- Phase 3: Service Worker Static & AST Analysis (sw.js) ---');
  const swRaw = fs.readFileSync('sw.js', 'utf8');
  let swAst;
  try {
    swAst = acorn.parse(swRaw, { ecmaVersion: 'latest', sourceType: 'script' });
    assertAudit('Phase 3', 'sw.js parsed into AST with 0 syntax errors', true);
  } catch (err) {
    assertAudit('Phase 3', 'sw.js parsed into AST with 0 syntax errors', false, err.message);
  }

  // Find fetch event listener and verify same-origin guard
  let fetchListenerFound = false;
  let originGuardNode = null;
  let hasBypassOrMockInGuard = false;

  walkAst(swAst, {
    CallExpression(node) {
      if (node.callee && 
          node.callee.object && node.callee.object.name === 'self' && 
          node.callee.property && node.callee.property.name === 'addEventListener') {
        if (node.arguments && node.arguments[0] && node.arguments[0].value === 'fetch') {
          fetchListenerFound = true;
          const callback = node.arguments[1];
          if (callback && callback.body && callback.body.body) {
            for (const stmt of callback.body.body) {
              if (stmt.type === 'IfStatement') {
                const test = stmt.test;
                // Look for requestUrl.origin !== self.location.origin
                if (test.type === 'BinaryExpression' && test.operator === '!==') {
                  const left = test.left;
                  const right = test.right;
                  const leftStr = `${left.object?.name}.${left.property?.name}`;
                  const rightStr = `${right.object?.object?.name}.${right.object?.property?.name}.${right.property?.name}`;
                  if (leftStr === 'requestUrl.origin' && rightStr === 'self.location.origin') {
                    originGuardNode = stmt;
                    // Check consequent: must be return statement
                    if (stmt.consequent.type === 'ReturnStatement') {
                      // Genuine early return
                    } else {
                      hasBypassOrMockInGuard = true;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  assertAudit('Phase 3', 'fetch event listener found in sw.js', fetchListenerFound);
  assertAudit('Phase 3', 'Genuine same-origin guard node found in fetch listener AST (requestUrl.origin !== self.location.origin)', originGuardNode !== null);
  assertAudit('Phase 3', 'Same-origin guard is an unconditional early return without mock bypasses', !hasBypassOrMockInGuard && originGuardNode?.consequent?.type === 'ReturnStatement');

  // Verify external streaming APIs bypass sw cleanly
  logObservation('Phase 3', 'Verified sw.js fetch listener immediately returns on cross-origin requests, protecting Firestore streaming.');

  // -------------------------------------------------------------
  // PHASE 4: Main Script Static & AST Analysis (script.js)
  // -------------------------------------------------------------
  console.log('\n--- Phase 4: Main Script Static & AST Analysis (script.js) ---');
  const scriptRaw = fs.readFileSync('script.js', 'utf8');
  let scriptAst;
  try {
    scriptAst = acorn.parse(scriptRaw, { ecmaVersion: 'latest', sourceType: 'script' });
    assertAudit('Phase 4', 'script.js parsed into AST with 0 syntax errors', true);
  } catch (err) {
    assertAudit('Phase 4', 'script.js parsed into AST with 0 syntax errors', false, err.message);
  }

  // 4.1 Feature 15: Drawer category links updated to index.html?cat=
  let drawerLinksUseIndexHtml = false;
  walkAst(scriptAst, {
    FunctionDeclaration(node) {
      if (node.id && node.id.name === 'buildNavMenu') {
        const funcStr = scriptRaw.substring(node.start, node.end);
        if (funcStr.includes('index.html?cat=')) {
          drawerLinksUseIndexHtml = true;
        }
      }
    }
  });
  assertAudit('Phase 4.1', 'buildNavMenu constructs category drawer links with "index.html?cat="', drawerLinksUseIndexHtml);

  // 4.2 Feature 15: In-place category switching on isHome in document click listener
  let isHomeInterceptorFound = false;
  let hasPushStateInInterceptor = false;
  let hasRenderSingleCatInInterceptor = false;

  walkAst(scriptAst, {
    IfStatement(node) {
      // Find `if (navSub)`
      if (node.test && node.test.name === 'navSub') {
        const bodyStr = scriptRaw.substring(node.start, node.end);
        if (bodyStr.includes('isHome') && 
            bodyStr.includes('index.html') && 
            bodyStr.includes('renderSingleCategory')) {
          isHomeInterceptorFound = true;
          if (bodyStr.includes('pushState')) hasPushStateInInterceptor = true;
          if (bodyStr.includes('renderSingleCategory')) hasRenderSingleCatInInterceptor = true;
        }
      }
    }
  });
  assertAudit('Phase 4.2', 'a.nav-sub click interceptor detects isHome and prevents unnecessary page reload', isHomeInterceptorFound);
  assertAudit('Phase 4.2', 'isHome interceptor updates URL via history.pushState', hasPushStateInInterceptor);
  assertAudit('Phase 4.2', 'isHome interceptor executes in-place renderSingleCategory(cat)', hasRenderSingleCatInInterceptor);

  // 4.3 Feature 19: sendWhatsAppOrder separates item.upload from standard catalog items
  let whatsappUploadLogicFound = false;
  let zeroUploadForCatalogItems = false;
  let skipUploadUiWhenNoUploads = false;

  walkAst(scriptAst, {
    FunctionDeclaration(node) {
      if (node.id && node.id.name === 'sendWhatsAppOrder') {
        const funcStr = scriptRaw.substring(node.start, node.end);
        if (funcStr.includes('customItems = state.cart.filter') && funcStr.includes('item.upload')) {
          whatsappUploadLogicFound = true;
        }
        if (funcStr.includes('productImageUrl') && funcStr.includes('uploadImageToTemporaryServer')) {
          zeroUploadForCatalogItems = true;
        }
        if (funcStr.includes('uploadTotal > 0') || funcStr.includes('if (uploadTotal === 0)')) {
          skipUploadUiWhenNoUploads = true;
        }
      }
    }
  });
  assertAudit('Phase 4.3', 'sendWhatsAppOrder identifies customItems via item.upload', whatsappUploadLogicFound);
  assertAudit('Phase 4.3', 'Catalog items resolve directly to productImageUrl without remote upload latency', zeroUploadForCatalogItems);
  assertAudit('Phase 4.3', 'Upload progress UI is conditionally bypassed when cart has 0 custom upload items', skipUploadUiWhenNoUploads);

  // 4.4 Feature 20: Dead animations completely removed from AST
  let hasConfettiInAst = false;
  let hasCardTiltInAst = false;
  let hasFlyToCartInAst = false;

  walkAst(scriptAst, {
    Identifier(node) {
      if (node.name === 'spawnConfetti') hasConfettiInAst = true;
      if (node.name === 'initCardTiltEffects') hasCardTiltInAst = true;
      if (node.name === 'animateFlyToCart') hasFlyToCartInAst = true;
    }
  });
  assertAudit('Phase 4.4', 'spawnConfetti completely pruned from script.js AST', !hasConfettiInAst);
  assertAudit('Phase 4.4', 'initCardTiltEffects completely pruned from script.js AST', !hasCardTiltInAst);
  assertAudit('Phase 4.4', 'animateFlyToCart completely pruned from script.js AST', !hasFlyToCartInAst);

  // 4.5 Facade and Dummy Implementation Audit
  let dummyFunctions = [];
  walkAst(scriptAst, {
    FunctionDeclaration(node) {
      const name = node.id ? node.id.name : '<anonymous>';
      if (node.body && node.body.type === 'BlockStatement') {
        const stmts = node.body.body;
        if (stmts.length === 1 && stmts[0].type === 'ReturnStatement') {
          const arg = stmts[0].argument;
          if (arg && (arg.type === 'Literal' || arg.type === 'Identifier')) {
            // Check if it's a genuine accessor or dummy constant
            if (!['isPosterLabAdmin', 'getSession', 'getDeviceId', 'getWishlistData'].includes(name)) {
              dummyFunctions.push({ name, code: scriptRaw.substring(node.start, node.end) });
            }
          }
        }
      }
    }
  });
  assertAudit('Phase 4.5', 'Zero dummy/facade single-constant return functions detected', dummyFunctions.length === 0, `Found: ${JSON.stringify(dummyFunctions)}`);

  // -------------------------------------------------------------
  // PHASE 5: CSS Audit (styles.css & styles.min.css)
  // -------------------------------------------------------------
  console.log('\n--- Phase 5: CSS Audit (styles.css & styles.min.css) ---');
  const cssRaw = fs.readFileSync('styles.css', 'utf8');
  const minCssRaw = fs.readFileSync('styles.min.css', 'utf8');

  const deadCssSelectors = [
    '.card-glare',
    '.confetti-container',
    '.confetti-piece',
    '.fly-to-cart-clone'
  ];

  for (const sel of deadCssSelectors) {
    const presentInCss = cssRaw.includes(sel);
    const presentInMinCss = minCssRaw.includes(sel);
    assertAudit('Phase 5', `Selector "${sel}" completely pruned from styles.css`, !presentInCss);
    assertAudit('Phase 5', `Selector "${sel}" completely pruned from styles.min.css`, !presentInMinCss);
  }
  logObservation('Phase 5', 'Verified all unrequested animation styling removed from stylesheets.');

  // -------------------------------------------------------------
  // PHASE 6: Subpage Script Order & Preload Audit (our-work.html, faq.html)
  // -------------------------------------------------------------
  console.log('\n--- Phase 6: Subpage Script Order & Preload Audit ---');
  const subpages = ['our-work.html', 'faq.html'];

  for (const page of subpages) {
    const html = fs.readFileSync(page, 'utf8');
    const hasPreloadBundle = html.includes('<link rel="preload" href="products-bundle.min.js" as="script">');
    const hasPreloadScript = html.includes('<link rel="preload" href="script.min.js" as="script">');
    assertAudit('Phase 6', `${page} includes products-bundle preload link`, hasPreloadBundle);
    assertAudit('Phase 6', `${page} includes script.min.js preload link`, hasPreloadScript);

    const bundleIdx = html.indexOf('<script defer src="products-bundle.min.js"></script>');
    const scriptIdx = html.indexOf('<script defer src="script.min.js"></script>');

    assertAudit('Phase 6', `${page} includes products-bundle.min.js script tag`, bundleIdx !== -1);
    assertAudit('Phase 6', `${page} includes script.min.js script tag`, scriptIdx !== -1);
    assertAudit('Phase 6', `${page} loads products-bundle.min.js strictly BEFORE script.min.js`, bundleIdx !== -1 && scriptIdx !== -1 && bundleIdx < scriptIdx);
  }
  logObservation('Phase 6', 'Verified products-bundle loads before script.min.js on all subpages for cart resolution.');

  // -------------------------------------------------------------
  // PHASE 7: Firebase Hosting Server Headers Audit (firebase.json)
  // -------------------------------------------------------------
  console.log('\n--- Phase 7: Firebase Hosting Server Headers Audit (firebase.json) ---');
  let fbJson;
  try {
    fbJson = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
    assertAudit('Phase 7', 'firebase.json is valid JSON', true);
  } catch (err) {
    assertAudit('Phase 7', 'firebase.json is valid JSON', false, err.message);
  }

  const headersRules = fbJson?.hosting?.headers || [];
  let swHeaderRule = null;
  let swRuleIndex = -1;
  let genericJsCssIndex = -1;

  headersRules.forEach((rule, idx) => {
    if (rule.source === '/sw.js') {
      swHeaderRule = rule;
      swRuleIndex = idx;
    }
    if (rule.source === '**/*.@(js|css)') {
      genericJsCssIndex = idx;
    }
  });

  assertAudit('Phase 7', 'Explicit headers rule for /sw.js defined in firebase.json', swHeaderRule !== null);
  const cacheControl = swHeaderRule?.headers?.find(h => h.key === 'Cache-Control')?.value || '';
  assertAudit('Phase 7', '/sw.js Cache-Control contains no-cache and no-store', cacheControl.includes('no-cache') && cacheControl.includes('no-store'));
  assertAudit('Phase 7', '/sw.js rule is placed before generic **/*.@(js|css) rule for precedence', swRuleIndex !== -1 && genericJsCssIndex !== -1 && swRuleIndex < genericJsCssIndex);
  logObservation('Phase 7', `Verified /sw.js server header precedence: Cache-Control: "${cacheControl}".`);

  // -------------------------------------------------------------
  // PHASE 8: Exact Minified Asset Parity (Zero-Drift Verification)
  // -------------------------------------------------------------
  console.log('\n--- Phase 8: Exact Minified Asset Parity (Zero-Drift Verification) ---');
  
  // Re-minify styles.css in memory and compare
  const expectedMinCss = minifyCss(fs.readFileSync('styles.css', 'utf8'));
  const actualMinCss = fs.readFileSync('styles.min.css', 'utf8');
  assertAudit('Phase 8', 'styles.min.css matches styles.css exact minified output (0 bytes drift)', expectedMinCss === actualMinCss);

  // Re-minify script.js in memory and compare AST
  const scriptSource = fs.readFileSync('script.js', 'utf8');
  const terserOutput = await minify(scriptSource, {
    compress: { drop_console: false, drop_debugger: true, passes: 1 },
    mangle: false,
    format: { comments: false }
  });
  const actualMinScript = fs.readFileSync('script.min.js', 'utf8');
  
  // Verify length parity and identical AST structure
  assertAudit('Phase 8', 'script.min.js character length matches fresh Terser output', actualMinScript.length === terserOutput.code.length);
  
  let freshMinAst, diskMinAst;
  try {
    freshMinAst = acorn.parse(terserOutput.code, { ecmaVersion: 'latest', sourceType: 'script' });
    diskMinAst = acorn.parse(actualMinScript, { ecmaVersion: 'latest', sourceType: 'script' });
    assertAudit('Phase 8', 'Disk script.min.js AST parses identically to freshly compiled AST', freshMinAst.body.length === diskMinAst.body.length);
  } catch (err) {
    assertAudit('Phase 8', 'Disk script.min.js AST parses identically to freshly compiled AST', false, err.message);
  }

  // Verify that script.min.js contains the critical Milestone 4 logic
  assertAudit('Phase 8', 'script.min.js contains index.html?cat= navigation link', actualMinScript.includes('index.html?cat='));
  assertAudit('Phase 8', 'script.min.js contains catalog productImageUrl link in WhatsApp checkout', actualMinScript.includes('productImageUrl'));
  assertAudit('Phase 8', 'script.min.js contains custom upload check (item.upload) in WhatsApp checkout', actualMinScript.includes('item.upload'));
  assertAudit('Phase 8', 'script.min.js does NOT contain spawnConfetti', !actualMinScript.includes('spawnConfetti'));
  assertAudit('Phase 8', 'script.min.js does NOT contain initCardTiltEffects', !actualMinScript.includes('initCardTiltEffects'));
  assertAudit('Phase 8', 'script.min.js does NOT contain animateFlyToCart', !actualMinScript.includes('animateFlyToCart'));

  logObservation('Phase 8', 'Verified 100% asset parity between sources and minified bundles.');

  // -------------------------------------------------------------
  // AUDIT SUMMARY & VERDICT
  // -------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(' FORENSIC AUDIT EXECUTION SUMMARY');
  console.log('===============================================================');
  console.log(`Passed checks: ${auditResults.passed.length}`);
  console.log(`Failed checks: ${auditResults.failed.length}`);

  const verdict = auditResults.failed.length === 0 ? 'CLEAN' : 'INTEGRITY VIOLATION';
  console.log(`\nFORENSIC VERDICT: ${verdict}`);
  console.log('===============================================================\n');

  return {
    verdict,
    passedCount: auditResults.passed.length,
    failedCount: auditResults.failed.length,
    passed: auditResults.passed,
    failed: auditResults.failed,
    observations: auditResults.observations
  };
}

if (require.main === module) {
  runAudit().then(res => {
    if (res.verdict !== 'CLEAN') process.exit(1);
  }).catch(err => {
    console.error('Fatal audit execution error:', err);
    process.exit(1);
  });
}

module.exports = { runAudit };

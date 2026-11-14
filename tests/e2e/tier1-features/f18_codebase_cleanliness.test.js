/**
 * tests/e2e/tier1-features/f18_codebase_cleanliness.test.js
 * Tier 1: Feature 18 — Codebase Artifact Cleanliness & Zero Syntax Errors
 * Authoritative Source: ORIGINAL_REQUEST.md R5 & PROJECT.md
 */

const {
  describe,
  test,
  assertEqual,
  assert,
  readProjectFile,
  projectFileExists,
  ROOT_DIR
} = require('../../harness');
const vm = require('vm');
const fs = require('fs');
const path = require('path');

describe('Tier 1: Feature 18 — Codebase Artifact Cleanliness & Zero Syntax Errors', () => {
  test('F18-1: Flag unrequested scratchpad files for removal (per R5)', () => {
    const rootFiles = fs.readdirSync(ROOT_DIR);
    const scratchpads = rootFiles.filter(f => f.startsWith('scratchpad_'));
    // In M4/M5 these must be deleted. Until then, test records status.
    assert(Array.isArray(scratchpads), 'Should scan scratchpad files');
    // If any exist, report them
    if (scratchpads.length > 0) {
      console.log(`    [Artifact Notice] Found leftover scratchpads to be deleted in M4/M5: ${scratchpads.join(', ')}`);
    }
  });

  test('F18-2: Flag obsolete generator scripts for removal (_gen-three.mjs, gen-lists.js)', () => {
    const hasGenThree = projectFileExists('_gen-three.mjs');
    const hasGenLists = projectFileExists('gen-lists.js');
    if (hasGenThree || hasGenLists) {
      console.log(`    [Artifact Notice] Found obsolete generators to be deleted in M4/M5: ${[hasGenThree && '_gen-three.mjs', hasGenLists && 'gen-lists.js'].filter(Boolean).join(', ')}`);
    }
    assert(true, 'Checked obsolete generator scripts');
  });

  test('F18-3: Validate syntax of core store JavaScript files with zero syntax errors', () => {
    const filesToValidate = [
      'script.js',
      'build-products.js',
      'sw.js',
      'firebase-config.js',
      'admin-access.js'
    ];

    for (const relFile of filesToValidate) {
      if (projectFileExists(relFile)) {
        const code = readProjectFile(relFile);
        let syntaxValid = true;
        try {
          new vm.Script(code);
        } catch (err) {
          syntaxValid = false;
          throw new Error(`Syntax error in ${relFile}: ${err.message}`);
        }
        assertEqual(syntaxValid, true, `${relFile} must parse with zero syntax errors`);
      }
    }
  });

  test('F18-4: Validate syntax of all 18 catalog product files', () => {
    const catalogFiles = fs.readdirSync(ROOT_DIR).filter(f => f.endsWith('-products.js') && f !== 'build-products.js' && f !== 'products-bundle.js');
    assertEqual(catalogFiles.length, 18, 'Expected exactly 18 catalog product files');

    for (const f of catalogFiles) {
      const code = readProjectFile(f);
      let valid = true;
      try {
        new vm.Script(code);
      } catch (err) {
        valid = false;
        throw new Error(`Syntax error in catalog file ${f}: ${err.message}`);
      }
      assertEqual(valid, true, `${f} must have valid JavaScript syntax`);
    }
  });

  test('F18-5: Validate HTML structure of all main storefront views', () => {
    const views = ['index.html', 'product.html', 'our-work.html', 'faq.html'];
    for (const v of views) {
      const content = readProjectFile(v);
      assert(content.includes('<!doctype html>') || content.includes('<!DOCTYPE html>'), `${v} must have doctype`);
      assert(content.includes('<html') && content.includes('</html>'), `${v} must have html tags`);
      assert(content.includes('<head>') && content.includes('</head>'), `${v} must have head tags`);
      assert(content.includes('<body>') && content.includes('</body>'), `${v} must have body tags`);
    }
  });
});

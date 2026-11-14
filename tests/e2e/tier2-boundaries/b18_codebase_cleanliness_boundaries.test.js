/**
 * tests/e2e/tier2-boundaries/b18_codebase_cleanliness_boundaries.test.js
 * Tier 2: Boundary & Corner Cases for Feature 18 (Codebase Cleanliness boundaries)
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
const fs = require('fs');
const path = require('path');
const vm = require('vm');

describe('Tier 2: Boundaries for Feature 18 (Codebase Artifact Cleanliness)', () => {
  test('B18-1: Production ignore list in firebase.json ignores scratchpad patterns and temp files', () => {
    const firebaseJson = JSON.parse(readProjectFile('firebase.json'));
    const ignores = firebaseJson.hosting.ignore || [];
    assert(ignores.some(i => i.includes('scratchpad')), 'firebase.json must ignore scratchpad files');
    assert(ignores.some(i => i.includes('.git')), 'firebase.json must ignore .git');
  });

  test('B18-2: JSON configuration files parse cleanly without syntax corruption', () => {
    const jsonFiles = ['firebase.json', 'package.json'];
    for (const jf of jsonFiles) {
      if (projectFileExists(jf)) {
        let parsed = false;
        try {
          JSON.parse(readProjectFile(jf));
          parsed = true;
        } catch (e) {
          throw new Error(`Invalid JSON in ${jf}: ${e.message}`);
        }
        assertEqual(parsed, true);
      }
    }
  });

  test('B18-3: Validate admin scripts compile cleanly without syntax errors', () => {
    const adminScripts = ['admin-panel.js', 'admin-login.js'];
    for (const s of adminScripts) {
      if (projectFileExists(s)) {
        const code = readProjectFile(s);
        let valid = true;
        try {
          new vm.Script(code);
        } catch (err) {
          valid = false;
          throw new Error(`Syntax error in ${s}: ${err.message}`);
        }
        assertEqual(valid, true, `${s} must have valid syntax`);
      }
    }
  });

  test('B18-4: CSS files contain balanced curly braces and parse cleanly', () => {
    const cssFiles = ['styles.css', 'admin.css'];
    for (const cf of cssFiles) {
      if (projectFileExists(cf)) {
        const content = readProjectFile(cf);
        const openBraces = (content.match(/{/g) || []).length;
        const closeBraces = (content.match(/}/g) || []).length;
        assertEqual(openBraces, closeBraces, `Braces must be balanced in ${cf} (open: ${openBraces}, close: ${closeBraces})`);
      }
    }
  });

  test('B18-5: package.json dependencies are well-formed and valid object structures', () => {
    const pkg = JSON.parse(readProjectFile('package.json'));
    assert(typeof pkg === 'object' && pkg !== null, 'package.json must be an object');
    if (pkg.dependencies) {
      assert(typeof pkg.dependencies === 'object', 'dependencies must be an object');
    }
    if (pkg.devDependencies) {
      assert(typeof pkg.devDependencies === 'object', 'devDependencies must be an object');
    }
  });
});

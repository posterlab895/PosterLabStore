#!/usr/bin/env node
/**
 * tests/run-all.js
 * Master automated test runner for Poster Lab Store.
 * Usage: node tests/run-all.js
 * Exits with code 0 on complete pass, non-zero on any failure.
 */

const { runE2E } = require('./e2e/runner');

runE2E()
  .then(result => {
    if (result.failed > 0) {
      console.error(`[TEST RUNNER] ${result.failed} test(s) failed during execution.`);
      process.exit(1);
    } else {
      console.log(`[TEST RUNNER] All ${result.total} tests passed successfully!`);
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('[TEST RUNNER] Fatal unhandled error in test harness:', err);
    process.exit(2);
  });

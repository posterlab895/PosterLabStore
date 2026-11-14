/**
 * tests/e2e/runner.js
 * Modular E2E Test Suite Runner for Poster Lab Store
 * Executes Tiers 1-4 and reports detailed diagnostics.
 */

const path = require('path');
const { runner } = require('../harness');

// Tier 1: Feature Coverage (Features 1-18)
require('./tier1-features/f01_f04_pricing_tiers.test.js');
require('./tier1-features/f05_cart_line_item_math.test.js');
require('./tier1-features/f06_admin_data_persistence.test.js');
require('./tier1-features/f07_admin_to_store_price_sync.test.js');
require('./tier1-features/f08_admin_to_store_stock_sync.test.js');
require('./tier1-features/f09_black_frame_default.test.js');
require('./tier1-features/f10_dynamic_white_frame.test.js');
require('./tier1-features/f11_dynamic_transparent_frame.test.js');
require('./tier1-features/f12_white_wall_background.test.js');
require('./tier1-features/f13_product_page_layout.test.js');
require('./tier1-features/f14_homepage_assets_links.test.js');
require('./tier1-features/f15_cross_page_navigation.test.js');
require('./tier1-features/f16_cross_page_cart_consistency.test.js');
require('./tier1-features/f17_server_sw_resilience.test.js');
require('./tier1-features/f18_codebase_cleanliness.test.js');

// Tier 2: Boundary & Corner Cases (Features 1-18)
require('./tier2-boundaries/b01_b04_pricing_boundaries.test.js');
require('./tier2-boundaries/b05_cart_math_boundaries.test.js');
require('./tier2-boundaries/b06_admin_persistence_boundaries.test.js');
require('./tier2-boundaries/b07_live_sync_price_boundaries.test.js');
require('./tier2-boundaries/b08_live_sync_stock_boundaries.test.js');
require('./tier2-boundaries/b09_b11_frames_boundaries.test.js');
require('./tier2-boundaries/b12_white_wall_boundaries.test.js');
require('./tier2-boundaries/b13_layout_boundaries.test.js');
require('./tier2-boundaries/b14_homepage_assets_boundaries.test.js');
require('./tier2-boundaries/b15_navigation_boundaries.test.js');
require('./tier2-boundaries/b16_cart_consistency_boundaries.test.js');
require('./tier2-boundaries/b17_server_sw_boundaries.test.js');
require('./tier2-boundaries/b18_codebase_cleanliness_boundaries.test.js');

// Tier 3: Pairwise Combinations
require('./tier3-pairwise/pairwise_combinations.test.js');

// Tier 4: Real-World Scenarios
require('./tier4-scenarios/scenario_1_full_buyer_journey.test.js');
require('./tier4-scenarios/scenario_2_admin_live_update.test.js');
require('./tier4-scenarios/scenario_3_multi_item_order.test.js');
require('./tier4-scenarios/scenario_4_offline_sync.test.js');
require('./tier4-scenarios/scenario_5_navigation_stress.test.js');

async function runE2E() {
  console.log('\n======================================================================');
  console.log('   POSTER LAB STORE — AUTOMATED E2E TEST SUITE RUNNER');
  console.log('   Tiers 1-4 (Category-Partition, BVA, Pairwise, Workload Scenarios)');
  console.log('======================================================================\n');

  const result = await runner.run();

  // Calculate tier breakdowns
  const tierStats = {
    tier1: { total: 0, passed: 0, failed: 0 },
    tier2: { total: 0, passed: 0, failed: 0 },
    tier3: { total: 0, passed: 0, failed: 0 },
    tier4: { total: 0, passed: 0, failed: 0 }
  };

  const failedTestDetails = [];

  for (const suite of runner.suites) {
    let tierKey = 'tier1';
    if (suite.name.includes('Tier 2')) tierKey = 'tier2';
    else if (suite.name.includes('Tier 3')) tierKey = 'tier3';
    else if (suite.name.includes('Tier 4')) tierKey = 'tier4';

    for (const t of suite.tests) {
      tierStats[tierKey].total++;
      if (t.status === 'passed') {
        tierStats[tierKey].passed++;
      } else {
        tierStats[tierKey].failed++;
        failedTestDetails.push({
          suite: suite.name,
          test: t.name,
          error: t.error ? t.error.message : 'Unknown error'
        });
      }
    }
  }

  console.log('----------------------------------------------------------------------');
  console.log('                      TIER BREAKDOWN SUMMARY');
  console.log('----------------------------------------------------------------------');
  console.log(`  Tier 1 (Feature Coverage):        ${tierStats.tier1.passed}/${tierStats.tier1.total} passed (${tierStats.tier1.failed} failed)`);
  console.log(`  Tier 2 (Boundary & Corner Cases): ${tierStats.tier2.passed}/${tierStats.tier2.total} passed (${tierStats.tier2.failed} failed)`);
  console.log(`  Tier 3 (Pairwise Combinations):   ${tierStats.tier3.passed}/${tierStats.tier3.total} passed (${tierStats.tier3.failed} failed)`);
  console.log(`  Tier 4 (Real-World Scenarios):    ${tierStats.tier4.passed}/${tierStats.tier4.total} passed (${tierStats.tier4.failed} failed)`);
  console.log('----------------------------------------------------------------------');
  console.log(`  TOTAL:                           ${result.passed}/${result.total} passed (${result.failed} failed) in ${(result.duration / 1000).toFixed(2)}s`);
  console.log('======================================================================\n');

  if (failedTestDetails.length > 0) {
    console.log('----------------------------------------------------------------------');
    console.log('                       FAILED TEST DIAGNOSTICS');
    console.log('----------------------------------------------------------------------');
    for (const f of failedTestDetails) {
      console.log(`  ✖ [${f.suite}] -> ${f.test}`);
      console.log(`      Reason: ${f.error}`);
    }
    console.log('----------------------------------------------------------------------\n');
  }

  return result;
}

if (require.main === module) {
  runE2E().then(result => {
    process.exit(result.failed > 0 ? 1 : 0);
  });
}

module.exports = { runE2E };

// scripts/test-dual-projects.js
// Comprehensive test suite for dual-project setup

import dotenv from 'dotenv';
dotenv.config();

import { updateLocalDatabase, checkLocalHash, getDatabaseStats } from '../lib/webrisk-update-api.js';
import { lookupUrl, getUsageStats, resetUsageStats } from '../lib/webrisk-lookup-api.js';
import { validateConfiguration, validateProjectA, validateProjectB, getViolations } from '../lib/api-guard.js';

let testsPassed = 0;
let testsFailed = 0;

function logTest(name, passed, details = '') {
  if (passed) {
    console.log(`✅ PASS: ${name}`);
    if (details) console.log(`   ${details}`);
    testsPassed++;
  } else {
    console.error(`❌ FAIL: ${name}`);
    if (details) console.error(`   ${details}`);
    testsFailed++;
  }
  console.log('');
}

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 DUAL-PROJECT SETUP TEST SUITE');
  console.log('='.repeat(60) + '\n');

  // Test 1: Configuration Validation
  console.log('Test 1: Configuration Validation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    validateConfiguration();
    logTest('Configuration validation', true, 'All environment variables set correctly');
  } catch (error) {
    logTest('Configuration validation', false, error.message);
  }

  // Test 2: API Guard - Project A Whitelist
  console.log('Test 2: API Guard - Project A Whitelist');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    validateProjectA('threatLists.computeDiff');
    logTest('Project A allows computeDiff', true);
  } catch (error) {
    logTest('Project A allows computeDiff', false, error.message);
  }

  try {
    validateProjectA('uris:search');
    logTest('Project A blocks uris:search', false, 'Should have thrown error');
  } catch (error) {
    logTest('Project A blocks uris:search', true, 'Correctly blocked cross-project call');
  }

  // Test 3: API Guard - Project B Whitelist
  console.log('Test 3: API Guard - Project B Whitelist');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    validateProjectB('uris:search');
    logTest('Project B allows uris:search', true);
  } catch (error) {
    logTest('Project B allows uris:search', false, error.message);
  }

  try {
    validateProjectB('threatLists.computeDiff');
    logTest('Project B blocks computeDiff', false, 'Should have thrown error');
  } catch (error) {
    logTest('Project B blocks computeDiff', true, 'Correctly blocked cross-project call');
  }

  // Test 4: Project A - Update Database
  console.log('Test 4: Project A - Hash Database Update');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const result = await updateLocalDatabase();
    logTest(
      'Hash database update',
      result.success && result.hashCount > 0,
      `Downloaded ${result.hashCount} hashes, Cost: $${result.cost}`
    );
  } catch (error) {
    logTest('Hash database update', false, error.message);
  }

  // Test 5: Project A - Local Hash Check
  console.log('Test 5: Project A - Local Hash Check');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const testUrl = 'https://google.com';
    const result = await checkLocalHash(testUrl);
    logTest(
      'Local hash check',
      result !== null,
      `URL: ${testUrl}, Found: ${result.found}, Cost: $${result.cost}`
    );
  } catch (error) {
    logTest('Local hash check', false, error.message);
  }

  // Test 6: Project B - Lookup API (Safe URL)
  console.log('Test 6: Project B - Lookup API (Safe URL)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const testUrl = 'https://google.com';
    const result = await lookupUrl(testUrl);
    logTest(
      'Lookup API (safe URL)',
      result.threats.length === 0,
      `URL: ${testUrl}, Threats: ${result.threats.length}, Cost: $${result.cost}`
    );
  } catch (error) {
    logTest('Lookup API (safe URL)', false, error.message);
  }

  // Test 7: Project B - Lookup API (Malicious URL)
  console.log('Test 7: Project B - Lookup API (Malicious URL)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const testUrl = 'http://testsafebrowsing.appspot.com/s/malware.html';
    const result = await lookupUrl(testUrl);
    logTest(
      'Lookup API (malicious URL)',
      result.threats.length > 0,
      `URL: ${testUrl}, Threats: ${result.threats.join(', ')}, Cost: $${result.cost}`
    );
  } catch (error) {
    logTest('Lookup API (malicious URL)', false, error.message);
  }

  // Test 8: Database Stats
  console.log('Test 8: Database Statistics');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const stats = getDatabaseStats();
    logTest(
      'Database stats retrieval',
      stats.totalHashes >= 0,
      `Total hashes: ${stats.totalHashes}, Last update: ${new Date(stats.lastUpdate).toLocaleString()}`
    );
  } catch (error) {
    logTest('Database stats retrieval', false, error.message);
  }

  // Test 9: Usage Stats
  console.log('Test 9: Usage Statistics (Project B)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const stats = getUsageStats();
    logTest(
      'Usage stats retrieval',
      stats.monthlyQueries >= 0,
      `Monthly queries: ${stats.monthlyQueries}/10000 (${stats.percentageUsed}%)`
    );
  } catch (error) {
    logTest('Usage stats retrieval', false, error.message);
  }

  // Test 10: Free Tier Limit Check
  console.log('Test 10: Free Tier Limit Enforcement');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const stats = getUsageStats();
    const withinLimit = stats.monthlyQueries < 10000;
    logTest(
      'Free tier limit check',
      withinLimit,
      withinLimit
        ? `Within limit: ${stats.monthlyQueries}/10000`
        : `⚠️  EXCEEDED: ${stats.monthlyQueries}/10000 - Project B may switch to paid tier!`
    );
  } catch (error) {
    logTest('Free tier limit check', false, error.message);
  }

  // Test 11: API Guard Violations (Test violations are expected from tests 2-3)
  console.log('Test 11: API Guard Violation Log');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const violations = getViolations();
    // Note: 2 violations are EXPECTED from testing the API guard itself (tests 2-3)
    const hasExpectedTestViolations = violations.length === 2;
    logTest(
      'API Guard working (test violations expected)',
      hasExpectedTestViolations || violations.length === 0,
      violations.length === 2
        ? `✅ ${violations.length} test violations (expected from guard tests)`
        : violations.length === 0
        ? 'No violations'
        : `⚠️  ${violations.length} violations - should be 0 or 2`
    );
  } catch (error) {
    logTest('API violation check', false, error.message);
  }

  // Test 12: Cost Verification
  console.log('Test 12: Cost Verification');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    const stats = getUsageStats();
    const estimatedCost = stats.estimatedCost || 0;
    logTest(
      'Cost remains $0 (free tier)',
      estimatedCost === 0,
      `Estimated Project B cost: $${estimatedCost.toFixed(2)}`
    );
  } catch (error) {
    logTest('Cost verification', false, error.message);
  }

  // Final Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(60) + '\n');

  if (testsFailed === 0) {
    console.log('🎉 All tests passed! Dual-project setup is working correctly.\n');
    console.log('Next steps:');
    console.log('1. Monitor billing dashboard daily for 7 days');
    console.log('2. Run: ./scripts/check-billing.sh');
    console.log('3. Start server: node server-dual.js');
    console.log('');
    process.exit(0);
  } else {
    console.error('⚠️  Some tests failed. Review configuration and credentials.\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('🚨 Test suite crashed:', error);
  process.exit(1);
});

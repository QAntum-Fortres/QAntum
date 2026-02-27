/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AETERNA v18.0 - INTEGRATION TEST
 * Tests all 50 modules across 3 phases
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { initialize, SovereignSingularity } = require('./index');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '═'.repeat(70));
  log(`  ${title}`, 'cyan');
  console.log('═'.repeat(70));
}

async function runIntegrationTests() {
  logSection('🧠 AETERNA v18.0 - SOVEREIGN SINGULARITY');
  log('  Integration Test Suite', 'yellow');
  log('  Testing all 50 modules across 3 phases\n', 'yellow');

  const startTime = Date.now();
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    phases: [],
  };

  try {
    // ═══════════════════════════════════════════════════════════════════
    // INITIALIZE
    // ═══════════════════════════════════════════════════════════════════
    logSection('🚀 INITIALIZATION');

    log('Initializing Sovereign Singularity...', 'yellow');
    const singularity = await initialize();
    log('✓ Singularity initialized successfully!', 'green');

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 1 TESTS
    // ═══════════════════════════════════════════════════════════════════
    logSection('🌑 PHASE 1: ENTERPRISE FOUNDATION (Steps 1-20)');

    const phase1Status = singularity.phase1.getStatus();
    log(`  Modules loaded: ${phase1Status.modules.loaded}/${phase1Status.modules.total}`, 'blue');

    const phase1Results = await singularity.phase1.runTests();
    results.phases.push(phase1Results);
    results.total += phase1Results.tests.length;
    results.passed += phase1Results.passed;
    results.failed += phase1Results.failed;

    for (const test of phase1Results.tests) {
      const icon = test.passed ? '✓' : '✗';
      const color = test.passed ? 'green' : 'red';
      log(`  ${icon} ${test.name}`, color);
    }

    log(
      `\n  Phase 1: ${phase1Results.passed}/${phase1Results.tests.length} passed`,
      phase1Results.success ? 'green' : 'red'
    );

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 2 TESTS
    // ═══════════════════════════════════════════════════════════════════
    logSection('🧠 PHASE 2: AUTONOMOUS INTELLIGENCE (Steps 21-35)');

    const phase2Status = singularity.phase2.getStatus();
    log(`  Modules loaded: ${phase2Status.modules.loaded}/${phase2Status.modules.total}`, 'blue');

    const phase2Results = await singularity.phase2.runTests();
    results.phases.push(phase2Results);
    results.total += phase2Results.tests.length;
    results.passed += phase2Results.passed;
    results.failed += phase2Results.failed;

    for (const test of phase2Results.tests) {
      const icon = test.passed ? '✓' : '✗';
      const color = test.passed ? 'green' : 'red';
      log(`  ${icon} ${test.name}`, color);
    }

    log(
      `\n  Phase 2: ${phase2Results.passed}/${phase2Results.tests.length} passed`,
      phase2Results.success ? 'green' : 'red'
    );

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 3 TESTS
    // ═══════════════════════════════════════════════════════════════════
    logSection('👑 PHASE 3: DOMINATION (Steps 36-50)');

    const phase3Status = singularity.phase3.getStatus();
    log(`  Modules loaded: ${phase3Status.modules.loaded}/${phase3Status.modules.total}`, 'blue');

    const phase3Results = await singularity.phase3.runTests();
    results.phases.push(phase3Results);
    results.total += phase3Results.tests.length;
    results.passed += phase3Results.passed;
    results.failed += phase3Results.failed;

    for (const test of phase3Results.tests) {
      const icon = test.passed ? '✓' : '✗';
      const color = test.passed ? 'green' : 'red';
      log(`  ${icon} ${test.name}`, color);
    }

    log(
      `\n  Phase 3: ${phase3Results.passed}/${phase3Results.tests.length} passed`,
      phase3Results.success ? 'green' : 'red'
    );

    // ═══════════════════════════════════════════════════════════════════
    // COMPREHENSIVE TEST
    // ═══════════════════════════════════════════════════════════════════
    logSection('🎯 COMPREHENSIVE TEST');

    log('Running comprehensive tests...', 'yellow');
    const comprehensiveResults = await singularity.runComprehensiveTests();
    log(`✓ Comprehensive tests completed!`, 'green');
    log(
      `  Overall success: ${comprehensiveResults.overallSuccess}`,
      comprehensiveResults.overallSuccess ? 'green' : 'red'
    );

    // ═══════════════════════════════════════════════════════════════════
    // FINAL REPORT
    // ═══════════════════════════════════════════════════════════════════
    logSection('📊 FINAL REPORT');

    const duration = Date.now() - startTime;
    const successRate = ((results.passed / results.total) * 100).toFixed(1);

    console.log(`
  ╔═══════════════════════════════════════════════════════════════╗
  ║                    TEST RESULTS SUMMARY                       ║
  ╠═══════════════════════════════════════════════════════════════╣
  ║  Total Tests:    ${String(results.total).padStart(4)}                                      ║
  ║  Passed:         ${String(results.passed).padStart(4)} ${colors.green}✓${colors.reset}                                     ║
  ║  Failed:         ${String(results.failed).padStart(4)} ${results.failed > 0 ? colors.red + '✗' : ' '}${colors.reset}                                     ║
  ║  Success Rate:   ${successRate.padStart(5)}%                                   ║
  ║  Duration:       ${String(duration).padStart(5)}ms                                   ║
  ╠═══════════════════════════════════════════════════════════════╣
  ║  Phase 1 (Enterprise Foundation):  ${phase1Results.passed}/${phase1Results.tests.length} passed              ║
  ║  Phase 2 (Autonomous Intelligence): ${phase2Results.passed}/${phase2Results.tests.length} passed              ║
  ║  Phase 3 (Domination):             ${phase3Results.passed}/${phase3Results.tests.length} passed              ║
  ╚═══════════════════════════════════════════════════════════════╝
`);

    // Final status
    if (results.failed === 0) {
      log('  🏆 ALL TESTS PASSED! SOVEREIGN SINGULARITY IS OPERATIONAL! 🏆', 'green');
    } else {
      log(`  ⚠️  ${results.failed} tests failed. Review and fix issues.`, 'red');
    }

    console.log('\n' + '═'.repeat(70));
    log('  🧠 AETERNA v18.0 - SOVEREIGN SINGULARITY', 'magenta');
    log('  "Built with Persistence. Engineered for Eternity."', 'yellow');
    console.log('═'.repeat(70) + '\n');

    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    logSection('❌ CRITICAL ERROR');
    log(`Error: ${error.message}`, 'red');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runIntegrationTests();
}

module.exports = { runIntegrationTests };

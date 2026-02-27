/**
 * 🧪 Quick Test for The Prediction Matrix
 * Run: npx ts-node src/prediction-matrix/test-prediction-matrix.ts
 */

import { predictionMatrix } from './index';
import type { ElementGeneticCode, ExecutionContext, ActionOutcome } from './types';

async function runTests() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       🧪 TESTING THE PREDICTION MATRIX                        ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Test 1: Create mock element
  const mockElement: ElementGeneticCode = {
    trackingId: 'test-element-001',
    timestamp: Date.now(),
    primarySelector: '[data-testid="submit-button"]',
    tagName: 'button',
    selectors: [
      {
        type: 'DATA_TESTID',
        value: '[data-testid="submit-button"]',
        specificity: 10,
        stability: 0.95,
        changeCount: 0,
        survivalProbability: 0.95,
      },
      {
        type: 'ID',
        value: '#submit-btn',
        specificity: 100,
        stability: 0.7,
        changeCount: 2,
        survivalProbability: 0.65,
      },
      {
        type: 'CLASS',
        value: '.btn-primary',
        specificity: 10,
        stability: 0.4,
        changeCount: 5,
        survivalProbability: 0.35,
      },
      {
        type: 'XPATH',
        value: '//form/div[2]/button[1]',
        specificity: 1,
        stability: 0.2,
        changeCount: 10,
        survivalProbability: 0.15,
      },
    ],
    attributes: {
      id: 'submit-btn',
      class: ['btn', 'btn-primary'],
      dataAttributes: { 'data-testid': 'submit-button' },
      ariaAttributes: { 'aria-label': 'Submit form' },
      customAttributes: {},
    },
    styles: {
      display: 'inline-block',
      visibility: 'visible',
      position: 'relative',
      zIndex: 'auto',
      width: '120px',
      height: '40px',
      color: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(0, 123, 255)',
      fontSize: '16px',
      fontFamily: 'Arial',
    },
    structure: {
      tagName: 'button',
      index: 0,
      globalIndex: 5,
      depth: 4,
      path: 'body > main > form > div:nth-of-type(2) > button',
    },
    siblings: {
      siblingCount: 1,
      sameTagSiblingCount: 1,
    },
    ancestry: [
      { tagName: 'div', class: ['form-group'], level: 1 },
      { tagName: 'form', id: 'login-form', level: 2 },
      { tagName: 'main', level: 3 },
    ],
    contentHash: 'a1b2c3d4',
    boundingBox: { x: 100, y: 300, width: 120, height: 40 },
  };

  // Test 2: Create mock context
  const mockContext: ExecutionContext = {
    url: 'https://example.com/login',
    domain: 'example.com',
    pagePath: '/login',
    pageType: 'login',
    framework: 'react',
    timeOfDay: 14,
    dayOfWeek: 2, // Tuesday
    isDeploymentWindow: false,
  };

  // Test 3: Initialize and predict
  console.log('📊 Test 1: Predicting best selector...');
  try {
    const prediction = await predictionMatrix.predictBestSelector(mockElement, mockContext);

    console.log('   ✅ Prediction successful!');
    console.log(`   🎯 Best selector: ${prediction.selector.value}`);
    console.log(`   📈 Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
    console.log(`   🎲 Strategy: ${prediction.strategy}`);
    console.log(`   💡 Reasoning: ${prediction.reasoning}`);
    console.log(`   📋 Alternatives: ${prediction.alternatives.length}`);
    prediction.alternatives.forEach((alt, i) => {
      console.log(`      ${i + 1}. ${alt.selector.value} (score: ${alt.score.toFixed(2)})`);
    });
  } catch (error) {
    console.error('   ❌ Prediction failed:', error);
  }

  // Test 4: Report outcome
  console.log('\n📊 Test 2: Reporting outcome...');
  const mockOutcome: ActionOutcome = {
    success: true,
    responseTimeMs: 85,
    usedFallback: false,
    consecutiveSuccesses: 1,
    survivedUpdate: false,
    mutationDetected: false,
  };

  try {
    predictionMatrix.reportOutcome(mockElement, mockElement.selectors[0], mockContext, mockOutcome);
    console.log('   ✅ Outcome reported successfully!');
  } catch (error) {
    console.error('   ❌ Report failed:', error);
  }

  // Test 5: Get statistics
  console.log('\n📊 Test 3: Getting statistics...');
  try {
    const stats = predictionMatrix.getStatistics();
    console.log('   ✅ Statistics retrieved!');
    console.log(
      `   🧬 Evolution Tracker: ${stats.evolutionTracker.trackedElements} elements, ${stats.evolutionTracker.totalMutations} mutations`
    );
    console.log(
      `   🔮 Simulator: ${stats.simulator.cachedSimulations} cached, ${stats.simulator.scenarioCount} scenarios`
    );
    console.log(
      `   🤖 RL Bridge: Q-table size ${stats.rlBridge.qTableSize}, exploration rate ${(stats.rlBridge.explorationRate * 100).toFixed(1)}%`
    );
  } catch (error) {
    console.error('   ❌ Statistics failed:', error);
  }

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       ✅ ALL TESTS COMPLETED                                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');

  // Cleanup
  predictionMatrix.dispose();
}

// Run tests
runTests().catch(console.error);

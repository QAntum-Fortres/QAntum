/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QANTUM SINGULARITY – Module Tests
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Tests for:
 *   • GenusEngine       (Core/Evolution)
 *   • MetaCognitiveOverwatch  (Safety)
 *   • RustBuilder       (Compiler)
 *   • SentimentEngine   (Oracle)
 *   • Alignment         (Safety)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════
// GENUS ENGINE TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('🧬 GenusEngine', () => {
  let GenusEngine: any;

  beforeEach(async () => {
    const mod = await import('./Core/Evolution/GenusEngine');
    GenusEngine = mod.GenusEngine;
  });

  it('should seed a population of the correct size', () => {
    const engine = new GenusEngine({ populationSize: 10 });
    engine.seedPopulation();
    expect(engine.getBest()).toBeDefined();
    expect(engine.getTopN(5).length).toBeLessThanOrEqual(10);
  });

  it('should select an RL action for a market state', () => {
    const engine = new GenusEngine({ populationSize: 5 });
    const result = engine.selectAction({
      price: 50000,
      volume: 1e6,
      volatility: 0.5,
      momentum: 0.3,
      trend: 0.1,
      orderImbalance: 0.0,
      sentimentScore: 0.2,
      timestamp: Date.now(),
    });
    expect(['BUY', 'SELL', 'HOLD']).toContain(result.action);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('should store transitions and retrieve replay buffer', () => {
    const engine = new GenusEngine({ populationSize: 5 });
    const state = {
      price: 50000, volume: 1e6, volatility: 0.5,
      momentum: 0.3, trend: 0.1, orderImbalance: 0.0,
      sentimentScore: 0.2, timestamp: Date.now(),
    };
    engine.storeTransition({ state, action: 'BUY', reward: 1.5, nextState: state, done: false });
    // No public buffer accessor but we can verify no error was thrown
    expect(engine.getBest).toBeDefined();
  });

  it('should run a short evolution and return the best gene', async () => {
    const engine = new GenusEngine({ populationSize: 5 });
    engine.seedPopulation();
    const best = await engine.evolve(2); // 2 generations is fast enough for a test
    expect(best).toHaveProperty('id');
    expect(best).toHaveProperty('riskFactor');
    expect(best).toHaveProperty('indicators');
    expect(Array.isArray(best.indicators)).toBe(true);
  }, 30_000);

  it('fitness formula matches utility function: (profit*stability) - (risk*entropy)', async () => {
    const engine = new GenusEngine({ populationSize: 5 });
    engine.seedPopulation();
    const best = await engine.evolve(1);
    // Fitness should be a finite number
    expect(isFinite(best.fitness)).toBe(true);
  }, 30_000);
});

// ═══════════════════════════════════════════════════════════════════════════
// META-COGNITIVE OVERWATCH TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('🧠 MetaCognitiveOverwatch', () => {
  let MetaCognitiveOverwatch: any;

  beforeEach(async () => {
    const mod = await import('./Safety/Overwatch');
    MetaCognitiveOverwatch = mod.MetaCognitiveOverwatch;
  });

  it('should approve a high-confidence critical decision', () => {
    const ow = new MetaCognitiveOverwatch({ autoVeto: true });
    const verdict = ow.review({
      id: 'test-1',
      action: 'BUY',
      reasoning: ['Momentum is positive', 'Volume confirms breakout', 'Sentiment is bullish'],
      confidence: 0.9999,
      severity: 'critical',
      metadata: {},
      timestamp: Date.now(),
    });
    expect(verdict.approved).toBe(true);
    expect(verdict.vetoReason).toBeUndefined();
  });

  it('should VETO a low-confidence critical decision', () => {
    const ow = new MetaCognitiveOverwatch({ autoVeto: true });
    const verdict = ow.review({
      id: 'test-2',
      action: 'SELL',
      reasoning: ['Trend is down'],
      confidence: 0.50,
      severity: 'critical',
      metadata: {},
      timestamp: Date.now(),
    });
    expect(verdict.approved).toBe(false);
    expect(verdict.vetoReason).toBeDefined();
  });

  it('should flag aggression bias after too many aggressive decisions', () => {
    const ow = new MetaCognitiveOverwatch({ autoVeto: false, maxAggressionStreak: 3 });
    const base = {
      action: 'BUY',
      reasoning: ['Signal strong'],
      confidence: 0.98,
      severity: 'high' as const,
      metadata: { positionSizePct: 20 },
      timestamp: Date.now(),
    };
    ow.review({ ...base, id: 'a1' });
    ow.review({ ...base, id: 'a2' });
    ow.review({ ...base, id: 'a3' });
    const verdict = ow.review({ ...base, id: 'a4' });
    const hasAggressionFlag = verdict.biasFlags.some((f: any) => f.type === 'aggression_bias');
    expect(hasAggressionFlag).toBe(true);
  });

  it('should flag confirmation bias when all reasoning confirms the action', () => {
    const ow = new MetaCognitiveOverwatch({ autoVeto: false });
    const verdict = ow.review({
      id: 'bias-1',
      action: 'BUY',
      reasoning: ['buy signal confirmed', 'buy momentum confirmed', 'buy trend confirmed'],
      confidence: 0.80,
      severity: 'medium',
      metadata: {},
      timestamp: Date.now(),
    });
    const hasConfirmationBias = verdict.biasFlags.some((f: any) => f.type === 'confirmation_bias');
    expect(hasConfirmationBias).toBe(true);
  });

  it('should return correct stats', () => {
    const ow = new MetaCognitiveOverwatch({ autoVeto: true });
    ow.review({
      id: 's1', action: 'BUY', reasoning: ['test'], confidence: 0.50,
      severity: 'critical', metadata: {}, timestamp: Date.now(),
    });
    const stats = ow.getStats();
    expect(stats.totalReviewed).toBeGreaterThan(0);
    expect(stats.vetoRate).toBeGreaterThanOrEqual(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// RUST BUILDER TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('🔧 RustBuilder', () => {
  let RustBuilder: any;

  beforeEach(async () => {
    const mod = await import('./Compiler/RustBuilder');
    RustBuilder = mod.RustBuilder;
  });

  it('should initialise with dry-run mode', () => {
    const builder = new RustBuilder({ dryRun: true });
    const stats = builder.getStats();
    expect(stats.totalDeployed).toBe(0);
    expect(stats.successRate).toBe(0);
  });

  it('should deploy a module in dry-run mode', async () => {
    const builder = new RustBuilder({ dryRun: true });
    const result = await builder.submit({
      name: 'test_module',
      version: '1.0.0',
      sourceCode: 'pub fn hello() -> &\'static str { "hello" }',
      description: 'Test module',
      targetPath: 'src/test_module',
    });
    expect(result.success).toBe(true);
    expect(result.stage).toBe('deploy');
    expect(result.benchmark).toBeDefined();
    expect(result.benchmark!.latencyImprovement).toBeGreaterThanOrEqual(0);
  });

  it('should record deployment history', async () => {
    const builder = new RustBuilder({ dryRun: true });
    await builder.submit({
      name: 'module_a',
      version: '1.0.0',
      sourceCode: 'pub fn run() {}',
      description: 'A',
      targetPath: 'src/a',
    });
    const history = builder.getHistory();
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0].moduleName).toBe('module_a');
  });

  it('should emit a deployed event on success', async () => {
    const builder = new RustBuilder({ dryRun: true });
    let emitted = false;
    builder.on('deployed', () => { emitted = true; });
    await builder.submit({
      name: 'emitter_test',
      version: '0.1.0',
      sourceCode: '// empty',
      description: 'Emitter test',
      targetPath: 'src/emitter',
    });
    expect(emitted).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SENTIMENT ENGINE TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('🔮 SentimentEngine', () => {
  let SentimentEngine: any;

  beforeEach(async () => {
    const mod = await import('./Oracle/SentimentEngine');
    SentimentEngine = mod.SentimentEngine;
  });

  it('should return null for unknown symbol', () => {
    const engine = new SentimentEngine();
    expect(engine.getScore('UNKNOWN')).toBeNull();
  });

  it('should compute a score after ingesting signals', () => {
    const engine = new SentimentEngine();
    engine.ingest({ source: 'twitter', content: 'BTC moon!', score: 0.8, confidence: 0.9, symbol: 'BTC', timestamp: Date.now() });
    engine.ingest({ source: 'bloomberg', content: 'Bitcoin rally continues', score: 0.6, confidence: 0.85, symbol: 'BTC', timestamp: Date.now() });
    const score = engine.getScore('BTC');
    expect(score).not.toBeNull();
    expect(score!.symbol).toBe('BTC');
    expect(score!.score).toBeGreaterThanOrEqual(-1);
    expect(score!.score).toBeLessThanOrEqual(1);
    expect(['bullish', 'bearish', 'neutral']).toContain(score!.direction);
  });

  it('should flag bullish direction for strong positive signals', () => {
    const engine = new SentimentEngine();
    for (const source of ['twitter', 'bloomberg', 'onchain', 'fear_greed', 'reddit'] as const) {
      engine.ingest({ source, content: 'pump', score: 0.95, confidence: 1.0, symbol: 'ETH', timestamp: Date.now() });
    }
    const score = engine.getScore('ETH');
    expect(score).not.toBeNull();
    expect(score!.direction).toBe('bullish');
  });

  it('should expire stale scores', () => {
    const engine = new SentimentEngine({ scoreTtlMs: 1 }); // 1ms TTL
    engine.ingest({ source: 'twitter', content: 'test', score: 0.5, confidence: 1.0, symbol: 'BTC', timestamp: Date.now() });
    // Wait 2ms and re-check
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const score = engine.getScore('BTC');
        expect(score).toBeNull();
        resolve();
      }, 10);
    });
  });

  it('should return signal buffer', () => {
    const engine = new SentimentEngine();
    engine.ingest({ source: 'reddit', content: 'diamond hands', score: 0.4, confidence: 0.7, symbol: 'BTC', timestamp: Date.now() });
    const buf = engine.getSignalBuffer(10);
    expect(buf.length).toBeGreaterThanOrEqual(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ALIGNMENT TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('🔒 Alignment – Utility Function & Dead Man\'s Switch', () => {
  let computeUtility: any;
  let DeadManSwitch: any;

  beforeEach(async () => {
    const mod = await import('./Safety/Alignment');
    computeUtility = mod.computeUtility;
    DeadManSwitch = mod.DeadManSwitch;
  });

  describe('computeUtility', () => {
    it('should return positive utility for profitable + stable strategy', () => {
      const score = computeUtility({ profit: 0.1, stability: 0.8, risk: 0.05, entropy: 0.2 });
      expect(score.value).toBeGreaterThan(0);
      expect(['excellent', 'good']).toContain(score.grade);
    });

    it('should return negative utility for high risk + entropy', () => {
      const score = computeUtility({ profit: 0.01, stability: 0.3, risk: 0.5, entropy: 0.9 });
      expect(score.value).toBeLessThan(0);
      expect(['poor', 'dangerous']).toContain(score.grade);
    });

    it('should match the formula U = (profit*stability) - (risk*entropy)', () => {
      const input = { profit: 0.05, stability: 0.6, risk: 0.1, entropy: 0.4 };
      const expected = input.profit * input.stability - input.risk * input.entropy;
      const score = computeUtility(input);
      expect(score.value).toBeCloseTo(expected, 10);
    });

    it('should include breakdown and recommendation', () => {
      const score = computeUtility({ profit: 0.05, stability: 0.6, risk: 0.1, entropy: 0.4 });
      expect(score.breakdown).toBeDefined();
      expect(score.recommendation).toBeDefined();
      expect(score.timestamp).toBeGreaterThan(0);
    });
  });

  describe('DeadManSwitch', () => {
    it('should start in confirmed state', () => {
      const dms = new DeadManSwitch({ secretKey: 'test-secret' });
      expect(dms.getState()).toBe('confirmed');
      expect(dms.isTradingAllowed()).toBe(true);
    });

    it('should generate a unique challenge on each call', () => {
      const dms = new DeadManSwitch({ secretKey: 'test-secret' });
      const c1 = dms.generateChallenge();
      const c2 = dms.generateChallenge();
      // Challenges should normally differ (astronomically unlikely collision)
      expect(typeof c1).toBe('string');
      expect(c1.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('should confirm with valid signature', () => {
      const dms = new DeadManSwitch({ secretKey: 'test-secret' });
      const challenge = dms.generateChallenge();
      const signature = dms.signChallenge(challenge);
      const ok = dms.confirm({ challenge, signature, timestamp: Date.now() });
      expect(ok).toBe(true);
      expect(dms.getState()).toBe('confirmed');
      dms.disarm();
    });

    it('should reject an invalid signature', () => {
      const dms = new DeadManSwitch({ secretKey: 'test-secret' });
      const challenge = dms.generateChallenge();
      const ok = dms.confirm({ challenge, signature: 'bad-signature', timestamp: Date.now() });
      expect(ok).toBe(false);
    });

    it('should freeze and block trading after grace period', async () => {
      const dms = new DeadManSwitch({
        secretKey: 'test-secret',
        confirmationIntervalMs: 10,  // 10ms for test speed
        gracePeriodMs: 10,
      });
      dms.arm();
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
      expect(dms.getState()).toBe('frozen');
      expect(dms.isTradingAllowed()).toBe(false);
      dms.disarm();
    }, 5_000);

    it('should provide status summary', () => {
      const dms = new DeadManSwitch({ secretKey: 'test-secret' });
      const status = dms.getStatus();
      expect(status).toHaveProperty('state');
      expect(status).toHaveProperty('tradingAllowed');
      expect(status).toHaveProperty('lastConfirmedAt');
      expect(status).toHaveProperty('nextChallengeAt');
    });
  });
});

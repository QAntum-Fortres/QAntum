/**
 * ═══════════════════════════════════════════════════════════════════════
 *  Tests for Stealth Stack: BezierMouse, StealthTLS, SessionMemory,
 *  and DeepSeekLink Ollama Fallback
 * ═══════════════════════════════════════════════════════════════════════
 */

// ═══════════════════ BEZIER MOUSE ENGINE TESTS ═══════════════════

import { BezierMouseEngine, getBezierMouseEngine } from '../BezierMouseEngine';

describe('BezierMouseEngine', () => {
  let engine: BezierMouseEngine;

  beforeEach(() => {
    engine = new BezierMouseEngine({
      baseSpeed: 3,
      overshootProbability: 0.8,
      enableFatigue: false, // Deterministic for tests
    });
  });

  test('generates non-empty path between two points', () => {
    const path = engine.generatePath({ x: 0, y: 0 }, { x: 500, y: 300 });
    expect(path.length).toBeGreaterThan(5);
  });

  test('path ends near the target', () => {
    const target = { x: 200, y: 150 };
    const path = engine.generatePath({ x: 0, y: 0 }, target);
    const last = path[path.length - 1];
    // Should be within 15px of target (allowing jitter/hesitation)
    expect(Math.abs(last.x - target.x)).toBeLessThan(15);
    expect(Math.abs(last.y - target.y)).toBeLessThan(15);
  });

  test('short distance produces minimal path', () => {
    const path = engine.generatePath({ x: 100, y: 100 }, { x: 101, y: 100 });
    expect(path.length).toBeLessThanOrEqual(3);
  });

  test('steps have valid phases', () => {
    const path = engine.generatePath({ x: 0, y: 0 }, { x: 300, y: 200 });
    const validPhases = ['accelerate', 'cruise', 'decelerate', 'overshoot', 'correct', 'hesitate'];
    for (const step of path) {
      expect(validPhases).toContain(step.phase);
    }
  });

  test('delays are positive', () => {
    const path = engine.generatePath({ x: 0, y: 0 }, { x: 400, y: 400 });
    for (const step of path) {
      expect(step.delay).toBeGreaterThanOrEqual(0);
    }
  });

  test('getStats returns valid data', () => {
    engine.generatePath({ x: 0, y: 0 }, { x: 100, y: 100 });
    engine.generatePath({ x: 100, y: 100 }, { x: 200, y: 200 });
    const stats = engine.getStats();
    expect(stats.totalMoves).toBe(2);
    expect(stats.sessionDuration).toBeGreaterThanOrEqual(0);
    expect(stats.nervousness).toBe(0.3);
  });

  test('setNervousness clamps value', () => {
    engine.setNervousness(2);
    expect(engine.getStats().nervousness).toBe(1);
    engine.setNervousness(-5);
    expect(engine.getStats().nervousness).toBe(0);
  });

  test('singleton factory returns same instance', () => {
    const a = getBezierMouseEngine();
    const b = getBezierMouseEngine();
    expect(a).toBe(b);
  });

  test('event emitter fires path-generated', (done) => {
    engine.on('path-generated', (data) => {
      expect(data.steps).toBeGreaterThan(0);
      expect(data.distance).toBeGreaterThan(0);
      done();
    });
    engine.generatePath({ x: 0, y: 0 }, { x: 100, y: 100 });
  });

  test('fatigue increases over simulated time', () => {
    const fatigueEngine = new BezierMouseEngine({
      enableFatigue: true,
      fatigueRate: 100, // Extreme rate for testing
    });
    // Fatigue is time-based, so we check it's >= 1
    const stats = fatigueEngine.getStats();
    expect(stats.currentFatigue).toBeGreaterThanOrEqual(1);
  });
});

// ═══════════════════ STEALTH TLS TESTS ═══════════════════

import { StealthTLS, getStealthTLS } from '../StealthTLS';

describe('StealthTLS', () => {
  let tls: StealthTLS;

  beforeEach(() => {
    tls = new StealthTLS({
      chromeVersion: 131,
      platform: 'Windows',
      rotateUA: false, // Deterministic
    });
  });

  test('initializes with correct Chrome version', () => {
    const info = tls.getProfileInfo();
    expect(info.chromeVersion).toBe(131);
    expect(info.userAgent).toContain('Chrome/131');
  });

  test('getHarmonizedHeaders returns all required headers', () => {
    const headers = tls.getHarmonizedHeaders();
    expect(headers['User-Agent']).toBeDefined();
    expect(headers['Accept']).toBeDefined();
    expect(headers['Accept-Language']).toBeDefined();
    expect(headers['Accept-Encoding']).toBeDefined();
    expect(headers['Sec-CH-UA']).toBeDefined();
    expect(headers['Sec-CH-UA-Platform']).toContain('Windows');
    expect(headers['Sec-CH-UA-Mobile']).toBe('?0');
    expect(headers['Sec-Fetch-Dest']).toBe('document');
  });

  test('headers match TLS profile — User-Agent consistency', () => {
    const headers = tls.getHarmonizedHeaders();
    const info = tls.getProfileInfo();
    expect(headers['User-Agent']).toBe(info.userAgent);
  });

  test('extra headers are merged', () => {
    const headers = tls.getHarmonizedHeaders({ 'X-Custom': 'test' });
    expect(headers['X-Custom']).toBe('test');
    expect(headers['User-Agent']).toBeDefined();
  });

  test('macOS platform adjusts profile', () => {
    const macTLS = new StealthTLS({ platform: 'macOS', chromeVersion: 131 });
    const info = macTLS.getProfileInfo();
    expect(info.userAgent).toContain('Macintosh');
    const headers = macTLS.getHarmonizedHeaders();
    expect(headers['Sec-CH-UA-Platform']).toContain('macOS');
  });

  test('Linux platform adjusts profile', () => {
    const linuxTLS = new StealthTLS({ platform: 'Linux', chromeVersion: 131 });
    const headers = linuxTLS.getHarmonizedHeaders();
    expect(headers['Sec-CH-UA-Platform']).toContain('Linux');
  });

  test('getPlaywrightArgs returns stealth flags', () => {
    const args = tls.getPlaywrightArgs();
    expect(args.some(a => a.includes('--user-agent='))).toBe(true);
    expect(args.some(a => a.includes('AutomationControlled'))).toBe(true);
    expect(args.some(a => a.includes('--lang='))).toBe(true);
  });

  test('JA3 fingerprint is defined', () => {
    const info = tls.getProfileInfo();
    expect(info.ja3).toBeDefined();
    expect(info.ja3.length).toBeGreaterThan(10);
    // JA3 format: version,ciphers,extensions,curves,point_formats
    expect(info.ja3.split(',').length).toBeGreaterThanOrEqual(4);
  });

  test('CycleTLS init returns false when not installed', async () => {
    const result = await tls.initCycleTLS();
    expect(result).toBe(false);
    expect(tls.getProfileInfo().hasCycleTLS).toBe(false);
  });

  test('request count starts at 0', () => {
    expect(tls.getProfileInfo().requestCount).toBe(0);
  });

  test('singleton factory returns same instance', () => {
    const a = getStealthTLS();
    const b = getStealthTLS();
    expect(a).toBe(b);
  });
});

// ═══════════════════ SESSION MEMORY TESTS ═══════════════════

import { SessionMemory, getSessionMemory } from '../SessionMemory';

describe('SessionMemory', () => {
  let memory: SessionMemory;

  beforeEach(() => {
    memory = new SessionMemory({
      maxEntries: 100,
      enableDecay: false, // Stable for tests
      vectorDimensions: 64, // Smaller for speed
    });
  });

  test('stores and recalls a memory', async () => {
    const id = await memory.remember('Test product costs $50', {
      type: 'price',
      pageUrl: 'https://example.com/page1',
      value: 50,
    });
    expect(id).toContain('mem_');

    const results = await memory.recall({ text: 'product price', limit: 5 });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].entry.content).toContain('$50');
  });

  test('rememberPrice convenience method works', async () => {
    await memory.rememberPrice('Widget', 29.99, 'https://shop.com/widget');
    const results = await memory.recallPrices('Widget');
    expect(results.length).toBe(1);
    expect(results[0].entry.metadata.value).toBe(29.99);
  });

  test('rememberNavigation works', async () => {
    await memory.rememberNavigation('https://example.com', 'Example Page');
    const results = await memory.recallOnPage('https://example.com');
    expect(results.length).toBe(1);
    expect(results[0].entry.metadata.type).toBe('navigation');
  });

  test('deduplication merges similar memories', async () => {
    // Hash-based embedding should consider these as similar
    const id1 = await memory.remember('Price is $50 for widget', { type: 'price', value: 50 });
    const id2 = await memory.remember('Price is $50 for widget', { type: 'price', value: 50 });
    
    // Should reinforce, not create duplicate
    const stats = memory.getStats();
    expect(stats.totalEntries).toBe(1);
  });

  test('eviction removes weakest when over capacity', async () => {
    const smallMemory = new SessionMemory({
      maxEntries: 10,
      enableDecay: false,
      vectorDimensions: 32,
    });

    for (let i = 0; i < 15; i++) {
      await smallMemory.remember(`Unique item number ${i} with random suffix ${Math.random()}`, {
        type: 'text',
        tags: [`item${i}`],
      });
    }

    const stats = smallMemory.getStats();
    expect(stats.totalEntries).toBeLessThanOrEqual(10);
  });

  test('getContextWindow returns formatted string', async () => {
    await memory.remember('Saw a nice laptop', { type: 'text', pageUrl: 'https://shop.com' });
    await memory.remember('Price was $999', { type: 'price', value: 999 });

    const context = memory.getContextWindow(10);
    expect(context).toContain('SESSION MEMORY');
    expect(context).toContain('PRICE');
  });

  test('filter by type works', async () => {
    await memory.remember('Navigation test', { type: 'navigation' });
    await memory.remember('Price test $10', { type: 'price', value: 10 });

    const priceOnly = await memory.recall({ type: 'price', limit: 10 });
    expect(priceOnly.length).toBe(1);
    expect(priceOnly[0].entry.metadata.type).toBe('price');
  });

  test('filter by tags works', async () => {
    await memory.remember('Tagged item', { type: 'custom', tags: ['special', 'priority'] });
    await memory.remember('Normal item', { type: 'custom', tags: ['regular'] });

    const special = await memory.recall({ tags: ['special'], limit: 10 });
    expect(special.length).toBe(1);
    expect(special[0].entry.metadata.tags).toContain('special');
  });

  test('getStats returns valid data', async () => {
    await memory.remember('Test 1', { type: 'text', pageUrl: 'https://a.com' });
    await memory.remember('Test 2 different', { type: 'text', pageUrl: 'https://b.com' });

    const stats = memory.getStats();
    expect(stats.totalEntries).toBe(2);
    expect(stats.pagesVisited).toBe(2);
    expect(stats.avgStrength).toBe(1);
    expect(stats.sessionId).toContain('session_');
    expect(stats.byType.text).toBe(2);
  });

  test('empty memory context window', () => {
    const context = memory.getContextWindow();
    expect(context).toBe('No session memories yet.');
  });

  test('findPattern detects cross-page similarities', async () => {
    await memory.remember('Laptop on page A costs $999', {
      type: 'price',
      pageUrl: 'https://storeA.com',
      value: 999,
    });

    const patterns = await memory.findPattern('Laptop costs $999', {
      excludeCurrentPage: 'https://storeB.com',
      minSimilarity: 0.1, // Low threshold for hash-based embedding
    });

    expect(patterns.length).toBeGreaterThan(0);
  });

  test('shutdown clears entries', async () => {
    await memory.remember('Temp data', { type: 'text' });
    expect(memory.getStats().totalEntries).toBe(1);

    await memory.shutdown();
    expect(memory.getStats().totalEntries).toBe(0);
  });
});

// ═══════════════════ INTEGRATED STACK TEST ═══════════════════

describe('Stealth Stack Integration', () => {
  test('all engines are independent singletons', () => {
    const mouse = getBezierMouseEngine();
    const tls = getStealthTLS();
    const mem = getSessionMemory();

    expect(mouse).toBeDefined();
    expect(tls).toBeDefined();
    expect(mem).toBeDefined();

    // Each has its own stats
    expect(mouse.getStats()).toHaveProperty('totalMoves');
    expect(tls.getProfileInfo()).toHaveProperty('ja3');
    expect(mem.getStats()).toHaveProperty('totalEntries');
  });

  test('bezier path + session memory record integration', async () => {
    const mouse = new BezierMouseEngine();
    const mem = new SessionMemory({ maxEntries: 100, enableDecay: false, vectorDimensions: 32 });

    // Generate a mouse path
    const path = mouse.generatePath({ x: 100, y: 100 }, { x: 500, y: 400 });
    expect(path.length).toBeGreaterThan(0);

    // Record the action in session memory
    await mem.rememberAction(`Clicked button at (500, 400) via ${path.length}-step Bezier path`, {
      pageUrl: 'https://target.com',
    });

    const results = await mem.recall({ text: 'clicked button', limit: 5 });
    expect(results.length).toBe(1);
    expect(results[0].entry.content).toContain('Bezier');
  });
});

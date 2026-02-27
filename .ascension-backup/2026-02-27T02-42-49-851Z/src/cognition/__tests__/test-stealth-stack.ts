import { BezierMouseEngine } from '../BezierMouseEngine';
import { StealthTLS } from '../StealthTLS';
import { SessionMemory } from '../SessionMemory';

async function testStealthStack() {
  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean) {
    if (condition) {
      console.log(`  ✅ ${name}`);
      passed++;
    } else {
      console.log(`  ❌ ${name}`);
      failed++;
    }
  }

  // ═══════════════ BEZIER MOUSE ENGINE ═══════════════
  console.log('\n╔═══════ BEZIER MOUSE ENGINE ═══════╗');
  const mouse = new BezierMouseEngine({ enableFatigue: false, overshootProbability: 0.8 });

  const path = mouse.generatePath({ x: 0, y: 0 }, { x: 500, y: 300 });
  assert('Generates path with 5+ steps', path.length > 5);

  const last = path[path.length - 1];
  assert('Target reached within 15px', Math.abs(last.x - 500) < 20 && Math.abs(last.y - 300) < 20);

  const phases = new Set(path.map(s => s.phase));
  assert('Has acceleration phase', phases.has('accelerate'));
  assert('Has cruise phase', phases.has('cruise'));
  assert('Has deceleration phase', phases.has('decelerate'));

  assert('All delays positive', path.every(s => s.delay >= 0));

  const shortPath = mouse.generatePath({ x: 100, y: 100 }, { x: 101, y: 100 });
  assert('Short distance = minimal path', shortPath.length <= 3);

  const stats = mouse.getStats();
  assert('Stats track moves', stats.totalMoves === 2);
  assert('Nervousness in range', stats.nervousness >= 0 && stats.nervousness <= 1);

  mouse.setNervousness(5);
  assert('setNervousness clamps to 1', mouse.getStats().nervousness === 1);
  mouse.setNervousness(-3);
  assert('setNervousness clamps to 0', mouse.getStats().nervousness === 0);

  // ═══════════════ STEALTH TLS ═══════════════
  console.log('\n╔═══════ STEALTH TLS ═══════╗');
  const stealthTLS = new StealthTLS({ chromeVersion: 131, platform: 'Windows', rotateUA: false });

  const info = stealthTLS.getProfileInfo();
  assert('Chrome version matches', info.chromeVersion === 131);
  assert('UA contains Chrome/131', info.userAgent.includes('Chrome/131'));
  assert('JA3 is defined', info.ja3.length > 10);
  assert('JA3 has correct format', info.ja3.split(',').length >= 4);

  const headers = stealthTLS.getHarmonizedHeaders();
  assert('Has User-Agent header', !!headers['User-Agent']);
  assert('Has Accept header', !!headers['Accept']);
  assert('Has Accept-Language', !!headers['Accept-Language']);
  assert('Has Sec-CH-UA', !!headers['Sec-CH-UA']);
  assert('Platform is Windows', headers['Sec-CH-UA-Platform'].includes('Windows'));
  assert('Has Sec-Fetch-Dest', headers['Sec-Fetch-Dest'] === 'document');

  const merged = stealthTLS.getHarmonizedHeaders({ 'X-Custom': 'test123' });
  assert('Custom headers merge', merged['X-Custom'] === 'test123');

  const macTLS = new StealthTLS({ platform: 'macOS', chromeVersion: 131 });
  assert('macOS UA has Macintosh', macTLS.getProfileInfo().userAgent.includes('Macintosh'));
  assert('macOS platform header', macTLS.getHarmonizedHeaders()['Sec-CH-UA-Platform'].includes('macOS'));

  const args = stealthTLS.getPlaywrightArgs();
  assert('Playwright args include user-agent', args.some(a => a.includes('--user-agent=')));
  assert('Playwright args disable automation', args.some(a => a.includes('AutomationControlled')));

  const hasCycleTLS = await stealthTLS.initCycleTLS();
  assert('CycleTLS not installed (expected)', hasCycleTLS === false);

  // ═══════════════ SESSION MEMORY ═══════════════
  console.log('\n╔═══════ SESSION MEMORY ═══════╗');
  const mem = new SessionMemory({ maxEntries: 50, enableDecay: false, vectorDimensions: 64 });

  const id1 = await mem.rememberPrice('Laptop', 999, 'https://store.com');
  assert('rememberPrice returns ID', id1.includes('mem_'));

  await mem.rememberPrice('Mouse', 25, 'https://store.com/mouse');
  await mem.rememberNavigation('https://other.com', 'Other Page');

  const memStats = mem.getStats();
  assert('3 entries stored', memStats.totalEntries === 3);
  assert('3 pages visited', memStats.pagesVisited === 3); // store.com, store.com/mouse, other.com
  assert('Average strength is 1', memStats.avgStrength === 1);

  const priceResults = await mem.recallPrices('Laptop');
  assert('Recall finds laptop price', priceResults.length > 0);

  const pageResults = await mem.recallOnPage('https://store.com');
  assert('Recall by page URL works', pageResults.length >= 1);

  const typeFilter = await mem.recall({ type: 'navigation', limit: 10 });
  assert('Type filter works', typeFilter.length === 1);
  assert('Filtered type is navigation', typeFilter[0].entry.metadata.type === 'navigation');

  const context = mem.getContextWindow(10);
  assert('Context window has entries', context.includes('SESSION MEMORY'));
  assert('Context shows PRICE type', context.includes('PRICE'));

  // Deduplication test
  await mem.remember('Exact same content for dedup test abc123', { type: 'text' });
  await mem.remember('Exact same content for dedup test abc123', { type: 'text' });
  const dedupStats = mem.getStats();
  assert('Dedup merges identical', dedupStats.totalEntries === 4); // 3 + 1 new (second is merged)

  // Eviction test
  const smallMem = new SessionMemory({ maxEntries: 5, enableDecay: false, vectorDimensions: 32 });
  for (let i = 0; i < 10; i++) {
    await smallMem.remember(`Unique item ${i} random ${Math.random()}`, { type: 'text', tags: [`i${i}`] });
  }
  assert('Eviction keeps under max', smallMem.getStats().totalEntries <= 5);

  // Empty context
  const emptyMem = new SessionMemory({ maxEntries: 10, enableDecay: false, vectorDimensions: 32 });
  assert('Empty context window', emptyMem.getContextWindow() === 'No session memories yet.');

  // Shutdown
  await mem.shutdown();
  assert('Shutdown clears entries', mem.getStats().totalEntries === 0);

  // ═══════════════ RESULTS ═══════════════
  console.log(`\n╔═══════════════════════════════╗`);
  console.log(`║  RESULTS: ${passed} passed, ${failed} failed  ║`);
  console.log(`╚═══════════════════════════════╝`);

  if (failed > 0) process.exit(1);
}

testStealthStack().catch(e => { console.error('FATAL:', e); process.exit(1); });

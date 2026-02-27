const path = require('path');
const RUST_ADDON_PATHS = [
    path.join(__dirname, 'native', 'aeterna-engine', 'aeterna-engine.node'),
    path.join(__dirname, 'native', 'aeterna-engine', 'target', 'release', 'aeterna_engine.node'),
    path.join(__dirname, 'aeterna-engine.node'),
];
let engine = null;
for (const p of RUST_ADDON_PATHS) {
    try {
        engine = require(p);
        console.log('LOADED:', p);
        console.log('  updateThresholds:', typeof engine.updateThresholds);
        console.log('  executeBatch:', typeof engine.executeBatch);
        console.log('  exports:', Object.keys(engine).join(', '));
        break;
    } catch (e) {
        console.log('SKIP:', p, '-', e.message.slice(0, 80));
    }
}
if (engine && engine.updateThresholds) {
    console.log('\nTesting updateThresholds...');
    engine.updateThresholds('BTC/USD', 68000.0, 68100.0);
    console.log('  updateThresholds("BTC/USD", 68000, 68100) - OK');
    const result = engine.executeBatch([
        { symbol: 'BTC/USD', exchange: 'binance', price: 68050.0, volume: 1.0, timestamp: Date.now() }
    ]);
    console.log('  Decision for BTC @ $68050 (between 68000-68100):', result.decisions[0].decision);
    console.log('  Expected: HOLD');
} else {
    console.log('\nERROR: updateThresholds not available');
}

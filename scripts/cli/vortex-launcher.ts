
import { vortex } from '../src/core/sys/VortexAI';

console.log('🚀 IGNITION SEQUENCE STARTED: VORTEX AI CORE');
console.log('============================================');

async function main() {
    try {
        await vortex.start();
    } catch (err) {
        console.error('💥 VORTEX CORE FAILED TO START:', err);
        process.exit(1);
    }
}

main();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 RECEIVED SHUTDOWN SIGNAL');
    vortex.stop();
    process.exit(0);
});

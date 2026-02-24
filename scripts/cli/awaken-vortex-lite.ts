
import { vortex } from '../src/core/sys/VortexAI';

async function awaken() {
    await vortex.start();

    // Keep it alive for a demo
    setTimeout(() => {
        vortex.stop();
        console.log('[DEMO] 💤 Vortex returning to slumber to save resources.');
        process.exit(0);
    }, 10000);
}

awaken().catch(console.error);


import { Worker } from '@temporalio/worker';
import * as activities from '../src/core/orchestration/vortex-activities';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

/**
 * 🤖 VORTEX TEMPORAL WORKER
 * This worker polls the 'vortex-core-queue' and executes heavy activities
 * and long-running workflows with durability guarantees.
 */
async function run() {
    console.log('🌌 [VORTEX WORKER] Wakeup sequence initiated...');

    // Register activities and workflows
    const worker = await Worker.create({
        workflowsPath: join(dirname(fileURLToPath(import.meta.url)), '../src/core/orchestration/vortex-workflow.ts'),
        activities,
        taskQueue: 'vortex-core-queue',
    });

    console.log('✅ [VORTEX WORKER] Nervous System Connected. Monitoring task queue...');

    await worker.run();
}

run().catch((err) => {
    console.error('💥 [VORTEX WORKER] Critical failure in Nervous System:', err);
    process.exit(1);
});

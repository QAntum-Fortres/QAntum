
import { Connection, Client } from '@temporalio/client';
import { vortexEvolutionWorkflow } from '../../src/core/orchestration/workflows';
import { nanoid } from 'nanoid';

/**
 * 🚀 VORTEX EVOLUTION TRIGGER
 * Manually trigger the evolution workflow from the CLI.
 */
async function main() {
    const requirement = process.argv[2] || 'GENERAL_SYSTEM_EVOLUTION';
    const userId = process.argv[3] || 'CLI_USER';

    console.log(`🚀 [EVOLVE] Initiating evolution for: ${requirement}`);

    try {
        const connection = await Connection.connect({
            address: process.env.TEMPORAL_HOST || 'localhost:7233'
        });
        const client = new Client({ connection });

        const workflowId = `vortex-${userId}-${nanoid(6)}`;

        const handle = await client.workflow.start(vortexEvolutionWorkflow, {
            taskQueue: 'vortex-core-queue',
            args: [requirement],
            workflowId,
        });

        console.log(`✅ [EVOLVE] Workflow started successfully.`);
        console.log(`🔗 Workflow ID: ${handle.workflowId}`);
        console.log(`📊 Run ID:      ${handle.runId}`);

        // Wait for result
        console.log('⏳ Waiting for evolution results...');
        const result = await handle.result();
        console.log('✨ [EVOLVE] Evolution Complete!');
        console.log('Result:', JSON.stringify(result, null, 2));

    } catch (err: any) {
        console.error('💥 [EVOLVE] Failed to trigger evolution:', err.message);
        process.exit(1);
    }
}

main();

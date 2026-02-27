import { ModuleRegistry } from './core/ModuleRegistry';
import { HealthMonitor } from './healing/HealthMonitor';
import { MegaSupremeDaemon } from '../PROJECT/QA-SAAS/packages/pinecone-bridge/src/daemon/MegaSupremeDaemon';
import { immuneSystem } from '../MrMindQATool/src/intelligence/ImmuneSystem';
import { getHardwareLock } from './modules/_root_migrated/security/auth/energy/hardware-lock';

export class AeternaNexus {
  private static instance: AeternaNexus;

  public readonly registry: ModuleRegistry;
  public readonly monitor: HealthMonitor;
  public readonly daemon: MegaSupremeDaemon;

  private constructor() {
    this.registry = new ModuleRegistry(process.cwd());
    this.monitor = new HealthMonitor();
    this.daemon = MegaSupremeDaemon.getInstance();
  }

  public static getInstance(): AeternaNexus {
    if (!AeternaNexus.instance) {
      AeternaNexus.instance = new AeternaNexus();
    }
    return AeternaNexus.instance;
  }

  async AWAKEN() {
    console.log('🌌 [NEXUS] Awakening the Aeterna Empire...');

    // 0. 🧬 GENETIC LOCK VERIFICATION
    console.log('🔐 [NEXUS] Verifying Hardware DNA...');
    const lock = getHardwareLock({ strictMode: true, onViolation: 'destroy' });
    const isAuthorized = await lock.initialize();

    if (!isAuthorized) {
      console.error('⛔ FATAL: UNAUTHORIZED HARDWARE CLONE DETECTED.');
      console.error('⛔ SYSTEM SELF-DESTRUCT SEQUENCE INITIATED.');
      process.exit(1);
    }
    console.log('✅ [NEXUS] Genetic Signature Verified: Lenovo Ryzen 7 Master Node.');

    // 1. Discover modules
    await this.registry.discoverModules();
    console.log(`📦 [NEXUS] ${this.registry.getAllModules().length} modules mapped.`);

    // 2. Perform health check
    const health = await this.monitor.runFullHealthCheck();
    if (health.overall === 'critical') {
      console.log('🚨 [NEXUS] System critical. Initiating Immune System healing...');
      await immuneSystem.healAll();
    }

    // 3. Start the Orchestrator
    await this.daemon.awaken();

    console.log('🌟 [NEXUS] Aeterna Empire is SYNCHRONIZED.');
  }
}

// Global invocation if run directly
if (require.main === module) {
  AeternaNexus.getInstance().AWAKEN().catch(console.error);
}

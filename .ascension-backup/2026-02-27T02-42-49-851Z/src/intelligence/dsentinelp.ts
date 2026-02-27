import { GhostRecon } from '../modules/hydrated/ghost-recon';
import { EventBus } from '../core/event-bus';
import { EntropyHarvester } from './entropy-harvester';
import { PatternEngine } from './pattern-engine';

/**
 * @class dSENTINELp
 * @description Background worker for continuous network observation and mesh hydration.
 * The Sentinel ensures the Neural Mesh is always refreshed with live environmental data.
 */
export class dSENTINELp {
  private recon: GhostRecon;
  private harvester: EntropyHarvester;
  private patternEngine: PatternEngine;
  private bus: EventBus;
  private interval: NodeJS.Timeout | null = null;

  constructor() {
    this.recon = new GhostRecon();
    this.harvester = new EntropyHarvester();
    this.patternEngine = new PatternEngine();
    this.bus = EventBus.getInstance();
  }

  /**
   * Starts the continuous observation loop.
   * @param frequency Frequency in milliseconds (default: 60s)
   */
  public watch(frequency: number = 60000): void {
    console.log(`[\x1b[35mSENTINEL\x1b[0m] Watchdog initialized. Frequency: ${frequency}ms`);

    // Immediate check
    this.cycle().catch(console.error);

    this.interval = setInterval(async () => {
      await this.cycle();
    }, frequency);
  }

  private async cycle() {
    try {
      // 1. Refresh Sensory Data
      await this.recon.executeRecon();

      // 2. Harvest Entropy (Silent Accumulation)
      await this.harvester.harvest();

      // 3. Analyze Patterns (The Hunt)
      await this.patternEngine.analyze();

      // 4. Notify System
      await this.bus.emit('dSENTINELp_UPDATE', { timestamp: Date.now(), status: 'SYNCED' });
    } catch (error) {
      console.error('[\x1b[31mdSENTINELp_ERROR\x1b[0m]', error);
      await this.bus.emit('dSENTINELp_ERROR', { error: String(error) });
    }
  }

  public halt(): void {
    if (this.interval) clearInterval(this.interval);
    console.log('[\x1b[35mSENTINEL\x1b[0m] Watchdog halted.');
  }
}

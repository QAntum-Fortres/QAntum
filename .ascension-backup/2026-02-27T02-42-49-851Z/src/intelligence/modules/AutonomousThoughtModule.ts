/**
 * Autonomous Thought Module Adapter
 */

import { ICognitiveModule } from '../types';
import { AutonomousMind } from '../../../scripts/autonomous-thought';

export class AutonomousThoughtModule implements ICognitiveModule {
  private mind: AutonomousMind;

  constructor() {
    this.mind = AutonomousMind.getInstance();
  }

  async execute(payload: Record<string, any>): Promise<any> {
    const meditationPath = payload.meditationPath || './data/meditation-result.json';
    return await this.mind.think(meditationPath);
  }

  getName(): string {
    return 'AutonomousThought';
  }
}

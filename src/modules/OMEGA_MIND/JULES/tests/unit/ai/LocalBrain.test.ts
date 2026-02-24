import { LocalBrain } from '../../../src/ai/LocalBrain';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs and path
jest.mock('fs');

describe('LocalBrain', () => {
  const mockInventory = 'Mock Inventory Content';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load memory from INVENTORY.md if it exists', () => {
    // Setup mock
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(mockInventory);

    const brain = new LocalBrain();

    // We can't access private properties easily, but we can verify behavior via the ask method
    // or by spying on the prototype if we really wanted to, but checking ask is better integration.

    // However, since we mock fs, we know it tried to read.
    expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('INVENTORY.md'), 'utf-8');
  });

  it('should not crash if INVENTORY.md does not exist', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    const brain = new LocalBrain();

    expect(fs.readFileSync).not.toHaveBeenCalled();
  });

  it('should enhance prompt with memory', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(mockInventory);

    const brain = new LocalBrain();
    const prompt = 'Hello AI';

    // Spy on the super.ask method (which is on the prototype chain)
    // Since LocalBrain extends Orchestrator, we can spy on Orchestrator.prototype.ask
    // OR we can spy on the instance method if we didn't call super in the constructor (but we do).
    // Actually, sping on the instance method works if we do it before calling it.

    // But since `ask` is defined in LocalBrain and calls super.ask, if we spy on brain.ask, we are spying on the LocalBrain implementation.
    // We want to verify what it passes to super.ask.
    // We can spy on the Orchestrator prototype.

    const orchestratorSpy = jest.spyOn(Object.getPrototypeOf(LocalBrain.prototype), 'ask');

    await brain.ask(prompt);

    expect(orchestratorSpy).toHaveBeenCalledWith(expect.stringContaining(mockInventory));
    expect(orchestratorSpy).toHaveBeenCalledWith(expect.stringContaining(prompt));
  });
});

import { Orchestrator } from '../../../src/ai/Orchestrator';

describe('Orchestrator', () => {
  it('should return a mock response', async () => {
    const orchestrator = new Orchestrator();
    const prompt = 'Test prompt';
    const response = await orchestrator.ask(prompt);

    expect(response).toContain('[AI Response]');
    expect(response).toContain(prompt);
  });
});

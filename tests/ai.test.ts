import { describe, it, expect, beforeEach } from 'vitest';
import { aiService } from '../lib/ai';
import { inMemoryDB } from '../lib/supabase';

describe('AI Qualification & RAG Engine', () => {
  beforeEach(() => {
    inMemoryDB.clear();
  });

  it('should answer questions using knowledge base context', async () => {
    aiService.ingestDocumentChunks('doc_trd', 'Coach Ethan Teo provides a $10 Introductory Session to evaluate lead strategy.');
    
    const result = await aiService.generateLeadResponse('What session do you offer?');
    expect(result.text).toBeDefined();
    expect(result.text.length).toBeGreaterThan(0);
  });

  it('should detect booking intent and trigger booking flag', async () => {
    const result = await aiService.generateLeadResponse('I would like to book a session');
    expect(result.shouldBook).toBe(true);
  });

  it('should flag complex questions for human coach escalation', async () => {
    const result = await aiService.generateLeadResponse('Can I get a custom enterprise discount refund?');
    expect(result.shouldEscalate).toBe(true);
    expect(result.text).toContain('[ESCALATE TO COACH]');
  });
});

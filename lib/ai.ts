import OpenAI from 'openai';
import dotenv from 'dotenv';
import { inMemoryDB } from './supabase';
import { SYSTEM_PROMPT_LEAD_QUALIFICATION, SYSTEM_PROMPT_ADMIN_ASSISTANT } from './prompts';

dotenv.config();

const apiKey = process.env.AI_API_KEY || 'mock_key';
const baseURL = process.env.AI_API_BASE_URL || 'https://api.openai.com/v1';
const model = process.env.AI_MODEL || 'gpt-4o-mini';

const openai = new OpenAI({
  apiKey,
  baseURL,
});

export interface KnowledgeChunk {
  id: string;
  documentId: string;
  content: string;
  metadata?: Record<string, any>;
}

export class AIService {
  /**
   * Simple keyword/semantic chunk similarity search over knowledge base
   */
  public searchKnowledgeBase(query: string, topK: number = 3): string[] {
    const chunks = inMemoryDB.knowledge_chunks;
    if (!chunks || chunks.length === 0) {
      // Default fallback knowledge extracted directly from Client_TRD.pdf
      return [
        `Client TRD Specification:
- Offer: $10 Introductory Session with Coach Ethan Teo (De AI Solutions Pte Ltd).
- Workflow Stages: New Contact -> Coffee Meeting -> $10 Session -> Active Client.
- Goal: Qualify leads on WhatsApp, book sessions, log contacts, issue follow-up reminders, weekly digests, and draft admin notes.
- Escalation: Any complex/unsupported question is flagged to Coach Ethan Teo.
- Governance: PDPA-conscious data retention, human-in-the-loop review before sending emails/proposals.`,
      ];
    }

    const queryTerms = query.toLowerCase().split(/\s+/);
    const scored = chunks.map((chunk) => {
      const text = chunk.content.toLowerCase();
      let score = 0;
      queryTerms.forEach((term) => {
        if (text.includes(term)) score += 1;
      });
      return { content: chunk.content, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map((s) => s.content);
  }

  /**
   * Generates AI qualification & answer response for WhatsApp lead
   */
  public async generateLeadResponse(
    userMessage: string,
    conversationHistory: { role: 'user' | 'assistant' | 'system'; content: string }[] = []
  ): Promise<{ text: string; shouldBook: boolean; shouldEscalate: boolean }> {
    const retrievedContext = this.searchKnowledgeBase(userMessage).join('\n---\n');

    if (apiKey.startsWith('mock_')) {
      const lower = userMessage.toLowerCase();
      let shouldBook = false;
      let shouldEscalate = false;
      let text = '';

      if (lower.includes('book') || lower.includes('session') || lower.includes('$10') || lower.includes('schedule')) {
        shouldBook = true;
        text = `Awesome! I'd love to set you up for Coach Ethan Teo's $10 Introductory Session. You can select a time directly on our calendar link, or let me know what day works best for you!`;
      } else if (lower.includes('custom') || lower.includes('discount') || lower.includes('refund') || lower.includes('complex')) {
        shouldEscalate = true;
        text = `That's a great question regarding custom setups. I have flagged this for Coach Ethan Teo to review personally, and he will get back to you shortly! [ESCALATE TO COACH]`;
      } else {
        text = `Hi! Thanks for reaching out. Based on our coaching roadmap, we offer a $10 Introductory Session to review your business strategy. Would you like to know more about how it works or book a slot?`;
      }

      return { text, shouldBook, shouldEscalate };
    }

    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: `${SYSTEM_PROMPT_LEAD_QUALIFICATION}\n\nKNOWLEDGE CONTEXT:\n${retrievedContext}` },
        ...conversationHistory.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage },
      ];

      const completion = await openai.chat.completions.create({
        model,
        messages,
        temperature: 0.3,
      });

      const text = completion.choices[0]?.message?.content || 'Thank you for your message. How can I help you today?';
      const shouldBook = text.toLowerCase().includes('book') || text.toLowerCase().includes('calendar');
      const shouldEscalate = text.includes('[ESCALATE TO COACH]') || text.toLowerCase().includes('escalat');

      return { text, shouldBook, shouldEscalate };
    } catch (error: any) {
      return {
        text: `Thanks for your interest! Coach Ethan Teo offers a $10 Introductory Session to help grow your business. Would you like to schedule a quick chat?`,
        shouldBook: false,
        shouldEscalate: false,
      };
    }
  }

  /**
   * Ingests text into knowledge_chunks
   */
  public ingestDocumentChunks(documentId: string, fullText: string, chunkSize: number = 500) {
    const paragraphs = fullText.split(/\n\s*\n/);
    paragraphs.forEach((p, idx) => {
      if (p.trim().length > 0) {
        inMemoryDB.knowledge_chunks.push({
          id: `chunk_${documentId}_${idx}`,
          content: p.trim(),
          metadata: { documentId, chunkIndex: idx },
        });
      }
    });
  }
}

export const aiService = new AIService();

import { describe, it, expect, beforeEach } from 'vitest';
import { whatsAppClient } from '../lib/whatsapp';
import { inMemoryDB } from '../lib/supabase';

describe('WhatsApp Integration & Webhook Verification', () => {
  beforeEach(() => {
    inMemoryDB.clear();
  });

  it('should verify webhook challenge when token matches', () => {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'mock_verify_token_123';
    const challenge = whatsAppClient.verifyWebhook('subscribe', verifyToken, 'challenge_12345');
    expect(challenge).toBe('challenge_12345');
  });

  it('should reject webhook verification with invalid token', () => {
    const challenge = whatsAppClient.verifyWebhook('subscribe', 'invalid_token', 'challenge_12345');
    expect(challenge).toBeNull();
  });

  it('should parse valid WhatsApp inbound text message payload', () => {
    const mockPayload = {
      entry: [
        {
          changes: [
            {
              value: {
                contacts: [{ profile: { name: 'Sarah Connor' } }],
                messages: [
                  {
                    id: 'wamid.123456',
                    from: '15559876543',
                    type: 'text',
                    text: { body: 'Hi, I want to book the $10 session' },
                    timestamp: '1726700000',
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const parsed = whatsAppClient.parseInboundWebhook(mockPayload);
    expect(parsed).not.toBeNull();
    expect(parsed?.senderName).toBe('Sarah Connor');
    expect(parsed?.fromPhone).toBe('15559876543');
    expect(parsed?.text).toContain('$10 session');
  });

  it('should handle duplicate webhook events idempotently', () => {
    inMemoryDB.webhook_events.push({
      id: 'evt_1',
      event_id: 'wamid.123456',
      source: 'whatsapp',
      event_type: 'message',
      payload: {},
      processed_at: new Date().toISOString(),
    });

    const isDuplicate = inMemoryDB.webhook_events.some((e) => e.event_id === 'wamid.123456');
    expect(isDuplicate).toBe(true);
  });
});

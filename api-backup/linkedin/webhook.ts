import { Request, Response } from 'express';
import { inMemoryDB } from '../../lib/supabase';

export async function handleLinkedInWebhook(req: Request, res: Response) {
  try {
    if (req.method === 'GET') {
      const challenge = req.query.challenge || req.query['hub.challenge'];
      if (challenge) {
        return res.status(200).send(challenge);
      }
      return res.status(200).json({ status: 'LinkedIn Webhook active' });
    }

    const eventPayload = req.body;
    const eventId = eventPayload?.eventId || `li_evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Idempotency check
    const existing = inMemoryDB.webhook_events.find((e) => e.event_id === eventId);
    if (existing) {
      return res.status(200).json({ success: true, message: 'Event already processed' });
    }

    inMemoryDB.webhook_events.push({
      id: `evt_${Date.now()}`,
      event_id: eventId,
      source: 'linkedin',
      event_type: eventPayload?.eventType || 'social_action',
      payload: eventPayload,
      processed_at: new Date().toISOString(),
    });

    return res.status(200).json({ success: true, eventId });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

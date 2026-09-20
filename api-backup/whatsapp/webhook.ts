import { Request, Response } from 'express';
import { whatsAppClient } from '../../lib/whatsapp';
import { aiService } from '../../lib/ai';
import { inMemoryDB, ContactRecord, ConversationRecord } from '../../lib/supabase';

export async function handleWhatsAppWebhook(req: Request, res: Response) {
  // Webhook verification endpoint (GET)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'] as string;
    const token = req.query['hub.verify_token'] as string;
    const challenge = req.query['hub.challenge'] as string;

    const verifiedChallenge = whatsAppClient.verifyWebhook(mode, token, challenge);
    if (verifiedChallenge) {
      return res.status(200).send(verifiedChallenge);
    }
    return res.status(403).json({ error: 'Webhook verification failed' });
  }

  // Webhook event processor (POST)
  try {
    const inbound = whatsAppClient.parseInboundWebhook(req.body);
    if (!inbound) {
      return res.status(200).json({ status: 'ignored_non_text_or_ack' });
    }

    // Idempotency check
    const existingEvent = inMemoryDB.webhook_events.find((e) => e.event_id === inbound.messageId);
    if (existingEvent) {
      return res.status(200).json({ status: 'duplicate_event_ignored' });
    }

    inMemoryDB.webhook_events.push({
      id: `evt_wa_${Date.now()}`,
      event_id: inbound.messageId,
      source: 'whatsapp',
      event_type: 'message',
      payload: req.body,
      processed_at: new Date().toISOString(),
    });

    // Find or create lead/contact
    let contact = inMemoryDB.contacts.find((c) => c.phone === inbound.fromPhone);
    if (!contact) {
      contact = {
        id: `c_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: inbound.senderName,
        linkedin_id: null,
        linkedin_url: null,
        email: null,
        phone: inbound.fromPhone,
        source: 'LinkedIn CTA WhatsApp Handoff',
        source_post_id: null,
        source_comment_id: null,
        status: 'active',
        stage_name: 'New Contact',
        last_contacted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      inMemoryDB.contacts.push(contact);
    } else {
      contact.last_contacted_at = new Date().toISOString();
      contact.updated_at = new Date().toISOString();
    }

    // Find or create conversation
    let conv = inMemoryDB.conversations.find((c) => c.contact_id === contact!.id);
    if (!conv) {
      conv = {
        id: `conv_${Date.now()}`,
        contact_id: contact.id,
        channel: 'whatsapp',
        status: 'active',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      inMemoryDB.conversations.push(conv);
    }

    // Log inbound user message
    inMemoryDB.messages.push({
      id: `msg_${Date.now()}_in`,
      conversation_id: conv.id,
      sender: 'user',
      content: inbound.text,
      whatsapp_message_id: inbound.messageId,
      created_at: new Date().toISOString(),
    });

    // Build chat context & evaluate with AI
    const history = inMemoryDB.messages
      .filter((m) => m.conversation_id === conv!.id)
      .map((m) => ({ role: m.sender as 'user' | 'assistant' | 'system', content: m.content }));

    const aiResult = await aiService.generateLeadResponse(inbound.text, history);

    // Update lead stage if booking
    if (aiResult.shouldBook && contact.stage_name === 'New Contact') {
      contact.stage_name = '$10 Session';
    }

    // Log outbound assistant message
    inMemoryDB.messages.push({
      id: `msg_${Date.now()}_out`,
      conversation_id: conv.id,
      sender: 'assistant',
      content: aiResult.text,
      created_at: new Date().toISOString(),
    });

    // Dispatch WhatsApp reply
    const sendResult = await whatsAppClient.sendMessage(inbound.fromPhone, aiResult.text);

    return res.status(200).json({
      success: true,
      messageId: inbound.messageId,
      replySent: sendResult.success,
      aiResponse: aiResult.text,
      stage: contact.stage_name,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

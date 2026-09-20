import { Request, Response } from 'express';
import { whatsAppClient } from '../../../lib/whatsapp';
import { aiService } from '../../../lib/ai';
import { inMemoryDB, ContactRecord, ConversationRecord } from '../../../lib/supabase';
import { createBooking, isSlotAvailable } from '../../../lib/calendar';

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
    const existingEvent = inMemoryDB.webhook_events.find((e: any) => e.event_id === inbound.messageId);
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
    let contact = inMemoryDB.contacts.find((c: ContactRecord) => c.phone === inbound.fromPhone);
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
    let conv = inMemoryDB.conversations.find((c: ConversationRecord) => c.contact_id === contact!.id);
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
      .filter((m: any) => m.conversation_id === conv!.id)
      .map((m) => ({ role: m.sender as 'user' | 'assistant' | 'system', content: m.content }));

    const aiResult = await aiService.generateLeadResponse(inbound.text, history);

    // Update lead stage if booking
    if (aiResult.shouldBook && contact.stage_name === 'New Contact') {
      contact.stage_name = '$10 Session';

      try {
        // Book a session 24 hours from now for 1 hour duration
        const startDate = new Date();
        startDate.setHours(startDate.getHours() + 24);
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 1);

        const name = contact.name || 'Unknown Lead';
        const email = contact.email || undefined;
        const phone = contact.phone || undefined;
        const start = startDate.toISOString();
        const end = endDate.toISOString();

        const available = await isSlotAvailable(start, end);

        if (!available) {
          const fallback = `Ah, it looks like that time slot was just taken! Could we try another time that works for you?`;
          
          inMemoryDB.messages.push({
            id: `msg_${Date.now()}_out`,
            conversation_id: conv.id,
            sender: 'assistant',
            content: fallback,
            created_at: new Date().toISOString(),
          });

          await whatsAppClient.sendMessage(inbound.fromPhone, fallback);
          
          return res.status(200).json({
            success: true,
            messageId: inbound.messageId,
            replySent: true,
            aiResponse: fallback,
            stage: contact.stage_name,
          });
        }

        await createBooking({
          name,
          email,
          phone,
          start,
          end
        });
        console.log(`[Google Calendar] Session booked for ${contact.name}`);
      } catch (err: any) {
        console.error(`[Google Calendar] Booking failed: ${err.message}`);
      }
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


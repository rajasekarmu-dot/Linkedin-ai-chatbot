import { Request, Response } from 'express';
import { whatsAppClient } from '../../../lib/whatsapp';
import { inMemoryDB } from '../../../lib/supabase';

export async function handleWhatsAppSend(req: Request, res: Response) {
  try {
    const { phone, text, contactId, draftId } = req.body;

    if (!phone || !text) {
      return res.status(400).json({ success: false, error: 'Phone number and message text are required' });
    }

    let draft: any = null;
    if (draftId) {
      draft = inMemoryDB.admin_drafts.find(d => d.id === draftId);
      if (!draft) {
        return res.status(404).json({ success: false, error: 'Draft not found' });
      }
      if (draft.status !== 'approved') {
        return res.status(403).json({ success: false, error: `Cannot send draft with status: ${draft.status}` });
      }
    }

    const result = await whatsAppClient.sendMessage(phone, text);

    if (result.success && contactId) {
      const conv = inMemoryDB.conversations.find((c) => c.contact_id === contactId);
      if (conv) {
        inMemoryDB.messages.push({
          id: `msg_${Date.now()}_outbound_direct`,
          conversation_id: conv.id,
          sender: 'assistant',
          content: text,
          whatsapp_message_id: result.messageId,
          created_at: new Date().toISOString(),
        });
      }
    }

    if (result.success && draft) {
      draft.status = 'sent';
      draft.sent_at = new Date().toISOString();
      draft.updated_at = new Date().toISOString();
    }

    return res.status(200).json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}


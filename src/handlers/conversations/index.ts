import { Request, Response } from 'express';
import { inMemoryDB } from '../../../lib/supabase';

export async function handleGetConversation(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Conversation ID is required' });
    }

    const conversation = inMemoryDB.conversations.find((c) => c.id === id || c.contact_id === id);
    if (!conversation) {
      return res.status(404).json({ success: false, error: `Conversation ${id} not found` });
    }

    const messages = inMemoryDB.messages.filter((m) => m.conversation_id === conversation.id);

    return res.status(200).json({
      success: true,
      conversation,
      messages,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}


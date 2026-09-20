import { Request, Response } from 'express';
import { inMemoryDB, FollowupRecord } from '../../../lib/supabase';

export async function handleCreateFollowup(req: Request, res: Response) {
  try {
    const { contactId, note, dueDate } = req.body;

    if (!contactId || !note || !dueDate) {
      return res.status(400).json({ success: false, error: 'contactId, note, and dueDate are required' });
    }

    const contact = inMemoryDB.contacts.find((c) => c.id === contactId);
    if (!contact) {
      return res.status(404).json({ success: false, error: `Contact ${contactId} not found` });
    }

    const followup: FollowupRecord = {
      id: `fol_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      contact_id: contactId,
      note,
      due_date: new Date(dueDate).toISOString(),
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    inMemoryDB.followups.push(followup);

    return res.status(201).json({
      success: true,
      followup,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}


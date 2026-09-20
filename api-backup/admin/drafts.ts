import { Request, Response } from 'express';
import { inMemoryDB } from '../../lib/supabase';

export async function handleGetDrafts(req: Request, res: Response) {
  try {
    const status = req.query.status as string;
    let drafts = inMemoryDB.admin_drafts;

    if (status) {
      drafts = drafts.filter(d => d.status === status);
    }

    return res.status(200).json({ success: true, count: drafts.length, drafts });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function handleGetDraft(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const draft = inMemoryDB.admin_drafts.find(d => d.id === id);

    if (!draft) {
      return res.status(404).json({ success: false, error: 'Draft not found' });
    }

    return res.status(200).json({ success: true, draft });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

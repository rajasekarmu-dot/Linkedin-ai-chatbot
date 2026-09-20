import { Request, Response } from 'express';
import { inMemoryDB } from '../../lib/supabase';

export async function handleRejectDraft(req: Request, res: Response) {
  try {
    const { draftId, reason } = req.body;
    const adminId = (req as any).adminId || 'admin';

    if (!draftId) {
      return res.status(400).json({ success: false, error: 'Draft ID is required' });
    }

    const draft = inMemoryDB.admin_drafts.find(d => d.id === draftId);
    
    if (!draft) {
      return res.status(404).json({ success: false, error: 'Draft not found' });
    }

    if (draft.status !== 'pending') {
      return res.status(400).json({ success: false, error: `Cannot reject draft in status: ${draft.status}` });
    }

    draft.status = 'rejected';
    draft.rejected_by = adminId;
    draft.rejected_at = new Date().toISOString();
    if (reason) {
      draft.metadata = { ...draft.metadata, rejection_reason: reason };
    }
    draft.updated_at = new Date().toISOString();

    return res.status(200).json({ success: true, draft });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

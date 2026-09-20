import { Request, Response } from 'express';
import { inMemoryDB } from '../../lib/supabase';
import { aiService } from '../../lib/ai';
import crypto from 'crypto';

export async function handleCreateDraft(req: Request, res: Response) {
  try {
    const { contactId, type, purpose, context } = req.body;
    const adminId = (req as any).adminId || 'admin';

    if (!type || !purpose) {
      return res.status(400).json({ success: false, error: 'Draft type and purpose are required.' });
    }

    // Load contact context if provided
    let contactContext = '';
    if (contactId) {
      const contact = inMemoryDB.contacts.find(c => c.id === contactId);
      if (!contact) {
        return res.status(404).json({ success: false, error: 'Contact not found' });
      }
      contactContext = `Contact Name: ${contact.name}\nContact Stage: ${contact.stage_name}\n`;
    }

    const additionalContext = context ? `\nAdditional Context: ${context}` : '';

    // Simulate AI Draft Generation
    // We pass instructions asking the AI to draft the response but NOT to act as a chat bot
    const draftPrompt = `Please generate a draft of type '${type}' for the following purpose: '${purpose}'.\n${contactContext}${additionalContext}\n\nThis is a draft for human approval, DO NOT include conversational filler, just the draft text.`;
    
    const aiResult = await aiService.generateLeadResponse(draftPrompt, []);
    
    const newDraft = {
      id: `draft_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
      contact_id: contactId || null,
      type: type,
      subject: `Draft for ${purpose.substring(0, 50)}...`,
      draft_content: aiResult.text,
      status: 'pending',
      created_by: adminId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    inMemoryDB.admin_drafts.push(newDraft);

    return res.status(201).json({
      success: true,
      draft: newDraft
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

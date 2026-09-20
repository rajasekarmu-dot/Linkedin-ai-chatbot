import { Request, Response } from 'express';
import { inMemoryDB, ContactRecord } from '../../../lib/supabase';

export async function handleCreateLead(req: Request, res: Response) {
  try {
    const { name, linkedin_id, linkedin_url, email, phone, source, source_post_id, source_comment_id, status, stage_name } = req.body;

    if (!phone && !email && !name) {
      return res.status(400).json({ success: false, error: 'Lead requires at least name, phone, or email' });
    }

    const newLead: ContactRecord = {
      id: `c_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: name || null,
      linkedin_id: linkedin_id || null,
      linkedin_url: linkedin_url || null,
      email: email || null,
      phone: phone || `+1555${Math.floor(Math.random() * 8999999 + 1000000)}`,
      source: source || 'LinkedIn CTA',
      source_post_id: source_post_id || null,
      source_comment_id: source_comment_id || null,
      status: status || 'active',
      stage_name: stage_name || 'New Contact',
      last_contacted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    inMemoryDB.contacts.push(newLead);

    return res.status(201).json({
      success: true,
      lead: newLead,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}


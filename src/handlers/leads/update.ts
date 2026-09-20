import { Request, Response } from 'express';
import { inMemoryDB } from '../../../lib/supabase';

export async function handleUpdateLead(req: Request, res: Response) {
  try {
    const id = req.params.id || req.body.id;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Lead ID is required for update' });
    }

    const lead = inMemoryDB.contacts.find((c) => c.id === id);
    if (!lead) {
      return res.status(404).json({ success: false, error: `Lead with ID ${id} not found` });
    }

    const { name, email, phone, stage_name, status, last_contacted_at } = req.body;

    if (name !== undefined) lead.name = name;
    if (email !== undefined) lead.email = email;
    if (phone !== undefined) lead.phone = phone;
    if (stage_name !== undefined) lead.stage_name = stage_name;
    if (status !== undefined) lead.status = status;
    if (last_contacted_at !== undefined) lead.last_contacted_at = last_contacted_at;
    lead.updated_at = new Date().toISOString();

    return res.status(200).json({
      success: true,
      lead,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}


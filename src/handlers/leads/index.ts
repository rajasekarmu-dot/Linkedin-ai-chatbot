import { Request, Response } from 'express';
import { inMemoryDB } from '../../../lib/supabase';

export async function handleGetLeads(req: Request, res: Response) {
  try {
    const stage = req.query.stage as string;
    let leads = inMemoryDB.contacts;

    if (stage) {
      leads = leads.filter((c) => c.stage_name.toLowerCase() === stage.toLowerCase());
    }

    return res.status(200).json({
      success: true,
      count: leads.length,
      leads,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}


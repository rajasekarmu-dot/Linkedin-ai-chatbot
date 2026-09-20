import { Request, Response } from 'express';
import { inMemoryDB } from '../lib/supabase';
import { whatsAppClient } from '../lib/whatsapp';

export async function handleCron(req: Request, res: Response) {
  try {
    const now = new Date();

    // 1. REQ-05: Follow-Up Reminders
    const dueFollowups = inMemoryDB.followups.filter(
      (f) => f.status === 'pending' && new Date(f.due_date) <= now
    );

    const followUpReminders = dueFollowups.map((f) => {
      const contact = inMemoryDB.contacts.find((c) => c.id === f.contact_id);
      f.status = 'notified';
      return {
        followupId: f.id,
        contactName: contact?.name || 'Unknown Contact',
        note: f.note,
        dueDate: f.due_date,
      };
    });

    // 2. REQ-06: Weekly Relationship-Review Digest (contacts not contacted in 4+ weeks / 28 days)
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    const staleDigest = inMemoryDB.contacts
      .filter((c) => new Date(c.last_contacted_at) <= fourWeeksAgo)
      .map((c) => ({
        contactId: c.id,
        name: c.name,
        phone: c.phone,
        stage: c.stage_name,
        lastContactedAt: c.last_contacted_at,
      }));

    // 3. REQ-09: Automated Re-Engagement of Stale Leads (inactive > 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const reEngagementTargets = inMemoryDB.contacts.filter(
      (c) => new Date(c.last_contacted_at) <= thirtyDaysAgo && c.status === 'active'
    );

    const reEngagedLeads: string[] = [];
    for (const lead of reEngagementTargets) {
      const messageText = `Hi ${lead.name || 'there'}! It's been a while since we connected on LinkedIn. Coach Ethan Teo is opening a few slots for our $10 Introductory Coaching Sessions this month. Would you be interested in picking up where we left off?`;
      await whatsAppClient.sendMessage(lead.phone, messageText);
      lead.last_contacted_at = now.toISOString();
      reEngagedLeads.push(lead.id);
    }

    return res.status(200).json({
      success: true,
      timestamp: now.toISOString(),
      followUpRemindersCount: followUpReminders.length,
      followUpReminders,
      weeklyDigestCount: staleDigest.length,
      weeklyDigest: staleDigest,
      reEngagedLeadsCount: reEngagedLeads.length,
      reEngagedLeads,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

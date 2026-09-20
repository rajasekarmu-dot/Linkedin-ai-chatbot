import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../server';
import { inMemoryDB } from '../lib/supabase';

describe('Vercel Cron & Proactive Workflows', () => {
  beforeEach(() => {
    inMemoryDB.clear();
  });

  it('should trigger follow-up reminders when due', async () => {
    // Add contact
    const contact = {
      id: 'c_test_1',
      name: 'Jane Smith',
      phone: '+15554443322',
      stage_name: 'Coffee Meeting',
      last_contacted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active',
      source: 'LinkedIn',
      linkedin_id: null,
      linkedin_url: null,
      email: null,
      source_post_id: null,
      source_comment_id: null,
    };
    inMemoryDB.contacts.push(contact);

    // Add due followup
    const pastDate = new Date(Date.now() - 3600 * 1000).toISOString();
    inMemoryDB.followups.push({
      id: 'fol_1',
      contact_id: 'c_test_1',
      note: 'Follow up on proposal feedback',
      due_date: pastDate,
      status: 'pending',
      created_at: pastDate,
      updated_at: pastDate,
    });

    const res = await request(app).get('/api/cron');
    expect(res.status).toBe(200);
    expect(res.body.followUpRemindersCount).toBe(1);
    expect(res.body.followUpReminders[0].contactName).toBe('Jane Smith');
  });

  it('should compile relationship digest for contacts uncontacted for 4+ weeks', async () => {
    const fiveWeeksAgo = new Date(Date.now() - 35 * 24 * 3600 * 1000).toISOString();
    inMemoryDB.contacts.push({
      id: 'c_stale_1',
      name: 'Stale Contact',
      phone: '+15559998877',
      stage_name: 'Coffee Meeting',
      last_contacted_at: fiveWeeksAgo,
      created_at: fiveWeeksAgo,
      updated_at: fiveWeeksAgo,
      status: 'active',
      source: 'LinkedIn',
      linkedin_id: null,
      linkedin_url: null,
      email: null,
      source_post_id: null,
      source_comment_id: null,
    });

    const res = await request(app).get('/api/cron');
    expect(res.status).toBe(200);
    expect(res.body.weeklyDigestCount).toBe(1);
    expect(res.body.weeklyDigest[0].name).toBe('Stale Contact');
  });
});

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../server';
import { inMemoryDB } from '../lib/supabase';
import { aiService } from '../lib/ai';
import { whatsAppClient } from '../lib/whatsapp';

describe('Admin Draft & Human Approval Workflow', () => {
  const ADMIN_TOKEN = process.env.ADMIN_API_KEY || 'secret_admin_key_123';

  beforeEach(() => {
    inMemoryDB.clear();
    process.env.ADMIN_API_KEY = ADMIN_TOKEN;

    inMemoryDB.contacts.push({
      id: 'contact_123',
      name: 'Test Lead',
      phone: '+15551234567',
      stage_name: 'New Contact',
      status: 'active',
      source: 'LinkedIn',
      linkedin_id: null,
      linkedin_url: null,
      email: null,
      source_post_id: null,
      source_comment_id: null,
      last_contacted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    vi.spyOn(aiService, 'generateLeadResponse').mockResolvedValue({
      text: 'This is a mocked AI draft',
      shouldBook: false,
      shouldEscalate: false
    });
    vi.spyOn(whatsAppClient, 'sendMessage').mockResolvedValue({
      success: true,
      messageId: 'mock_msg_123'
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('unauthenticated draft creation -> rejected', async () => {
    const res = await request(app)
      .post('/api/admin/draft')
      .send({ type: 'whatsapp', purpose: 'Say hello' });
    
    expect(res.status).toBe(401);
  });

  it('authenticated draft creation -> pending draft', async () => {
    const res = await request(app)
      .post('/api/admin/draft')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ contactId: 'contact_123', type: 'whatsapp', purpose: 'Follow up' });
    
    expect(res.status).toBe(201);
    expect(res.body.draft).toBeDefined();
    expect(res.body.draft.status).toBe('pending');
    expect(res.body.draft.draft_content).toBe('This is a mocked AI draft');
  });

  it('invalid draft request -> validation error', async () => {
    const res = await request(app)
      .post('/api/admin/draft')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ contactId: 'contact_123' }); // Missing type & purpose
    
    expect(res.status).toBe(400);
  });

  it('get draft -> returns draft', async () => {
    inMemoryDB.admin_drafts.push({
      id: 'draft_get_1',
      type: 'whatsapp',
      draft_content: 'Test content',
      status: 'pending',
      created_by: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const res = await request(app)
      .get('/api/admin/drafts/draft_get_1')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);
    
    expect(res.status).toBe(200);
    expect(res.body.draft.id).toBe('draft_get_1');
  });

  it('approve pending draft -> approved', async () => {
    inMemoryDB.admin_drafts.push({
      id: 'draft_app_1',
      type: 'whatsapp',
      draft_content: 'Test content',
      status: 'pending',
      created_by: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const res = await request(app)
      .post('/api/admin/approve')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ draftId: 'draft_app_1' });
    
    expect(res.status).toBe(200);
    expect(res.body.draft.status).toBe('approved');
    expect(res.body.draft.approved_by).toBeDefined();
  });

  it('approve already approved draft -> rejected', async () => {
    inMemoryDB.admin_drafts.push({
      id: 'draft_app_2',
      type: 'whatsapp',
      draft_content: 'Test content',
      status: 'approved',
      created_by: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const res = await request(app)
      .post('/api/admin/approve')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ draftId: 'draft_app_2' });
    
    expect(res.status).toBe(400);
  });

  it('approve already sent draft -> rejected', async () => {
    inMemoryDB.admin_drafts.push({
      id: 'draft_app_3',
      type: 'whatsapp',
      draft_content: 'Test content',
      status: 'sent',
      created_by: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const res = await request(app)
      .post('/api/admin/approve')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ draftId: 'draft_app_3' });
    
    expect(res.status).toBe(400);
  });

  it('reject pending draft -> rejected', async () => {
    inMemoryDB.admin_drafts.push({
      id: 'draft_rej_1',
      type: 'whatsapp',
      draft_content: 'Test content',
      status: 'pending',
      created_by: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const res = await request(app)
      .post('/api/admin/reject')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ draftId: 'draft_rej_1', reason: 'Too informal' });
    
    expect(res.status).toBe(200);
    expect(res.body.draft.status).toBe('rejected');
    expect(res.body.draft.metadata.rejection_reason).toBe('Too informal');
  });

  it('pending draft cannot be sent', async () => {
    inMemoryDB.admin_drafts.push({
      id: 'draft_send_1',
      type: 'whatsapp',
      draft_content: 'Test content',
      status: 'pending',
      created_by: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const res = await request(app)
      .post('/api/whatsapp/send')
      .send({ phone: '+123', text: 'hello', draftId: 'draft_send_1' });
    
    expect(res.status).toBe(403);
  });

  it('rejected draft cannot be sent', async () => {
    inMemoryDB.admin_drafts.push({
      id: 'draft_send_2',
      type: 'whatsapp',
      draft_content: 'Test content',
      status: 'rejected',
      created_by: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const res = await request(app)
      .post('/api/whatsapp/send')
      .send({ phone: '+123', text: 'hello', draftId: 'draft_send_2' });
    
    expect(res.status).toBe(403);
  });

  it('approved draft can be sent and marks status as sent', async () => {
    inMemoryDB.admin_drafts.push({
      id: 'draft_send_3',
      type: 'whatsapp',
      draft_content: 'Test content',
      status: 'approved',
      created_by: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const res = await request(app)
      .post('/api/whatsapp/send')
      .send({ phone: '+123', text: 'hello', draftId: 'draft_send_3' });
    
    expect(res.status).toBe(200);
    expect(inMemoryDB.admin_drafts[0].status).toBe('sent');
    expect(inMemoryDB.admin_drafts[0].sent_at).toBeDefined();
  });

  it('sent draft cannot be sent again', async () => {
    inMemoryDB.admin_drafts.push({
      id: 'draft_send_4',
      type: 'whatsapp',
      draft_content: 'Test content',
      status: 'sent',
      created_by: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const res = await request(app)
      .post('/api/whatsapp/send')
      .send({ phone: '+123', text: 'hello', draftId: 'draft_send_4' });
    
    expect(res.status).toBe(403);
  });

  it('external send failure does not incorrectly mark draft as sent', async () => {
    vi.spyOn(whatsAppClient, 'sendMessage').mockResolvedValueOnce({
      success: false,
      error: 'Simulated API failure'
    });

    inMemoryDB.admin_drafts.push({
      id: 'draft_send_5',
      type: 'whatsapp',
      draft_content: 'Test content',
      status: 'approved',
      created_by: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const res = await request(app)
      .post('/api/whatsapp/send')
      .send({ phone: '+123', text: 'hello', draftId: 'draft_send_5' });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(inMemoryDB.admin_drafts[0].status).toBe('approved'); // Remains approved
  });
});

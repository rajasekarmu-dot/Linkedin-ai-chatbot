import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../server';
import { inMemoryDB } from '../lib/supabase';

describe('Leads API & CRM Pipeline', () => {
  beforeEach(() => {
    inMemoryDB.clear();
  });

  it('should create lead record with correct initial fields and stage', async () => {
    const res = await request(app)
      .post('/api/leads/create')
      .send({
        name: 'Alex Mercer',
        phone: '+15551112233',
        email: 'alex@example.com',
        source: 'LinkedIn CTA Post #4',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.lead.name).toBe('Alex Mercer');
    expect(res.body.lead.stage_name).toBe('New Contact');
  });

  it('should update lead stage in pipeline', async () => {
    const createRes = await request(app)
      .post('/api/leads/create')
      .send({ name: 'John Doe', phone: '+15558889999' });

    const leadId = createRes.body.lead.id;

    const updateRes = await request(app)
      .patch(`/api/leads/${leadId}`)
      .send({ stage_name: 'Coffee Meeting' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.lead.stage_name).toBe('Coffee Meeting');
  });

  it('should retrieve lead list filtered by stage', async () => {
    await request(app).post('/api/leads/create').send({ name: 'User 1', phone: '+1111', stage_name: 'New Contact' });
    await request(app).post('/api/leads/create').send({ name: 'User 2', phone: '+2222', stage_name: '$10 Session' });

    const res = await request(app).get('/api/leads?stage=New%20Contact');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.leads[0].name).toBe('User 1');
  });
});

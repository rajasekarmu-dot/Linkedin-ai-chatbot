import { supabase, ContactRecord, ConversationRecord, MessageRecord, FollowupRecord, WebhookEventRecord, AdminDraftRecord } from './supabase';

// Helper to determine if we are in a testing environment
const isTestEnv = process.env.NODE_ENV === 'test';

// Test-only memory storage to bypass Supabase during unit tests
export const mockDB = {
  contacts: [] as ContactRecord[],
  conversations: [] as ConversationRecord[],
  messages: [] as MessageRecord[],
  followups: [] as FollowupRecord[],
  webhook_events: [] as WebhookEventRecord[],
  admin_drafts: [] as AdminDraftRecord[],
  knowledge_chunks: [] as { id: string; content: string; metadata: any }[],

  clear() {
    this.contacts = [];
    this.conversations = [];
    this.messages = [];
    this.followups = [];
    this.webhook_events = [];
    this.admin_drafts = [];
    this.knowledge_chunks = [];
  }
};

class DatabaseRepository {
  
  // --- Contacts ---
  async getContact(id: string): Promise<ContactRecord | null> {
    if (isTestEnv) return mockDB.contacts.find(c => c.id === id) || null;
    const { data, error } = await supabase.from('contacts').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }

  async getContactByPhone(phone: string): Promise<ContactRecord | null> {
    if (isTestEnv) return mockDB.contacts.find(c => c.phone === phone) || null;
    const { data, error } = await supabase.from('contacts').select('*').eq('phone', phone).single();
    if (error) return null;
    return data;
  }

  async getAllContacts(): Promise<ContactRecord[]> {
    if (isTestEnv) return [...mockDB.contacts];
    const { data, error } = await supabase.from('contacts').select('*');
    if (error) throw error;
    return data || [];
  }

  async createContact(contact: Partial<ContactRecord>): Promise<ContactRecord> {
    if (isTestEnv) {
      const newContact = { ...contact, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as ContactRecord;
      if (!newContact.id) newContact.id = `c_${Date.now()}`;
      mockDB.contacts.push(newContact);
      return newContact;
    }
    const { data, error } = await supabase.from('contacts').insert(contact).select().single();
    if (error) throw error;
    return data;
  }

  async updateContact(id: string, updates: Partial<ContactRecord>): Promise<ContactRecord | null> {
    if (isTestEnv) {
      const idx = mockDB.contacts.findIndex(c => c.id === id);
      if (idx === -1) return null;
      mockDB.contacts[idx] = { ...mockDB.contacts[idx], ...updates, updated_at: new Date().toISOString() };
      return mockDB.contacts[idx];
    }
    const { data, error } = await supabase.from('contacts').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  // --- Conversations ---
  async getConversationByContact(contactId: string): Promise<ConversationRecord | null> {
    if (isTestEnv) return mockDB.conversations.find(c => c.contact_id === contactId) || null;
    const { data, error } = await supabase.from('conversations').select('*').eq('contact_id', contactId).single();
    if (error) return null;
    return data;
  }

  async createConversation(conversation: Partial<ConversationRecord>): Promise<ConversationRecord> {
    if (isTestEnv) {
      const newConv = { ...conversation, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as ConversationRecord;
      if (!newConv.id) newConv.id = `conv_${Date.now()}`;
      mockDB.conversations.push(newConv);
      return newConv;
    }
    const { data, error } = await supabase.from('conversations').insert(conversation).select().single();
    if (error) throw error;
    return data;
  }

  // --- Messages ---
  async getMessagesByConversation(conversationId: string): Promise<MessageRecord[]> {
    if (isTestEnv) return mockDB.messages.filter(m => m.conversation_id === conversationId);
    const { data, error } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async createMessage(message: Partial<MessageRecord>): Promise<MessageRecord> {
    if (isTestEnv) {
      const newMsg = { ...message, created_at: new Date().toISOString() } as MessageRecord;
      if (!newMsg.id) newMsg.id = `msg_${Date.now()}`;
      mockDB.messages.push(newMsg);
      return newMsg;
    }
    const { data, error } = await supabase.from('messages').insert(message).select().single();
    if (error) throw error;
    return data;
  }

  // --- Followups ---
  async getPendingFollowups(): Promise<FollowupRecord[]> {
    if (isTestEnv) return mockDB.followups.filter(f => f.status === 'pending');
    const { data, error } = await supabase.from('followups').select('*').eq('status', 'pending');
    if (error) throw error;
    return data || [];
  }

  async createFollowup(followup: Partial<FollowupRecord>): Promise<FollowupRecord> {
    if (isTestEnv) {
      const newF = { ...followup, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as FollowupRecord;
      if (!newF.id) newF.id = `f_${Date.now()}`;
      mockDB.followups.push(newF);
      return newF;
    }
    const { data, error } = await supabase.from('followups').insert(followup).select().single();
    if (error) throw error;
    return data;
  }

  async updateFollowup(id: string, updates: Partial<FollowupRecord>): Promise<FollowupRecord | null> {
    if (isTestEnv) {
      const idx = mockDB.followups.findIndex(f => f.id === id);
      if (idx === -1) return null;
      mockDB.followups[idx] = { ...mockDB.followups[idx], ...updates, updated_at: new Date().toISOString() };
      return mockDB.followups[idx];
    }
    const { data, error } = await supabase.from('followups').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  // --- Admin Drafts ---
  async getDrafts(status?: string): Promise<AdminDraftRecord[]> {
    if (isTestEnv) {
      return status ? mockDB.admin_drafts.filter(d => d.status === status) : [...mockDB.admin_drafts];
    }
    let query = supabase.from('admin_drafts').select('*');
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getDraft(id: string): Promise<AdminDraftRecord | null> {
    if (isTestEnv) return mockDB.admin_drafts.find(d => d.id === id) || null;
    const { data, error } = await supabase.from('admin_drafts').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }

  async createDraft(draft: Partial<AdminDraftRecord>): Promise<AdminDraftRecord> {
    if (isTestEnv) {
      const newD = { ...draft, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as AdminDraftRecord;
      if (!newD.id) newD.id = `draft_${Date.now()}`;
      mockDB.admin_drafts.push(newD);
      return newD;
    }
    const { data, error } = await supabase.from('admin_drafts').insert(draft).select().single();
    if (error) throw error;
    return data;
  }

  async updateDraft(id: string, updates: Partial<AdminDraftRecord>): Promise<AdminDraftRecord | null> {
    if (isTestEnv) {
      const idx = mockDB.admin_drafts.findIndex(d => d.id === id);
      if (idx === -1) return null;
      mockDB.admin_drafts[idx] = { ...mockDB.admin_drafts[idx], ...updates, updated_at: new Date().toISOString() };
      return mockDB.admin_drafts[idx];
    }
    const { data, error } = await supabase.from('admin_drafts').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  // --- Webhook Events (Idempotency) ---
  async getWebhookEvent(eventId: string): Promise<WebhookEventRecord | null> {
    if (isTestEnv) return mockDB.webhook_events.find(e => e.event_id === eventId) || null;
    const { data, error } = await supabase.from('webhook_events').select('*').eq('event_id', eventId).single();
    if (error) return null;
    return data;
  }

  async createWebhookEvent(event: Partial<WebhookEventRecord>): Promise<WebhookEventRecord> {
    if (isTestEnv) {
      const newE = { ...event, processed_at: new Date().toISOString() } as WebhookEventRecord;
      if (!newE.id) newE.id = `evt_${Date.now()}`;
      mockDB.webhook_events.push(newE);
      return newE;
    }
    const { data, error } = await supabase.from('webhook_events').insert(event).select().single();
    if (error) throw error;
    return data;
  }

  // --- Appointments ---
  async createAppointment(appointment: any): Promise<any> {
    if (isTestEnv) {
       // Just mocking if needed. 
       return { ...appointment, id: `appt_${Date.now()}` };
    }
    const { data, error } = await supabase.from('appointments').insert(appointment).select().single();
    if (error) throw error;
    return data;
  }

  // --- Knowledge Chunks ---
  async getKnowledgeChunks(): Promise<any[]> {
    if (isTestEnv) return mockDB.knowledge_chunks;
    const { data, error } = await supabase.from('knowledge_chunks').select('*');
    if (error) throw error;
    return data || [];
  }
}

export const db = new DatabaseRepository();

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || 'sb_secret_R7DO5DPfJ8ZJbTrCzG2p2A_5FXKrqcl';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

// In-memory fallback database for local testing & offline execution
export interface ContactRecord {
  id: string;
  name: string | null;
  linkedin_id: string | null;
  linkedin_url: string | null;
  email: string | null;
  phone: string;
  source: string;
  source_post_id: string | null;
  source_comment_id: string | null;
  status: string;
  stage_name: string;
  last_contacted_at: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationRecord {
  id: string;
  contact_id: string;
  channel: string;
  status: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MessageRecord {
  id: string;
  conversation_id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  whatsapp_message_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface FollowupRecord {
  id: string;
  contact_id: string;
  note: string;
  due_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface WebhookEventRecord {
  id: string;
  event_id: string;
  source: string;
  event_type: string;
  payload: any;
  processed_at: string;
}

export interface AdminDraftRecord {
  id: string;
  contact_id?: string | null;
  type: string;
  subject?: string | null;
  draft_content: string;
  status: string; // 'pending', 'approved', 'rejected', 'sent'
  created_by: string;
  approved_by?: string | null;
  approved_at?: string | null;
  rejected_by?: string | null;
  rejected_at?: string | null;
  sent_at?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export class InMemoryDB {
  contacts: ContactRecord[] = [];
  conversations: ConversationRecord[] = [];
  messages: MessageRecord[] = [];
  followups: FollowupRecord[] = [];
  webhook_events: WebhookEventRecord[] = [];
  admin_drafts: AdminDraftRecord[] = [];
  knowledge_chunks: { id: string; content: string; metadata: any }[] = [];

  clear() {
    this.contacts = [];
    this.conversations = [];
    this.messages = [];
    this.followups = [];
    this.webhook_events = [];
    this.admin_drafts = [];
    this.knowledge_chunks = [];
  }
}

export const inMemoryDB = new InMemoryDB();

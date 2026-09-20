import express from 'express';
import dotenv from 'dotenv';
import { handleLinkedInAuth } from './src/handlers/linkedin/auth';
import { handleLinkedInCallback } from './src/handlers/linkedin/callback';
import { handleLinkedInWebhook } from './src/handlers/linkedin/webhook';
import { handleGetLinkedInPosts, handleCreateLinkedInPost } from './src/handlers/linkedin/posts';
import { handleGetLinkedInComments } from './src/handlers/linkedin/comments';
import { handleWhatsAppWebhook } from './src/handlers/whatsapp/webhook';
import { handleWhatsAppSend } from './src/handlers/whatsapp/send';
import { handleAIChat } from './src/handlers/ai/chat';
import { handleGetLeads } from './src/handlers/leads/index';
import { handleCreateLead } from './src/handlers/leads/create';
import { handleUpdateLead } from './src/handlers/leads/update';
import { handleGetConversation } from './src/handlers/conversations/index';
import { handleCreateFollowup } from './src/handlers/followups/index';
import { handleCron } from './src/handlers/cron';
import { handleHealthCheck } from './src/handlers/health';
import { requireAdmin } from './src/handlers/admin/auth';
import { handleCreateDraft } from './src/handlers/admin/draft';
import { handleGetDrafts, handleGetDraft } from './src/handlers/admin/drafts';
import { handleApproveDraft } from './src/handlers/admin/approve';
import { handleRejectDraft } from './src/handlers/admin/reject';

dotenv.config();

const app = express();

app.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'LinkedIn → WhatsApp AI Chatbot',
    message: 'API is running'
  });
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple cookie parser fallback if needed
app.use((req, res, next) => {
  const cookieHeader = req.headers.cookie;
  (req as any).cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      (req as any).cookies[parts[0].trim()] = (parts[1] || '').trim();
    });
  }
  next();
});

// LinkedIn Routes
app.get('/api/linkedin/auth', handleLinkedInAuth);
app.get('/api/linkedin/callback', handleLinkedInCallback);
app.get('/api/linkedin/webhook', handleLinkedInWebhook);
app.post('/api/linkedin/webhook', handleLinkedInWebhook);
app.get('/api/linkedin/posts', handleGetLinkedInPosts);
app.post('/api/linkedin/posts', handleCreateLinkedInPost);
app.get('/api/linkedin/comments', handleGetLinkedInComments);

// WhatsApp Routes
app.get('/api/whatsapp/webhook', handleWhatsAppWebhook);
app.post('/api/whatsapp/webhook', handleWhatsAppWebhook);
app.post('/api/whatsapp/send', handleWhatsAppSend);

// AI & Qualification Routes
app.post('/api/ai/chat', handleAIChat);

// CRM Lead Management Routes
app.get('/api/leads', handleGetLeads);
app.post('/api/leads/create', handleCreateLead);
app.patch('/api/leads/:id', handleUpdateLead);
app.post('/api/leads/update', handleUpdateLead);

// Conversations & Followups
app.get('/api/conversations/:id', handleGetConversation);
app.post('/api/followups', handleCreateFollowup);

// Cron Job Route
app.get('/api/cron', handleCron);
app.post('/api/cron', handleCron);

// Admin Draft & Approval Routes
app.post('/api/admin/draft', requireAdmin, handleCreateDraft);
app.get('/api/admin/drafts', requireAdmin, handleGetDrafts);
app.get('/api/admin/drafts/:id', requireAdmin, handleGetDraft);
app.post('/api/admin/approve', requireAdmin, handleApproveDraft);
app.post('/api/admin/reject', requireAdmin, handleRejectDraft);

// Health Check
app.get('/api/health', handleHealthCheck);

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Server] LinkedIn-to-WhatsApp AI Lead Funnel API running on port ${PORT}`);
  });
}

export default app;


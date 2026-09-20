# System Architecture & Flow Specifications

## System Overview
The LinkedIn-to-WhatsApp AI Lead Generation & Qualification System connects LinkedIn post CTAs to a WhatsApp AI qualification bot, backed by a Supabase CRM data store and Vercel Cron proactive reminders.

```
[LinkedIn Post CTA / WhatsApp Link]
             │
             ▼
   [WhatsApp Cloud API]
             │
   (Inbound Webhook GET/POST)
             ▼
    [/api/whatsapp/webhook] ◄─── (Idempotency Check via webhook_events)
             │
             ├──► [Supabase CRM: contacts, conversations, messages]
             │
             ├──► [AI Qualification Engine / RAG: lib/ai.ts]
             │            ▲
             │            └─── Reads from knowledge_chunks (Client_TRD.pdf)
             │
             ▼
   (Outbound Response via WhatsApp API)
```

---

## Data Schema & CRM Pipeline
The CRM tracks leads through four distinct stages defined in `supabase/schema.sql`:
1. `New Contact`: Inbound contact initialized from WhatsApp CTA handoff.
2. `Coffee Meeting`: Contact logged following informal coffee chat.
3. `$10 Session`: Lead qualified and booked for introductory coaching session.
4. `Active Client`: Converted active coaching engagement.

---

## Proactive Vercel Cron Workflows
Mounted at `/api/cron` (triggered via Vercel Cron or schedule timer):
1. **Follow-Up Reminders (REQ-05)**: Scans pending follow-up records reaching their due date.
2. **Weekly Relationship-Review Digest (REQ-06)**: Compiles contacts uncontacted for 4–6 weeks.
3. **Stale Lead Re-Engagement (REQ-09)**: Sends automated re-engagement messages via WhatsApp for leads inactive >30 days.

---

## Security & Data Privacy (PDPA)
- **Token Protection**: Access tokens are kept strictly server-side.
- **Webhook Security**: Webhook requests are verified via token signature (`X-Hub-Signature-256`).
- **OAuth CSRF Prevention**: Uses cryptographically secure state verification in authorization flows.
- **Idempotency**: All webhook events store processed IDs in `webhook_events` to prevent duplicate processing.

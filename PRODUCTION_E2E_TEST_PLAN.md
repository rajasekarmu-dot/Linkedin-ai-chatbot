# Production End-to-End Test Plan

This document outlines the critical scenarios required to verify the end-to-end functionality of the LinkedIn-to-WhatsApp Lead Funnel in a production environment.

| ID | Test Scenario | Action | Expected Result | Pass/Fail |
|----|---------------|--------|-----------------|-----------|
| **A** | LinkedIn CTA | User comments "COACH" on an organization post on LinkedIn | The system identifies the comment via webhook, generates a direct WhatsApp CTA link, and (if supported by Community API) replies to the comment with the link | [ ] |
| **B** | WhatsApp First Message | User clicks the WhatsApp CTA link and sends the pre-filled message (e.g., "Hi, I saw your LinkedIn post...") | The system receives the webhook, verifies the signature, prevents duplicates, and logs the inbound message in Supabase | [ ] |
| **C** | Lead Creation | Triggered automatically by Action B | A new `Contact` is created in Supabase with the user's phone number and the pipeline stage is set to `New Contact` | [ ] |
| **D** | AI Response Generation | Triggered automatically by Action B | The AI generates a contextual reply using the TRD knowledge base without hallucination | [ ] |
| **E** | Qualification | User asks about pricing/services | The AI accurately retrieves pricing from the knowledge base and invites the user to book a session | [ ] |
| **F** | Appointment Booking | User agrees to book the $10 introductory session | The AI flags the intent (`shouldBook: true`), and the system updates the Contact's pipeline stage to `$10 Session` | [ ] |
| **G** | Admin Draft Creation | Admin calls `POST /api/admin/draft` with a specific `purpose` | AI generates a draft without filler text. The draft is saved to the database with `status: pending` | [ ] |
| **H** | Human Approval | Admin reviews the draft and calls `POST /api/admin/approve` | The draft status changes to `approved` and the admin's identity/timestamp is recorded | [ ] |
| **I** | Approved Message Sending | Admin/System dispatches the approved draft via `POST /api/whatsapp/send` | The message is successfully sent to the WhatsApp API. The draft status immediately changes to `sent` | [ ] |
| **J** | Duplicate Message Prevention | Admin/System attempts to send the same draft from Step I again | The `/api/whatsapp/send` endpoint returns a `403 Forbidden` error (Cannot send `sent` draft) | [ ] |
| **K** | Rejected Draft Prevention | Admin rejects a draft, then attempts to send it | The `/api/whatsapp/send` endpoint returns a `403 Forbidden` error (Cannot send `rejected` draft) | [ ] |
| **L** | Follow-up/Cron | Cron job (`GET /api/cron`) is triggered | Follow-up reminders are fired for overdue leads. Stale leads (>30 days inactive) receive automated re-engagement texts | [ ] |
| **M** | Error Handling | An invalid WhatsApp number is provided to the send API | The WhatsApp API returns an error; the system handles it gracefully, returning a `500` or `400` without crashing | [ ] |

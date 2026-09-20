# LinkedIn-to-WhatsApp AI Lead Generation Chatbot

Production-ready LinkedIn to WhatsApp AI lead funnel, RAG pipeline, Supabase CRM, Vercel Cron tasks, and admin API built according to `Client_TRD.pdf`.

---

## 🚀 Key Features

- **LinkedIn Integration & OAuth**: Official OAuth 2.0 authorization, token exchange, Organization Post fetching, comment monitoring, and WhatsApp direct CTA url generator.
- **WhatsApp Cloud API Integration**: Inbound webhook handler, GET verification, signature verification, and automated outbound text messaging.
- **AI Qualification & RAG Engine**: Answers prospect questions strictly using knowledge extracted from `Client_TRD.pdf`, identifies needs, offers $10 introductory session booking, and escalates complex queries.
- **Supabase CRM Data Pipeline**: Manages contacts, conversations, messages, followups, appointments, and pipeline stages (`New Contact` -> `Coffee Meeting` -> `$10 Session` -> `Active Client`).
- **Proactive Cron Workflows**: Automated follow-up reminders (REQ-05), weekly relationship digest (REQ-06), and stale lead re-engagement (REQ-09).
- **Security & Reliability**: Idempotent webhook handling, state parameter validation, strict environment secret management, and zero exposed credentials.

---

## 📂 Project Structure

```
├── api/
│   ├── linkedin/ (auth, callback, webhook, posts, comments)
│   ├── whatsapp/ (webhook, send)
│   ├── ai/ (chat)
│   ├── leads/ (create, update, index)
│   ├── conversations/
│   ├── followups/
│   ├── health.ts
│   └── cron.ts
├── lib/
│   ├── linkedin.ts
│   ├── whatsapp.ts
│   ├── ai.ts
│   ├── supabase.ts
│   └── prompts.ts
├── supabase/
│   └── schema.sql
├── docs/
│   ├── LINKEDIN_SETUP.md
│   ├── WHATSAPP_SETUP.md
│   └── ARCHITECTURE.md
├── tests/
├── .env.example
├── server.ts
└── package.json
```

---

## 🛠️ Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

### 3. Run Tests
```bash
npm test
```

### 4. Build TypeScript
```bash
npm run build
```

### 5. Start Development Server
```bash
npm run dev
```
Server runs at `http://localhost:3000`. Test `/api/health`.

---

## 📚 Documentation Links
- [LinkedIn Setup & Permissions Guide](docs/LINKEDIN_SETUP.md)
- [WhatsApp Cloud API Setup Guide](docs/WHATSAPP_SETUP.md)
- [System Architecture](docs/ARCHITECTURE.md)

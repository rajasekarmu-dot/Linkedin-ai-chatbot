# WhatsApp Business Cloud API Setup Guide

This guide details the setup for Meta WhatsApp Business Cloud API, Webhook configuration, and phone number onboarding.

---

## 1. Meta Developer App Setup
1. Go to [Meta for Developers](https://developers.facebook.com/) and register as a developer.
2. Click **Create App** -> Select **Business** app type.
3. Add the **WhatsApp** product to your Meta app.
4. Obtain your **Temporary Access Token** (or create a System User Permanent Token) and **Phone Number ID**.

---

## 2. Configuring Webhooks
1. In the Meta Developer App sidebar under WhatsApp, select **Configuration**.
2. Click **Edit** under Webhooks.
3. Enter your Webhook URL:
   - URL: `https://your-domain.vercel.app/api/whatsapp/webhook`
   - Verify Token: Match the value set in `WHATSAPP_VERIFY_TOKEN` in `.env`.
4. Click **Verify and Save**.
5. Subscribe to the `messages` webhook field.

---

## 3. Environment Variable Configuration
Set the following keys in your `.env` or Vercel Environment Configuration:
```env
WHATSAPP_ACCESS_TOKEN=eaag...
WHATSAPP_PHONE_NUMBER_ID=109283...
WHATSAPP_VERIFY_TOKEN=your_custom_secret_verify_token
WHATSAPP_APP_SECRET=your_meta_app_secret
```

---

## 4. Testing Webhook Verification & Outbound Messaging
Run automated unit tests:
```bash
npx vitest run tests/whatsapp.test.ts
```

Manual verification via HTTP GET request:
```bash
curl -X GET "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=your_custom_secret_verify_token&hub.challenge=test_challenge"
```
Expected response: `test_challenge`

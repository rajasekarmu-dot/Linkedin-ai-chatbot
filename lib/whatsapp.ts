import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

export interface WhatsAppInboundMessage {
  messageId: string;
  fromPhone: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export class WhatsAppClient {
  private accessToken: string;
  private phoneNumberId: string;
  private verifyToken: string;
  private appSecret: string;

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || '';
    this.appSecret = process.env.WHATSAPP_APP_SECRET || '';
  }

  /**
   * Validates webhook setup GET request parameters
   */
  public verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.verifyToken) {
      return challenge;
    }
    return null;
  }

  /**
   * Verifies X-Hub-Signature-256 HMAC for inbound WhatsApp webhooks
   */
  public verifySignature(payload: string | Buffer, signatureHeader?: string): boolean {
    if (!signatureHeader || !this.appSecret || this.appSecret.startsWith('mock_')) {
      return true; // Bypass signature check in mock test mode
    }

    const elements = signatureHeader.split('=');
    const signatureHash = elements[1];
    const expectedHash = crypto
      .createHmac('sha256', this.appSecret)
      .update(payload)
      .digest('hex');

    return signatureHash === expectedHash;
  }

  /**
   * Extracts inbound message data from Meta WhatsApp Cloud API webhook body
   */
  public parseInboundWebhook(body: any): WhatsAppInboundMessage | null {
    try {
      const entry = body?.entry?.[0];
      const change = entry?.changes?.[0]?.value;
      const message = change?.messages?.[0];
      const contact = change?.contacts?.[0];

      if (!message || message.type !== 'text') {
        return null;
      }

      return {
        messageId: message.id,
        fromPhone: message.from,
        senderName: contact?.profile?.name || 'Prospect',
        text: message.text?.body || '',
        timestamp: message.timestamp || String(Math.floor(Date.now() / 1000)),
      };
    } catch (err) {
      return null;
    }
  }

  /**
   * Sends an outbound text message via WhatsApp Business Cloud API
   */
  public async sendMessage(toPhone: string, text: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!toPhone || !text) {
      return { success: false, error: 'Recipient phone number and text are required' };
    }

    if (this.accessToken.startsWith('mock_') || this.phoneNumberId.startsWith('mock_')) {
      return {
        success: true,
        messageId: `wamid.mock.${Date.now()}.${Math.floor(Math.random() * 1000)}`,
      };
    }

    const url = `https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'text',
      text: { preview_url: false, body: text },
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return { success: false, error: `WhatsApp API Error (${res.status}): ${errorText}` };
      }

      const data = await res.json();
      const messageId = data?.messages?.[0]?.id;
      return { success: true, messageId };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Unknown WhatsApp API error' };
    }
  }
}

export const whatsAppClient = new WhatsAppClient();

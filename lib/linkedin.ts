import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

export interface LinkedInAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  scope?: string;
  refresh_token?: string;
}

export interface LinkedInProfile {
  id: string;
  localizedFirstName?: string;
  localizedLastName?: string;
  vanityName?: string;
  profilePicture?: string;
}

export class LinkedInClient {
  private config: LinkedInAuthConfig;
  public storedAccessToken: string | null = process.env.LINKEDIN_ACCESS_TOKEN || null;

  constructor(config?: Partial<LinkedInAuthConfig>) {
    this.config = {
      clientId: config?.clientId || process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: config?.clientSecret || process.env.LINKEDIN_CLIENT_SECRET || '',
      redirectUri: config?.redirectUri || process.env.LINKEDIN_REDIRECT_URI || '',
    };
  }

  /**
   * Generates LinkedIn OAuth Authorization URL with cryptographically secure state
   */
  public generateAuthUrl(scopes: string[] = ['openid', 'profile', 'w_member_social']): { url: string; state: string } {
    const state = crypto.randomBytes(16).toString('hex');
    const clientId = this.config.clientId || process.env.LINKEDIN_CLIENT_ID || '864lm0b92it9nr';
    const redirectUri = this.config.redirectUri || process.env.LINKEDIN_REDIRECT_URI || 'https://linkedin-ai-chatbot.vercel.app/api/linkedin/callback';
    const scopeParam = encodeURIComponent(scopes.join(' '));
    const redirectParam = encodeURIComponent(redirectUri);
    
    const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code` +
      `&client_id=${clientId}` +
      `&redirect_uri=${redirectParam}` +
      `&state=${state}` +
      `&scope=${scopeParam}`;

    return { url, state };
  }

  /**
   * Exchanges OAuth authorization code for an access token
   */
  public async exchangeCodeForToken(code: string): Promise<LinkedInTokenResponse> {
    if (!code) {
      throw new Error('Authorization code is required');
    }

    const clientId = this.config.clientId || process.env.LINKEDIN_CLIENT_ID || '864lm0b92it9nr';
    const clientSecret = this.config.clientSecret || process.env.LINKEDIN_CLIENT_SECRET || '';
    const redirectUri = this.config.redirectUri || process.env.LINKEDIN_REDIRECT_URI || 'https://linkedin-ai-chatbot.vercel.app/api/linkedin/callback';

    // If using mock secrets during testing
    if (clientId.startsWith('mock_') || code.startsWith('mock_')) {
      this.storedAccessToken = 'mock_access_token_' + Date.now();
      return {
        access_token: this.storedAccessToken,
        expires_in: 5184000,
        scope: 'r_liteprofile w_member_social r_organization_social',
      };
    }

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LinkedIn OAuth Token Error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as LinkedInTokenResponse;
    this.storedAccessToken = data.access_token;
    return data;
  }

  /**
   * Retrieves authorized profile information
   */
  public async getProfile(accessToken?: string): Promise<LinkedInProfile> {
    const token = accessToken || this.storedAccessToken;
    if (!token) {
      throw new Error('Insufficient LinkedIn Permissions: Access token missing. Please authenticate via OAuth.');
    }

    if (token.startsWith('mock_')) {
      return {
        id: 'linkedin_user_mock_123',
        localizedFirstName: 'Ethan',
        localizedLastName: 'Teo',
        vanityName: 'ethan-teo-coaching',
      };
    }

    const response = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      console.error(`[LinkedIn API Error] 401 Unauthorized - Access token expired or invalid.`);
      throw new Error('LinkedIn API Error (401 Unauthorized): Access token expired or invalid.');
    }

    if (response.status === 403) {
      console.error(`[LinkedIn API Error] 403 Forbidden - Insufficient permissions for endpoint.`);
      throw new Error('Insufficient LinkedIn Permissions (403 Forbidden): Scope or approval required.');
    }

    if (response.status === 429) {
      console.error(`[LinkedIn API Error] 429 Rate Limit Exceeded - Throttle limit reached.`);
      throw new Error('LinkedIn API Error (429 Rate Limit Exceeded): Please retry after rate limit resets.');
    }

    if (!response.ok) {
      console.error(`[LinkedIn API Error] Status ${response.status}`);
      throw new Error(`LinkedIn API Error (${response.status}): Request failed`);
    }

    return (await response.json()) as LinkedInProfile;
  }

  /**
   * Retrieves organization posts (requires r_organization_social permission)
   */
  public async getOrganizationPosts(organizationId: string, accessToken?: string): Promise<any[]> {
    const token = accessToken || this.storedAccessToken;
    if (!token) {
      throw new Error('Insufficient LinkedIn Permissions: Access token missing.');
    }

    if (token.startsWith('mock_')) {
      return [
        {
          id: 'urn:li:share:1001',
          author: `urn:li:organization:${organizationId}`,
          text: 'Ready to scale your business? Comment "COACH" or click our WhatsApp link to start!',
          createdAt: Date.now(),
        },
      ];
    }

    const response = await fetch(`https://api.linkedin.com/v2/shares?q=owners&owners=urn:li:organization:${organizationId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    if (response.status === 403) {
      throw new Error('Insufficient LinkedIn Permissions: r_organization_social permission required to access organization posts.');
    }

    if (!response.ok) {
      throw new Error(`LinkedIn API Error (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();
    return data.elements || [];
  }

  /**
   * Retrieves comments on a specific post (requires r_organization_social or Community Management API permissions)
   */
  public async getPostComments(postId: string, accessToken?: string): Promise<any[]> {
    const token = accessToken || this.storedAccessToken;
    if (!token) {
      throw new Error('Insufficient LinkedIn Permissions: Access token missing.');
    }

    if (token.startsWith('mock_')) {
      return [
        {
          id: 'urn:li:comment:2001',
          object: postId,
          actor: 'urn:li:person:mock_prospect_456',
          message: 'Interested in the $10 session! COACH',
          created_at: Date.now(),
        },
      ];
    }

    const response = await fetch(`https://api.linkedin.com/v2/socialActions/${encodeURIComponent(postId)}/comments`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 403) {
      throw new Error('Insufficient LinkedIn Permissions: Reading post comments requires approved Community Management API or r_organization_social permissions.');
    }

    if (!response.ok) {
      throw new Error(`LinkedIn API Error (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();
    return data.elements || [];
  }

  /**
   * Formats a direct WhatsApp CTA link with optional custom parameters
   */
  public formatWhatsAppCtaUrl(phoneNumber: string, defaultMessage: string = 'Hi, I saw your LinkedIn post and want to learn about the coaching session!'): string {
    const cleanedPhone = phoneNumber.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(defaultMessage)}`;
  }

  /**
   * Publishes a post to LinkedIn using LinkedIn REST API /rest/posts
   */
  public async createPost(text: string, personUrn?: string, accessToken?: string): Promise<any> {
    if (!text) {
      throw new Error('Post text is required');
    }

    const token = accessToken || this.storedAccessToken || process.env.LINKEDIN_ACCESS_TOKEN;
    const author = personUrn || process.env.LINKEDIN_PERSON_URN || 'urn:li:person:mock_user_123';

    if (!token) {
      throw new Error('LinkedIn configuration missing: Access token required.');
    }

    if (token.startsWith('mock_') || author.includes('mock_')) {
      return {
        id: `urn:li:share:mock_${Date.now()}`,
        author,
        commentary: text,
        visibility: 'PUBLIC',
        lifecycleState: 'PUBLISHED',
      };
    }

    const response = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202603',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author,
        commentary: text,
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: 'PUBLISHED',
      }),
    });

    const result = await response.text();

    if (!response.ok) {
      throw new Error(`LinkedIn Post Error (${response.status}): ${result}`);
    }

    try {
      return JSON.parse(result);
    } catch {
      return { id: response.headers.get('x-restli-id') || result, result };
    }
  }
}

export const linkedInClient = new LinkedInClient();

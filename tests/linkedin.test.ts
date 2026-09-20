import { describe, it, expect, beforeEach } from 'vitest';
import { linkedInClient } from '../lib/linkedin';
import { inMemoryDB } from '../lib/supabase';

describe('LinkedIn Integration & OAuth', () => {
  beforeEach(() => {
    inMemoryDB.clear();
    linkedInClient.storedAccessToken = null;
  });

  it('should generate valid OAuth authorization URL with state', () => {
    const { url, state } = linkedInClient.generateAuthUrl(['r_liteprofile', 'w_member_social']);
    expect(url).toContain('https://www.linkedin.com/oauth/v2/authorization');
    expect(url).toContain('response_type=code');
    expect(url).toContain(`state=${state}`);
    expect(state).toHaveLength(32);
  });

  it('should exchange code for access token in mock mode', async () => {
    const tokenRes = await linkedInClient.exchangeCodeForToken('mock_auth_code');
    expect(tokenRes.access_token).toBeDefined();
    expect(tokenRes.expires_in).toBeGreaterThan(0);
  });

  it('should handle permission errors gracefully when fetching profile without token', async () => {
    await expect(linkedInClient.getProfile('')).rejects.toThrow('Insufficient LinkedIn Permissions');
  });

  it('should fetch organization posts', async () => {
    const posts = await linkedInClient.getOrganizationPosts('org_123', 'mock_token');
    expect(Array.isArray(posts)).toBe(true);
    expect(posts.length).toBeGreaterThan(0);
    expect(posts[0].text).toContain('WhatsApp');
  });

  it('should format direct WhatsApp CTA url', () => {
    const url = linkedInClient.formatWhatsAppCtaUrl('+1 (555) 019-2831', 'Hello Coach Ethan');
    expect(url).toBe('https://wa.me/15550192831?text=Hello%20Coach%20Ethan');
  });

  it('should publish a post to LinkedIn in mock mode', async () => {
    const postRes = await linkedInClient.createPost('Test commentary text', 'urn:li:person:mock_123', 'mock_token');
    expect(postRes.id).toBeDefined();
    expect(postRes.commentary).toBe('Test commentary text');
  });
});

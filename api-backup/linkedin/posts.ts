import { Request, Response } from 'express';
import { linkedInClient } from '../../lib/linkedin';

export async function handleGetLinkedInPosts(req: Request, res: Response) {
  try {
    const orgId = (req.query.orgId as string) || process.env.LINKEDIN_ORGANIZATION_ID || 'mock_org_123';
    const posts = await linkedInClient.getOrganizationPosts(orgId);
    return res.status(200).json({ success: true, count: posts.length, posts });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

import { Request, Response } from 'express';
import { linkedInClient } from '../../lib/linkedin';

export async function handleGetLinkedInComments(req: Request, res: Response) {
  try {
    const postId = req.query.postId as string;
    if (!postId) {
      return res.status(400).json({ success: false, error: 'postId query parameter is required' });
    }

    const comments = await linkedInClient.getPostComments(postId);
    return res.status(200).json({ success: true, count: comments.length, comments });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

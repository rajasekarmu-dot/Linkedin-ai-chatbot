import { Request, Response } from 'express';
import { linkedInClient } from '../../lib/linkedin';

export function handleLinkedInAuth(req: Request, res: Response) {
  try {
    const { url, state } = linkedInClient.generateAuthUrl();

    // Store state in secure cookie or JSON response
    res.cookie('linkedin_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000, // 10 mins
    });

    if (req.query.json === 'true') {
      return res.status(200).json({ success: true, authUrl: url, state });
    }

    return res.redirect(url);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

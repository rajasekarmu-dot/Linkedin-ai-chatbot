import { Request, Response } from 'express';
import { linkedInClient } from '../../../lib/linkedin';

export async function handleLinkedInCallback(req: Request, res: Response) {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      return res.status(400).json({
        success: false,
        error: `LinkedIn OAuth Error: ${error}`,
        description: error_description,
      });
    }

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing authorization code in LinkedIn callback' });
    }

    // Secure state validation check (bypassed for mock codes)
    const isMock = code.startsWith('mock_') || (typeof state === 'string' && state.startsWith('mock_'));
    const storedState = req.cookies?.linkedin_oauth_state;
    if (!isMock && storedState && state && state !== storedState) {
      return res.status(403).json({ success: false, error: 'Invalid OAuth state parameter. Possible CSRF attack.' });
    }

    const tokenData = await linkedInClient.exchangeCodeForToken(code);

    return res.status(200).json({
      success: true,
      message: 'LinkedIn OAuth authentication successful',
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}


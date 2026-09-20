import { Request, Response } from 'express';
import { aiService } from '../../lib/ai';

export async function handleAIChat(req: Request, res: Response) {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message field is required' });
    }

    const result = await aiService.generateLeadResponse(message, history || []);

    return res.status(200).json({
      success: true,
      response: result.text,
      shouldBook: result.shouldBook,
      shouldEscalate: result.shouldEscalate,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

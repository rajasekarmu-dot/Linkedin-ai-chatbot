import { Request, Response } from 'express';

export function handleHealthCheck(req: Request, res: Response) {
  return res.status(200).json({
    status: 'ok',
    system: 'LinkedIn-to-WhatsApp AI Lead Funnel API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}

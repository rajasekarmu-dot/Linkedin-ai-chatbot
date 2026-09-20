import { Request, Response, NextFunction } from 'express';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token format' });
  }

  if (token !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({ success: false, error: 'Forbidden: Invalid admin token' });
  }

  // Extend request object to contain admin identity if needed
  (req as any).adminId = 'admin';
  next();
}

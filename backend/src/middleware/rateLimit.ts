import { Request, Response, NextFunction } from 'express';

type Key = string;
type Bucket = { count: number; windowStart: number };

export const createRateLimiter = (maxRequests: number, windowMs: number) => {
  const buckets = new Map<Key, Bucket>();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${ip}:${req.path}`;
    const now = Date.now();
    const current = buckets.get(key);

    if (!current || now - current.windowStart > windowMs) {
      buckets.set(key, { count: 1, windowStart: now });
      return next();
    }

    if (current.count >= maxRequests) {
      return res.status(429).json({ message: 'Demasiadas solicitudes, intenta más tarde.' });
    }

    current.count += 1;
    buckets.set(key, current);
    next();
  };
};

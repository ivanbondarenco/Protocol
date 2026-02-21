import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

interface AuthRequest extends Request {
  userId?: string;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ code: 'TOKEN_MISSING', message: 'Token de autenticacion requerido.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (err instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ code: 'TOKEN_EXPIRED', message: 'Token expirado. Inicia sesion nuevamente.' });
      }

      if (err instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ code: 'TOKEN_INVALID', message: 'Token invalido.' });
      }

      console.error('Error de verificacion de JWT:', err);
      return res.status(401).json({ code: 'TOKEN_ERROR', message: 'No se pudo verificar el token.' });
    }

    req.userId = (user as { userId: string }).userId;
    next();
  });
};

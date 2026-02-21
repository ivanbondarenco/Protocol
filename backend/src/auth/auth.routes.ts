import { Router } from 'express';
import { register, login, updateMe } from './auth.controller';
import { authenticateToken } from './auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.put('/me', authenticateToken, updateMe);

export default router;

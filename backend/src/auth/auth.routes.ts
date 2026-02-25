import { Router } from 'express';
import { register, login, updateMe, changePassword, deleteAccount } from './auth.controller';
import { authenticateToken } from './auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.put('/me', authenticateToken, updateMe);
router.put('/password', authenticateToken, changePassword);
router.delete('/me', authenticateToken, deleteAccount);

export default router;

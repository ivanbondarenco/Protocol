import { Router } from 'express';
import { getVaultData, syncIdeas, syncBooks } from './vault.controller';
import { authenticateToken } from '../auth/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getVaultData);
router.post('/ideas/sync', syncIdeas);
router.post('/books/sync', syncBooks);

export default router;

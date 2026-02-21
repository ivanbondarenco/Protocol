import { Router } from 'express';
import { authenticateToken } from '../auth/auth.middleware';
import { completeOnboarding } from './onboarding.controller';

const router = Router();
router.use(authenticateToken);
router.post('/complete', completeOnboarding);

export default router;
